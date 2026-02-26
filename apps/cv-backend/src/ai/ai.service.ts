import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('openai.apiKey'),
    });
  }

  async generateCv(
    prompt: string,
    context?: Record<string, any>,
  ): Promise<{
    sections: any[];
    personalInfo: any;
    summary: string;
    theme: any;
    html: string;
  }> {
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
        temperature: 0.7,
        max_completion_tokens: 4000,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI');
      }

      return JSON.parse(content);
    } catch (error) {
      this.logger.error('AI CV generation failed', error);
      throw error;
    }
  }

  async editSection(
    prompt: string,
    sectionType: string,
    currentContent?: any,
  ): Promise<any> {
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
        temperature: 0.7,
        max_completion_tokens: 2000,
      });

      const content = completion.choices[0]?.message?.content;
      return content ? JSON.parse(content) : null;
    } catch (error) {
      this.logger.error('AI section edit failed', error);
      throw error;
    }
  }

  async generateCvHtml(cvData: any): Promise<string> {
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
        temperature: 0.5,
        max_completion_tokens: 4000,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      this.logger.error('AI HTML generation failed', error);
      throw error;
    }
  }

  async chatAboutCv(
    messages: { role: 'user' | 'assistant'; content: string }[],
    cvContext?: any,
  ): Promise<string> {
    const systemPrompt = `You are a helpful CV building assistant. Help the user improve their CV, suggest changes, and provide career advice.
${cvContext ? `Current CV data: ${JSON.stringify(cvContext)}` : ''}
Respond in a friendly, professional manner. When suggesting CV changes, be specific about what to modify.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-5',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        temperature: 0.7,
        max_completion_tokens: 1500,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      this.logger.error('AI chat failed', error);
      throw error;
    }
  }
}
