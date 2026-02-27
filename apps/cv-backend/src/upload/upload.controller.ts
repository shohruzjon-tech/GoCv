import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import 'multer';

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
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    // Extract text content from the file buffer
    let text = '';
    if (
      file.mimetype === 'text/plain' ||
      file.mimetype === 'application/octet-stream'
    ) {
      text = file.buffer.toString('utf-8');
    } else {
      // For PDF/DOC, extract readable text from the buffer
      // Convert buffer to string, stripping binary noise
      const raw = file.buffer.toString('utf-8');
      // Extract text-like sequences (basic extraction for PDF text layer)
      text = raw
        .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
        .replace(/\s{3,}/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    }

    if (!text || text.length < 20) {
      throw new BadRequestException(
        'Could not extract text from this file. Please paste the content manually.',
      );
    }
    return { text: text.substring(0, 15000) };
  }
}
