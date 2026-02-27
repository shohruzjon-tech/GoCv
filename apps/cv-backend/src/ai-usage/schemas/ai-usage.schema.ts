import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { AiToolType } from '../../common/enums/ai-tool.enum.js';

export type AiUsageDocument = HydratedDocument<AiUsage>;

@Schema({ timestamps: true })
export class AiUsage {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: AiToolType, required: true })
  toolType: AiToolType;

  @Prop({ required: true })
  model: string;

  @Prop({ default: 0 })
  promptTokens: number;

  @Prop({ default: 0 })
  completionTokens: number;

  @Prop({ default: 0 })
  totalTokens: number;

  // Estimated cost in USD (millicents for precision)
  @Prop({ default: 0 })
  estimatedCostMills: number;

  @Prop()
  prompt?: string;

  @Prop({ default: false })
  success: boolean;

  @Prop()
  errorMessage?: string;

  @Prop({ default: 0 })
  latencyMs: number;

  @Prop({ type: Types.ObjectId, ref: 'Cv' })
  cvId?: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export const AiUsageSchema = SchemaFactory.createForClass(AiUsage);

// Indexes for analytics queries
AiUsageSchema.index({ userId: 1, createdAt: -1 });
AiUsageSchema.index({ toolType: 1, createdAt: -1 });
AiUsageSchema.index({ createdAt: -1 });
AiUsageSchema.index({
  userId: 1,
  createdAt: 1,
  toolType: 1,
});
