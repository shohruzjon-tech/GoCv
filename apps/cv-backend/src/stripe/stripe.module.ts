import { Global, Module, forwardRef } from '@nestjs/common';
import { StripeService } from './stripe.service.js';
import { StripeWebhookController } from './stripe-webhook.controller.js';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Global()
@Module({
  imports: [forwardRef(() => SubscriptionsModule), NotificationsModule],
  controllers: [StripeWebhookController],
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule {}
