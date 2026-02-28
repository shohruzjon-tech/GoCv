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

  /** Gather Stripe health & analytics for the admin dashboard */
  async getHealthAndAnalytics(): Promise<{
    health: {
      status: 'connected' | 'disconnected' | 'degraded';
      latencyMs: number;
      apiVersion: string;
      lastCheckedAt: string;
    };
    overview: {
      totalCustomers: number;
      activeSubscriptions: number;
      totalBalance: number;
      currency: string;
    };
    recentCharges: {
      total: number;
      succeeded: number;
      failed: number;
      incomplete: number;
      totalAmount: number;
      failedAmount: number;
    };
    webhookEvents: {
      recentEvents: Array<{
        id: string;
        type: string;
        created: number;
        status: string;
      }>;
      totalRecent: number;
    };
    subscriptionBreakdown: {
      active: number;
      pastDue: number;
      canceled: number;
      trialing: number;
      incomplete: number;
    };
    revenueTimeline: Array<{
      date: string;
      amount: number;
      count: number;
    }>;
  }> {
    if (!this.isConfigured() || !this.stripe) {
      return {
        health: {
          status: 'disconnected',
          latencyMs: 0,
          apiVersion: '',
          lastCheckedAt: new Date().toISOString(),
        },
        overview: {
          totalCustomers: 0,
          activeSubscriptions: 0,
          totalBalance: 0,
          currency: 'usd',
        },
        recentCharges: {
          total: 0,
          succeeded: 0,
          failed: 0,
          incomplete: 0,
          totalAmount: 0,
          failedAmount: 0,
        },
        webhookEvents: { recentEvents: [], totalRecent: 0 },
        subscriptionBreakdown: {
          active: 0,
          pastDue: 0,
          canceled: 0,
          trialing: 0,
          incomplete: 0,
        },
        revenueTimeline: [],
      };
    }

    const startTime = Date.now();
    let healthStatus: 'connected' | 'disconnected' | 'degraded' = 'connected';
    let latencyMs = 0;

    try {
      await this.stripe.customers.list({ limit: 1 });
      latencyMs = Date.now() - startTime;
      if (latencyMs > 3000) healthStatus = 'degraded';
    } catch {
      healthStatus = 'disconnected';
      latencyMs = Date.now() - startTime;
    }

    // Run all data fetches in parallel
    const thirtyDaysAgo = Math.floor(
      (Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000,
    );
    const now = Math.floor(Date.now() / 1000);

    const [
      customersRes,
      activeSubsRes,
      pastDueSubsRes,
      canceledSubsRes,
      trialingSubsRes,
      incompleteSubsRes,
      chargesRes,
      balanceRes,
      eventsRes,
      invoicesRes,
    ] = await Promise.allSettled([
      this.stripe.customers.list({ limit: 1 }),
      this.stripe.subscriptions.list({ status: 'active', limit: 1 }),
      this.stripe.subscriptions.list({ status: 'past_due', limit: 1 }),
      this.stripe.subscriptions.list({ status: 'canceled', limit: 1 }),
      this.stripe.subscriptions.list({ status: 'trialing', limit: 1 }),
      this.stripe.subscriptions.list({ status: 'incomplete', limit: 1 }),
      this.stripe.charges.list({ limit: 100, created: { gte: thirtyDaysAgo } }),
      this.stripe.balance.retrieve(),
      this.stripe.events.list({ limit: 20 }),
      this.stripe.invoices.list({
        limit: 100,
        created: { gte: thirtyDaysAgo },
        status: 'paid',
      }),
    ]);

    // Parse results safely
    const safeVal = <T>(result: PromiseSettledResult<T>, fallback: T): T =>
      result.status === 'fulfilled' ? result.value : fallback;

    const customers = safeVal(customersRes, {
      data: [],
      has_more: false,
    } as any);
    const activeSubs = safeVal(activeSubsRes, {
      data: [],
      has_more: false,
    } as any);
    const pastDueSubs = safeVal(pastDueSubsRes, {
      data: [],
      has_more: false,
    } as any);
    const canceledSubs = safeVal(canceledSubsRes, {
      data: [],
      has_more: false,
    } as any);
    const trialingSubs = safeVal(trialingSubsRes, {
      data: [],
      has_more: false,
    } as any);
    const incompleteSubs = safeVal(incompleteSubsRes, {
      data: [],
      has_more: false,
    } as any);
    const charges = safeVal(chargesRes, { data: [] } as any);
    const balance = safeVal(balanceRes, { available: [], pending: [] } as any);
    const events = safeVal(eventsRes, { data: [] } as any);
    const invoices = safeVal(invoicesRes, { data: [] } as any);

    // Charges analytics
    const chargeData = charges.data || [];
    const succeededCharges = chargeData.filter(
      (c: any) => c.status === 'succeeded',
    );
    const failedCharges = chargeData.filter((c: any) => c.status === 'failed');
    const incompleteCharges = chargeData.filter(
      (c: any) => c.status !== 'succeeded' && c.status !== 'failed',
    );

    // Revenue timeline — group invoices by day
    const revenueMap = new Map<string, { amount: number; count: number }>();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = date.toISOString().split('T')[0]!;
      revenueMap.set(key, { amount: 0, count: 0 });
    }
    for (const inv of invoices.data || []) {
      const date = new Date((inv as any).created * 1000)
        .toISOString()
        .split('T')[0]!;
      const entry = revenueMap.get(date);
      if (entry) {
        entry.amount += ((inv as any).amount_paid || 0) / 100;
        entry.count += 1;
      }
    }
    const revenueTimeline = Array.from(revenueMap.entries()).map(
      ([date, data]) => ({
        date,
        amount: Math.round(data.amount * 100) / 100,
        count: data.count,
      }),
    );

    // Balance
    const availableBalance =
      balance.available?.reduce((s: number, b: any) => s + (b.amount || 0), 0) /
        100 || 0;

    return {
      health: {
        status: healthStatus,
        latencyMs,
        apiVersion: '2026-02-25',
        lastCheckedAt: new Date().toISOString(),
      },
      overview: {
        totalCustomers: (customers as any).has_more
          ? 100
          : (customers.data?.length ?? 0),
        activeSubscriptions: activeSubs.data?.length ?? 0,
        totalBalance: Math.round(availableBalance * 100) / 100,
        currency: 'usd',
      },
      recentCharges: {
        total: chargeData.length,
        succeeded: succeededCharges.length,
        failed: failedCharges.length,
        incomplete: incompleteCharges.length,
        totalAmount:
          Math.round(
            (succeededCharges.reduce(
              (s: number, c: any) => s + (c.amount || 0),
              0,
            ) /
              100) *
              100,
          ) / 100,
        failedAmount:
          Math.round(
            (failedCharges.reduce(
              (s: number, c: any) => s + (c.amount || 0),
              0,
            ) /
              100) *
              100,
          ) / 100,
      },
      webhookEvents: {
        recentEvents: (events.data || []).slice(0, 15).map((e: any) => ({
          id: e.id,
          type: e.type,
          created: e.created,
          status: e.data?.object?.status || 'processed',
        })),
        totalRecent: events.data?.length || 0,
      },
      subscriptionBreakdown: {
        active: activeSubs.data?.length ?? 0,
        pastDue: pastDueSubs.data?.length ?? 0,
        canceled: canceledSubs.data?.length ?? 0,
        trialing: trialingSubs.data?.length ?? 0,
        incomplete: incompleteSubs.data?.length ?? 0,
      },
      revenueTimeline,
    };
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
