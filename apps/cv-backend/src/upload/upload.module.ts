import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { UploadService } from './upload.service.js';
import { UploadController } from './upload.controller.js';

@Module({
  imports: [
    MulterModule.register({
      storage: undefined, // Use memory storage
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
