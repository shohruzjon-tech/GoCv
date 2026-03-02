import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service.js';
import { SessionsService } from '../sessions/sessions.service.js';
import { CvService } from '../cv/cv.service.js';
import { TemplatesService } from '../templates/templates.service.js';
import { SubscriptionsService } from '../subscriptions/subscriptions.service.js';
import { PlanConfigService } from '../subscriptions/plan-config.service.js';
import { AiUsageService } from '../ai-usage/ai-usage.service.js';
import { AuditService } from '../audit/audit.service.js';
import { FeatureFlagsService } from '../feature-flags/feature-flags.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { StripeService } from '../stripe/stripe.service.js';
import { Role } from '../common/enums/role.enum.js';
import { AuditAction } from '../common/enums/audit-action.enum.js';
import { SubscriptionPlan } from '../common/enums/subscription-plan.enum.js';

@Injectable()
export class AdminService implements OnModuleInit {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private usersService: UsersService,
    private sessionsService: SessionsService,
    private cvService: CvService,
    private configService: ConfigService,
    private templatesService: TemplatesService,
    private subscriptionsService: SubscriptionsService,
    private planConfigService: PlanConfigService,
    private aiUsageService: AiUsageService,
    private auditService: AuditService,
    private featureFlagsService: FeatureFlagsService,
    private notificationsService: NotificationsService,
    private stripeService: StripeService,
  ) {}

  async onModuleInit() {
    await this.seedDefaultAdmin();
  }

  private async seedDefaultAdmin() {
    const adminEmail =
      this.configService.get<string>('admin.email') || 'admin@cvbuilder.com';
    const adminPassword =
      this.configService.get<string>('admin.password') || 'Admin@123456';

    const existingAdmin = await this.usersService.findByEmail(adminEmail);
    if (!existingAdmin) {
      await this.usersService.create({
        name: 'Admin',
        email: adminEmail,
        password: adminPassword,
        role: Role.ADMIN,
        username: 'admin',
        isActive: true,
      });
      this.logger.log(`Default admin created: ${adminEmail}`);
    } else {
      this.logger.log('Default admin already exists');
    }
  }

  // ─── User Management ───

  async getUsers(
    page = 1,
    limit = 20,
    filters?: {
      search?: string;
      role?: string;
      status?: string;
      sortBy?: string;
      sortOrder?: string;
    },
  ) {
    return this.usersService.findAll(page, limit, filters);
  }

  async bulkUpdateUserStatus(userIds: string[], isActive: boolean) {
    const results = await Promise.all(
      userIds.map(async (id) => {
        try {
          if (!isActive) {
            await this.sessionsService.deactivateAllForUser(id);
          }
          await this.usersService.setActive(id, isActive);
          return { id, success: true };
        } catch {
          return { id, success: false };
        }
      }),
    );
    return {
      message: `Updated ${results.filter((r) => r.success).length} of ${userIds.length} users`,
      results,
    };
  }

  async getUserById(id: string) {
    return this.usersService.findById(id);
  }

  async getUserDetail(id: string) {
    const user = await this.usersService.findById(id);
    if (!user) throw new Error('User not found');

    const [subscription, aiStats, sessions, cvs, auditLogs] = await Promise.all(
      [
        this.subscriptionsService.findByUserId(id),
        this.aiUsageService.getUserMonthlyStats(id),
        this.sessionsService.findByUserId(id),
        this.cvService.findAllByUser(id).catch(() => []),
        this.auditService.findByUser(id, 1, 20).catch(() => ({
          logs: [],
          total: 0,
        })),
      ],
    );

    // Get recent AI usage records (last 50)
    const aiUsage = await this.aiUsageService
      .findByUserId(id, 1, 50)
      .catch(() => ({ usages: [], total: 0 }));

    return {
      user,
      subscription,
      aiStats,
      activeSessions: sessions.filter((s: any) => s.isActive).length,
      sessions,
      cvCount: Array.isArray(cvs) ? cvs.length : 0,
      auditLogs: auditLogs.logs || [],
      auditTotal: auditLogs.total || 0,
      recentAiUsage: aiUsage.usages || [],
      totalAiRequests: aiUsage.total || 0,
    };
  }

  async toggleUserActive(id: string, isActive: boolean) {
    if (!isActive) {
      await this.sessionsService.deactivateAllForUser(id);
    }
    return this.usersService.setActive(id, isActive);
  }

  async deleteUser(id: string) {
    await this.sessionsService.deactivateAllForUser(id);
    await this.usersService.deleteUser(id);
    return { message: 'User deleted successfully' };
  }

  async changeUserRole(id: string, role: Role) {
    const user = await this.usersService.findById(id);
    if (!user) throw new Error('User not found');
    user.role = role;
    return user.save();
  }

  // ─── Session Management ───

  async getSessions(page = 1, limit = 20) {
    return this.sessionsService.findAll(page, limit);
  }

  async getUserSessions(userId: string) {
    return this.sessionsService.findByUserId(userId);
  }

  async terminateSession(sessionId: string) {
    await this.sessionsService.deactivate(sessionId);
    return { message: 'Session terminated' };
  }

  async terminateAllUserSessions(userId: string) {
    await this.sessionsService.deactivateAllForUser(userId);
    return { message: 'All user sessions terminated' };
  }

  // ─── CV Management ───

  async getAllCvs(page = 1, limit = 20) {
    return this.cvService.findAll(page, limit);
  }

  // ─── Template Management ───

  async getTemplates(page = 1, limit = 20) {
    return this.templatesService.findAllAdmin(page, limit);
  }

  async createTemplate(data: any) {
    return this.templatesService.create(data);
  }

  async updateTemplate(id: string, data: any) {
    return this.templatesService.update(id, data);
  }

  async deleteTemplate(id: string) {
    return this.templatesService.delete(id);
  }

  // ─── Subscription Management ───

  async getSubscriptions(
    page = 1,
    limit = 20,
    filters?: { plan?: string; status?: string },
  ) {
    return this.subscriptionsService.findAll(page, limit, filters);
  }

  async getSubscriptionStats() {
    return this.subscriptionsService.getStats();
  }

  async updateSubscription(id: string, data: any) {
    return this.subscriptionsService.adminUpdate(id, data);
  }

  async cancelSubscription(id: string) {
    return this.subscriptionsService.adminCancel(id);
  }

  async resetSubscriptionUsage(id: string) {
    return this.subscriptionsService.adminUpdate(id, { resetUsage: true });
  }

  // ─── Plan Configurations ───

  async getPlans() {
    return this.planConfigService.findAll();
  }

  async getPlan(id: string) {
    return this.planConfigService.findById(id);
  }

  async createPlan(data: any) {
    return this.planConfigService.create(data);
  }

  async updatePlan(id: string, data: any) {
    return this.planConfigService.update(id, data);
  }

  async deletePlan(id: string) {
    return this.planConfigService.delete(id);
  }

  async syncPlanToStripe(id: string) {
    if (!this.stripeService.isConfigured()) {
      throw new Error(
        'Stripe is not configured. Enable Stripe in Site Settings first.',
      );
    }
    return this.stripeService.ensureStripePrices(id);
  }

  async syncAllPlansToStripe() {
    if (!this.stripeService.isConfigured()) {
      throw new Error(
        'Stripe is not configured. Enable Stripe in Site Settings first.',
      );
    }
    const plans = await this.planConfigService.findAll();
    const results: Array<{
      planId: string;
      planName: string;
      monthlyPriceId: string | null;
      yearlyPriceId: string | null;
      created: { monthly: boolean; yearly: boolean };
    }> = [];

    for (const plan of plans) {
      // Skip free plans (no prices to create)
      if (plan.monthlyPrice === 0 && plan.yearlyPrice === 0) continue;
      const result = await this.stripeService.ensureStripePrices(
        plan._id.toString(),
      );
      results.push({
        planId: plan._id.toString(),
        planName: plan.name,
        ...result,
      });
    }
    return results;
  }

  // ─── AI Usage Analytics ───

  async getAiUsage(page = 1, limit = 50) {
    return this.aiUsageService.findAll(page, limit);
  }

  async getAiGlobalStats() {
    return this.aiUsageService.getGlobalStats();
  }

  async getUserAiStats(userId: string) {
    return this.aiUsageService.getUserMonthlyStats(userId);
  }

  // ─── Audit Logs ───

  async getAuditLogs(
    page = 1,
    limit = 50,
    filters?: { action?: string; resource?: string },
  ) {
    return this.auditService.findAll(page, limit, filters as any);
  }

  async getUserAuditLogs(userId: string) {
    return this.auditService.findByUser(userId);
  }

  // ─── Feature Flags ───

  async getFeatureFlags() {
    return this.featureFlagsService.getAll();
  }

  async createFeatureFlag(data: any) {
    return this.featureFlagsService.create(data);
  }

  async updateFeatureFlag(id: string, data: any) {
    return this.featureFlagsService.update(id, data);
  }

  async toggleFeatureFlag(id: string) {
    return this.featureFlagsService.toggle(id);
  }

  async deleteFeatureFlag(id: string) {
    return this.featureFlagsService.delete(id);
  }

  // ─── Notifications ───

  async sendNotification(userId: string, data: any) {
    return this.notificationsService.create({
      userId,
      ...data,
    });
  }

  async sendBulkNotification(data: {
    title: string;
    message: string;
    type: string;
  }) {
    const { users } = await this.usersService.findAll(1, 10000);
    const results = await Promise.allSettled(
      users.map((u: any) =>
        this.notificationsService.create({
          userId: u._id.toString(),
          title: data.title,
          message: data.message,
          type: data.type as any,
        }),
      ),
    );
    const sent = results.filter((r) => r.status === 'fulfilled').length;
    return { sent, total: users.length };
  }

  // ─── Revenue Overview ───

  async getRevenueOverview() {
    const subStats = await this.subscriptionsService.getStats();
    const aiStats = await this.aiUsageService.getGlobalStats();
    const mrr = this.calculateMrr(subStats);

    return {
      subscriptionStats: {
        free: subStats.totalFree,
        premium: subStats.totalPremium,
        enterprise: subStats.totalEnterprise,
      },
      aiCosts: {
        totalRequests: aiStats.totalRequests,
        totalTokens: aiStats.totalTokens,
        totalCost: aiStats.totalCost,
      },
      mrr,
    };
  }

  private calculateMrr(subStats: any): number {
    const premiumPrice =
      this.planConfigService.getMonthlyPrice(SubscriptionPlan.PREMIUM) / 100;
    const enterprisePrice =
      this.planConfigService.getMonthlyPrice(SubscriptionPlan.ENTERPRISE) / 100;
    return (
      (subStats.totalPremium || 0) * premiumPrice +
      (subStats.totalEnterprise || 0) * enterprisePrice
    );
  }

  // ─── Detailed Revenue Stats ───

  async getDetailedRevenueStats(days = 30) {
    const subStats = await this.subscriptionsService.getStats();
    const aiStats = await this.aiUsageService.getGlobalStats(days);
    const mrr = this.calculateMrr(subStats);
    const arr = mrr * 12;

    // Get all subscriptions for deeper analysis
    const { subscriptions: allSubs } = await this.subscriptionsService.findAll(
      1,
      10000,
    );

    // Calculate subscription revenue breakdown
    const activePaid = allSubs.filter(
      (s: any) => s.plan !== 'free' && s.status === 'active',
    );
    const cancelledSubs = allSubs.filter(
      (s: any) => s.status === 'cancelled' || s.cancelAtPeriodEnd,
    );
    const trialSubs = allSubs.filter((s: any) => s.status === 'trial');
    const expiredSubs = allSubs.filter((s: any) => s.status === 'expired');

    // Revenue by plan
    const premiumMonthlyPrice =
      this.planConfigService.getMonthlyPrice(SubscriptionPlan.PREMIUM) / 100;
    const enterpriseMonthlyPrice =
      this.planConfigService.getMonthlyPrice(SubscriptionPlan.ENTERPRISE) / 100;
    const premiumYearlyPrice =
      this.planConfigService.getYearlyPrice(SubscriptionPlan.PREMIUM) / 100;
    const enterpriseYearlyPrice =
      this.planConfigService.getYearlyPrice(SubscriptionPlan.ENTERPRISE) / 100;

    const premiumRevenue = (subStats.totalPremium || 0) * premiumMonthlyPrice;
    const enterpriseRevenue =
      (subStats.totalEnterprise || 0) * enterpriseMonthlyPrice;

    // AI costs breakdown
    const aiCostUsd = aiStats.totalCost || 0;
    const netRevenue = mrr - aiCostUsd;
    const profitMargin = mrr > 0 ? (netRevenue / mrr) * 100 : 0;

    // Average revenue per user (ARPU)
    const totalPaying =
      (subStats.totalPremium || 0) + (subStats.totalEnterprise || 0);
    const arpu = totalPaying > 0 ? mrr / totalPaying : 0;

    // Lifetime value estimate (avg 12 months retention)
    const ltv = arpu * 12;

    // Customer Acquisition Cost placeholder (can be configured)
    const cac = 0;

    // Churn rate
    const totalActive = allSubs.filter(
      (s: any) => s.status === 'active',
    ).length;
    const churnRate =
      totalActive > 0
        ? (cancelledSubs.length / (totalActive + cancelledSubs.length)) * 100
        : 0;

    // Revenue timeline from AI daily usage (costs)
    const aiDailyCosts = aiStats.dailyUsage.map((d: any) => ({
      date: d.date,
      aiCost: (d.tokens / 1000) * 0.002, // approximate cost
      requests: d.count,
    }));

    // Stripe data if available
    let stripeData: any = null;
    try {
      if (this.stripeService.isConfigured()) {
        const healthAnalytics =
          await this.stripeService.getHealthAndAnalytics();
        stripeData = {
          revenueTimeline: healthAnalytics.revenueTimeline,
          recentCharges: healthAnalytics.recentCharges,
          subscriptionBreakdown: healthAnalytics.subscriptionBreakdown,
          totalBalance: healthAnalytics.overview.totalBalance,
        };
      }
    } catch {
      // Stripe not configured, continue without
    }

    // Generate daily revenue projection for the last N days
    const dailyRevenue: {
      date: string;
      revenue: number;
      cost: number;
      profit: number;
    }[] = [];
    const dailyMrr = mrr / 30;
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0]!;
      const dayAiCost = aiDailyCosts.find((d: any) => d.date === dateStr);
      const cost = dayAiCost?.aiCost || 0;
      // If Stripe data available, use actual; otherwise project from MRR
      const stripeDay = stripeData?.revenueTimeline?.find(
        (d: any) => d.date === dateStr,
      );
      const revenue = stripeDay ? stripeDay.amount : dailyMrr;
      dailyRevenue.push({
        date: dateStr,
        revenue: Math.round(revenue * 100) / 100,
        cost: Math.round(cost * 100) / 100,
        profit: Math.round((revenue - cost) * 100) / 100,
      });
    }

    // Bookings / checkout sessions analysis
    const completedBookings = activePaid.length;
    const incompleteBookings = allSubs.filter(
      (s: any) =>
        s.stripeCustomerId && !s.stripeSubscriptionId && s.plan === 'free',
    ).length;
    const cancelledBookings = cancelledSubs.length;

    return {
      // Summary KPIs
      summary: {
        mrr: Math.round(mrr * 100) / 100,
        arr: Math.round(arr * 100) / 100,
        netRevenue: Math.round(netRevenue * 100) / 100,
        profitMargin: Math.round(profitMargin * 100) / 100,
        totalRevenue: stripeData?.revenueTimeline
          ? Math.round(
              stripeData.revenueTimeline.reduce(
                (s: number, d: any) => s + d.amount,
                0,
              ) * 100,
            ) / 100
          : Math.round(mrr * 100) / 100,
        totalExpenses: Math.round(aiCostUsd * 100) / 100,
        balance: stripeData?.totalBalance ?? 0,
      },

      // Subscription breakdown
      subscriptions: {
        total: allSubs.length,
        free: subStats.totalFree || 0,
        premium: subStats.totalPremium || 0,
        enterprise: subStats.totalEnterprise || 0,
        active: totalActive,
        cancelled: cancelledSubs.length,
        trial: trialSubs.length,
        expired: expiredSubs.length,
        pastDue: stripeData?.subscriptionBreakdown?.pastDue ?? 0,
      },

      // Revenue breakdown by plan
      revenueByPlan: {
        premium: {
          count: subStats.totalPremium || 0,
          monthlyPrice: premiumMonthlyPrice,
          yearlyPrice: premiumYearlyPrice,
          monthlyRevenue: Math.round(premiumRevenue * 100) / 100,
        },
        enterprise: {
          count: subStats.totalEnterprise || 0,
          monthlyPrice: enterpriseMonthlyPrice,
          yearlyPrice: enterpriseYearlyPrice,
          monthlyRevenue: Math.round(enterpriseRevenue * 100) / 100,
        },
      },

      // Bookings
      bookings: {
        completed: completedBookings,
        incomplete: incompleteBookings,
        cancelled: cancelledBookings,
        conversionRate:
          completedBookings + incompleteBookings > 0
            ? Math.round(
                (completedBookings / (completedBookings + incompleteBookings)) *
                  100 *
                  100,
              ) / 100
            : 0,
      },

      // Profit / Loss
      profitLoss: {
        grossRevenue: Math.round(mrr * 100) / 100,
        aiInfrastructureCost: Math.round(aiCostUsd * 100) / 100,
        netProfit: Math.round(netRevenue * 100) / 100,
        margin: Math.round(profitMargin * 100) / 100,
        isProfit: netRevenue >= 0,
      },

      // Customer metrics
      customerMetrics: {
        totalCustomers: allSubs.length,
        payingCustomers: totalPaying,
        freeCustomers: subStats.totalFree || 0,
        arpu: Math.round(arpu * 100) / 100,
        ltv: Math.round(ltv * 100) / 100,
        cac,
        churnRate: Math.round(churnRate * 100) / 100,
      },

      // AI costs breakdown
      aiCosts: {
        totalRequests: aiStats.totalRequests,
        totalTokens: aiStats.totalTokens,
        totalCostUsd: Math.round(aiCostUsd * 100) / 100,
        byTool: aiStats.byTool,
        dailyUsage: aiStats.dailyUsage,
      },

      // Charges from Stripe
      charges: stripeData?.recentCharges ?? {
        total: 0,
        succeeded: 0,
        failed: 0,
        incomplete: 0,
        totalAmount: 0,
        failedAmount: 0,
      },

      // Daily revenue timeline
      dailyRevenue,

      // Period info
      period: {
        days,
        startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
      },
    };
  }

  async getRevenueInvoices(page = 1, limit = 50, statusFilter?: string) {
    // Get all subscriptions with Stripe customers
    const { subscriptions: allSubs } = await this.subscriptionsService.findAll(
      1,
      10000,
    );
    const subsWithStripe = allSubs.filter((s: any) => s.stripeCustomerId);

    if (!this.stripeService.isConfigured() || subsWithStripe.length === 0) {
      return { invoices: [], total: 0, page, limit };
    }

    // Gather invoices from all Stripe customers
    const allInvoices: any[] = [];
    const batchSize = 10;
    for (let i = 0; i < subsWithStripe.length; i += batchSize) {
      const batch = subsWithStripe.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map((s: any) =>
          this.stripeService.getInvoices(s.stripeCustomerId, 50),
        ),
      );
      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        if (result && result.status === 'fulfilled') {
          const sub = batch[j] as any;
          for (const inv of result.value) {
            const invoiceData = {
              id: inv.id,
              number: inv.number,
              status: inv.status,
              amount: inv.amount_paid / 100,
              amountDue: inv.amount_due / 100,
              currency: inv.currency || 'usd',
              date: inv.created
                ? new Date(inv.created * 1000).toISOString()
                : null,
              dueDate: inv.due_date
                ? new Date(inv.due_date * 1000).toISOString()
                : null,
              pdfUrl: inv.invoice_pdf,
              hostedUrl: inv.hosted_invoice_url,
              customerEmail: (sub.userId as any)?.email || 'N/A',
              customerName: (sub.userId as any)?.name || 'N/A',
              plan: sub.plan,
              description: inv.description || `${sub.plan} subscription`,
            };
            allInvoices.push(invoiceData);
          }
        }
      }
    }

    // Filter by status if requested
    let filtered = allInvoices;
    if (statusFilter && statusFilter !== 'all') {
      filtered = allInvoices.filter((inv) => inv.status === statusFilter);
    }

    // Sort by date descending
    filtered.sort(
      (a, b) =>
        new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
    );

    // Paginate
    const total = filtered.length;
    const start = (page - 1) * limit;
    const invoices = filtered.slice(start, start + limit);

    // Calculate totals
    const paidTotal = allInvoices
      .filter((inv) => inv.status === 'paid')
      .reduce((s, inv) => s + inv.amount, 0);
    const openTotal = allInvoices
      .filter((inv) => inv.status === 'open')
      .reduce((s, inv) => s + inv.amountDue, 0);
    const voidTotal = allInvoices
      .filter((inv) => inv.status === 'void')
      .reduce((s, inv) => s + inv.amount, 0);

    return {
      invoices,
      total,
      page,
      limit,
      totals: {
        paid: Math.round(paidTotal * 100) / 100,
        open: Math.round(openTotal * 100) / 100,
        void: Math.round(voidTotal * 100) / 100,
        all: allInvoices.length,
        paidCount: allInvoices.filter((inv) => inv.status === 'paid').length,
        openCount: allInvoices.filter((inv) => inv.status === 'open').length,
        voidCount: allInvoices.filter((inv) => inv.status === 'void').length,
        draftCount: allInvoices.filter((inv) => inv.status === 'draft').length,
        uncollectibleCount: allInvoices.filter(
          (inv) => inv.status === 'uncollectible',
        ).length,
      },
    };
  }

  // ─── Impersonation ───

  async impersonateUser(adminId: string, targetUserId: string) {
    const user = await this.usersService.findById(targetUserId);
    if (!user) throw new Error('User not found');

    await this.auditService.log({
      userId: adminId,
      action: AuditAction.ADMIN_IMPERSONATE,
      resource: 'user',
      resourceId: targetUserId,
      metadata: { targetEmail: user.email },
    });

    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      impersonating: true,
    };
  }

  // ─── Dashboard Stats (Enhanced) ───

  async getDashboardStats() {
    const { total: totalUsers } = await this.usersService.findAll(1, 1);
    const { total: totalCvs } = await this.cvService.findAll(1, 1);
    const { total: totalSessions } = await this.sessionsService.findAll(1, 1);
    const subStats = await this.subscriptionsService.getStats();
    const aiStats = await this.aiUsageService.getGlobalStats();

    return {
      totalUsers,
      totalCvs,
      totalSessions,
      subscriptions: subStats,
      aiUsage: {
        totalRequests: aiStats.totalRequests,
        totalTokens: aiStats.totalTokens,
        totalCostUsd: aiStats.totalCost,
      },
      estimatedMrr: this.calculateMrr(subStats),
    };
  }
}
