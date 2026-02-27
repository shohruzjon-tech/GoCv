import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  FeatureFlag,
  FeatureFlagDocument,
} from './schemas/feature-flag.schema.js';

@Injectable()
export class FeatureFlagsService {
  constructor(
    @InjectModel(FeatureFlag.name)
    private flagModel: Model<FeatureFlagDocument>,
  ) {}

  async getAll(): Promise<FeatureFlagDocument[]> {
    return this.flagModel.find().sort({ key: 1 }).exec();
  }

  async getByKey(key: string): Promise<FeatureFlagDocument | null> {
    return this.flagModel.findOne({ key }).exec();
  }

  async isEnabled(
    key: string,
    userId?: string,
    plan?: string,
  ): Promise<boolean> {
    const flag = await this.flagModel.findOne({ key }).exec();
    if (!flag || !flag.enabled) return false;

    // Check allowed plans
    if (flag.allowedPlans.length > 0 && plan) {
      if (!flag.allowedPlans.includes(plan)) return false;
    }

    // Check allowed user IDs
    if (flag.allowedUserIds.length > 0 && userId) {
      if (!flag.allowedUserIds.includes(userId)) return false;
    }

    // Check rollout percentage
    if (flag.rolloutPercentage < 100 && userId) {
      const hash =
        userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) %
        100;
      if (hash >= flag.rolloutPercentage) return false;
    }

    return true;
  }

  async create(data: Partial<FeatureFlag>): Promise<FeatureFlagDocument> {
    const flag = new this.flagModel(data);
    return flag.save();
  }

  async update(
    id: string,
    data: Partial<FeatureFlag>,
  ): Promise<FeatureFlagDocument> {
    const updated = await this.flagModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Feature flag not found');
    return updated;
  }

  async toggle(id: string): Promise<FeatureFlagDocument> {
    const flag = await this.flagModel.findById(id).exec();
    if (!flag) throw new NotFoundException('Feature flag not found');
    flag.enabled = !flag.enabled;
    return flag.save();
  }

  async delete(id: string): Promise<void> {
    await this.flagModel.findByIdAndDelete(id).exec();
  }

  async seedDefaults(): Promise<void> {
    const count = await this.flagModel.countDocuments().exec();
    if (count > 0) return;

    const defaults: Partial<FeatureFlag>[] = [
      {
        key: 'ai_cv_enhance',
        name: 'AI CV Enhancer',
        description: 'Enable AI-powered CV enhancement tool',
        enabled: true,
        allowedPlans: ['premium', 'enterprise'],
      },
      {
        key: 'ai_job_tailor',
        name: 'AI Job Tailor',
        description: 'Enable job-specific CV tailoring',
        enabled: true,
        allowedPlans: ['premium', 'enterprise'],
      },
      {
        key: 'ai_ats_score',
        name: 'AI ATS Scoring',
        description: 'Enable ATS optimization scoring',
        enabled: true,
        allowedPlans: ['premium', 'enterprise'],
      },
      {
        key: 'ai_interview_prep',
        name: 'AI Interview Prep',
        description: 'Enable AI interview preparation suggestions',
        enabled: true,
        allowedPlans: ['premium', 'enterprise'],
      },
      {
        key: 'ai_skill_gap',
        name: 'AI Skill Gap Analysis',
        description: 'Enable AI skill gap analysis',
        enabled: true,
        allowedPlans: ['premium', 'enterprise'],
      },
      {
        key: 'pdf_export',
        name: 'PDF Export',
        description: 'Enable PDF export functionality',
        enabled: true,
      },
      {
        key: 'custom_domain',
        name: 'Custom Domain',
        description: 'Enable custom domain for public CV pages',
        enabled: false,
        allowedPlans: ['enterprise'],
      },
      {
        key: 'dark_mode',
        name: 'Dark Mode',
        description: 'Enable dark/light mode toggle',
        enabled: true,
      },
    ];

    await this.flagModel.insertMany(defaults);
  }
}
