import {
  Controller,
  Post,
  Headers,
  Req,
  Logger,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { StripeService } from './stripe.service.js';
import { SubscriptionsService } from '../subscriptions/subscriptions.service.js';
import { AuditService } from '../audit/audit.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { AuditAction } from '../common/enums/audit-action.enum.js';
import {
  SubscriptionPlan,
  SubscriptionStatus,
} from '../common/enums/subscription-plan.enum.js';
import Stripe from 'stripe';

@Controller('api/stripe')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    private readonly stripeService: StripeService,
    @Inject(forwardRef(() => SubscriptionsService))
    private readonly subscriptionsService: SubscriptionsService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    let event: Stripe.Event;
    try {
      event = this.stripeService.constructWebhookEvent(req.rawBody!, signature);
    } catch (err: any) {
      this.logger.error(
        `Webhook signature verification failed: ${err.message}`,
      );
      throw new BadRequestException('Invalid webhook signature');
    }

    this.logger.log(`📩 Stripe webhook: ${event.type}`);

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutComplete(
            event.data.object as Stripe.Checkout.Session,
          );
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(
            event.data.object as Stripe.Subscription,
          );
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(
            event.data.object as Stripe.Subscription,
          );
          break;

        case 'invoice.payment_succeeded':
          await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoiceFailed(event.data.object as Stripe.Invoice);
          break;

        default:
          this.logger.debug(`Unhandled event type: ${event.type}`);
      }
    } catch (error: any) {
      this.logger.error(
        `Error processing webhook ${event.type}: ${error.message}`,
      );
      // Still return 200 to prevent Stripe retries for processing errors
    }

    return { received: true };
  }

  // ─── Handlers ───

  private async handleCheckoutComplete(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan as SubscriptionPlan;

    if (!userId || !plan) {
      this.logger.warn('Checkout session missing metadata');
      return;
    }

    const stripeSubscriptionId = session.subscription as string;
    const stripeCustomerId = session.customer as string;

    await this.subscriptionsService.activateFromStripe(
      userId,
      plan,
      stripeCustomerId,
      stripeSubscriptionId,
    );

    await this.auditService.log({
      userId,
      action: AuditAction.SUBSCRIPTION_UPGRADED,
      resource: 'subscription',
      metadata: { plan, stripeSubscriptionId },
    });

    await this.notificationsService.create({
      userId,
      type: 'success',
      title: `Welcome to ${plan.charAt(0).toUpperCase() + plan.slice(1)}! 🎉`,
      message: `Your ${plan} plan is now active. Enjoy all your new features!`,
    });

    this.logger.log(`✅ User ${userId} upgraded to ${plan}`);
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const userId = subscription.metadata?.userId;
    if (!userId) return;

    const priceId = subscription.items.data[0]?.price?.id;
    if (!priceId) return;

    const planInfo = this.stripeService.planFromPriceId(priceId);
    if (!planInfo) {
      this.logger.warn(`Unknown price ID: ${priceId}`);
      return;
    }

    // Map Stripe status to our status
    let status: SubscriptionStatus;
    switch (subscription.status) {
      case 'active':
      case 'trialing':
        status = SubscriptionStatus.ACTIVE;
        break;
      case 'canceled':
        status = SubscriptionStatus.CANCELLED;
        break;
      case 'past_due':
      case 'unpaid':
        status = SubscriptionStatus.EXPIRED;
        break;
      default:
        status = SubscriptionStatus.ACTIVE;
    }

    await this.subscriptionsService.syncFromStripe(userId, {
      plan: planInfo.plan,
      status,
      stripeSubscriptionId: subscription.id,
      currentPeriodStart: new Date(
        (subscription as any).current_period_start * 1000,
      ),
      currentPeriodEnd: new Date(
        (subscription as any).current_period_end * 1000,
      ),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });

    this.logger.log(
      `🔄 Subscription updated for user ${userId}: ${planInfo.plan} (${status})`,
    );
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const userId = subscription.metadata?.userId;
    if (!userId) return;

    await this.subscriptionsService.deactivateFromStripe(userId);

    await this.notificationsService.create({
      userId,
      type: 'info',
      title: 'Subscription ended',
      message: 'Your subscription has ended. You are now on the Free plan.',
    });

    this.logger.log(`❌ Subscription cancelled for user ${userId}`);
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;
    this.logger.log(
      `💰 Invoice paid: $${(invoice.amount_paid / 100).toFixed(2)} for customer ${customerId}`,
    );
  }

  private async handleInvoiceFailed(invoice: Stripe.Invoice) {
    const subscriptionId = (invoice as any).subscription as string;
    if (!subscriptionId) return;

    try {
      const subscription =
        await this.stripeService.getSubscription(subscriptionId);
      const userId = subscription.metadata?.userId;

      if (userId) {
        await this.notificationsService.create({
          userId,
          type: 'error',
          title: 'Payment failed',
          message:
            'Your payment could not be processed. Please update your payment method to avoid service interruption.',
        });
      }
    } catch (error: any) {
      this.logger.error(`Error handling failed invoice: ${error.message}`);
    }
  }
}
