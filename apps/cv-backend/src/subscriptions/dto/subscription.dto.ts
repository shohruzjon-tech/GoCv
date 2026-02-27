import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SubscriptionPlan } from '../../common/enums/subscription-plan.enum.js';

export class CreateSubscriptionDto {
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  @IsOptional()
  @IsString()
  stripePaymentMethodId?: string;
}

export class UpgradeSubscriptionDto {
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  @IsOptional()
  @IsString()
  billingCycle?: 'monthly' | 'yearly';

  @IsOptional()
  @IsString()
  stripePaymentMethodId?: string;
}

export class CancelSubscriptionDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
