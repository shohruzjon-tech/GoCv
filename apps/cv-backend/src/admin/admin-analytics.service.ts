import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema.js';
import {
  Session,
  SessionDocument,
} from '../sessions/schemas/session.schema.js';
import {
  AuditLog,
  AuditLogDocument,
} from '../audit/schemas/audit-log.schema.js';

/**
 * AdminAnalyticsService — dedicated to real-time dashboard metrics.
 *
 * Provides:
 *  - Registration stats (completed vs incomplete, daily trends)
 *  - User joining dynamics (hourly / daily aggregation)
 *  - Request throughput tracking (in-memory ring buffer, ~trading-chart style)
 *  - Active sessions count
 */
@Injectable()
export class AdminAnalyticsService {
  private readonly logger = new Logger(AdminAnalyticsService.name);

  // ── In-memory request ring buffer (last 60 min, 1-sec resolution) ──
  private readonly REQUEST_BUFFER_SIZE = 3600; // 1 hour of seconds
  private requestBuffer: {
    timestamp: number;
    count: number;
    methods: Record<string, number>;
    statuses: Record<string, number>;
  }[] = [];

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
    @InjectModel(AuditLog.name) private auditModel: Model<AuditLogDocument>,
  ) {}

  // ─── Request Tracking (called from middleware) ───

  trackRequest(method: string, statusCode: number) {
    const now = Math.floor(Date.now() / 1000);
    const last = this.requestBuffer[this.requestBuffer.length - 1];

    if (last && last.timestamp === now) {
      last.count++;
      last.methods[method] = (last.methods[method] || 0) + 1;
      const statusBucket = `${Math.floor(statusCode / 100)}xx`;
      last.statuses[statusBucket] = (last.statuses[statusBucket] || 0) + 1;
    } else {
      const statusBucket = `${Math.floor(statusCode / 100)}xx`;
      this.requestBuffer.push({
        timestamp: now,
        count: 1,
        methods: { [method]: 1 },
        statuses: { [statusBucket]: 1 },
      });
      // Trim buffer
      if (this.requestBuffer.length > this.REQUEST_BUFFER_SIZE) {
        this.requestBuffer.shift();
      }
    }
  }

  // ─── Request Dynamics (trading-chart style) ───

  getRequestDynamics(seconds = 300): {
    dataPoints: {
      timestamp: number;
      count: number;
      methods: Record<string, number>;
      statuses: Record<string, number>;
    }[];
    summary: {
      totalRequests: number;
      avgRps: number;
      peakRps: number;
      currentRps: number;
      methodBreakdown: Record<string, number>;
      statusBreakdown: Record<string, number>;
    };
  } {
    const cutoff = Math.floor(Date.now() / 1000) - seconds;
    const dataPoints = this.requestBuffer.filter((p) => p.timestamp >= cutoff);

    const totalRequests = dataPoints.reduce((sum, p) => sum + p.count, 0);
    const peakRps = dataPoints.length
      ? Math.max(...dataPoints.map((p) => p.count))
      : 0;

    // Current RPS = average of last 5 seconds
    const last5 = Math.floor(Date.now() / 1000) - 5;
    const recent = dataPoints.filter((p) => p.timestamp >= last5);
    const currentRps = recent.length
      ? recent.reduce((s, p) => s + p.count, 0) / 5
      : 0;

    const methodBreakdown: Record<string, number> = {};
    const statusBreakdown: Record<string, number> = {};
    dataPoints.forEach((p) => {
      Object.entries(p.methods).forEach(([m, c]) => {
        methodBreakdown[m] = (methodBreakdown[m] || 0) + c;
      });
      Object.entries(p.statuses).forEach(([s, c]) => {
        statusBreakdown[s] = (statusBreakdown[s] || 0) + c;
      });
    });

    return {
      dataPoints,
      summary: {
        totalRequests,
        avgRps: seconds > 0 ? totalRequests / seconds : 0,
        peakRps,
        currentRps: Math.round(currentRps * 100) / 100,
        methodBreakdown,
        statusBreakdown,
      },
    };
  }

  // ─── Registration Stats ───

  async getRegistrationStats(): Promise<{
    total: number;
    verified: number;
    unverified: number;
    withPassword: number;
    googleOnly: number;
    verificationRate: number;
    last24h: number;
    last7d: number;
    last30d: number;
  }> {
    const now = new Date();
    const d24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const d7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const d30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      total,
      verified,
      withPassword,
      googleOnly,
      last24h,
      last7d,
      last30d,
    ] = await Promise.all([
      this.userModel.countDocuments(),
      this.userModel.countDocuments({ isEmailVerified: true }),
      this.userModel.countDocuments({
        password: { $exists: true, $ne: null },
      }),
      this.userModel.countDocuments({
        googleId: { $exists: true, $ne: null },
        password: { $exists: false },
      }),
      this.userModel.countDocuments({ createdAt: { $gte: d24h } }),
      this.userModel.countDocuments({ createdAt: { $gte: d7d } }),
      this.userModel.countDocuments({ createdAt: { $gte: d30d } }),
    ]);

    const unverified = total - verified;
    const verificationRate = total > 0 ? (verified / total) * 100 : 0;

    return {
      total,
      verified,
      unverified,
      withPassword,
      googleOnly,
      verificationRate: Math.round(verificationRate * 10) / 10,
      last24h,
      last7d,
      last30d,
    };
  }

  // ─── User Joining Dynamics (hourly breakdown for last 7 days) ───

  async getUserJoiningDynamics(days = 7): Promise<{
    daily: { date: string; count: number }[];
    hourly: { hour: string; count: number }[];
    cumulative: { date: string; total: number }[];
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Daily aggregation
    const dailyPipeline = [
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 as const } },
    ];

    // Hourly aggregation (last 48 hours)
    const hourlyStart = new Date();
    hourlyStart.setHours(hourlyStart.getHours() - 48);
    const hourlyPipeline = [
      { $match: { createdAt: { $gte: hourlyStart } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%dT%H:00',
              date: '$createdAt',
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 as const } },
    ];

    const [dailyRaw, hourlyRaw] = await Promise.all([
      this.userModel.aggregate(dailyPipeline),
      this.userModel.aggregate(hourlyPipeline),
    ]);

    const daily = dailyRaw.map((d: any) => ({
      date: d._id,
      count: d.count,
    }));
    const hourly = hourlyRaw.map((h: any) => ({
      hour: h._id,
      count: h.count,
    }));

    // Build cumulative
    let runningTotal = 0;
    const totalBeforeRange = await this.userModel.countDocuments({
      createdAt: { $lt: startDate },
    });
    runningTotal = totalBeforeRange;
    const cumulative = daily.map((d) => {
      runningTotal += d.count;
      return { date: d.date, total: runningTotal };
    });

    return { daily, hourly, cumulative };
  }

  // ─── Active Sessions Count ───

  async getActiveSessionsCount(): Promise<number> {
    return this.sessionModel.countDocuments({
      isActive: true,
      expiresAt: { $gt: new Date() },
    });
  }

  // ─── Live Stats Snapshot (for WebSocket push) ───

  async getLiveSnapshot(): Promise<{
    activeSessions: number;
    registrationStats: {
      total: number;
      verified: number;
      unverified: number;
      last24h: number;
    };
    requestDynamics: ReturnType<typeof this.getRequestDynamics>;
  }> {
    const [activeSessions, regStats] = await Promise.all([
      this.getActiveSessionsCount(),
      this.getRegistrationStats(),
    ]);

    return {
      activeSessions,
      registrationStats: {
        total: regStats.total,
        verified: regStats.verified,
        unverified: regStats.unverified,
        last24h: regStats.last24h,
      },
      requestDynamics: this.getRequestDynamics(300),
    };
  }
}
