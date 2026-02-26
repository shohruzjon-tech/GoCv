import { Module } from '@nestjs/common';
import { AdminService } from './admin.service.js';
import { AdminController } from './admin.controller.js';
import { UsersModule } from '../users/users.module.js';
import { SessionsModule } from '../sessions/sessions.module.js';
import { CvModule } from '../cv/cv.module.js';

@Module({
  imports: [UsersModule, SessionsModule, CvModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
