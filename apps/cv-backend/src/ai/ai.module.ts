import { Module } from '@nestjs/common';
import { AiService } from './ai.service.js';
import { AiController } from './ai.controller.js';
import { AiUsageModule } from '../ai-usage/ai-usage.module.js';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module.js';

@Module({
  imports: [AiUsageModule, SubscriptionsModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
