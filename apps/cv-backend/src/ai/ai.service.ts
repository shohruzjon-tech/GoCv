import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AiUsageService } from '../ai-usage/ai-usage.service.js';
import { SubscriptionsService } from '../subscriptions/subscriptions.service.js';
import { AiToolType } from '../common/enums/ai-tool.enum.js';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openai: OpenAI;

  constructor(
    private configService: ConfigService,
    private aiUsageService: AiUsageService,
    private subscriptionsService: SubscriptionsService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('openai.apiKey'),
    });
  }

  // ─── Rate limiting check ───
  private async checkAndTrackUsage(userId: string): Promise<void> {
    const allowed = await this.subscriptionsService.incrementAiUsage(userId);
    if (!allowed) {
      throw new BadRequestException(
        'AI credit limit reached for this month. Upgrade your plan for more credits.',
      );
    }
  }

  // ─── Track AI call results ───
  private async trackCall(
    userId: string,
    toolType: AiToolType,
    completion: any,
    startTime: number,
    success: boolean,
    prompt?: string,
    cvId?: string,
    errorMsg?: string,
  ): Promise<void> {
    const latencyMs = Date.now() - startTime;
    const usage = completion?.usage;

    await this.aiUsageService.trackUsage({
      userId,
      toolType,
      model: 'gpt-5',
      promptTokens: usage?.prompt_tokens || 0,
      completionTokens: usage?.completion_tokens || 0,
      totalTokens: usage?.total_tokens || 0,
      estimatedCostMills: this.estimateCost(
        usage?.prompt_tokens || 0,
        usage?.completion_tokens || 0,
      ),
      prompt: prompt?.substring(0, 500),
      success,
      errorMessage: errorMsg,
      latencyMs,
      cvId,
    });
  }

  private estimateCost(promptTokens: number, completionTokens: number): number {
    // GPT-5 pricing estimate (mills = 1/1000 USD)
    const promptCost = (promptTokens / 1000) * 5; // $5/1M input tokens
    const completionCost = (completionTokens / 1000) * 15; // $15/1M output tokens
    return Math.round((promptCost + completionCost) * 1000);
  }

  // ─── Core CV Generation ───
  async generateCv(
    prompt: string,
    context?: Record<string, any>,
    userId?: string,
  ): Promise<{
    sections: any[];
    personalInfo: any;
    summary: string;
    theme: any;
    html: string;
  }> {
    if (userId) await this.checkAndTrackUsage(userId);
    const startTime = Date.now();

    const systemPrompt = `You are an expert CV/Resume builder AI. Generate professional CV content based on user input.
Return a JSON object with the following structure:
{
  "personalInfo": {
    "fullName": "",
    "email": "",
    "phone": "",
    "location": "",
    "website": "",
    "linkedin": "",
    "github": ""
  },
  "summary": "Professional summary paragraph",
  "sections": [
    {
      "type": "experience",
      "title": "Work Experience",
      "order": 1,
      "visible": true,
      "content": {
        "items": [
          {
            "title": "Job Title",
            "company": "Company Name",
            "location": "City, Country",
            "startDate": "2020-01",
            "endDate": "Present",
            "description": "Description of role",
            "highlights": ["Achievement 1", "Achievement 2"]
          }
        ]
      }
    },
    {
      "type": "education",
      "title": "Education",
      "order": 2,
      "visible": true,
      "content": {
        "items": [
          {
            "degree": "Degree Name",
            "institution": "University Name",
            "location": "City, Country",
            "startDate": "2016",
            "endDate": "2020",
            "description": "Relevant coursework or achievements"
          }
        ]
      }
    },
    {
      "type": "skills",
      "title": "Skills",
      "order": 3,
      "visible": true,
      "content": {
        "categories": [
          {
            "name": "Programming Languages",
            "skills": ["JavaScript", "TypeScript", "Python"]
          }
        ]
      }
    }
  ],
  "theme": {
    "primaryColor": "#2563eb",
    "fontFamily": "Inter",
    "layout": "modern"
  }
}

Also generate a complete HTML representation of the CV in the "html" field, styled with inline CSS for a professional, modern look.
If context about existing CV data is provided, use it to enhance or modify the content.`;

    const userPrompt = context
      ? `${prompt}\n\nExisting CV context: ${JSON.stringify(context)}`
      : prompt;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        max_completion_tokens: 16384,
      });

      const choice = completion.choices[0];
      const content = choice?.message?.content;
      if (!content) {
        this.logger.error(
          `Empty AI response — finish_reason: ${choice?.finish_reason}, usage: ${JSON.stringify(completion.usage)}`,
        );
        throw new Error(
          `No response from AI (finish_reason: ${choice?.finish_reason ?? 'unknown'})`,
        );
      }

      if (userId) {
        await this.trackCall(
          userId,
          AiToolType.CV_GENERATE,
          completion,
          startTime,
          true,
          prompt,
        );
      }

      return JSON.parse(content);
    } catch (error: any) {
      if (userId) {
        await this.trackCall(
          userId,
          AiToolType.CV_GENERATE,
          null,
          startTime,
          false,
          prompt,
          undefined,
          error.message,
        );
      }
      this.logger.error('AI CV generation failed', error);
      throw error;
    }
  }

  // ─── Section Editing ───
  async editSection(
    prompt: string,
    sectionType: string,
    currentContent?: any,
    userId?: string,
  ): Promise<any> {
    if (userId) await this.checkAndTrackUsage(userId);
    const startTime = Date.now();

    const systemPrompt = `You are an expert CV editor AI. Edit the ${sectionType} section of a CV based on user instructions.
Return a JSON object with the updated section content that matches the original structure.
If current content is provided, modify it. Otherwise, generate new content for this section type.`;

    const userPrompt = currentContent
      ? `${prompt}\n\nCurrent content: ${JSON.stringify(currentContent)}`
      : prompt;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        max_completion_tokens: 2000,
      });

      const content = completion.choices[0]?.message?.content;
      if (userId) {
        await this.trackCall(
          userId,
          AiToolType.CV_EDIT_SECTION,
          completion,
          startTime,
          true,
          prompt,
        );
      }
      return content ? JSON.parse(content) : null;
    } catch (error: any) {
      if (userId) {
        await this.trackCall(
          userId,
          AiToolType.CV_EDIT_SECTION,
          null,
          startTime,
          false,
          prompt,
          undefined,
          error.message,
        );
      }
      this.logger.error('AI section edit failed', error);
      throw error;
    }
  }

  // ─── HTML Generation ───
  async generateCvHtml(cvData: any, userId?: string): Promise<string> {
    if (userId) await this.checkAndTrackUsage(userId);
    const startTime = Date.now();

    const systemPrompt = `You are an expert web designer. Generate a beautiful, professional HTML page for a CV/Resume.
Use inline CSS for styling. Make it responsive and print-friendly.
The HTML should be a complete standalone page that looks professional.
Return ONLY the HTML string, no JSON wrapping.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Generate a professional CV HTML page with this data: ${JSON.stringify(cvData)}`,
          },
        ],
        max_completion_tokens: 16384,
      });

      if (userId) {
        await this.trackCall(
          userId,
          AiToolType.CV_REGENERATE_HTML,
          completion,
          startTime,
          true,
        );
      }

      return completion.choices[0]?.message?.content || '';
    } catch (error: any) {
      if (userId) {
        await this.trackCall(
          userId,
          AiToolType.CV_REGENERATE_HTML,
          null,
          startTime,
          false,
          undefined,
          undefined,
          error.message,
        );
      }
      this.logger.error('AI HTML generation failed', error);
      throw error;
    }
  }

  // ─── Chat ───
  async chatAboutCv(
    messages: { role: 'user' | 'assistant'; content: string }[],
    cvContext?: any,
    userId?: string,
  ): Promise<string> {
    if (userId) await this.checkAndTrackUsage(userId);
    const startTime = Date.now();

    const systemPrompt = `You are a helpful CV building assistant. Help the user improve their CV, suggest changes, and provide career advice.
${cvContext ? `Current CV data: ${JSON.stringify(cvContext)}` : ''}
Respond in a friendly, professional manner. When suggesting CV changes, be specific about what to modify.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-5',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        max_completion_tokens: 1500,
      });

      if (userId) {
        await this.trackCall(
          userId,
          AiToolType.CV_CHAT,
          completion,
          startTime,
          true,
        );
      }

      return completion.choices[0]?.message?.content || '';
    } catch (error: any) {
      if (userId) {
        await this.trackCall(
          userId,
          AiToolType.CV_CHAT,
          null,
          startTime,
          false,
          undefined,
          undefined,
          error.message,
        );
      }
      this.logger.error('AI chat failed', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════
  // PROFILE EXTRACTION FROM TEXT / LINKEDIN / FILE
  // ═══════════════════════════════════════════

  async extractProfile(
    text: string,
    sourceType: 'prompt' | 'linkedin' | 'file',
    userId: string,
  ): Promise<any> {
    await this.checkAndTrackUsage(userId);
    const startTime = Date.now();

    const sourceHint =
      sourceType === 'linkedin'
        ? 'The following text is from a LinkedIn profile.'
        : sourceType === 'file'
          ? 'The following text was extracted from an uploaded CV/resume file.'
          : 'The following is a freeform description of professional background.';

    const systemPrompt = `You are an expert CV data extractor. ${sourceHint}
Extract ALL available professional information and return a structured JSON object.
Return ONLY valid JSON with this exact structure (use empty strings or empty arrays where data is not available):
{
  "personalInfo": {
    "fullName": "",
    "email": "",
    "phone": "",
    "location": "",
    "website": "",
    "linkedin": "",
    "github": ""
  },
  "summary": "",
  "skills": {
    "technical": [],
    "tools": [],
    "soft": [],
    "languages": []
  },
  "experience": [
    {
      "company": "",
      "title": "",
      "location": "",
      "startDate": "",
      "endDate": "",
      "current": false,
      "bullets": []
    }
  ],
  "projects": [
    {
      "name": "",
      "description": "",
      "technologies": "",
      "liveUrl": "",
      "sourceUrl": ""
    }
  ],
  "education": [
    {
      "degree": "",
      "institution": "",
      "location": "",
      "startDate": "",
      "endDate": "",
      "gpa": "",
      "honors": ""
    }
  ],
  "certifications": [
    {
      "name": "",
      "issuer": "",
      "date": "",
      "url": ""
    }
  ]
}

Rules:
- Extract every piece of information you can find
- For dates use YYYY-MM format when possible
- If someone is currently working somewhere, set current=true and endDate=""
- For skills, categorize intelligently: programming/frameworks in "technical", tools/platforms in "tools", interpersonal in "soft", spoken languages with proficiency in "languages"
- Convert bullet points to concise "Action + Result + Metric" format where possible
- Do NOT invent data that is not present in the input
- Omit sections with no data (use empty arrays)`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
        response_format: { type: 'json_object' },
        max_completion_tokens: 8192,
      });

      const content = completion.choices[0]?.message?.content;
      await this.trackCall(
        userId,
        AiToolType.PROFILE_EXTRACT,
        completion,
        startTime,
        true,
        text.substring(0, 500),
      );
      return content ? JSON.parse(content) : null;
    } catch (error: any) {
      await this.trackCall(
        userId,
        AiToolType.PROFILE_EXTRACT,
        null,
        startTime,
        false,
        text.substring(0, 500),
        undefined,
        error.message,
      );
      this.logger.error('Profile extraction failed', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════
  // PROJECT DESCRIPTION IMPROVEMENT
  // ═══════════════════════════════════════════

  async improveProjectDescription(
    projectTitle: string,
    currentText: string,
    field: 'short' | 'long',
    technologies: string[],
    action: 'improve' | 'professional' | 'technical' | 'concise',
    userId: string,
  ): Promise<{ improved: string }> {
    await this.checkAndTrackUsage(userId);
    const startTime = Date.now();

    const lengthGuide =
      field === 'short'
        ? 'Keep it between 1-3 sentences (max 200 characters). This is a brief tagline/overview.'
        : 'Write 2-4 detailed paragraphs. This is the full project description for a portfolio.';

    const toneGuide: Record<string, string> = {
      improve:
        'Improve clarity, grammar, and impact while keeping the original meaning.',
      professional:
        'Rewrite in a polished, business-professional tone suitable for recruiters.',
      technical:
        'Rewrite with a technical focus, highlighting architecture, patterns, and engineering decisions.',
      concise:
        'Make it as concise and punchy as possible — remove filler words.',
    };

    const systemPrompt = `You are an expert portfolio copywriter for software developers.
Improve the given project description text.

Project title: "${projectTitle}"
Technologies used: ${technologies.length > 0 ? technologies.join(', ') : 'Not specified'}
Field type: ${field === 'short' ? 'Short description' : 'Full description'}

Instructions:
- ${toneGuide[action]}
- ${lengthGuide}
- Mention relevant technologies naturally if they fit
- Use active voice and strong action verbs
- Make it compelling for potential employers or clients

Return ONLY a JSON object: { "improved": "your improved text here" }`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content:
              currentText ||
              `Write a ${field} description for a project called "${projectTitle}" using ${technologies.join(', ') || 'various technologies'}.`,
          },
        ],
        response_format: { type: 'json_object' },
        max_completion_tokens: field === 'short' ? 300 : 1500,
      });

      const content = completion.choices[0]?.message?.content;
      await this.trackCall(
        userId,
        AiToolType.PROJECT_IMPROVE,
        completion,
        startTime,
        true,
        currentText?.substring(0, 300),
      );
      return content ? JSON.parse(content) : { improved: '' };
    } catch (error: any) {
      await this.trackCall(
        userId,
        AiToolType.PROJECT_IMPROVE,
        null,
        startTime,
        false,
        currentText?.substring(0, 300),
        undefined,
        error.message,
      );
      this.logger.error('Project description improvement failed', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════
  // NEW ADVANCED AI TOOLS
  // ═══════════════════════════════════════════

  // ─── CV Enhancer ───
  async enhanceCv(
    cvData: any,
    userId: string,
  ): Promise<{
    enhancedSummary: string;
    enhancedSections: any[];
    suggestions: string[];
    overallScore: number;
  } | null> {
    await this.checkAndTrackUsage(userId);
    const startTime = Date.now();

    const systemPrompt = `You are an expert CV reviewer and enhancer. Analyze the provided CV data and return improved content.
Return a JSON object with:
{
  "enhancedSummary": "An improved, more compelling professional summary",
  "enhancedSections": [array of improved sections maintaining the same structure],
  "suggestions": ["List of specific improvements you made and why"],
  "overallScore": 85  // Score from 0-100 rating the CV quality
}

Focus on:
- Stronger action verbs
- Quantified achievements
- Clear, concise language
- Professional tone
- ATS-friendly formatting
- Removing redundancy`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Enhance this CV: ${JSON.stringify(cvData)}`,
          },
        ],
        response_format: { type: 'json_object' },
        max_completion_tokens: 8192,
      });

      const content = completion.choices[0]?.message?.content;
      await this.trackCall(
        userId,
        AiToolType.CV_ENHANCE,
        completion,
        startTime,
        true,
      );
      return content ? JSON.parse(content) : null;
    } catch (error: any) {
      await this.trackCall(
        userId,
        AiToolType.CV_ENHANCE,
        null,
        startTime,
        false,
        undefined,
        undefined,
        error.message,
      );
      throw error;
    }
  }

  // ─── Job-Specific Tailoring ───
  async tailorForJob(
    cvData: any,
    jobDescription: string,
    userId: string,
  ): Promise<{
    tailoredSummary: string;
    tailoredSections: any[];
    matchScore: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    recommendations: string[];
  } | null> {
    await this.checkAndTrackUsage(userId);
    const startTime = Date.now();

    const systemPrompt = `You are an expert recruiter and CV optimizer. Tailor the provided CV to match a specific job description.
Return a JSON object with:
{
  "tailoredSummary": "A summary rewritten to highlight relevant experience for this specific role",
  "tailoredSections": [sections modified to emphasize matching experience],
  "matchScore": 78,  // 0-100 match score
  "matchedKeywords": ["keyword1", "keyword2"],
  "missingKeywords": ["keyword3", "keyword4"],
  "recommendations": ["Specific recommendations for improving match"]
}

Focus on:
- Matching job requirements with candidate experience
- Reordering sections to prioritize relevant experience
- Enhancing bullet points to match job keywords
- Identifying skills gaps`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `CV Data: ${JSON.stringify(cvData)}\n\nJob Description: ${jobDescription}`,
          },
        ],
        response_format: { type: 'json_object' },
        max_completion_tokens: 8192,
      });

      const content = completion.choices[0]?.message?.content;
      await this.trackCall(
        userId,
        AiToolType.JOB_TAILOR,
        completion,
        startTime,
        true,
        jobDescription.substring(0, 200),
      );
      return content ? JSON.parse(content) : null;
    } catch (error: any) {
      await this.trackCall(
        userId,
        AiToolType.JOB_TAILOR,
        null,
        startTime,
        false,
        undefined,
        undefined,
        error.message,
      );
      throw error;
    }
  }

  // ─── Bullet Point Improver ───
  async improveBulletPoints(
    bulletPoints: string[],
    context: string,
    userId: string,
  ): Promise<{
    improved: { original: string; improved: string; explanation: string }[];
  }> {
    await this.checkAndTrackUsage(userId);
    const startTime = Date.now();

    const systemPrompt = `You are an expert CV writer. Improve the given bullet points to be more impactful.
Return a JSON object with:
{
  "improved": [
    {
      "original": "Original bullet point",
      "improved": "Improved version with action verbs and metrics",
      "explanation": "Why this improvement is better"
    }
  ]
}

Rules:
- Start with strong action verbs (Led, Developed, Increased, etc.)
- Add quantified results where possible (%, $, numbers)
- Keep concise (max 2 lines)
- Use professional language
- Focus on impact and achievements, not duties`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Context: ${context}\n\nBullet points to improve:\n${bulletPoints.map((b, i) => `${i + 1}. ${b}`).join('\n')}`,
          },
        ],
        response_format: { type: 'json_object' },
        max_completion_tokens: 2000,
      });

      const content = completion.choices[0]?.message?.content;
      await this.trackCall(
        userId,
        AiToolType.BULLET_IMPROVE,
        completion,
        startTime,
        true,
      );
      return content ? JSON.parse(content) : { improved: [] };
    } catch (error: any) {
      await this.trackCall(
        userId,
        AiToolType.BULLET_IMPROVE,
        null,
        startTime,
        false,
        undefined,
        undefined,
        error.message,
      );
      throw error;
    }
  }

  // ─── Summary Generator ───
  async generateSummary(
    cvData: any,
    tone: 'professional' | 'creative' | 'technical' | 'executive',
    userId: string,
  ): Promise<{
    summaries: { style: string; text: string }[];
  }> {
    await this.checkAndTrackUsage(userId);
    const startTime = Date.now();

    const systemPrompt = `You are an expert CV writer. Generate 3 professional summary variations based on the CV data.
Return a JSON object with:
{
  "summaries": [
    { "style": "concise", "text": "A 2-3 sentence summary" },
    { "style": "detailed", "text": "A more detailed 4-5 sentence summary" },
    { "style": "achievement-focused", "text": "A summary highlighting key achievements" }
  ]
}

The tone should be: ${tone}
Focus on the candidate's strongest qualifications and achievements.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Generate professional summaries from this CV data: ${JSON.stringify(cvData)}`,
          },
        ],
        response_format: { type: 'json_object' },
        max_completion_tokens: 1500,
      });

      const content = completion.choices[0]?.message?.content;
      await this.trackCall(
        userId,
        AiToolType.SUMMARY_GENERATE,
        completion,
        startTime,
        true,
      );
      return content ? JSON.parse(content) : { summaries: [] };
    } catch (error: any) {
      await this.trackCall(
        userId,
        AiToolType.SUMMARY_GENERATE,
        null,
        startTime,
        false,
        undefined,
        undefined,
        error.message,
      );
      throw error;
    }
  }

  // ─── Skill Gap Analysis ───
  async analyzeSkillGap(
    cvData: any,
    targetRole: string,
    userId: string,
  ): Promise<{
    currentSkills: string[];
    requiredSkills: string[];
    matchingSkills: string[];
    missingSkills: string[];
    learningPath: { skill: string; priority: string; resources: string[] }[];
    overallReadiness: number;
  } | null> {
    await this.checkAndTrackUsage(userId);
    const startTime = Date.now();

    const systemPrompt = `You are a career development expert. Analyze the candidate's skills vs requirements for a target role.
Return a JSON object with:
{
  "currentSkills": ["skills the candidate has"],
  "requiredSkills": ["skills needed for the target role"],
  "matchingSkills": ["skills that match"],
  "missingSkills": ["skills the candidate lacks"],
  "learningPath": [
    {
      "skill": "Skill name",
      "priority": "high|medium|low",
      "resources": ["Resource 1", "Resource 2"]
    }
  ],
  "overallReadiness": 72  // 0-100 readiness score
}`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `CV Data: ${JSON.stringify(cvData)}\n\nTarget Role: ${targetRole}`,
          },
        ],
        response_format: { type: 'json_object' },
        max_completion_tokens: 3000,
      });

      const content = completion.choices[0]?.message?.content;
      await this.trackCall(
        userId,
        AiToolType.SKILL_GAP_ANALYSIS,
        completion,
        startTime,
        true,
        targetRole,
      );
      return content ? JSON.parse(content) : null;
    } catch (error: any) {
      await this.trackCall(
        userId,
        AiToolType.SKILL_GAP_ANALYSIS,
        null,
        startTime,
        false,
        undefined,
        undefined,
        error.message,
      );
      throw error;
    }
  }

  // ─── ATS Optimization Scoring ───
  async atsOptimize(
    cvData: any,
    jobDescription?: string,
    userId?: string,
  ): Promise<{
    atsScore: number;
    formatScore: number;
    keywordScore: number;
    readabilityScore: number;
    issues: { severity: string; message: string; fix: string }[];
    optimizedContent?: any;
  } | null> {
    if (userId) await this.checkAndTrackUsage(userId);
    const startTime = Date.now();

    const systemPrompt = `You are an ATS (Applicant Tracking System) expert. Analyze the CV for ATS compatibility.
Return a JSON object with:
{
  "atsScore": 75,  // Overall ATS score 0-100
  "formatScore": 80,  // Format compatibility score
  "keywordScore": 70,  // Keyword optimization score
  "readabilityScore": 85,  // Readability score
  "issues": [
    {
      "severity": "high|medium|low",
      "message": "Description of the issue",
      "fix": "How to fix it"
    }
  ],
  "optimizedContent": { /* Optional: ATS-optimized version of the CV */ }
}

Check for:
- Proper use of standard section headings
- Keyword density and relevance
- Format simplicity (no tables, columns issues)
- Consistent date formats
- Proper use of bullet points
- Length appropriateness
- Contact info completeness`;

    try {
      const userContent = jobDescription
        ? `CV Data: ${JSON.stringify(cvData)}\n\nTarget Job Description: ${jobDescription}`
        : `CV Data: ${JSON.stringify(cvData)}`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        response_format: { type: 'json_object' },
        max_completion_tokens: 3000,
      });

      const content = completion.choices[0]?.message?.content;
      if (userId) {
        await this.trackCall(
          userId,
          AiToolType.ATS_OPTIMIZE,
          completion,
          startTime,
          true,
        );
      }
      return content ? JSON.parse(content) : null;
    } catch (error: any) {
      if (userId) {
        await this.trackCall(
          userId,
          AiToolType.ATS_OPTIMIZE,
          null,
          startTime,
          false,
          undefined,
          undefined,
          error.message,
        );
      }
      throw error;
    }
  }

  // ─── Interview Preparation ───
  async interviewPrep(
    cvData: any,
    jobDescription: string,
    userId: string,
  ): Promise<{
    likelyQuestions: {
      question: string;
      category: string;
      difficulty: string;
      suggestedAnswer: string;
      tips: string;
    }[];
    talkingPoints: string[];
    weaknesses: string[];
    strengthsToHighlight: string[];
  } | null> {
    await this.checkAndTrackUsage(userId);
    const startTime = Date.now();

    const systemPrompt = `You are an expert interview coach. Based on the candidate's CV and a job description, prepare interview guidance.
Return a JSON object with:
{
  "likelyQuestions": [
    {
      "question": "Tell me about...",
      "category": "behavioral|technical|situational|experience",
      "difficulty": "easy|medium|hard",
      "suggestedAnswer": "A framework for answering this question using STAR method...",
      "tips": "Specific tips for this question"
    }
  ],
  "talkingPoints": ["Key points the candidate should bring up"],
  "weaknesses": ["Potential weak points the interviewer might probe"],
  "strengthsToHighlight": ["Key strengths from the CV to emphasize"]
}

Generate 8-10 diverse questions covering different categories.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `CV: ${JSON.stringify(cvData)}\n\nJob Description: ${jobDescription}`,
          },
        ],
        response_format: { type: 'json_object' },
        max_completion_tokens: 4000,
      });

      const content = completion.choices[0]?.message?.content;
      await this.trackCall(
        userId,
        AiToolType.INTERVIEW_PREP,
        completion,
        startTime,
        true,
        jobDescription.substring(0, 200),
      );
      return content ? JSON.parse(content) : null;
    } catch (error: any) {
      await this.trackCall(
        userId,
        AiToolType.INTERVIEW_PREP,
        null,
        startTime,
        false,
        undefined,
        undefined,
        error.message,
      );
      throw error;
    }
  }
}
