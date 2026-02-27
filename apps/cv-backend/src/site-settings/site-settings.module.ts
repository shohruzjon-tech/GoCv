import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SiteSettingsController } from './site-settings.controller.js';
import { SiteSettingsService } from './site-settings.service.js';
import {
  SiteSettings,
  SiteSettingsSchema,
} from './schemas/site-settings.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SiteSettings.name, schema: SiteSettingsSchema },
    ]),
  ],
  controllers: [SiteSettingsController],
  providers: [SiteSettingsService],
  exports: [SiteSettingsService],
})
export class SiteSettingsModule {}
