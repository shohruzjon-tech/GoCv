import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  SubscriptionPlan,
  SubscriptionStatus,
} from '../../common/enums/subscription-plan.enum.js';

export type SubscriptionDocument = HydratedDocument<Subscription>;

@Schema({ timestamps: true })
export class Subscription {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    enum: SubscriptionPlan,
    default: SubscriptionPlan.FREE,
  })
  plan: SubscriptionPlan;

  @Prop({
    type: String,
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  // Plan limits
  @Prop({ type: Object })
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

  // Usage tracking for current billing cycle
  @Prop({ type: Object, default: {} })
  currentUsage: {
    aiCreditsUsed: number;
    pdfExportsUsed: number;
    cvsCreated: number;
    projectsCreated: number;
  };

  // Billing
  @Prop()
  stripeCustomerId?: string;

  @Prop()
  stripeSubscriptionId?: string;

  @Prop()
  currentPeriodStart?: Date;

  @Prop()
  currentPeriodEnd?: Date;

  @Prop()
  cancelledAt?: Date;

  @Prop({ default: false })
  cancelAtPeriodEnd?: boolean;

  @Prop()
  trialEndsAt?: Date;

  // Price in cents
  @Prop({ default: 0 })
  pricePerMonth: number;

  @Prop({ default: 0 })
  pricePerYear: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

// Indexes
SubscriptionSchema.index({ plan: 1, status: 1 });
SubscriptionSchema.index({ currentPeriodEnd: 1 });
