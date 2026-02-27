import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CvVersionDocument = HydratedDocument<CvVersion>;

@Schema({ timestamps: true })
export class CvVersion {
  @Prop({ type: Types.ObjectId, ref: 'Cv', required: true })
  cvId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  version: number;

  @Prop()
  label?: string;

  @Prop({ type: Object, required: true })
  snapshot: {
    title: string;
    summary?: string;
    personalInfo?: Record<string, any>;
    sections: Record<string, any>[];
    theme?: Record<string, any>;
    templateId?: string;
    aiGeneratedHtml?: string;
  };

  @Prop()
  changeDescription?: string;

  @Prop({ type: String, enum: ['manual', 'ai-generated', 'auto-save', 'publish', 'restore', 'branch'] })
  changeType: string;

  @Prop({ type: Object })
  diff?: {
    fieldsChanged: string[];
    sectionsAdded: string[];
    sectionsRemoved: string[];
    sectionsModified: string[];
  };

  @Prop({ type: Types.ObjectId, ref: 'CvVersion' })
  parentVersionId?: Types.ObjectId;

  @Prop()
  branchName?: string;

  @Prop({ default: false })
  isBranch: boolean;

  @Prop({ type: Number })
  sizeBytes?: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const CvVersionSchema = SchemaFactory.createForClass(CvVersion);
CvVersionSchema.index({ cvId: 1, version: -1 });
CvVersionSchema.index({ cvId: 1, branchName: 1 });
CvVersionSchema.index({ userId: 1, createdAt: -1 });
CvVersionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 }); // TTL: 180 days
