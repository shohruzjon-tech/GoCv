import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Subscription,
  SubscriptionDocument,
} from './schemas/subscription.schema.js';
import {
  SubscriptionPlan,
  SubscriptionStatus,
} from '../common/enums/subscription-plan.enum.js';
import { StripeService } from '../stripe/stripe.service.js';
import { PlanConfigService } from './plan-config.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<SubscriptionDocument>,
    private readonly stripeService: StripeService,
    private readonly planConfigService: PlanConfigService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // Get or create subscription for user
  async getOrCreate(userId: string): Promise<SubscriptionDocument> {
    let sub = await this.subscriptionModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();

    if (!sub) {
      sub = (await this.create(userId, SubscriptionPlan.FREE)) as any;
    }

    return sub!;
  }

  async create(
    userId: string,
    plan: SubscriptionPlan,
  ): Promise<SubscriptionDocument> {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const subscription = new this.subscriptionModel({
      userId: new Types.ObjectId(userId),
      plan,
      status: SubscriptionStatus.ACTIVE,
      limits: this.planConfigService.getPlanLimits(plan),
      currentUsage: {
        aiCreditsUsed: 0,
        pdfExportsUsed: 0,
        cvsCreated: 0,
        projectsCreated: 0,
      },
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      pricePerMonth: this.planConfigService.getMonthlyPrice(plan),
      pricePerYear: this.planConfigService.getYearlyPrice(plan),
    });

    return subscription.save();
  }

  async findByUserId(userId: string): Promise<SubscriptionDocument | null> {
    return this.subscriptionModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
  }

  async upgrade(
    userId: string,
    newPlan: SubscriptionPlan,
    billingCycle: 'monthly' | 'yearly' = 'monthly',
    userEmail?: string,
    userName?: string,
  ): Promise<{ checkoutUrl?: string; subscription?: SubscriptionDocument }> {
    const sub = await this.getOrCreate(userId);

    if (sub.plan === newPlan) {
      throw new BadRequestException('Already on this plan');
    }

    // Free plan downgrade — no payment needed
    if (newPlan === SubscriptionPlan.FREE) {
      if (sub.stripeSubscriptionId) {
        await this.stripeService.cancelSubscription(
          sub.stripeSubscriptionId,
          false,
        );
      }
      sub.plan = SubscriptionPlan.FREE;
      sub.limits = this.planConfigService.getPlanLimits(SubscriptionPlan.FREE);
      sub.status = SubscriptionStatus.ACTIVE;
      sub.stripeSubscriptionId = undefined;
      sub.pricePerMonth = 0;
      sub.pricePerYear = 0;
      return { subscription: await sub.save() };
    }

    // If Stripe is not configured, do a direct upgrade (dev mode)
    if (!this.stripeService.isConfigured()) {
      this.logger.warn('Stripe not configured — direct upgrade (dev mode)');
      sub.plan = newPlan;
      sub.limits = this.planConfigService.getPlanLimits(newPlan);
      sub.status = SubscriptionStatus.ACTIVE;
      sub.pricePerMonth = this.planConfigService.getMonthlyPrice(newPlan);
      sub.pricePerYear = this.planConfigService.getYearlyPrice(newPlan);
      return { subscription: await sub.save() };
    }

    // If user already has an active Stripe subscription, change it
    if (sub.stripeSubscriptionId && sub.status === SubscriptionStatus.ACTIVE) {
      await this.stripeService.changeSubscription(
        sub.stripeSubscriptionId,
        newPlan,
        billingCycle,
      );
      sub.plan = newPlan;
      sub.limits = this.planConfigService.getPlanLimits(newPlan);
      sub.pricePerMonth = this.planConfigService.getMonthlyPrice(newPlan);
      sub.pricePerYear = this.planConfigService.getYearlyPrice(newPlan);
      return { subscription: await sub.save() };
    }

    // Create Stripe customer if needed
    if (!sub.stripeCustomerId) {
      const customer = await this.stripeService.createCustomer(
        userEmail || 'user@example.com',
        userName || 'User',
        { userId },
      );
      sub.stripeCustomerId = customer.id;
      await sub.save();
    }

    // Create Stripe Checkout session
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4001';

    const session = await this.stripeService.createCheckoutSession({
      customerId: sub.stripeCustomerId!,
      plan: newPlan,
      billingCycle,
      successUrl: `${frontendUrl}/dashboard/settings/billing?success=true&plan=${newPlan}`,
      cancelUrl: `${frontendUrl}/dashboard/settings/billing?cancelled=true`,
      userId,
    });

    return { checkoutUrl: session.url! };
  }

  async cancel(userId: string, reason?: string): Promise<SubscriptionDocument> {
    const sub = await this.findByUserId(userId);
    if (!sub) throw new NotFoundException('Subscription not found');

    // If there's an active Stripe subscription, cancel at period end
    if (sub.stripeSubscriptionId && this.stripeService.isConfigured()) {
      await this.stripeService.cancelSubscription(
        sub.stripeSubscriptionId,
        true, // cancel at period end
      );
      sub.cancelAtPeriodEnd = true;
      sub.cancelledAt = new Date();
      const saved = await sub.save();

      await this.notificationsService.create({
        userId,
        title: 'Subscription Cancelled',
        message:
          'Your subscription has been cancelled. You can still use free features.',
        type: 'warning',
        actionUrl: '/dashboard/settings/billing',
      });

      return saved;
    }

    // Direct cancel (free plan or dev mode)
    sub.status = SubscriptionStatus.CANCELLED;
    sub.plan = SubscriptionPlan.FREE;
    sub.limits = this.planConfigService.getPlanLimits(SubscriptionPlan.FREE);
    sub.cancelledAt = new Date();
    sub.pricePerMonth = 0;
    sub.pricePerYear = 0;
    const saved = await sub.save();

    await this.notificationsService.create({
      userId,
      title: 'Subscription Cancelled',
      message:
        'Your subscription has been cancelled. You can still use free features.',
      type: 'warning',
      actionUrl: '/dashboard/settings/billing',
    });

    return saved;
  }

  // Usage tracking
  async incrementAiUsage(userId: string): Promise<boolean> {
    const sub = await this.getOrCreate(userId);
    const limit = sub.limits.maxAiCreditsPerMonth;

    if (limit !== -1 && sub.currentUsage.aiCreditsUsed >= limit) {
      return false; // Limit reached
    }

    await this.subscriptionModel
      .updateOne(
        { userId: new Types.ObjectId(userId) },
        { $inc: { 'currentUsage.aiCreditsUsed': 1 } },
      )
      .exec();

    // Notify when AI credits reach 80% usage
    const newUsage = sub.currentUsage.aiCreditsUsed + 1;
    if (limit !== -1 && newUsage === Math.ceil(limit * 0.8)) {
      const remaining = limit - newUsage;
      await this.notificationsService.notifyAiCreditsLow(userId, remaining);
    }

    return true;
  }

  async incrementPdfExport(userId: string): Promise<boolean> {
    const sub = await this.getOrCreate(userId);
    const limit = sub.limits.maxPdfExportsPerMonth;

    if (limit !== -1 && sub.currentUsage.pdfExportsUsed >= limit) {
      return false;
    }

    await this.subscriptionModel
      .updateOne(
        { userId: new Types.ObjectId(userId) },
        { $inc: { 'currentUsage.pdfExportsUsed': 1 } },
      )
      .exec();

    return true;
  }

  async canCreateCv(userId: string): Promise<boolean> {
    const sub = await this.getOrCreate(userId);
    const limit = sub.limits.maxCvs;
    return limit === -1 || sub.currentUsage.cvsCreated < limit;
  }

  async canCreateProject(userId: string): Promise<boolean> {
    const sub = await this.getOrCreate(userId);
    const limit = sub.limits.maxProjects;
    return limit === -1 || sub.currentUsage.projectsCreated < limit;
  }

  async hasAdvancedAiTools(userId: string): Promise<boolean> {
    const sub = await this.getOrCreate(userId);
    return sub.limits.hasAdvancedAiTools;
  }

  async hasPremiumTemplates(userId: string): Promise<boolean> {
    const sub = await this.getOrCreate(userId);
    return sub.limits.hasPremiumTemplates;
  }

  // Reset monthly usage (call via cron)
  async resetMonthlyUsage(): Promise<void> {
    const now = new Date();
    await this.subscriptionModel
      .updateMany(
        { currentPeriodEnd: { $lte: now } },
        {
          $set: {
            'currentUsage.aiCreditsUsed': 0,
            'currentUsage.pdfExportsUsed': 0,
            currentPeriodStart: now,
            currentPeriodEnd: new Date(
              now.getFullYear(),
              now.getMonth() + 1,
              now.getDate(),
            ),
          },
        },
      )
      .exec();
  }

  // Admin methods
  async findAll(
    page = 1,
    limit = 20,
    filters?: { plan?: string; status?: string },
  ): Promise<{ subscriptions: SubscriptionDocument[]; total: number }> {
    const skip = (page - 1) * limit;
    const query: any = {};
    if (filters?.plan) query.plan = filters.plan;
    if (filters?.status) query.status = filters.status;

    const [subscriptions, total] = await Promise.all([
      this.subscriptionModel
        .find(query)
        .populate('userId', 'name email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.subscriptionModel.countDocuments(query).exec(),
    ]);
    return { subscriptions, total };
  }

  async getStats(): Promise<{
    totalFree: number;
    totalPremium: number;
    totalEnterprise: number;
    totalRevenue: number;
  }> {
    const [totalFree, totalPremium, totalEnterprise] = await Promise.all([
      this.subscriptionModel
        .countDocuments({ plan: SubscriptionPlan.FREE })
        .exec(),
      this.subscriptionModel
        .countDocuments({ plan: SubscriptionPlan.PREMIUM })
        .exec(),
      this.subscriptionModel
        .countDocuments({ plan: SubscriptionPlan.ENTERPRISE })
        .exec(),
    ]);

    const totalRevenue =
      totalPremium *
        this.planConfigService.getMonthlyPrice(SubscriptionPlan.PREMIUM) +
      totalEnterprise *
        this.planConfigService.getMonthlyPrice(SubscriptionPlan.ENTERPRISE);

    return { totalFree, totalPremium, totalEnterprise, totalRevenue };
  }

  // Admin: Update user subscription
  async adminUpdate(
    userId: string,
    data: {
      plan?: SubscriptionPlan;
      status?: SubscriptionStatus;
      limits?: Subscription['limits'];
      resetUsage?: boolean;
      extendDays?: number;
    },
  ): Promise<SubscriptionDocument> {
    const sub = await this.getOrCreate(userId);

    if (data.plan !== undefined) {
      sub.plan = data.plan;
      sub.limits = this.planConfigService.getPlanLimits(data.plan);
      sub.pricePerMonth = this.planConfigService.getMonthlyPrice(data.plan);
      sub.pricePerYear = this.planConfigService.getYearlyPrice(data.plan);
    }

    if (data.status !== undefined) {
      sub.status = data.status;
    }

    // Allow admin to override limits manually
    if (data.limits !== undefined) {
      sub.limits = data.limits;
    }

    if (data.resetUsage) {
      sub.currentUsage = {
        aiCreditsUsed: 0,
        pdfExportsUsed: 0,
        cvsCreated: sub.currentUsage.cvsCreated,
        projectsCreated: sub.currentUsage.projectsCreated,
      };
    }

    if (data.extendDays && data.extendDays > 0) {
      const currentEnd = sub.currentPeriodEnd || new Date();
      const newEnd = new Date(currentEnd);
      newEnd.setDate(newEnd.getDate() + data.extendDays);
      sub.currentPeriodEnd = newEnd;
    }

    return sub.save();
  }

  // Admin: Cancel user subscription
  async adminCancel(userId: string): Promise<SubscriptionDocument> {
    const sub = await this.findByUserId(userId);
    if (!sub) throw new NotFoundException('Subscription not found');

    // Cancel Stripe if active
    if (sub.stripeSubscriptionId && this.stripeService.isConfigured()) {
      try {
        await this.stripeService.cancelSubscription(
          sub.stripeSubscriptionId,
          false,
        );
      } catch (err) {
        this.logger.warn(`Failed to cancel Stripe subscription: ${err}`);
      }
    }

    sub.plan = SubscriptionPlan.FREE;
    sub.status = SubscriptionStatus.ACTIVE;
    sub.limits = this.planConfigService.getPlanLimits(SubscriptionPlan.FREE);
    sub.stripeSubscriptionId = undefined;
    sub.cancelAtPeriodEnd = false;
    sub.cancelledAt = new Date();
    sub.pricePerMonth = 0;
    sub.pricePerYear = 0;
    return sub.save();
  }

  // ═══════════════════════════════════════════
  // STRIPE SYNC METHODS (called by webhook)
  // ═══════════════════════════════════════════

  async activateFromStripe(
    userId: string,
    plan: SubscriptionPlan,
    stripeCustomerId: string,
    stripeSubscriptionId: string,
  ): Promise<SubscriptionDocument> {
    const sub = await this.getOrCreate(userId);
    sub.plan = plan;
    sub.status = SubscriptionStatus.ACTIVE;
    sub.limits = this.planConfigService.getPlanLimits(plan);
    sub.stripeCustomerId = stripeCustomerId;
    sub.stripeSubscriptionId = stripeSubscriptionId;
    sub.pricePerMonth = this.planConfigService.getMonthlyPrice(plan);
    sub.pricePerYear = this.planConfigService.getYearlyPrice(plan);
    sub.cancelAtPeriodEnd = false;
    return sub.save();
  }

  async syncFromStripe(
    userId: string,
    data: {
      plan: SubscriptionPlan;
      status: SubscriptionStatus;
      stripeSubscriptionId: string;
      currentPeriodStart: Date;
      currentPeriodEnd: Date;
      cancelAtPeriodEnd: boolean;
    },
  ): Promise<SubscriptionDocument> {
    const sub = await this.getOrCreate(userId);
    sub.plan = data.plan;
    sub.status = data.status;
    sub.limits = this.planConfigService.getPlanLimits(data.plan);
    sub.stripeSubscriptionId = data.stripeSubscriptionId;
    sub.currentPeriodStart = data.currentPeriodStart;
    sub.currentPeriodEnd = data.currentPeriodEnd;
    sub.cancelAtPeriodEnd = data.cancelAtPeriodEnd;
    sub.pricePerMonth = this.planConfigService.getMonthlyPrice(data.plan);
    sub.pricePerYear = this.planConfigService.getYearlyPrice(data.plan);
    return sub.save();
  }

  async deactivateFromStripe(userId: string): Promise<SubscriptionDocument> {
    const sub = await this.getOrCreate(userId);
    sub.plan = SubscriptionPlan.FREE;
    sub.status = SubscriptionStatus.ACTIVE;
    sub.limits = this.planConfigService.getPlanLimits(SubscriptionPlan.FREE);
    sub.stripeSubscriptionId = undefined;
    sub.cancelAtPeriodEnd = false;
    sub.pricePerMonth = 0;
    sub.pricePerYear = 0;
    // Reset usage
    sub.currentUsage = {
      aiCreditsUsed: 0,
      pdfExportsUsed: 0,
      cvsCreated: sub.currentUsage.cvsCreated,
      projectsCreated: sub.currentUsage.projectsCreated,
    };
    return sub.save();
  }

  // ─── Billing Portal ───

  async createBillingPortalSession(
    userId: string,
    returnUrl: string,
  ): Promise<string | null> {
    const sub = await this.findByUserId(userId);
    if (!sub?.stripeCustomerId || !this.stripeService.isConfigured()) {
      return null;
    }

    const session = await this.stripeService.createBillingPortalSession(
      sub.stripeCustomerId,
      returnUrl,
    );
    return session.url;
  }

  // ─── Invoice History ───

  async getInvoices(userId: string) {
    const sub = await this.findByUserId(userId);
    if (!sub?.stripeCustomerId || !this.stripeService.isConfigured()) {
      return [];
    }

    const invoices = await this.stripeService.getInvoices(
      sub.stripeCustomerId,
      20,
    );
    return invoices.map((inv) => ({
      id: inv.id,
      number: inv.number,
      status: inv.status,
      amount: inv.amount_paid / 100,
      currency: inv.currency,
      date: inv.created ? new Date(inv.created * 1000).toISOString() : null,
      pdfUrl: inv.invoice_pdf,
      hostedUrl: inv.hosted_invoice_url,
    }));
  }
}
