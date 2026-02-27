import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { SubscriptionPlan } from '../common/enums/subscription-plan.enum.js';

export interface StripePriceIds {
  premium_monthly: string;
  premium_yearly: string;
  enterprise_monthly: string;
  enterprise_yearly: string;
}

@Injectable()
export class StripeService implements OnModuleInit {
  private readonly logger = new Logger(StripeService.name);
  public stripe: Stripe;
  private priceIds: StripePriceIds;

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>('stripe.secretKey');
    this.stripe = new Stripe(secretKey || '', {
      apiVersion: '2026-02-25.clover' as any,
    });

    this.priceIds = {
      premium_monthly:
        this.configService.get<string>('stripe.prices.premiumMonthly') || '',
      premium_yearly:
        this.configService.get<string>('stripe.prices.premiumYearly') || '',
      enterprise_monthly:
        this.configService.get<string>('stripe.prices.enterpriseMonthly') || '',
      enterprise_yearly:
        this.configService.get<string>('stripe.prices.enterpriseYearly') || '',
    };
  }

  async onModuleInit() {
    // Verify Stripe connection on startup
    try {
      if (this.configService.get<string>('stripe.secretKey')) {
        await this.stripe.customers.list({ limit: 1 });
        this.logger.log('✅ Stripe connected successfully');
      } else {
        this.logger.warn(
          '⚠️ Stripe secret key not configured — payments disabled',
        );
      }
    } catch (error: any) {
      this.logger.error(`❌ Stripe connection failed: ${error.message}`);
    }
  }

  isConfigured(): boolean {
    return !!this.configService.get<string>('stripe.secretKey');
  }

  // ─── Customer Management ───

  async createCustomer(
    email: string,
    name: string,
    metadata?: Record<string, string>,
  ): Promise<Stripe.Customer> {
    return this.stripe.customers.create({
      email,
      name,
      metadata: { ...metadata },
    });
  }

  async getCustomer(customerId: string): Promise<Stripe.Customer> {
    return this.stripe.customers.retrieve(
      customerId,
    ) as Promise<Stripe.Customer>;
  }

  async updateCustomer(
    customerId: string,
    data: Stripe.CustomerUpdateParams,
  ): Promise<Stripe.Customer> {
    return this.stripe.customers.update(customerId, data);
  }

  // ─── Checkout Session ───

  async createCheckoutSession(params: {
    customerId: string;
    plan: SubscriptionPlan;
    billingCycle: 'monthly' | 'yearly';
    successUrl: string;
    cancelUrl: string;
    userId: string;
  }): Promise<Stripe.Checkout.Session> {
    const priceId = this.getPriceId(params.plan, params.billingCycle);
    if (!priceId) {
      throw new Error(
        `No price configured for ${params.plan} ${params.billingCycle}`,
      );
    }

    return this.stripe.checkout.sessions.create({
      customer: params.customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: {
        userId: params.userId,
        plan: params.plan,
        billingCycle: params.billingCycle,
      },
      subscription_data: {
        metadata: {
          userId: params.userId,
          plan: params.plan,
        },
      },
      allow_promotion_codes: true,
    });
  }

  // ─── Billing Portal ───

  async createBillingPortalSession(
    customerId: string,
    returnUrl: string,
  ): Promise<Stripe.BillingPortal.Session> {
    return this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  // ─── Subscription Management ───

  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return this.stripe.subscriptions.retrieve(subscriptionId);
  }

  async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd = true,
  ): Promise<Stripe.Subscription> {
    if (cancelAtPeriodEnd) {
      return this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    }
    return this.stripe.subscriptions.cancel(subscriptionId);
  }

  async resumeSubscription(
    subscriptionId: string,
  ): Promise<Stripe.Subscription> {
    return this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
  }

  async changeSubscription(
    subscriptionId: string,
    newPlan: SubscriptionPlan,
    billingCycle: 'monthly' | 'yearly',
  ): Promise<Stripe.Subscription> {
    const priceId = this.getPriceId(newPlan, billingCycle);
    if (!priceId) {
      throw new Error(`No price configured for ${newPlan} ${billingCycle}`);
    }

    const subscription =
      await this.stripe.subscriptions.retrieve(subscriptionId);
    const itemId = subscription.items.data[0]?.id;
    if (!itemId) throw new Error('No subscription item found');

    return this.stripe.subscriptions.update(subscriptionId, {
      items: [{ id: itemId, price: priceId }],
      proration_behavior: 'create_prorations',
      metadata: { plan: newPlan },
    });
  }

  // ─── Invoice / Payment History ───

  async getInvoices(customerId: string, limit = 10): Promise<Stripe.Invoice[]> {
    const list = await this.stripe.invoices.list({
      customer: customerId,
      limit,
    });
    return list.data;
  }

  async getUpcomingInvoice(customerId: string): Promise<Stripe.Invoice | null> {
    try {
      return await (this.stripe.invoices as any).retrieveUpcoming({
        customer: customerId,
      });
    } catch {
      return null; // No upcoming invoice (e.g. free plan)
    }
  }

  // ─── Webhooks ───

  constructWebhookEvent(body: Buffer, signature: string): Stripe.Event {
    const webhookSecret = this.configService.get<string>(
      'stripe.webhookSecret',
    );
    if (!webhookSecret) {
      throw new Error('Stripe webhook secret not configured');
    }
    return this.stripe.webhooks.constructEvent(body, signature, webhookSecret);
  }

  // ─── Helpers ───

  getPriceId(
    plan: SubscriptionPlan,
    billingCycle: 'monthly' | 'yearly',
  ): string | null {
    const key = `${plan}_${billingCycle}` as keyof StripePriceIds;
    return this.priceIds[key] || null;
  }

  planFromPriceId(priceId: string): {
    plan: SubscriptionPlan;
    billingCycle: 'monthly' | 'yearly';
  } | null {
    for (const [key, id] of Object.entries(this.priceIds)) {
      if (id === priceId) {
        const [plan, cycle] = key.split('_') as [
          SubscriptionPlan,
          'monthly' | 'yearly',
        ];
        return { plan, billingCycle: cycle };
      }
    }
    return null;
  }
}
