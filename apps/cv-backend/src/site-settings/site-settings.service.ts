import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SiteSettings } from './schemas/site-settings.schema.js';

@Injectable()
export class SiteSettingsService {
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
}
