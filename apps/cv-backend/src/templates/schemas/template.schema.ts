import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  TemplateCategory,
  TemplateStatus,
} from '../../common/enums/template.enum.js';

export type TemplateDocument = HydratedDocument<Template>;

@Schema()
export class TemplateColorTheme {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  primaryColor: string;

  @Prop({ required: true })
  secondaryColor: string;

  @Prop({ required: true })
  backgroundColor: string;

  @Prop({ required: true })
  textColor: string;

  @Prop()
  accentColor?: string;
}

export const TemplateColorThemeSchema =
  SchemaFactory.createForClass(TemplateColorTheme);

@Schema({ timestamps: true })
export class Template {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop()
  description?: string;

  @Prop({
    type: String,
    enum: TemplateCategory,
    default: TemplateCategory.MINIMAL,
  })
  category: TemplateCategory;

  @Prop({
    type: String,
    enum: TemplateStatus,
    default: TemplateStatus.ACTIVE,
  })
  status: TemplateStatus;

  @Prop()
  thumbnailUrl?: string;

  @Prop()
  previewUrl?: string;

  // The HTML/CSS template with handlebars-style placeholders
  @Prop({ required: true })
  htmlTemplate: string;

  @Prop()
  cssStyles?: string;

  // Layout configuration
  @Prop({ type: Object })
  layoutConfig?: {
    columns?: number;
    sidebarPosition?: 'left' | 'right' | 'none';
    headerStyle?: 'full-width' | 'centered' | 'split';
    sectionSpacing?: 'compact' | 'normal' | 'spacious';
  };

  // Color themes available for this template
  @Prop({ type: [TemplateColorThemeSchema], default: [] })
  colorThemes: TemplateColorTheme[];

  // Typography options
  @Prop({ type: [String], default: ['Inter'] })
  supportedFonts: string[];

  @Prop({ default: 'Inter' })
  defaultFont: string;

  // Access control
  @Prop({ default: false })
  isPremium: boolean;

  @Prop({ default: false })
  isEnterprise: boolean;

  // Metadata
  @Prop({ default: 0 })
  usageCount: number;

  @Prop({ type: Number, default: 0 })
  rating: number;

  @Prop({ default: 0 })
  sortOrder: number;

  @Prop({ type: [String], default: [] })
  tags: string[];

  createdAt?: Date;
  updatedAt?: Date;
}

export const TemplateSchema = SchemaFactory.createForClass(Template);

// Indexes
TemplateSchema.index({ category: 1, status: 1 });
TemplateSchema.index({ isPremium: 1, status: 1 });
TemplateSchema.index({ sortOrder: 1 });
