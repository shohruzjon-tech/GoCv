import { Module } from '@nestjs/common';
import { PdfService } from './pdf.service.js';
import { PdfController } from './pdf.controller.js';
import { CvModule } from '../cv/cv.module.js';

@Module({
  imports: [CvModule],
  controllers: [PdfController],
  providers: [PdfService],
  exports: [PdfService],
})
export class PdfModule {}
