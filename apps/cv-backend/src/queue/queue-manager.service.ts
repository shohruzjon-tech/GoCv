import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import {
  QueueName,
  JobType,
  JobStatus,
} from '../common/enums/job-status.enum.js';

export interface AiJobData {
  userId: string;
  jobType: JobType;
  payload: Record<string, any>;
  cvId?: string;
  organizationId?: string;
  priority?: number;
  correlationId?: string;
}

export interface PdfJobData {
  userId: string;
  cvId: string;
  templateId?: string;
  format?: 'a4' | 'letter';
  correlationId?: string;
}

export interface WebhookJobData {
  url: string;
  event: string;
  payload: Record<string, any>;
  secret?: string;
  organizationId?: string;
  retryCount?: number;
}

@Injectable()
export class QueueManagerService {
  private readonly logger = new Logger(QueueManagerService.name);

  constructor(
    @InjectQueue(QueueName.AI_PROCESSING) private aiQueue: Queue,
    @InjectQueue(QueueName.PDF_GENERATION) private pdfQueue: Queue,
    @InjectQueue(QueueName.WEBHOOKS) private webhookQueue: Queue,
  ) {}

  // ─── AI Jobs ───

  async enqueueAiJob(data: AiJobData): Promise<Job> {
    const job = await this.aiQueue.add(data.jobType, data, {
      priority: data.priority || 10,
      jobId: data.correlationId || undefined,
      attempts: 3,
      backoff: { type: 'exponential', delay: 3000 },
    });
    this.logger.log(
      `AI job enqueued: ${job.id} [${data.jobType}] for user ${data.userId}`,
    );
    return job;
  }

  async enqueueAiJobBulk(jobs: AiJobData[]): Promise<Job[]> {
    const bulkJobs = jobs.map((data) => ({
      name: data.jobType,
      data,
      opts: {
        priority: data.priority || 10,
        attempts: 3,
        backoff: { type: 'exponential' as const, delay: 3000 },
      },
    }));
    const results = await this.aiQueue.addBulk(bulkJobs);
    this.logger.log(`${results.length} AI jobs enqueued in bulk`);
    return results;
  }

  // ─── PDF Jobs ───

  async enqueuePdfJob(data: PdfJobData): Promise<Job> {
    const job = await this.pdfQueue.add(JobType.PDF_GENERATE, data, {
      priority: 5,
      attempts: 2,
      backoff: { type: 'fixed', delay: 5000 },
    });
    this.logger.log(`PDF job enqueued: ${job.id} for CV ${data.cvId}`);
    return job;
  }

  // ─── Webhook Jobs ───

  async enqueueWebhook(data: WebhookJobData): Promise<Job> {
    const job = await this.webhookQueue.add(JobType.WEBHOOK_DISPATCH, data, {
      priority: 3,
      attempts: 5,
      backoff: { type: 'exponential', delay: 1000 },
    });
    this.logger.log(`Webhook job enqueued: ${job.id} → ${data.url}`);
    return job;
  }

  // ─── Job Status ───

  async getJobStatus(
    queueName: QueueName,
    jobId: string,
  ): Promise<{
    id: string;
    status: string;
    progress: number;
    result?: any;
    failedReason?: string;
    attemptsMade: number;
    timestamp: number;
  } | null> {
    const queue = this.getQueue(queueName);
    const job = await queue.getJob(jobId);
    if (!job) return null;

    const state = await job.getState();
    return {
      id: job.id!,
      status: state,
      progress: (job.progress as number) || 0,
      result: job.returnvalue,
      failedReason: job.failedReason,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
    };
  }

  async getQueueMetrics(queueName: QueueName): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const queue = this.getQueue(queueName);
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);
    return { waiting, active, completed, failed, delayed };
  }

  async getAllQueueMetrics(): Promise<Record<string, any>> {
    const metrics: Record<string, any> = {};
    for (const name of Object.values(QueueName)) {
      try {
        metrics[name] = await this.getQueueMetrics(name);
      } catch {
        metrics[name] = { error: 'Queue not available' };
      }
    }
    return metrics;
  }

  private getQueue(name: QueueName): Queue {
    switch (name) {
      case QueueName.AI_PROCESSING:
        return this.aiQueue;
      case QueueName.PDF_GENERATION:
        return this.pdfQueue;
      case QueueName.WEBHOOKS:
        return this.webhookQueue;
      default:
        throw new Error(`Queue ${name} not registered`);
    }
  }
}
