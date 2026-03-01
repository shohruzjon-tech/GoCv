import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminService } from './admin.service.js';
import { AdminController } from './admin.controller.js';
import { AdminAnalyticsService } from './admin-analytics.service.js';
import { AdminDashboardGateway } from './admin-dashboard.gateway.js';
import { UsersModule } from '../users/users.module.js';
import { SessionsModule } from '../sessions/sessions.module.js';
import { CvModule } from '../cv/cv.module.js';
import { TemplatesModule } from '../templates/templates.module.js';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module.js';
import { AiUsageModule } from '../ai-usage/ai-usage.module.js';
import { FeatureFlagsModule } from '../feature-flags/feature-flags.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { User, UserSchema } from '../users/schemas/user.schema.js';
import { Session, SessionSchema } from '../sessions/schemas/session.schema.js';
import { AuditLog, AuditLogSchema } from '../audit/schemas/audit-log.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Session.name, schema: SessionSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret') || 'jwt-secret-dev',
      }),
    }),
    UsersModule,
    SessionsModule,
    CvModule,
    TemplatesModule,
    SubscriptionsModule,
    AiUsageModule,
    FeatureFlagsModule,
    NotificationsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminAnalyticsService, AdminDashboardGateway],
  exports: [AdminAnalyticsService, AdminDashboardGateway],
})
export class AdminModule {}
