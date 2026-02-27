import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('api/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private adminService: AdminService) {}

  // ─── Dashboard ───

  @Get('dashboard')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // ─── Users ───

  @Get('users')
  async getUsers(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getUsers(Number(page) || 1, Number(limit) || 20);
  }

  @Get('users/:id')
  async getUser(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Get('users/:id/detail')
  async getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Put('users/:id/toggle-active')
  async toggleUserActive(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.adminService.toggleUserActive(id, isActive);
  }

  @Put('users/:id/role')
  async changeUserRole(@Param('id') id: string, @Body('role') role: Role) {
    return this.adminService.changeUserRole(id, role);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Post('users/:id/impersonate')
  async impersonateUser(
    @CurrentUser('_id') adminId: string,
    @Param('id') targetUserId: string,
  ) {
    return this.adminService.impersonateUser(adminId, targetUserId);
  }

  // ─── Sessions ───

  @Get('sessions')
  async getSessions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getSessions(
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  @Get('sessions/user/:userId')
  async getUserSessions(@Param('userId') userId: string) {
    return this.adminService.getUserSessions(userId);
  }

  @Delete('sessions/:id')
  async terminateSession(@Param('id') id: string) {
    return this.adminService.terminateSession(id);
  }

  @Delete('sessions/user/:userId')
  async terminateAllUserSessions(@Param('userId') userId: string) {
    return this.adminService.terminateAllUserSessions(userId);
  }

  // ─── CVs ───

  @Get('cvs')
  async getAllCvs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getAllCvs(Number(page) || 1, Number(limit) || 20);
  }

  // ─── Templates ───

  @Get('templates')
  async getTemplates(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getTemplates(
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  @Post('templates')
  async createTemplate(@Body() data: any) {
    return this.adminService.createTemplate(data);
  }

  @Put('templates/:id')
  async updateTemplate(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateTemplate(id, data);
  }

  @Delete('templates/:id')
  async deleteTemplate(@Param('id') id: string) {
    return this.adminService.deleteTemplate(id);
  }

  // ─── Subscriptions ───

  @Get('subscriptions')
  async getSubscriptions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('plan') plan?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getSubscriptions(
      Number(page) || 1,
      Number(limit) || 20,
      { plan, status },
    );
  }

  @Get('subscriptions/stats')
  async getSubscriptionStats() {
    return this.adminService.getSubscriptionStats();
  }

  @Put('subscriptions/:id')
  async updateSubscription(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateSubscription(id, data);
  }

  @Post('subscriptions/:id/cancel')
  async cancelSubscription(@Param('id') id: string) {
    return this.adminService.cancelSubscription(id);
  }

  @Post('subscriptions/:id/reset-usage')
  async resetSubscriptionUsage(@Param('id') id: string) {
    return this.adminService.resetSubscriptionUsage(id);
  }

  // ─── Plan Configurations ───

  @Get('plans')
  async getPlans() {
    return this.adminService.getPlans();
  }

  @Get('plans/:id')
  async getPlan(@Param('id') id: string) {
    return this.adminService.getPlan(id);
  }

  @Post('plans')
  async createPlan(@Body() data: any) {
    return this.adminService.createPlan(data);
  }

  @Put('plans/:id')
  async updatePlan(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updatePlan(id, data);
  }

  @Delete('plans/:id')
  async deletePlan(@Param('id') id: string) {
    return this.adminService.deletePlan(id);
  }

  // ─── AI Usage ───

  @Get('ai-usage')
  async getAiUsage(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getAiUsage(Number(page) || 1, Number(limit) || 50);
  }

  @Get('ai-usage/stats')
  async getAiGlobalStats() {
    return this.adminService.getAiGlobalStats();
  }

  @Get('ai-usage/user/:userId')
  async getUserAiStats(@Param('userId') userId: string) {
    return this.adminService.getUserAiStats(userId);
  }

  // ─── Audit Logs ───

  @Get('audit-logs')
  async getAuditLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('action') action?: string,
    @Query('resource') resource?: string,
  ) {
    return this.adminService.getAuditLogs(
      Number(page) || 1,
      Number(limit) || 50,
      { action, resource },
    );
  }

  @Get('audit-logs/user/:userId')
  async getUserAuditLogs(@Param('userId') userId: string) {
    return this.adminService.getUserAuditLogs(userId);
  }

  // ─── Feature Flags ───

  @Get('feature-flags')
  async getFeatureFlags() {
    return this.adminService.getFeatureFlags();
  }

  @Post('feature-flags')
  async createFeatureFlag(@Body() data: any) {
    return this.adminService.createFeatureFlag(data);
  }

  @Put('feature-flags/:id')
  async updateFeatureFlag(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateFeatureFlag(id, data);
  }

  @Put('feature-flags/:id/toggle')
  async toggleFeatureFlag(@Param('id') id: string) {
    return this.adminService.toggleFeatureFlag(id);
  }

  @Delete('feature-flags/:id')
  async deleteFeatureFlag(@Param('id') id: string) {
    return this.adminService.deleteFeatureFlag(id);
  }

  // ─── Notifications ───

  @Post('notifications/send')
  async sendNotification(@Body('userId') userId: string, @Body() data: any) {
    return this.adminService.sendNotification(userId, data);
  }

  @Post('notifications/broadcast')
  async sendBulkNotification(@Body() data: any) {
    return this.adminService.sendBulkNotification(data);
  }

  // ─── Revenue ───

  @Get('revenue')
  async getRevenueOverview() {
    return this.adminService.getRevenueOverview();
  }
}
