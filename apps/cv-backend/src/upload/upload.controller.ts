import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import 'multer';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse');
import * as mammoth from 'mammoth';

@Controller('api/upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed'), false);
        }
      },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.uploadFile(file, 'images');
  }

  @Post('images')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed'), false);
        }
      },
    }),
  )
  async uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
    return this.uploadService.uploadMultipleFiles(files, 'images');
  }

  @Post('document')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadDocument(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.uploadFile(file, 'documents');
  }

  @Post('parse-cv')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (
          file.mimetype.match(
            /\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document|plain)$/,
          )
        ) {
          cb(null, true);
        } else {
          cb(
            new Error('Only PDF, DOC, DOCX, and TXT files are allowed'),
            false,
          );
        }
      },
    }),
  )
  async parseCvFile(@UploadedFile() file: Express.Multer.File) {
    const logger = new Logger('ParseCV');
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    let text = '';

    try {
      if (file.mimetype === 'text/plain') {
        // Plain text files
        text = file.buffer.toString('utf-8');
      } else if (file.mimetype === 'application/pdf') {
        // PDF — use pdf-parse for proper text extraction
        const pdfData = await pdfParse(file.buffer);
        text = pdfData.text || '';
      } else if (
        file.mimetype ===
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.mimetype === 'application/msword'
      ) {
        // DOCX — use mammoth for text extraction
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        text = result.value || '';
      } else {
        // Fallback for other types
        text = file.buffer.toString('utf-8');
      }
    } catch (err) {
      logger.error(`File parsing failed for ${file.mimetype}: ${err.message}`);
      throw new BadRequestException(
        'Could not parse this file. Please try a different format or paste the content manually.',
      );
    }

    // Clean up whitespace
    text = text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (!text || text.length < 20) {
      throw new BadRequestException(
        'Could not extract text from this file. Please paste the content manually.',
      );
    }

    logger.log(
      `Parsed ${file.mimetype} — extracted ${text.length} chars of text`,
    );
    return { text: text.substring(0, 15000) };
  }
}
