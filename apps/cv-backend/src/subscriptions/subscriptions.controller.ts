import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service.js';
import { PlanConfigService } from './plan-config.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import {
  UpgradeSubscriptionDto,
  CancelSubscriptionDto,
} from './dto/subscription.dto.js';

@Controller('api/subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(
    private subscriptionsService: SubscriptionsService,
    private planConfigService: PlanConfigService,
  ) {}

  @Get('my')
  async getMySubscription(@CurrentUser('_id') userId: string) {
    return this.subscriptionsService.getOrCreate(userId);
  }

  @Get('plans')
  async getPlans() {
    const configs = await this.planConfigService.getActivePlans();
    return {
      plans: configs.map((c) => ({
        plan: c.plan,
        name: c.name,
        description: c.description,
        monthlyPrice: c.monthlyPrice / 100, // cents → dollars
        yearlyPrice: c.yearlyPrice / 100,
        popular: c.popular,
        features: c.features,
        limits: c.limits,
      })),
    };
  }

  @Post('upgrade')
  @HttpCode(HttpStatus.OK)
  async upgrade(@CurrentUser() user: any, @Body() dto: UpgradeSubscriptionDto) {
    const result = await this.subscriptionsService.upgrade(
      user._id,
      dto.plan,
      dto.billingCycle || 'monthly',
      user.email,
      user.name,
    );

    // If there's a checkout URL, redirect the client
    if (result.checkoutUrl) {
      return { checkoutUrl: result.checkoutUrl };
    }

    // Direct upgrade (dev mode / downgrade to free)
    return result.subscription;
  }

  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(
    @CurrentUser('_id') userId: string,
    @Body() dto: CancelSubscriptionDto,
  ) {
    return this.subscriptionsService.cancel(userId, dto.reason);
  }

  @Get('usage')
  async getUsage(@CurrentUser('_id') userId: string) {
    const sub = await this.subscriptionsService.getOrCreate(userId);
    return {
      plan: sub.plan,
      usage: sub.currentUsage,
      limits: sub.limits,
      periodEnd: sub.currentPeriodEnd,
    };
  }

  @Post('billing-portal')
  @HttpCode(HttpStatus.OK)
  async billingPortal(@CurrentUser('_id') userId: string) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4001';
    const url = await this.subscriptionsService.createBillingPortalSession(
      userId,
      `${frontendUrl}/dashboard/settings/billing`,
    );
    if (!url) {
      return { message: 'No billing information available' };
    }
    return { url };
  }

  @Get('invoices')
  async getInvoices(@CurrentUser('_id') userId: string) {
    return this.subscriptionsService.getInvoices(userId);
  }
}
