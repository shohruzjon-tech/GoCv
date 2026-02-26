import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProjectDocument = HydratedDocument<Project>;

@Schema({ timestamps: true })
export class ProjectImage {
  @Prop({ required: true })
  url: string;

  @Prop()
  key: string; // S3 key

  @Prop()
  caption?: string;

  @Prop({ default: 0 })
  order: number;
}

export const ProjectImageSchema = SchemaFactory.createForClass(ProjectImage);

@Schema({ timestamps: true })
export class Project {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Cv' })
  cvId?: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop()
  longDescription?: string;

  @Prop({ type: [String], default: [] })
  technologies: string[];

  @Prop({ type: [ProjectImageSchema], default: [] })
  images: ProjectImage[];

  @Prop()
  liveUrl?: string;

  @Prop()
  sourceUrl?: string;

  @Prop()
  startDate?: Date;

  @Prop()
  endDate?: Date;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ default: true })
  isVisible: boolean;

  @Prop({ default: 0 })
  order: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
