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

  async getUsers(page = 1, limit = 20) {
    return this.usersService.findAll(page, limit);
  }

  async getUserById(id: string) {
    return this.usersService.findById(id);
  }

  async getUserDetail(id: string) {
    const user = await this.usersService.findById(id);
    const subscription = await this.subscriptionsService.findByUserId(id);
    const aiStats = await this.aiUsageService.getUserMonthlyStats(id);
    const sessions = await this.sessionsService.findByUserId(id);
    return { user, subscription, aiStats, activeSessions: sessions.length };
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
