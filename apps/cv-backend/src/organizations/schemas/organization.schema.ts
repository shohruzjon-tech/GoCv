import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { OrgStatus, OrgPlan } from '../../common/enums/org-role.enum.js';

export type OrganizationDocument = HydratedDocument<Organization>;

@Schema()
export class OrgBranding {
  @Prop() logoUrl?: string;
  @Prop() faviconUrl?: string;
  @Prop() primaryColor?: string;
  @Prop() accentColor?: string;
  @Prop() customDomain?: string;
  @Prop() companyName?: string;
  @Prop() tagline?: string;
}

export const OrgBrandingSchema = SchemaFactory.createForClass(OrgBranding);

@Schema()
export class OrgSettings {
  @Prop({ default: true }) allowMemberInvites: boolean;
  @Prop({ default: true }) allowPublicCvs: boolean;
  @Prop({ default: false }) requireApprovalForPublish: boolean;
  @Prop({ default: true }) enableAiTools: boolean;
  @Prop({ default: false }) enforceTemplates: boolean;
  @Prop({ type: [String], default: [] }) allowedTemplateIds: string[];
  @Prop({ default: 'openai' }) preferredAiProvider: string;
  @Prop({ type: Object }) ssoConfig?: {
    provider: string;
    clientId: string;
    clientSecret: string;
    domain: string;
    enabled: boolean;
  };
  @Prop({ type: Object }) complianceConfig?: {
    gdprEnabled: boolean;
    dataRetentionDays: number;
    auditLogRetentionDays: number;
    requireMfa: boolean;
  };
}

export const OrgSettingsSchema = SchemaFactory.createForClass(OrgSettings);

@Schema({ timestamps: true })
export class Organization {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop()
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;

  @Prop({ type: String, enum: OrgStatus, default: OrgStatus.ACTIVE })
  status: OrgStatus;

  @Prop({ type: String, enum: OrgPlan, default: OrgPlan.TEAM })
  plan: OrgPlan;

  @Prop({ type: OrgBrandingSchema })
  branding?: OrgBranding;

  @Prop({ type: OrgSettingsSchema })
  settings?: OrgSettings;

  @Prop({ default: 0 })
  memberCount: number;

  @Prop({ default: 10 })
  maxMembers: number;

  @Prop({ default: 0 })
  totalCvsCreated: number;

  @Prop()
  stripeCustomerId?: string;

  @Prop()
  stripeSubscriptionId?: string;

  @Prop()
  trialEndsAt?: Date;

  @Prop()
  industry?: string;

  @Prop()
  website?: string;

  @Prop()
  size?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
OrganizationSchema.index({ ownerId: 1 });
OrganizationSchema.index({ status: 1, plan: 1 });
OrganizationSchema.index({ 'branding.customDomain': 1 }, { sparse: true });
