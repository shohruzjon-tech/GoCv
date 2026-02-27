import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { SubscriptionPlan } from '../../common/enums/subscription-plan.enum.js';

export type PlanConfigDocument = HydratedDocument<PlanConfig>;

@Schema({ timestamps: true })
export class PlanConfig {
  @Prop({
    type: String,
    enum: SubscriptionPlan,
    required: true,
    unique: true,
  })
  plan: SubscriptionPlan;

  @Prop({ required: true })
  name: string;

  @Prop({ default: '' })
  description: string;

  // Prices in cents
  @Prop({ default: 0 })
  monthlyPrice: number;

  @Prop({ default: 0 })
  yearlyPrice: number;

  @Prop({ default: 'usd' })
  currency: string;

  // Plan limits
  @Prop({ type: Object, required: true })
  limits: {
    maxCvs: number;
    maxProjects: number;
    maxAiCreditsPerMonth: number;
    maxPdfExportsPerMonth: number;
    hasCustomDomain: boolean;
    hasAdvancedAiTools: boolean;
    hasPremiumTemplates: boolean;
    hasCustomBranding: boolean;
    hasPrioritySupport: boolean;
  };

  // Features list (displayed on pricing page)
  @Prop({ type: [String], default: [] })
  features: string[];

  // Display settings
  @Prop({ default: 0 })
  displayOrder: number;

  @Prop({ default: false })
  popular: boolean;

  @Prop({ default: true })
  isActive: boolean;

  // Stripe price IDs (for checkout)
  @Prop()
  stripePriceIdMonthly?: string;

  @Prop()
  stripePriceIdYearly?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const PlanConfigSchema = SchemaFactory.createForClass(PlanConfig);

PlanConfigSchema.index({ isActive: 1, displayOrder: 1 });
