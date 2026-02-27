import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { OrgRole } from '../../common/enums/org-role.enum.js';

export type OrgMembershipDocument = HydratedDocument<OrgMembership>;

@Schema({ timestamps: true })
export class OrgMembership {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId: Types.ObjectId;

  @Prop({ type: String, enum: OrgRole, default: OrgRole.MEMBER })
  role: OrgRole;

  @Prop({ type: [Types.ObjectId], ref: 'Team', default: [] })
  teamIds: Types.ObjectId[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  invitedBy?: Types.ObjectId;

  @Prop()
  invitedAt?: Date;

  @Prop()
  joinedAt?: Date;

  @Prop({ type: Object })
  permissions?: {
    canCreateCv: boolean;
    canPublishCv: boolean;
    canUseAi: boolean;
    canManageTemplates: boolean;
    canInviteMembers: boolean;
    canViewAnalytics: boolean;
    canManageBilling: boolean;
  };

  createdAt?: Date;
  updatedAt?: Date;
}

export const OrgMembershipSchema = SchemaFactory.createForClass(OrgMembership);
OrgMembershipSchema.index({ userId: 1, organizationId: 1 }, { unique: true });
OrgMembershipSchema.index({ organizationId: 1, role: 1 });
OrgMembershipSchema.index({ userId: 1, isActive: 1 });
