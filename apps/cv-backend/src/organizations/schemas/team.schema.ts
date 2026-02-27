import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TeamDocument = HydratedDocument<Team>;

@Schema({ timestamps: true })
export class Team {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  memberIds: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'User' })
  leadId?: Types.ObjectId;

  @Prop({ type: Object })
  settings?: {
    defaultTemplateId?: string;
    maxCvsPerMember?: number;
    aiCreditsPool?: number;
    autoApprovePublish?: boolean;
  };

  @Prop({ default: '#3b82f6' })
  color: string;

  @Prop()
  icon?: string;

  @Prop({ default: true })
  isActive: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const TeamSchema = SchemaFactory.createForClass(Team);
TeamSchema.index({ organizationId: 1 });
TeamSchema.index({ organizationId: 1, slug: 1 }, { unique: true });
