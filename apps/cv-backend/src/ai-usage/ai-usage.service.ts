import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AiUsage, AiUsageDocument } from './schemas/ai-usage.schema.js';
import { AiToolType } from '../common/enums/ai-tool.enum.js';

@Injectable()
export class AiUsageService {
  constructor(
    @InjectModel(AiUsage.name) private aiUsageModel: Model<AiUsageDocument>,
  ) {}

  async trackUsage(data: {
    userId: string;
    toolType: AiToolType;
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCostMills: number;
    prompt?: string;
    success: boolean;
    errorMessage?: string;
    latencyMs: number;
    cvId?: string;
  }): Promise<AiUsageDocument> {
    const usage = new this.aiUsageModel({
      ...data,
      userId: new Types.ObjectId(data.userId),
      cvId: data.cvId ? new Types.ObjectId(data.cvId) : undefined,
    });
    return usage.save();
  }

  async getUserUsage(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<AiUsageDocument[]> {
    const query: Record<string, any> = {
      userId: new Types.ObjectId(userId),
    };
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }
    return this.aiUsageModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .exec();
  }

  async getUserMonthlyStats(userId: string): Promise<{
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    byTool: Record<string, number>;
  }> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const usages = await this.aiUsageModel
      .find({
        userId: new Types.ObjectId(userId),
        createdAt: { $gte: startOfMonth },
        success: true,
      })
      .exec();

    const byTool: Record<string, number> = {};
    let totalTokens = 0;
    let totalCost = 0;

    usages.forEach((u) => {
      totalTokens += u.totalTokens;
      totalCost += u.estimatedCostMills;
      byTool[u.toolType] = (byTool[u.toolType] || 0) + 1;
    });

    return {
      totalRequests: usages.length,
      totalTokens,
      totalCost: totalCost / 1000, // Convert mills to USD
      byTool,
    };
  }

  // Admin: Global stats
  async getGlobalStats(days = 30): Promise<{
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    byTool: Record<string, number>;
    dailyUsage: { date: string; count: number; tokens: number }[];
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const usages = await this.aiUsageModel
      .find({ createdAt: { $gte: startDate }, success: true })
      .exec();

    const byTool: Record<string, number> = {};
    const dailyMap: Record<string, { count: number; tokens: number }> = {};
    let totalTokens = 0;
    let totalCost = 0;

    usages.forEach((u) => {
      totalTokens += u.totalTokens;
      totalCost += u.estimatedCostMills;
      byTool[u.toolType] = (byTool[u.toolType] || 0) + 1;

      const dateKey = u.createdAt
        ? u.createdAt.toISOString().split('T')[0]
        : 'unknown';
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = { count: 0, tokens: 0 };
      }
      dailyMap[dateKey].count++;
      dailyMap[dateKey].tokens += u.totalTokens;
    });

    const dailyUsage = Object.entries(dailyMap)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalRequests: usages.length,
      totalTokens,
      totalCost: totalCost / 1000,
      byTool,
      dailyUsage,
    };
  }

  async findAll(
    page = 1,
    limit = 50,
  ): Promise<{ usages: AiUsageDocument[]; total: number }> {
    const skip = (page - 1) * limit;
    const [usages, total] = await Promise.all([
      this.aiUsageModel
        .find()
        .populate('userId', 'name email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.aiUsageModel.countDocuments().exec(),
    ]);
    return { usages, total };
  }
}
