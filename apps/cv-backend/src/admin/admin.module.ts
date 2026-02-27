import { Module } from '@nestjs/common';
import { AdminService } from './admin.service.js';
import { AdminController } from './admin.controller.js';
import { UsersModule } from '../users/users.module.js';
import { SessionsModule } from '../sessions/sessions.module.js';
import { CvModule } from '../cv/cv.module.js';
import { TemplatesModule } from '../templates/templates.module.js';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module.js';
import { AiUsageModule } from '../ai-usage/ai-usage.module.js';
import { FeatureFlagsModule } from '../feature-flags/feature-flags.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [
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
  providers: [AdminService],
})
export class AdminModule {}
