import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Query,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProjectsService } from './projects.service.js';
import 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto.js';

@Controller('api/projects')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  // Public route - get projects by CV
  @Get('cv/:cvId')
  async findByCv(@Param('cvId') cvId: string) {
    return this.projectsService.findByCv(cvId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUser('_id') userId: string,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectsService.create(userId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@CurrentUser('_id') userId: string) {
    return this.projectsService.findAllByUser(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    return this.projectsService.findById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @CurrentUser('_id') userId: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, userId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @CurrentUser('_id') userId: string) {
    return this.projectsService.delete(id, userId);
  }

  @Post(':id/images')
  @UseGuards(JwtAuthGuard)
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
  async addImages(
    @Param('id') id: string,
    @CurrentUser('_id') userId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.projectsService.addImages(id, userId, files);
  }

  @Delete(':id/images/:imageIndex')
  @UseGuards(JwtAuthGuard)
  async removeImage(
    @Param('id') id: string,
    @CurrentUser('_id') userId: string,
    @Param('imageIndex') imageIndex: string,
  ) {
    return this.projectsService.removeImage(id, userId, parseInt(imageIndex));
  }

  @Put(':id/images/reorder')
  @UseGuards(JwtAuthGuard)
  async reorderImages(
    @Param('id') id: string,
    @CurrentUser('_id') userId: string,
    @Body('order') order: number[],
  ) {
    return this.projectsService.reorderImages(id, userId, order);
  }
}
