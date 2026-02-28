import { Controller, Get, Put, Post, Body, UseGuards } from '@nestjs/common';
import { SiteSettingsService } from './site-settings.service.js';
import { StripeService } from '../stripe/stripe.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '../common/enums/role.enum.js';

@Controller('api/site-settings')
export class SiteSettingsController {
  constructor(
    private siteSettingsService: SiteSettingsService,
    private stripeService: StripeService,
  ) {}

  // Public endpoint — anyone can read creator info
  @Get('creator')
  async getCreatorInfo() {
    return this.siteSettingsService.getCreatorInfo();
  }

  // Admin-only: get full settings
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getSettings() {
    return this.siteSettingsService.get();
  }

  // Admin-only: update settings
  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateSettings(@Body() data: any) {
    return this.siteSettingsService.update(data);
  }

  // ─── Stripe Configuration (Admin-only) ───

  @Get('stripe')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getStripeConfig() {
    return this.siteSettingsService.getStripeStatus();
  }

  @Put('stripe')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateStripeConfig(@Body() data: any) {
    const config = await this.siteSettingsService.updateStripeConfig(data);
    // Reinitialize Stripe client with the new config
    const result = await this.stripeService.reloadConfig();
    return {
      config: await this.siteSettingsService.getStripeStatus(),
      connection: result,
    };
  }

  @Post('stripe/test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async testStripeConnection(@Body('secretKey') secretKey: string) {
    return this.stripeService.testConnection(secretKey);
  }

  @Post('stripe/reload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async reloadStripe() {
    return this.stripeService.reloadConfig();
  }

  @Get('stripe/health')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getStripeHealth() {
    return this.stripeService.getHealthAndAnalytics();
  }
}
