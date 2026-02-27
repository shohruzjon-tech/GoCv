import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueName } from '../common/enums/job-status.enum.js';
import { QueueManagerService } from './queue-manager.service.js';
import { AiJobProcessor } from './processors/ai-job.processor.js';
import { PdfJobProcessor } from './processors/pdf-job.processor.js';
import { WebhookJobProcessor } from './processors/webhook-job.processor.js';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('redis.host') || 'localhost',
          port: configService.get<number>('redis.port') || 6379,
          password: configService.get<string>('redis.password'),
          db: configService.get<number>('redis.db') || 0,
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: { age: 86400, count: 1000 },
          removeOnFail: { age: 604800, count: 5000 },
        },
      }),
    }),
    BullModule.registerQueue(
      { name: QueueName.AI_PROCESSING },
      { name: QueueName.PDF_GENERATION },
      { name: QueueName.NOTIFICATIONS },
      { name: QueueName.WEBHOOKS },
      { name: QueueName.DATA_PIPELINE },
    ),
  ],
  providers: [
    QueueManagerService,
    AiJobProcessor,
    PdfJobProcessor,
    WebhookJobProcessor,
  ],
  exports: [QueueManagerService, BullModule],
})
export class QueueModule {}
