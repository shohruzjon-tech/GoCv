import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({
    type: String,
    enum: ['info', 'success', 'warning', 'error', 'upgrade'],
    default: 'info',
  })
  type: string;

  @Prop({ default: false })
  read: boolean;

  @Prop()
  actionUrl?: string;

  @Prop()
  actionLabel?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  createdAt?: Date;
  updatedAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
NotificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 },
);
