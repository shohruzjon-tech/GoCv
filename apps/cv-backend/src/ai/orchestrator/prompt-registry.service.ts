import { Injectable, Logger } from '@nestjs/common';
import { AiToolType } from '../../common/enums/ai-tool.enum.js';

export interface PromptTemplate {
  id: string;
  toolType: AiToolType;
  version: string;
  systemPrompt: string;
  userPromptTemplate: string;
  jsonMode: boolean;
  maxTokens: number;
  /** Optional: map of A/B test variants */
  variants?: Record<string, { systemPrompt: string; weight: number }>;
  createdAt: Date;
  isActive: boolean;
}

@Injectable()
export class PromptRegistryService {
  private readonly logger = new Logger(PromptRegistryService.name);
  private prompts = new Map<string, PromptTemplate>();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults() {
    // ── CV Generation ──
    this.register({
      id: 'cv-generate',
      toolType: AiToolType.CV_GENERATE,
      version: 'v2',
      systemPrompt: `You are an expert CV/Resume builder AI. Generate professional CV content based on user input.
Return a JSON object with the following structure:
{
  "personalInfo": {
    "fullName": "", "email": "", "phone": "", "location": "",
    "website": "", "linkedin": "", "github": ""
  },
  "summary": "Professional summary paragraph",
  "sections": [
    {
      "type": "experience|education|skills|certifications|languages|awards|publications|projects|volunteer",
      "title": "Section Title",
      "content": { ... section-specific data },
      "order": 0,
      "visible": true
    }
  ],
  "theme": { "primaryColor": "#2563eb", "fontFamily": "Inter", "layout": "modern" }
}

For experience sections, content should be: { "items": [{ "company": "", "position": "", "startDate": "", "endDate": "", "current": false, "description": "", "highlights": [""] }] }
For education sections: { "items": [{ "institution": "", "degree": "", "field": "", "startDate": "", "endDate": "", "gpa": "", "highlights": [""] }] }
For skills sections: { "categories": [{ "name": "", "skills": [""] }] }

ALWAYS include experience, education, and skills sections. Be detailed and professional.`,
      userPromptTemplate: '{prompt}',
      jsonMode: true,
      maxTokens: 16384,
      isActive: true,
      createdAt: new Date(),
    });

    // ── CV Enhancement ──
    this.register({
      id: 'cv-enhance',
      toolType: AiToolType.CV_ENHANCE,
      version: 'v2',
      systemPrompt: `You are a professional CV enhancement specialist. Improve the provided CV content to be more impactful, ATS-friendly, and professional.
Return a JSON object with the enhanced CV data maintaining the same structure.
Focus on:
- Stronger action verbs
- Quantified achievements
- ATS-optimized keywords
- Clear, concise language
- Professional tone`,
      userPromptTemplate:
        'Enhance this CV data: {cvData}\n\nEnhancement focus: {focus}',
      jsonMode: true,
      maxTokens: 8192,
      isActive: true,
      createdAt: new Date(),
    });

    // ── Job Tailoring ──
    this.register({
      id: 'cv-tailor',
      toolType: AiToolType.JOB_TAILOR,
      version: 'v2',
      systemPrompt: `You are a CV tailoring expert. Customize the CV content to match a specific job description.
Return a JSON object with the tailored CV maintaining the same structure.
Focus on:
- Matching keywords from the job description
- Reordering sections by relevance
- Highlighting transferable skills
- Adjusting the professional summary
- Emphasizing relevant experience`,
      userPromptTemplate:
        'CV Data: {cvData}\n\nTarget Job Description: {jobDescription}',
      jsonMode: true,
      maxTokens: 8192,
      isActive: true,
      createdAt: new Date(),
    });

    // ── ATS Optimization ──
    this.register({
      id: 'ats-optimize',
      toolType: AiToolType.ATS_OPTIMIZE,
      version: 'v2',
      systemPrompt: `You are an ATS (Applicant Tracking System) expert. Analyze the CV for ATS compatibility.
Return a JSON object with:
{
  "atsScore": 75,
  "formatScore": 80,
  "keywordScore": 70,
  "readabilityScore": 85,
  "issues": [{ "severity": "high|medium|low", "message": "", "fix": "" }],
  "optimizedContent": { /* optional ATS-optimized version */ }
}

Check for: standard section headings, keyword density, format simplicity, consistent date formats, bullet points, length, contact info completeness.`,
      userPromptTemplate: 'CV Data: {cvData}\n\nTarget Job: {jobDescription}',
      jsonMode: true,
      maxTokens: 3000,
      isActive: true,
      createdAt: new Date(),
    });

    // ── Bullet Point Improvement ──
    this.register({
      id: 'bullet-improve',
      toolType: AiToolType.BULLET_IMPROVE,
      version: 'v2',
      systemPrompt: `You are an expert at writing impactful resume bullet points.
Return a JSON object with:
{
  "improved": [
    { "original": "", "improved": "", "explanation": "" }
  ],
  "tips": [""]
}
Use strong action verbs, quantify achievements, be specific and concise.`,
      userPromptTemplate:
        'Improve these bullet points: {bullets}\n\nContext: {context}',
      jsonMode: true,
      maxTokens: 2000,
      isActive: true,
      createdAt: new Date(),
    });

    // ── Summary Generation ──
    this.register({
      id: 'summary-generate',
      toolType: AiToolType.SUMMARY_GENERATE,
      version: 'v2',
      systemPrompt: `You are a professional summary writer. Create a compelling professional summary.
Return a JSON object with:
{
  "summary": "3-4 sentence professional summary",
  "variants": ["variant 1", "variant 2"],
  "keywords": ["key", "words"]
}
Be professional, specific, and impactful.`,
      userPromptTemplate: 'CV Data: {cvData}\n\nTarget role: {targetRole}',
      jsonMode: true,
      maxTokens: 1500,
      isActive: true,
      createdAt: new Date(),
    });

    // ── Skill Gap Analysis ──
    this.register({
      id: 'skill-gap',
      toolType: AiToolType.SKILL_GAP_ANALYSIS,
      version: 'v2',
      systemPrompt: `You are a career development expert. Analyze skill gaps between a candidate's CV and a target role.
Return a JSON object with:
{
  "matchScore": 75,
  "matchingSkills": ["skill1"],
  "missingSkills": [{ "skill": "", "importance": "critical|important|nice-to-have", "learningPath": "" }],
  "recommendations": [""],
  "estimatedTimeToFill": ""
}`,
      userPromptTemplate: 'CV Data: {cvData}\n\nTarget Role: {targetRole}',
      jsonMode: true,
      maxTokens: 3000,
      isActive: true,
      createdAt: new Date(),
    });

    // ── Interview Prep ──
    this.register({
      id: 'interview-prep',
      toolType: AiToolType.INTERVIEW_PREP,
      version: 'v2',
      systemPrompt: `You are an expert interview coach. Prepare interview guidance based on CV and job description.
Return a JSON object with:
{
  "likelyQuestions": [
    { "question": "", "category": "behavioral|technical|situational|experience", "difficulty": "easy|medium|hard", "suggestedAnswer": "", "tips": "" }
  ],
  "talkingPoints": [""],
  "weaknesses": [""],
  "strengthsToHighlight": [""]
}
Generate 8-10 diverse questions.`,
      userPromptTemplate: 'CV: {cvData}\n\nJob Description: {jobDescription}',
      jsonMode: true,
      maxTokens: 4000,
      isActive: true,
      createdAt: new Date(),
    });

    // ── HTML Generation ──
    this.register({
      id: 'cv-html',
      toolType: AiToolType.CV_REGENERATE_HTML,
      version: 'v2',
      systemPrompt: `Generate a beautiful, professional HTML CV/resume. Return ONLY the full HTML string (no JSON wrapper). Use inline CSS for styling. Make it print-friendly (A4 size). The design should be modern, clean, and ATS-friendly.`,
      userPromptTemplate: 'Generate HTML for this CV: {cvData}',
      jsonMode: false,
      maxTokens: 16384,
      isActive: true,
      createdAt: new Date(),
    });

    // ── Section Edit ──
    this.register({
      id: 'cv-edit-section',
      toolType: AiToolType.CV_EDIT_SECTION,
      version: 'v2',
      systemPrompt: `You are a CV section editor. Edit the specified section based on the user's instructions.
Return a JSON object with the updated section content (matching the original content structure for the section type).`,
      userPromptTemplate:
        'Section type: {sectionType}\nCurrent content: {currentContent}\n\nInstruction: {prompt}',
      jsonMode: true,
      maxTokens: 4000,
      isActive: true,
      createdAt: new Date(),
    });

    // ── Chat ──
    this.register({
      id: 'cv-chat',
      toolType: AiToolType.CV_CHAT,
      version: 'v2',
      systemPrompt: `You are a friendly and helpful CV assistant. Help the user with their CV questions, provide suggestions, and offer professional advice. Be conversational but professional.`,
      userPromptTemplate: '{message}',
      jsonMode: false,
      maxTokens: 2000,
      isActive: true,
      createdAt: new Date(),
    });

    this.logger.log(`📝 Registered ${this.prompts.size} prompt templates`);
  }

