import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  ApiKeyScope,
  ApiKeyStatus,
} from '../../common/enums/api-key-scope.enum.js';

export type ApiKeyDocument = HydratedDocument<ApiKey>;

@Schema({ timestamps: true })
export class ApiKey {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  keyHash: string;

  @Prop({ required: true })
  keyPrefix: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Organization' })
  organizationId?: Types.ObjectId;

  @Prop({ type: [String], enum: ApiKeyScope, default: [ApiKeyScope.CV_READ] })
  scopes: ApiKeyScope[];

  @Prop({ type: String, enum: ApiKeyStatus, default: ApiKeyStatus.ACTIVE })
  status: ApiKeyStatus;

  @Prop()
  expiresAt?: Date;

  @Prop()
  lastUsedAt?: Date;

  @Prop({ default: 0 })
  usageCount: number;

  @Prop({ type: Object })
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };

  @Prop({ type: [String], default: [] })
  allowedIps: string[];

  @Prop({ type: [String], default: [] })
  allowedOrigins: string[];

  @Prop()
  revokedAt?: Date;

  @Prop()
  revokedBy?: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKey);
ApiKeySchema.index({ keyHash: 1 });
ApiKeySchema.index({ userId: 1, status: 1 });
ApiKeySchema.index({ organizationId: 1, status: 1 });
ApiKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
