import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QueueName, JobType } from '../../common/enums/job-status.enum.js';
import { AiOrchestratorService } from '../../ai/orchestrator/ai-orchestrator.service.js';
import { PromptRegistryService } from '../../ai/orchestrator/prompt-registry.service.js';
import { AiJobData } from '../queue-manager.service.js';

@Processor(QueueName.AI_PROCESSING, {
  concurrency: 5,
  limiter: { max: 20, duration: 60000 },
})
export class AiJobProcessor extends WorkerHost {
  private readonly logger = new Logger(AiJobProcessor.name);

  constructor(
    private orchestrator: AiOrchestratorService,
    private promptRegistry: PromptRegistryService,
  ) {
    super();
  }

  async process(job: Job<AiJobData>): Promise<any> {
    const { userId, jobType, payload, cvId, correlationId } = job.data;

    this.logger.log(
      `Processing AI job ${job.id} [${jobType}] for user ${userId} (attempt ${job.attemptsMade + 1})`,
    );

    try {
      await job.updateProgress(10);
      let result: any;

      switch (jobType) {
        case JobType.AI_CV_GENERATE:
          result = await this.processCvGenerate(job, payload);
          break;
        case JobType.AI_CV_ENHANCE:
          result = await this.processCvEnhance(job, payload);
          break;
        case JobType.AI_CV_TAILOR:
          result = await this.processCvTailor(job, payload);
          break;
        case JobType.AI_ATS_SCORE:
          result = await this.processAtsScore(job, payload);
          break;
        case JobType.AI_SKILL_GAP:
          result = await this.processSkillGap(job, payload);
          break;
        case JobType.AI_INTERVIEW_PREP:
          result = await this.processInterviewPrep(job, payload);
          break;
        case JobType.AI_BULLETS:
          result = await this.processBulletImprove(job, payload);
          break;
        case JobType.AI_SUMMARY:
          result = await this.processSummary(job, payload);
          break;
        default:
          throw new Error(`Unknown job type: ${jobType}`);
      }

      await job.updateProgress(100);
      this.logger.log(`AI job ${job.id} [${jobType}] completed successfully`);
      return result;
    } catch (error: any) {
      this.logger.error(
        `AI job ${job.id} [${jobType}] failed: ${error.message}`,
      );
      throw error;
    }
  }

  private async processCvGenerate(job: Job, payload: Record<string, any>) {
    const template = this.promptRegistry.get('cv-generate');
    if (!template) throw new Error('Prompt template cv-generate not found');

    await job.updateProgress(30);

    const userPrompt = this.promptRegistry.buildUserPrompt(template, {
      prompt: payload.prompt || '',
    });

    const response = await this.orchestrator.complete({
      systemPrompt: template.systemPrompt,
      userPrompt,
      jsonMode: template.jsonMode,
      maxTokens: template.maxTokens,
      metadata: {
        userId: job.data.userId,
        cvId: job.data.cvId,
        toolType: 'cv_generate',
      },
    });

    await job.updateProgress(80);
    return JSON.parse(response.content);
  }

  private async processCvEnhance(job: Job, payload: Record<string, any>) {
    const template = this.promptRegistry.get('cv-enhance');
    if (!template) throw new Error('Prompt template cv-enhance not found');

    await job.updateProgress(30);

    const userPrompt = this.promptRegistry.buildUserPrompt(template, {
      cvData: JSON.stringify(payload.cvData),
      focus: payload.focus || 'general improvement',
    });

    const response = await this.orchestrator.complete({
      systemPrompt: template.systemPrompt,
      userPrompt,
      jsonMode: template.jsonMode,
      maxTokens: template.maxTokens,
      metadata: { userId: job.data.userId, toolType: 'cv_enhance' },
    });

    await job.updateProgress(80);
    return JSON.parse(response.content);
  }