  // ─── Registry Operations ───

  register(template: PromptTemplate): void {
    const key = this.makeKey(template.id, template.version);
    this.prompts.set(key, template);
  }

  get(id: string, version = 'v2'): PromptTemplate | undefined {
    return this.prompts.get(this.makeKey(id, version));
  }

  getByToolType(
    toolType: AiToolType,
    version = 'v2',
  ): PromptTemplate | undefined {
    for (const template of this.prompts.values()) {
      if (
        template.toolType === toolType &&
        template.version === version &&
        template.isActive
      ) {
        return template;
      }
    }
    return undefined;
  }

  /**
   * Build the user prompt by replacing {placeholders} with actual values.
   */
  buildUserPrompt(
    template: PromptTemplate,
    variables: Record<string, string>,
  ): string {
    let prompt = template.userPromptTemplate;
    for (const [key, value] of Object.entries(variables)) {
      prompt = prompt.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    return prompt;
  }

  /**
   * Select a variant for A/B testing based on weights.
   */
  selectVariant(template: PromptTemplate): string {
    if (!template.variants || Object.keys(template.variants).length === 0) {
      return template.systemPrompt;
    }

    const rand = Math.random();
    let cumulative = 0;
    for (const [, variant] of Object.entries(template.variants)) {
      cumulative += variant.weight;
      if (rand <= cumulative) {
        return variant.systemPrompt;
      }
    }

    return template.systemPrompt;
  }

  listAll(): PromptTemplate[] {
    return [...this.prompts.values()];
  }

  private makeKey(id: string, version: string): string {
    return `${id}:${version}`;
  }
}
