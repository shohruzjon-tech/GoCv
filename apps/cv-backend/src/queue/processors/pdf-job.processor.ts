import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QueueName, JobType } from '../../common/enums/job-status.enum.js';
import { PdfJobData } from '../queue-manager.service.js';

@Processor(QueueName.PDF_GENERATION, {
  concurrency: 3,
  limiter: { max: 10, duration: 60000 },
})
export class PdfJobProcessor extends WorkerHost {
  private readonly logger = new Logger(PdfJobProcessor.name);

  async process(job: Job<PdfJobData>): Promise<any> {
    const { userId, cvId, templateId, format } = job.data;

    this.logger.log(
      `Processing PDF job ${job.id} for CV ${cvId} (attempt ${job.attemptsMade + 1})`,
    );

    try {
      await job.updateProgress(10);

      // Dynamic import puppeteer to avoid loading it on every worker init
      const puppeteer = await import('puppeteer');

      await job.updateProgress(30);

      const browser = await puppeteer.default.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
        ],
      });

      try {
        const page = await browser.newPage();

        // Fetch CV HTML from the API or render it
        const html =
          job.data.payload?.html || '<html><body>No content</body></html>';

        await page.setContent(html, { waitUntil: 'networkidle0' });

        await job.updateProgress(60);

        const pdfBuffer = await page.pdf({
          format: format === 'letter' ? 'Letter' : 'A4',
          printBackground: true,
          margin: {
            top: '0.5in',
            right: '0.5in',
            bottom: '0.5in',
            left: '0.5in',
          },
        });

        await job.updateProgress(90);

        this.logger.log(
          `PDF job ${job.id} completed: ${pdfBuffer.length} bytes`,
        );

        return {
          size: pdfBuffer.length,
          format: format || 'a4',
          generatedAt: new Date().toISOString(),
          // In production, upload to S3 and return URL
          // url: await this.uploadToS3(pdfBuffer, `${cvId}.pdf`),
        };
      } finally {
        await browser.close();
      }
    } catch (error: any) {
      this.logger.error(`PDF job ${job.id} failed: ${error.message}`);
      throw error;
    }
  }
}
