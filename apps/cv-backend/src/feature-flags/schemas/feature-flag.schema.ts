import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FeatureFlagDocument = HydratedDocument<FeatureFlag>;

@Schema({ timestamps: true })
export class FeatureFlag {
  @Prop({ required: true, unique: true })
  key: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ default: false })
  enabled: boolean;

  // Percentage rollout (0-100)
  @Prop({ default: 100 })
  rolloutPercentage: number;

  // Restrict to specific plans
  @Prop({ type: [String], default: [] })
  allowedPlans: string[];

  // Restrict to specific user IDs
  @Prop({ type: [String], default: [] })
  allowedUserIds: string[];

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  createdAt?: Date;
  updatedAt?: Date;
}

export const FeatureFlagSchema = SchemaFactory.createForClass(FeatureFlag);
