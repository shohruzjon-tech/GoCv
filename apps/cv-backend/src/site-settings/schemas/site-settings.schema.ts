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

  // ─── Stripe Configuration ───

  @Prop({ default: false })
  stripeEnabled: boolean;

  @Prop({ default: '' })
  stripeSecretKey: string;

  @Prop({ default: '' })
  stripeWebhookSecret: string;

  @Prop({ default: '' })
  stripePremiumMonthlyPriceId: string;

  @Prop({ default: '' })
  stripePremiumYearlyPriceId: string;

  @Prop({ default: '' })
  stripeEnterpriseMonthlyPriceId: string;

  @Prop({ default: '' })
  stripeEnterpriseYearlyPriceId: string;
}

export const SiteSettingsSchema = SchemaFactory.createForClass(SiteSettings);
