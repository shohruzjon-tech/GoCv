import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Session, SessionDocument } from './schemas/session.schema.js';

@Injectable()
export class SessionsService {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
  ) {}

  async create(data: {
    userId: Types.ObjectId;
    token: string;
    userAgent?: string;
    ipAddress?: string;
    expiresAt: Date;
  }): Promise<SessionDocument> {
    const session = new this.sessionModel({
      ...data,
      lastActivityAt: new Date(),
    });
    return session.save();
  }

  async findByToken(token: string): Promise<SessionDocument | null> {
    return this.sessionModel.findOne({ token, isActive: true }).exec();
  }

  async findByUserId(userId: string): Promise<SessionDocument[]> {
    return this.sessionModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findAll(
    page = 1,
    limit = 20,
  ): Promise<{ sessions: SessionDocument[]; total: number }> {
    const skip = (page - 1) * limit;
    const [sessions, total] = await Promise.all([
      this.sessionModel
        .find()
        .populate('userId', 'name email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.sessionModel.countDocuments().exec(),
    ]);
    return { sessions, total };
  }

  async deactivate(sessionId: string): Promise<void> {
    await this.sessionModel
      .findByIdAndUpdate(sessionId, { isActive: false })
      .exec();
  }

  async deactivateAllForUser(userId: string): Promise<void> {
    await this.sessionModel
      .updateMany({ userId: new Types.ObjectId(userId) }, { isActive: false })
      .exec();
  }

  async updateActivity(token: string): Promise<void> {
    await this.sessionModel
      .updateOne({ token }, { lastActivityAt: new Date() })
      .exec();
  }

  async cleanExpired(): Promise<void> {
    await this.sessionModel
      .deleteMany({
        expiresAt: { $lt: new Date() },
      })
      .exec();
  }
}
