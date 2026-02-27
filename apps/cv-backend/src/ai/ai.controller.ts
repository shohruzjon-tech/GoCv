import { Controller, Post, Body, UseGuards, Param, Get } from '@nestjs/common';
import { AiService } from './ai.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { AiUsageService } from '../ai-usage/ai-usage.service.js';

@Controller('api/ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    private aiService: AiService,
    private aiUsageService: AiUsageService,
  ) {}

  @Post('chat')
  async chat(
    @CurrentUser('_id') userId: string,
    @Body('messages')
    messages: { role: 'user' | 'assistant'; content: string }[],
    @Body('cvContext') cvContext?: any,
  ) {
    const response = await this.aiService.chatAboutCv(
      messages,
      cvContext,
      userId,
    );
    return { message: response };
  }

  // ─── Advanced AI Tools ───

  @Post('enhance')
  async enhanceCv(
    @CurrentUser('_id') userId: string,
    @Body('cvData') cvData: any,
  ) {
    return this.aiService.enhanceCv(cvData, userId);
  }

  @Post('tailor')
  async tailorForJob(
    @CurrentUser('_id') userId: string,
    @Body('cvData') cvData: any,
    @Body('jobDescription') jobDescription: string,
  ) {
    return this.aiService.tailorForJob(cvData, jobDescription, userId);
  }

  @Post('improve-bullets')
  async improveBulletPoints(
    @CurrentUser('_id') userId: string,
    @Body('bulletPoints') bulletPoints: string[],
    @Body('context') context: string,
  ) {
    return this.aiService.improveBulletPoints(bulletPoints, context, userId);
  }

  @Post('generate-summary')
  async generateSummary(
    @CurrentUser('_id') userId: string,
    @Body('cvData') cvData: any,
    @Body('tone')
    tone: 'professional' | 'creative' | 'technical' | 'executive',
  ) {
    return this.aiService.generateSummary(cvData, tone, userId);
  }

  @Post('skill-gap')
  async analyzeSkillGap(
    @CurrentUser('_id') userId: string,
    @Body('cvData') cvData: any,
    @Body('targetRole') targetRole: string,
  ) {
    return this.aiService.analyzeSkillGap(cvData, targetRole, userId);
  }

  @Post('ats-score')
  async atsOptimize(
    @CurrentUser('_id') userId: string,
    @Body('cvData') cvData: any,
    @Body('jobDescription') jobDescription?: string,
  ) {
    return this.aiService.atsOptimize(cvData, jobDescription, userId);
  }

  @Post('interview-prep')
  async interviewPrep(
    @CurrentUser('_id') userId: string,
    @Body('cvData') cvData: any,
    @Body('jobDescription') jobDescription: string,
  ) {
    return this.aiService.interviewPrep(cvData, jobDescription, userId);
  }

  // ─── Profile Extraction ───

  @Post('extract-profile')
  async extractProfile(
    @CurrentUser('_id') userId: string,
    @Body('text') text: string,
    @Body('sourceType') sourceType: 'prompt' | 'linkedin' | 'file',
  ) {
    return this.aiService.extractProfile(text, sourceType, userId);
  }

  // ─── Usage Stats ───
  @Get('usage')
  async getMyUsage(@CurrentUser('_id') userId: string) {
    return this.aiUsageService.getUserMonthlyStats(userId);
  }

  @Get('usage/history')
  async getMyUsageHistory(@CurrentUser('_id') userId: string) {
    return this.aiUsageService.getUserUsage(userId);
  }
}
