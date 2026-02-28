import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Role } from '../../common/enums/role.enum.js';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  password?: string;

  @Prop()
  avatar?: string;

  @Prop()
  googleId?: string;

  @Prop({ type: String, enum: Role, default: Role.USER })
  role: Role;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastLoginAt?: Date;

  @Prop({ unique: true, sparse: true })
  username?: string;

  @Prop()
  bio?: string;

  @Prop()
  headline?: string;

  @Prop()
  location?: string;

  @Prop()
  website?: string;

  @Prop({ type: Object })
  socialLinks?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
  };

  // ─── Enterprise Fields ───

  @Prop({ type: Types.ObjectId, ref: 'Organization' })
  defaultOrganizationId?: Types.ObjectId;

  @Prop({ type: Object })
  preferences?: {
    defaultAiProvider?: string;
    defaultTemplateId?: string;
    emailNotifications?: boolean;
    marketingEmails?: boolean;
    language?: string;
    timezone?: string;
  };

  @Prop({ type: Object })
  mfaConfig?: {
    enabled: boolean;
    method?: 'totp' | 'sms' | 'email';
    secret?: string;
    verifiedAt?: Date;
  };

  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
