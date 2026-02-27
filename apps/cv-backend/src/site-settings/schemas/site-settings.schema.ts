import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class SiteSettings extends Document {
  @Prop({ default: 'default' })
  key: string;

  // Creator / About section
  @Prop({ default: '' })
  creatorName: string;

  @Prop({ default: '' })
  creatorTitle: string;

  @Prop({ default: '' })
  creatorBio: string;

  @Prop({ default: '' })
  creatorAvatar: string;

  @Prop({ type: [String], default: [] })
  creatorSkills: string[];

  @Prop({ default: '' })
  creatorEmail: string;

  @Prop({ default: '' })
  creatorLinkedin: string;

  @Prop({ default: '' })
  creatorGithub: string;

  @Prop({ default: '' })
  creatorWebsite: string;

  @Prop({ default: '' })
  creatorLocation: string;
}

export const SiteSettingsSchema = SchemaFactory.createForClass(SiteSettings);
