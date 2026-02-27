import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { AuditAction } from '../../common/enums/audit-action.enum.js';

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;

  @Prop({ type: String, enum: AuditAction, required: true })
  action: AuditAction;

  @Prop({ required: true })
  resource: string; // e.g., 'user', 'cv', 'template'

  @Prop()
  resourceId?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop()
  ipAddress?: string;

  @Prop()
  userAgent?: string;

  // Who performed the action (for admin impersonation)
  @Prop({ type: Types.ObjectId, ref: 'User' })
  performedBy?: Types.ObjectId;

  createdAt?: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

// Indexes
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ resource: 1, resourceId: 1 });
AuditLogSchema.index({ createdAt: -1 });
// TTL index: auto-delete logs older than 90 days
AuditLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 },
);
