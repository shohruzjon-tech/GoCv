import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { PdfService } from './pdf.service.js';
import { CvService } from '../cv/cv.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('api/pdf')
export class PdfController {
  constructor(
    private pdfService: PdfService,
    private cvService: CvService,
  ) {}

  @Get(':cvId')
  @UseGuards(JwtAuthGuard)
  async downloadPdf(
    @Param('cvId') cvId: string,
    @CurrentUser('_id') userId: string,
    @Res() res: Response,
  ) {
    const cv = await this.cvService.findById(cvId);

    if (!cv.aiGeneratedHtml) {
      return res.status(400).json({
        message: 'CV HTML not generated yet. Please generate it first.',
      });
    }

    const pdfBuffer = await this.pdfService.generatePdfFromHtml(
      cv.aiGeneratedHtml,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${cv.title || 'cv'}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }
}
