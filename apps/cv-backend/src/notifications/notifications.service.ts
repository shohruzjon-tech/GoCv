import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema.js';
import { NotificationsGateway } from './notifications.gateway.js';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notifModel: Model<NotificationDocument>,
    private gateway: NotificationsGateway,
  ) {}

  async create(data: {
    userId: string;
    title: string;
    message: string;
    type?: string;
    actionUrl?: string;
    actionLabel?: string;
    metadata?: Record<string, any>;
  }): Promise<NotificationDocument> {
    const notif = new this.notifModel({
      ...data,
      userId: new Types.ObjectId(data.userId),
    });
    const saved = await notif.save();

    // Push real-time notification via WebSocket
    this.gateway.sendToUser(data.userId, 'notification', {
      _id: saved._id.toString(),
      title: saved.title,
      message: saved.message,
      type: saved.type,
      read: saved.read,
      actionUrl: saved.actionUrl,
      actionLabel: saved.actionLabel,
      metadata: saved.metadata,
      createdAt: saved.createdAt,
    });

    // Also send updated unread count
    const count = await this.getUnreadCount(data.userId);
    this.gateway.sendToUser(data.userId, 'unread-count', count);

    return saved;
  }

  async findByUser(
    userId: string,
    unreadOnly = false,
  ): Promise<NotificationDocument[]> {
    const query: Record<string, any> = {
      userId: new Types.ObjectId(userId),
    };
    if (unreadOnly) query.read = false;

    return this.notifModel.find(query).sort({ createdAt: -1 }).limit(50).exec();
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notifModel
      .countDocuments({
        userId: new Types.ObjectId(userId),
        read: false,
      })
      .exec();
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    await this.notifModel
      .updateOne(
        { _id: id, userId: new Types.ObjectId(userId) },
        { read: true },
      )
      .exec();
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notifModel
      .updateMany(
        { userId: new Types.ObjectId(userId), read: false },
        { read: true },
      )
      .exec();
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.notifModel
      .deleteOne({ _id: id, userId: new Types.ObjectId(userId) })
      .exec();
  }

  // System notifications
  async notifyWelcome(userId: string): Promise<void> {
    await this.create({
      userId,
      title: 'Welcome to GoCV! 🎉',
      message:
        'Create your first CV using our AI-powered builder. Get started in seconds!',
      type: 'success',
      actionUrl: '/dashboard/cv/builder',
      actionLabel: 'Create CV',
    });
  }

  async notifyAiCreditsLow(userId: string, remaining: number): Promise<void> {
    await this.create({
      userId,
      title: 'AI Credits Running Low',
      message: `You have ${remaining} AI credits remaining this month. Upgrade to Premium for more!`,
      type: 'warning',
      actionUrl: '/dashboard/settings/billing',
      actionLabel: 'Upgrade Now',
    });
  }

  async notifyCvPublished(userId: string, slug: string): Promise<void> {
    await this.create({
      userId,
      title: 'CV Published! 🚀',
      message: 'Your CV is now live and publicly accessible.',
      type: 'success',
      actionUrl: `/cv/${slug}`,
      actionLabel: 'View CV',
    });
  }
}
