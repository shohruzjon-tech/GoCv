import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Subscription,
  SubscriptionSchema,
} from './schemas/subscription.schema.js';
import { PlanConfig, PlanConfigSchema } from './schemas/plan-config.schema.js';
import { SubscriptionsService } from './subscriptions.service.js';
import { SubscriptionsController } from './subscriptions.controller.js';
import { PlanConfigService } from './plan-config.service.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: PlanConfig.name, schema: PlanConfigSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, PlanConfigService],
  exports: [SubscriptionsService, PlanConfigService],
})
export class SubscriptionsModule {}
