import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CvService } from './cv.service.js';
import { CvController } from './cv.controller.js';
import { Cv, CvSchema } from './schemas/cv.schema.js';
import { AiModule } from '../ai/ai.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Cv.name, schema: CvSchema }]),
    AiModule,
    NotificationsModule,
  ],
  controllers: [CvController],
  providers: [CvService],
  exports: [CvService],
})
export class CvModule {}
