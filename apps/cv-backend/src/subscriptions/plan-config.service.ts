import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  PlanConfig,
  PlanConfigDocument,
} from './schemas/plan-config.schema.js';
import { SubscriptionPlan } from '../common/enums/subscription-plan.enum.js';

@Injectable()
export class PlanConfigService implements OnModuleInit {
  private readonly logger = new Logger(PlanConfigService.name);

  // In-memory cache for fast lookups
  private planCache: Map<SubscriptionPlan, PlanConfigDocument> = new Map();

  constructor(
    @InjectModel(PlanConfig.name)
    private planConfigModel: Model<PlanConfigDocument>,
  ) {}

  async onModuleInit() {
    await this.seedDefaults();
    await this.refreshCache();
  }

  // ─── Seed Defaults ───

  private async seedDefaults() {
    const count = await this.planConfigModel.countDocuments().exec();
    if (count > 0) {
      this.logger.log('Plan configurations already exist, skipping seed');
      return;
    }

    const defaults: Partial<PlanConfig>[] = [
      {
        plan: SubscriptionPlan.FREE,
        name: 'Free',
        description: 'Get started with basic features',
        monthlyPrice: 0,
        yearlyPrice: 0,
        currency: 'usd',
        limits: {
          maxCvs: 2,
          maxProjects: 3,
          maxAiCreditsPerMonth: 10,
          maxPdfExportsPerMonth: 3,
          hasCustomDomain: false,
          hasAdvancedAiTools: false,
          hasPremiumTemplates: false,
          hasCustomBranding: false,
          hasPrioritySupport: false,
        },
        features: [
          '2 CVs',
          '3 Projects',
          '10 AI credits/month',
          '3 PDF exports/month',
          'Basic templates',
        ],
        displayOrder: 0,
        popular: false,
        isActive: true,
      },
      {
        plan: SubscriptionPlan.PREMIUM,
        name: 'Premium',
        description: 'Everything you need to stand out',
        monthlyPrice: 1200, // $12.00
        yearlyPrice: 9600, // $96.00 ($8/mo)
        currency: 'usd',
        limits: {
          maxCvs: 20,
          maxProjects: 50,
          maxAiCreditsPerMonth: 200,
          maxPdfExportsPerMonth: 50,
          hasCustomDomain: false,
          hasAdvancedAiTools: true,
          hasPremiumTemplates: true,
          hasCustomBranding: false,
          hasPrioritySupport: true,
        },
        features: [
          '20 CVs',
          '50 Projects',
          '200 AI credits/month',
          '50 PDF exports/month',
          'All templates',
          'Advanced AI tools',
          'Priority support',
        ],
        displayOrder: 1,
        popular: true,
        isActive: true,
      },
      {
        plan: SubscriptionPlan.ENTERPRISE,
        name: 'Enterprise',
        description: 'For teams and power users',
        monthlyPrice: 4900, // $49.00
        yearlyPrice: 39600, // $396.00 ($33/mo)
        currency: 'usd',
        limits: {
          maxCvs: -1,
          maxProjects: -1,
          maxAiCreditsPerMonth: -1,
          maxPdfExportsPerMonth: -1,
          hasCustomDomain: true,
          hasAdvancedAiTools: true,
          hasPremiumTemplates: true,
          hasCustomBranding: true,
          hasPrioritySupport: true,
        },
        features: [
          'Unlimited CVs',
          'Unlimited Projects',
          'Unlimited AI credits',
          'Unlimited PDF exports',
          'All templates',
          'Custom branding',
          'Custom domain',
          'Advanced AI tools',
          'Priority support',
        ],
        displayOrder: 2,
        popular: false,
        isActive: true,
      },
    ];

    await this.planConfigModel.insertMany(defaults);
    this.logger.log('Default plan configurations seeded');
  }

  // ─── Cache Management ───

  async refreshCache() {
    const configs = await this.planConfigModel.find().exec();
    this.planCache.clear();
    for (const config of configs) {
      this.planCache.set(config.plan, config);
    }
    this.logger.log(`Plan config cache refreshed (${configs.length} plans)`);
  }

  // ─── Public Getters ───

  getPlanLimits(plan: SubscriptionPlan): PlanConfig['limits'] {
    const config = this.planCache.get(plan);
    if (!config) {
      this.logger.warn(`No config found for plan: ${plan}, using fallback`);
      return {
        maxCvs: 2,
        maxProjects: 3,
        maxAiCreditsPerMonth: 10,
        maxPdfExportsPerMonth: 3,
        hasCustomDomain: false,
        hasAdvancedAiTools: false,
        hasPremiumTemplates: false,
        hasCustomBranding: false,
        hasPrioritySupport: false,
      };
    }
    return config.limits;
  }

  getMonthlyPrice(plan: SubscriptionPlan): number {
    return this.planCache.get(plan)?.monthlyPrice ?? 0;
  }

  getYearlyPrice(plan: SubscriptionPlan): number {
    return this.planCache.get(plan)?.yearlyPrice ?? 0;
  }

  // ─── Public API (for pricing page) ───

  async getActivePlans(): Promise<PlanConfigDocument[]> {
    return this.planConfigModel
      .find({ isActive: true })
      .sort({ displayOrder: 1 })
      .exec();
  }

  // ─── Admin CRUD ───

  async findAll(): Promise<PlanConfigDocument[]> {
    return this.planConfigModel.find().sort({ displayOrder: 1 }).exec();
  }

  async findByPlan(plan: SubscriptionPlan): Promise<PlanConfigDocument | null> {
    return this.planConfigModel.findOne({ plan }).exec();
  }

  async findById(id: string): Promise<PlanConfigDocument> {
    const config = await this.planConfigModel.findById(id).exec();
    if (!config) throw new NotFoundException('Plan configuration not found');
    return config;
  }

  async update(
    id: string,
    data: Partial<PlanConfig>,
  ): Promise<PlanConfigDocument> {
    const config = await this.findById(id);

    // Update allowed fields
    if (data.name !== undefined) config.name = data.name;
    if (data.description !== undefined) config.description = data.description;
    if (data.monthlyPrice !== undefined)
      config.monthlyPrice = data.monthlyPrice;
    if (data.yearlyPrice !== undefined) config.yearlyPrice = data.yearlyPrice;
    if (data.currency !== undefined) config.currency = data.currency;
    if (data.limits !== undefined) config.limits = data.limits;
    if (data.features !== undefined) config.features = data.features;
    if (data.displayOrder !== undefined)
      config.displayOrder = data.displayOrder;
    if (data.popular !== undefined) config.popular = data.popular;
    if (data.isActive !== undefined) config.isActive = data.isActive;
    if (data.stripePriceIdMonthly !== undefined)
      config.stripePriceIdMonthly = data.stripePriceIdMonthly;
    if (data.stripePriceIdYearly !== undefined)
      config.stripePriceIdYearly = data.stripePriceIdYearly;

    const saved = await config.save();
    await this.refreshCache();
    return saved;
  }

  async create(data: Partial<PlanConfig>): Promise<PlanConfigDocument> {
    const config = new this.planConfigModel(data);
    const saved = await config.save();
    await this.refreshCache();
    return saved;
  }

  async delete(id: string): Promise<{ message: string }> {
    const config = await this.findById(id);
    // Prevent deleting the Free plan
    if (config.plan === SubscriptionPlan.FREE) {
      throw new Error('Cannot delete the Free plan');
    }
    await this.planConfigModel.findByIdAndDelete(id).exec();
    await this.refreshCache();
    return { message: 'Plan configuration deleted' };
  }
}
