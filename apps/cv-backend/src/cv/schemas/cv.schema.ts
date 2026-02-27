import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { CvStatus } from '../../common/enums/cv-status.enum.js';

export type CvDocument = HydratedDocument<Cv>;

@Schema({ timestamps: true })
export class CvSection {
  @Prop({ required: true })
  type: string; // 'summary' | 'experience' | 'education' | 'skills' | 'certifications' | 'custom'

  @Prop({ required: true })
  title: string;

  @Prop({ type: Object })
  content: Record<string, any>;

  @Prop({ default: 0 })
  order: number;

  @Prop({ default: true })
  visible: boolean;
}

export const CvSectionSchema = SchemaFactory.createForClass(CvSection);

@Schema({ timestamps: true })
export class Cv {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop()
  summary?: string;

  @Prop({ type: String, enum: CvStatus, default: CvStatus.DRAFT })
  status: CvStatus;

  @Prop({ unique: true, sparse: true })
  slug?: string;

  @Prop({ type: [CvSectionSchema], default: [] })
  sections: CvSection[];

  @Prop({ type: Object })
  personalInfo?: {
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    website?: string;
    linkedin?: string;
    github?: string;
  };

  @Prop({ type: Object })
  theme?: {
    primaryColor?: string;
    fontFamily?: string;
    layout?: string; // 'modern' | 'classic' | 'minimal' | 'creative'
  };

  @Prop()
  templateId?: string;

  @Prop()
  aiGeneratedHtml?: string;

  @Prop()
  lastAiPrompt?: string;

  @Prop({ default: false })
  isPublic: boolean;

  @Prop()
  publicUrl?: string;

  // ─── Enterprise Fields ───

  @Prop({ type: Types.ObjectId, ref: 'Organization' })
  organizationId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Team' })
  teamId?: Types.ObjectId;

  @Prop({ default: 1 })
  currentVersion: number;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop()
  targetRole?: string;

  @Prop()
  targetCompany?: string;

  @Prop({ type: Object })
  metadata?: {
    lastAiProvider?: string;
    lastAiModel?: string;
    totalAiEdits?: number;
    exportCount?: number;
    viewCount?: number;
  };

  createdAt?: Date;
  updatedAt?: Date;
}

export const CvSchema = SchemaFactory.createForClass(Cv);
CvSchema.index({ organizationId: 1, userId: 1 });
CvSchema.index({ tags: 1 });
CvSchema.index({
  targetRole: 'text',
  targetCompany: 'text',
  'personalInfo.fullName': 'text',
});
