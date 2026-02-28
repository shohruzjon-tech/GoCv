import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type EmailVerificationDocument = HydratedDocument<EmailVerification>;

@Schema({ timestamps: true })
export class EmailVerification {
  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  code: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: false })
  used: boolean;

  @Prop({ default: 0 })
  attempts: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const EmailVerificationSchema =
  SchemaFactory.createForClass(EmailVerification);

EmailVerificationSchema.index({ email: 1, code: 1 });
EmailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
