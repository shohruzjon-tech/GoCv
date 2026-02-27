import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema.js';
import { AuditAction } from '../common/enums/audit-action.enum.js';

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name) private auditModel: Model<AuditLogDocument>,
  ) {}

  async log(data: {
    userId?: string;
    action: AuditAction;
    resource: string;
    resourceId?: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    performedBy?: string;
  }): Promise<void> {
    const entry = new this.auditModel({
      ...data,
      userId: data.userId ? new Types.ObjectId(data.userId) : undefined,
      performedBy: data.performedBy
        ? new Types.ObjectId(data.performedBy)
        : undefined,
    });
    await entry.save();
  }

  async findByUser(
    userId: string,
    page = 1,
    limit = 50,
  ): Promise<{ logs: AuditLogDocument[]; total: number }> {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      this.auditModel
        .find({ userId: new Types.ObjectId(userId) })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.auditModel
        .countDocuments({ userId: new Types.ObjectId(userId) })
        .exec(),
    ]);
    return { logs, total };
  }

  async findAll(
    page = 1,
    limit = 50,
    filters?: { action?: AuditAction; resource?: string },
  ): Promise<{ logs: AuditLogDocument[]; total: number }> {
    const skip = (page - 1) * limit;
    const query: Record<string, any> = {};
    if (filters?.action) query.action = filters.action;
    if (filters?.resource) query.resource = filters.resource;

    const [logs, total] = await Promise.all([
      this.auditModel
        .find(query)
        .populate('userId', 'name email')
        .populate('performedBy', 'name email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.auditModel.countDocuments(query).exec(),
    ]);
    return { logs, total };
  }
}
