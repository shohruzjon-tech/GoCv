import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QueueName } from '../../common/enums/job-status.enum.js';
import { WebhookJobData } from '../queue-manager.service.js';
import * as crypto from 'crypto';

@Processor(QueueName.WEBHOOKS, {
  concurrency: 10,
  limiter: { max: 50, duration: 60000 },
})
export class WebhookJobProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookJobProcessor.name);

  async process(job: Job<WebhookJobData>): Promise<any> {
    const { url, event, payload, secret } = job.data;

    this.logger.log(
      `Dispatching webhook ${job.id} [${event}] → ${url} (attempt ${job.attemptsMade + 1})`,
    );

    try {
      const body = JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        data: payload,
      });

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Webhook-Event': event,
        'X-Webhook-Delivery': job.id || '',
        'X-Webhook-Timestamp': Date.now().toString(),
      };

      // Sign the payload if a secret is provided (HMAC SHA-256)
      if (secret) {
        const signature = crypto
          .createHmac('sha256', secret)
          .update(body)
          .digest('hex');
        headers['X-Webhook-Signature'] = `sha256=${signature}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        throw new Error(`Webhook returned HTTP ${response.status}: ${response.statusText}`);
      }

      this.logger.log(`Webhook ${job.id} delivered: HTTP ${response.status}`);
      return {
        status: response.status,
        deliveredAt: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error(`Webhook ${job.id} failed: ${error.message}`);
      throw error;
    }
  }
}
