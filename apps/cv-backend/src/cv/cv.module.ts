import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CvService } from './cv.service.js';
import { CvVersionService } from './cv-version.service.js';
import { CvController } from './cv.controller.js';
import { Cv, CvSchema } from './schemas/cv.schema.js';
import { CvVersion, CvVersionSchema } from './schemas/cv-version.schema.js';
import { AiModule } from '../ai/ai.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cv.name, schema: CvSchema },
      { name: CvVersion.name, schema: CvVersionSchema },
    ]),
    AiModule,
    NotificationsModule,
  ],
  controllers: [CvController],
  providers: [CvService, CvVersionService],
  exports: [CvService, CvVersionService],
})
export class CvModule {}
