import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { AdminAnalyticsService } from './admin-analytics.service.js';

/**
 * Admin Dashboard WebSocket Gateway
 *
 * Provides real-time push of:
 *  - Online admin count
 *  - Live user count / active sessions
 *  - Request dynamics (trading-chart data every 2s)
 *  - Registration stats (every 10s)
 *  - User joining dynamics (every 30s)
 *
 * Only admins can connect (JWT verified, role === 'admin').
 */
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:4001',
    credentials: true,
  },
  namespace: '/admin-dashboard',
})
export class AdminDashboardGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AdminDashboardGateway.name);
  private connectedAdmins = new Map<string, Set<string>>();

  // Push intervals
  private fastInterval: NodeJS.Timeout | null = null; // 2s — request dynamics
  private mediumInterval: NodeJS.Timeout | null = null; // 10s — live stats
  private slowInterval: NodeJS.Timeout | null = null; // 30s — joining dynamics

  constructor(
    private jwtService: JwtService,
    private analyticsService: AdminAnalyticsService,
  ) {}

  afterInit() {
    this.logger.log('Admin Dashboard Gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      if (payload.role !== 'admin') {
        client.disconnect();
        return;
      }

      const userId = payload.sub;
      client.data.userId = userId;
      client.join('admin-room');

      const existing = this.connectedAdmins.get(userId) || new Set();
      existing.add(client.id);
      this.connectedAdmins.set(userId, existing);

      this.logger.log(`Admin connected: ${userId} (${client.id})`);

      // Start broadcasting if first admin connected
      if (this.getTotalConnections() === 1) {
        this.startBroadcasting();
      }

      // Emit initial snapshot immediately
      await this.emitFullSnapshot(client);

      // Emit online admin count
      this.emitAdminCount();
    } catch (err) {
      this.logger.warn(`Admin WS auth failed: ${(err as Error).message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (userId) {
      const sockets = this.connectedAdmins.get(userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) this.connectedAdmins.delete(userId);
      }
      this.logger.log(`Admin disconnected: ${userId} (${client.id})`);

      // Stop broadcasting if no admins connected
      if (this.getTotalConnections() === 0) {
        this.stopBroadcasting();
      }

      this.emitAdminCount();
    }
  }

  // ─── Broadcasting Logic ───

  private startBroadcasting() {
    this.logger.log('Starting admin dashboard broadcasting');

    // Fast: request dynamics every 2 seconds
    this.fastInterval = setInterval(() => {
      const dynamics = this.analyticsService.getRequestDynamics(300);
      this.server.to('admin-room').emit('request-dynamics', dynamics);
    }, 2000);

    // Medium: live stats every 10 seconds
    this.mediumInterval = setInterval(async () => {
      try {
        const snapshot = await this.analyticsService.getLiveSnapshot();
        this.server.to('admin-room').emit('live-stats', snapshot);
      } catch (err) {
        this.logger.error('Failed to emit live stats', (err as Error).stack);
      }
    }, 10000);

    // Slow: user joining dynamics every 30 seconds
    this.slowInterval = setInterval(async () => {
      try {
        const dynamics = await this.analyticsService.getUserJoiningDynamics(7);
        this.server.to('admin-room').emit('joining-dynamics', dynamics);
      } catch (err) {
        this.logger.error(
          'Failed to emit joining dynamics',
          (err as Error).stack,
        );
      }
    }, 30000);
  }

  private stopBroadcasting() {
    this.logger.log('Stopping admin dashboard broadcasting');
    if (this.fastInterval) clearInterval(this.fastInterval);
    if (this.mediumInterval) clearInterval(this.mediumInterval);
    if (this.slowInterval) clearInterval(this.slowInterval);
    this.fastInterval = null;
    this.mediumInterval = null;
    this.slowInterval = null;
  }

  // ─── Helpers ───

  private async emitFullSnapshot(client: Socket) {
    try {
      const [snapshot, joiningDynamics, regStats] = await Promise.all([
        this.analyticsService.getLiveSnapshot(),
        this.analyticsService.getUserJoiningDynamics(7),
        this.analyticsService.getRegistrationStats(),
      ]);

      client.emit('live-stats', snapshot);
      client.emit('joining-dynamics', joiningDynamics);
      client.emit('registration-stats', regStats);
      client.emit('request-dynamics', snapshot.requestDynamics);
    } catch (err) {
      this.logger.error(
        'Failed to emit initial snapshot',
        (err as Error).stack,
      );
    }
  }

  private emitAdminCount() {
    this.server
      .to('admin-room')
      .emit('admin-count', this.getTotalConnections());
  }

  private getTotalConnections(): number {
    let count = 0;
    this.connectedAdmins.forEach((sockets) => {
      count += sockets.size;
    });
    return count;
  }

  // ─── Public: notify new request (called from middleware) ───

  notifyRequest(method: string, statusCode: number) {
    this.analyticsService.trackRequest(method, statusCode);
  }
}
