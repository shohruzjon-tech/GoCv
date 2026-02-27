import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { SessionsModule } from './sessions/sessions.module.js';
import { CvModule } from './cv/cv.module.js';
import { AiModule } from './ai/ai.module.js';
import { ProjectsModule } from './projects/projects.module.js';
import { UploadModule } from './upload/upload.module.js';
import { PdfModule } from './pdf/pdf.module.js';
import { AdminModule } from './admin/admin.module.js';
import { TemplatesModule } from './templates/templates.module.js';
import { SubscriptionsModule } from './subscriptions/subscriptions.module.js';
import { AiUsageModule } from './ai-usage/ai-usage.module.js';
import { AuditModule } from './audit/audit.module.js';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { StripeModule } from './stripe/stripe.module.js';
import { OrganizationsModule } from './organizations/organizations.module.js';
import { AiOrchestratorModule } from './ai/orchestrator/ai-orchestrator.module.js';
import { QueueModule } from './queue/queue.module.js';
import { SiteSettingsModule } from './site-settings/site-settings.module.js';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware.js';
import { TenantMiddleware } from './common/middleware/tenant.middleware.js';
import { SecurityHeadersMiddleware } from './common/middleware/security-headers.middleware.js';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 5 },
      { name: 'medium', ttl: 10000, limit: 30 },
      { name: 'long', ttl: 60000, limit: 100 },
    ]),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('mongodb.uri'),
      }),
    }),

    // ── Core Infrastructure ──
    AuditModule,
    AiOrchestratorModule,
    QueueModule,

    // ── Auth & Users ──
    StripeModule,
    AuthModule,
    UsersModule,
    SessionsModule,

    // ── Business Logic ──
    CvModule,
    AiModule,
    AiUsageModule,
    ProjectsModule,
    UploadModule,
    PdfModule,
    TemplatesModule,
    SubscriptionsModule,

    // ── Enterprise ──
    OrganizationsModule,

    // ── Platform ──
    AdminModule,
    FeatureFlagsModule,
    NotificationsModule,
    SiteSettingsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        CorrelationIdMiddleware,
        SecurityHeadersMiddleware,
        RequestLoggerMiddleware,
        TenantMiddleware,
      )
      .forRoutes('*');
  }
}
