import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import Stripe from 'stripe';
import { SubscriptionPlan } from '../common/enums/subscription-plan.enum.js';
import {
  SiteSettingsService,
  StripeConfig,
} from '../site-settings/site-settings.service.js';

export interface StripePriceIds {
  premium_monthly: string;
  premium_yearly: string;
  enterprise_monthly: string;
  enterprise_yearly: string;
}

@Injectable()
export class StripeService implements OnModuleInit {
  private readonly logger = new Logger(StripeService.name);
  public stripe: Stripe | null = null;
  private priceIds: StripePriceIds = {
    premium_monthly: '',
    premium_yearly: '',
    enterprise_monthly: '',
    enterprise_yearly: '',
  };
  private webhookSecret = '';
  private enabled = false;

  constructor(private siteSettingsService: SiteSettingsService) {}

  async onModuleInit() {
    await this.reloadConfig();
  }

  /**
   * Reload Stripe configuration from DB. Called on startup and
   * whenever the admin updates Stripe settings.
   */
  async reloadConfig(): Promise<{ ok: boolean; error?: string }> {
    try {
      const config = await this.siteSettingsService.getStripeConfig();
      this.enabled = config.enabled;

      if (!config.enabled || !config.secretKey) {
        this.stripe = null;
        this.webhookSecret = '';
        this.priceIds = {
          premium_monthly: '',
          premium_yearly: '',
          enterprise_monthly: '',
          enterprise_yearly: '',
        };
        this.logger.warn(
          '⚠️ Stripe is disabled or secret key not configured — payments disabled',
        );
        return { ok: true };
      }

      this.stripe = new Stripe(config.secretKey, {
        apiVersion: '2026-02-25.clover' as any,
      });

      this.webhookSecret = config.webhookSecret;

      this.priceIds = {
        premium_monthly: config.premiumMonthlyPriceId,
        premium_yearly: config.premiumYearlyPriceId,
        enterprise_monthly: config.enterpriseMonthlyPriceId,
        enterprise_yearly: config.enterpriseYearlyPriceId,
      };

      // Verify connection
      await this.stripe.customers.list({ limit: 1 });
      this.logger.log('✅ Stripe connected successfully');
      return { ok: true };
    } catch (error: any) {
      this.stripe = null;
      this.enabled = false;
      this.logger.error(`❌ Stripe connection failed: ${error.message}`);
      return { ok: false, error: error.message };
    }
  }

  /** Test a Stripe secret key without persisting it */
  async testConnection(
    secretKey: string,
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      const testStripe = new Stripe(secretKey, {
        apiVersion: '2026-02-25.clover' as any,
      });
      await testStripe.customers.list({ limit: 1 });
      return { ok: true };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  isConfigured(): boolean {
    return this.enabled && !!this.stripe;
  }

  private ensureConfigured() {
    if (!this.isConfigured() || !this.stripe) {
      throw new Error(
        'Stripe is not configured. Ask an admin to enable Stripe in Site Settings.',
      );
    }
  }

  // ─── Customer Management ───

  async createCustomer(
    email: string,
    name: string,
    metadata?: Record<string, string>,
  ): Promise<Stripe.Customer> {
    this.ensureConfigured();
    return this.stripe!.customers.create({
      email,
      name,
      metadata: { ...metadata },
    });
  }

  async getCustomer(customerId: string): Promise<Stripe.Customer> {
    this.ensureConfigured();
    return this.stripe!.customers.retrieve(
      customerId,
    ) as Promise<Stripe.Customer>;
  }

  async updateCustomer(
    customerId: string,
    data: Stripe.CustomerUpdateParams,
  ): Promise<Stripe.Customer> {
    this.ensureConfigured();
    return this.stripe!.customers.update(customerId, data);
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
    this.ensureConfigured();
    const priceId = this.getPriceId(params.plan, params.billingCycle);
    if (!priceId) {
      throw new Error(
        `No price configured for ${params.plan} ${params.billingCycle}`,
      );
    }

    return this.stripe!.checkout.sessions.create({
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
    this.ensureConfigured();
    return this.stripe!.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  // ─── Subscription Management ───

  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    this.ensureConfigured();
    return this.stripe!.subscriptions.retrieve(subscriptionId);
  }

  async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd = true,
  ): Promise<Stripe.Subscription> {
    this.ensureConfigured();
    if (cancelAtPeriodEnd) {
      return this.stripe!.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    }
    return this.stripe!.subscriptions.cancel(subscriptionId);
  }

  async resumeSubscription(
    subscriptionId: string,
  ): Promise<Stripe.Subscription> {
    this.ensureConfigured();
    return this.stripe!.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
  }

  async changeSubscription(
    subscriptionId: string,
    newPlan: SubscriptionPlan,
    billingCycle: 'monthly' | 'yearly',
  ): Promise<Stripe.Subscription> {
    this.ensureConfigured();
    const priceId = this.getPriceId(newPlan, billingCycle);
    if (!priceId) {
      throw new Error(`No price configured for ${newPlan} ${billingCycle}`);
    }

    const subscription =
      await this.stripe!.subscriptions.retrieve(subscriptionId);
    const itemId = subscription.items.data[0]?.id;
    if (!itemId) throw new Error('No subscription item found');

    return this.stripe!.subscriptions.update(subscriptionId, {
      items: [{ id: itemId, price: priceId }],
      proration_behavior: 'create_prorations',
      metadata: { plan: newPlan },
    });
  }

  // ─── Invoice / Payment History ───

  async getInvoices(customerId: string, limit = 10): Promise<Stripe.Invoice[]> {
    this.ensureConfigured();
    const list = await this.stripe!.invoices.list({
      customer: customerId,
      limit,
    });
    return list.data;
  }

  async getUpcomingInvoice(customerId: string): Promise<Stripe.Invoice | null> {
    this.ensureConfigured();
    try {
      return await (this.stripe!.invoices as any).retrieveUpcoming({
        customer: customerId,
      });
    } catch {
      return null; // No upcoming invoice (e.g. free plan)
    }
  }

  // ─── Webhooks ───

  constructWebhookEvent(body: Buffer, signature: string): Stripe.Event {
    this.ensureConfigured();
    if (!this.webhookSecret) {
      throw new Error('Stripe webhook secret not configured');
    }
    return this.stripe!.webhooks.constructEvent(
      body,
      signature,
      this.webhookSecret,
    );
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
