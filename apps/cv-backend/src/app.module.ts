import { Module } from '@nestjs/common';
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
    AuditModule,
    StripeModule,
    AuthModule,
    UsersModule,
    SessionsModule,
    CvModule,
    AiModule,
    AiUsageModule,
    ProjectsModule,
    UploadModule,
    PdfModule,
    AdminModule,
    TemplatesModule,
    SubscriptionsModule,
    FeatureFlagsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
