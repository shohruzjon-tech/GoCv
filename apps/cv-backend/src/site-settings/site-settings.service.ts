import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SiteSettings } from './schemas/site-settings.schema.js';

export interface StripeConfig {
  enabled: boolean;
  secretKey: string;
  webhookSecret: string;
  premiumMonthlyPriceId: string;
  premiumYearlyPriceId: string;
  enterpriseMonthlyPriceId: string;
  enterpriseYearlyPriceId: string;
}

@Injectable()
export class SiteSettingsService {
  private readonly logger = new Logger(SiteSettingsService.name);

  constructor(
    @InjectModel(SiteSettings.name)
    private siteSettingsModel: Model<SiteSettings>,
  ) {}

  async get(): Promise<SiteSettings> {
    let settings = await this.siteSettingsModel.findOne({ key: 'default' });
    if (!settings) {
      settings = await this.siteSettingsModel.create({ key: 'default' });
    }
    return settings;
  }

  async update(data: Partial<SiteSettings>): Promise<SiteSettings> {
    const settings = await this.siteSettingsModel.findOneAndUpdate(
      { key: 'default' },
      { $set: data },
      { new: true, upsert: true },
    );
    return settings;
  }

  async getCreatorInfo() {
    const settings = await this.get();
    return {
      name: settings.creatorName,
      title: settings.creatorTitle,
      bio: settings.creatorBio,
      avatar: settings.creatorAvatar,
      skills: settings.creatorSkills,
      email: settings.creatorEmail,
      linkedin: settings.creatorLinkedin,
      github: settings.creatorGithub,
      website: settings.creatorWebsite,
      location: settings.creatorLocation,
    };
  }

  // ─── Stripe Configuration ───

  async getStripeConfig(): Promise<StripeConfig> {
    const settings = await this.get();
    return {
      enabled: settings.stripeEnabled ?? false,
      secretKey: settings.stripeSecretKey ?? '',
      webhookSecret: settings.stripeWebhookSecret ?? '',
      premiumMonthlyPriceId: settings.stripePremiumMonthlyPriceId ?? '',
      premiumYearlyPriceId: settings.stripePremiumYearlyPriceId ?? '',
      enterpriseMonthlyPriceId: settings.stripeEnterpriseMonthlyPriceId ?? '',
      enterpriseYearlyPriceId: settings.stripeEnterpriseYearlyPriceId ?? '',
    };
  }

  /** Returns Stripe config without secret key for the admin UI status view */
  async getStripeStatus(): Promise<{
    enabled: boolean;
    hasSecretKey: boolean;
    hasWebhookSecret: boolean;
    premiumMonthlyPriceId: string;
    premiumYearlyPriceId: string;
    enterpriseMonthlyPriceId: string;
    enterpriseYearlyPriceId: string;
  }> {
    const config = await this.getStripeConfig();
    return {
      enabled: config.enabled,
      hasSecretKey: !!config.secretKey,
      hasWebhookSecret: !!config.webhookSecret,
      premiumMonthlyPriceId: config.premiumMonthlyPriceId,
      premiumYearlyPriceId: config.premiumYearlyPriceId,
      enterpriseMonthlyPriceId: config.enterpriseMonthlyPriceId,
      enterpriseYearlyPriceId: config.enterpriseYearlyPriceId,
    };
  }

  async updateStripeConfig(data: Partial<StripeConfig>): Promise<StripeConfig> {
    const updateFields: any = {};

    if (data.enabled !== undefined) updateFields.stripeEnabled = data.enabled;
    if (data.secretKey !== undefined)
      updateFields.stripeSecretKey = data.secretKey;
    if (data.webhookSecret !== undefined)
      updateFields.stripeWebhookSecret = data.webhookSecret;
    if (data.premiumMonthlyPriceId !== undefined)
      updateFields.stripePremiumMonthlyPriceId = data.premiumMonthlyPriceId;
    if (data.premiumYearlyPriceId !== undefined)
      updateFields.stripePremiumYearlyPriceId = data.premiumYearlyPriceId;
    if (data.enterpriseMonthlyPriceId !== undefined)
      updateFields.stripeEnterpriseMonthlyPriceId =
        data.enterpriseMonthlyPriceId;
    if (data.enterpriseYearlyPriceId !== undefined)
      updateFields.stripeEnterpriseYearlyPriceId = data.enterpriseYearlyPriceId;

    await this.update(updateFields);
    this.logger.log('Stripe configuration updated');
    return this.getStripeConfig();
  }
}