  private async processCvTailor(job: Job, payload: Record<string, any>) {
    const template = this.promptRegistry.get('cv-tailor');
    if (!template) throw new Error('Prompt template cv-tailor not found');

    await job.updateProgress(30);

    const userPrompt = this.promptRegistry.buildUserPrompt(template, {
      cvData: JSON.stringify(payload.cvData),
      jobDescription: payload.jobDescription || '',
    });

    const response = await this.orchestrator.complete({
      systemPrompt: template.systemPrompt,
      userPrompt,
      jsonMode: template.jsonMode,
      maxTokens: template.maxTokens,
      metadata: { userId: job.data.userId, toolType: 'job_tailor' },
    });

    await job.updateProgress(80);
    return JSON.parse(response.content);
  }

  private async processAtsScore(job: Job, payload: Record<string, any>) {
    const template = this.promptRegistry.get('ats-optimize');
    if (!template) throw new Error('Prompt template ats-optimize not found');

    await job.updateProgress(30);

    const userPrompt = this.promptRegistry.buildUserPrompt(template, {
      cvData: JSON.stringify(payload.cvData),
      jobDescription: payload.jobDescription || '',
    });

    const response = await this.orchestrator.complete({
      systemPrompt: template.systemPrompt,
      userPrompt,
      jsonMode: template.jsonMode,
      maxTokens: template.maxTokens,
      metadata: { userId: job.data.userId, toolType: 'ats_optimize' },
    });

    await job.updateProgress(80);
    return JSON.parse(response.content);
  }

  private async processSkillGap(job: Job, payload: Record<string, any>) {
    const template = this.promptRegistry.get('skill-gap');
    if (!template) throw new Error('Prompt template skill-gap not found');

    await job.updateProgress(30);

    const userPrompt = this.promptRegistry.buildUserPrompt(template, {
      cvData: JSON.stringify(payload.cvData),
      targetRole: payload.targetRole || '',
    });

    const response = await this.orchestrator.complete({
      systemPrompt: template.systemPrompt,
      userPrompt,
      jsonMode: template.jsonMode,
      maxTokens: template.maxTokens,
      metadata: { userId: job.data.userId, toolType: 'skill_gap_analysis' },
    });

    await job.updateProgress(80);
    return JSON.parse(response.content);
  }

  private async processInterviewPrep(job: Job, payload: Record<string, any>) {
    const template = this.promptRegistry.get('interview-prep');
    if (!template) throw new Error('Prompt template interview-prep not found');

    await job.updateProgress(30);

    const userPrompt = this.promptRegistry.buildUserPrompt(template, {
      cvData: JSON.stringify(payload.cvData),
      jobDescription: payload.jobDescription || '',
    });

    const response = await this.orchestrator.complete({
      systemPrompt: template.systemPrompt,
      userPrompt,
      jsonMode: template.jsonMode,
      maxTokens: template.maxTokens,
      metadata: { userId: job.data.userId, toolType: 'interview_prep' },
    });

    await job.updateProgress(80);
    return JSON.parse(response.content);
  }

  private async processBulletImprove(job: Job, payload: Record<string, any>) {
    const template = this.promptRegistry.get('bullet-improve');
    if (!template) throw new Error('Prompt template bullet-improve not found');

    await job.updateProgress(30);

    const userPrompt = this.promptRegistry.buildUserPrompt(template, {
      bullets: JSON.stringify(payload.bullets),
      context: payload.context || '',
    });

    const response = await this.orchestrator.complete({
      systemPrompt: template.systemPrompt,
      userPrompt,
      jsonMode: template.jsonMode,
      maxTokens: template.maxTokens,
      metadata: { userId: job.data.userId, toolType: 'bullet_improve' },
    });

    await job.updateProgress(80);
    return JSON.parse(response.content);
  }

  private async processSummary(job: Job, payload: Record<string, any>) {
    const template = this.promptRegistry.get('summary-generate');
    if (!template)
      throw new Error('Prompt template summary-generate not found');

    await job.updateProgress(30);

    const userPrompt = this.promptRegistry.buildUserPrompt(template, {
      cvData: JSON.stringify(payload.cvData),
      targetRole: payload.targetRole || '',
    });

    const response = await this.orchestrator.complete({
      systemPrompt: template.systemPrompt,
      userPrompt,
      jsonMode: template.jsonMode,
      maxTokens: template.maxTokens,
      metadata: { userId: job.data.userId, toolType: 'summary_generate' },
    });

    await job.updateProgress(80);
    return JSON.parse(response.content);
  }
}
