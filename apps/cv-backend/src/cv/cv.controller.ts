import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { CvService } from './cv.service.js';
import { CvVersionService } from './cv-version.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import {
  CreateCvDto,
  UpdateCvDto,
  AiGenerateCvDto,
  AiEditSectionDto,
} from './dto/cv.dto.js';

@Controller('api/cv')
export class CvController {
  constructor(
    private cvService: CvService,
    private cvVersionService: CvVersionService,
  ) {}

  // Public route - view published CVs
  @Get('public/:slug')
  async getPublicCv(@Param('slug') slug: string) {
    return this.cvService.getPublicCv(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@CurrentUser('_id') userId: string, @Body() dto: CreateCvDto) {
    return this.cvService.create(userId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@CurrentUser('_id') userId: string) {
    return this.cvService.findAllByUser(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    return this.cvService.findById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @CurrentUser('_id') userId: string,
    @Body() dto: UpdateCvDto,
  ) {
    return this.cvService.update(id, userId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @CurrentUser('_id') userId: string) {
    return this.cvService.delete(id, userId);
  }

  // AI-powered endpoints
  @Post('ai/generate')
  @UseGuards(JwtAuthGuard)
  async generateWithAi(
    @CurrentUser('_id') userId: string,
    @Body() dto: AiGenerateCvDto,
  ) {
    return this.cvService.generateWithAi(userId, dto);
  }

  @Post(':id/ai/edit-section')
  @UseGuards(JwtAuthGuard)
  async editSectionWithAi(
    @Param('id') id: string,
    @CurrentUser('_id') userId: string,
    @Body() dto: AiEditSectionDto,
  ) {
    return this.cvService.editSectionWithAi(id, userId, dto);
  }

  @Post(':id/ai/regenerate-html')
  @UseGuards(JwtAuthGuard)
  async regenerateHtml(
    @Param('id') id: string,
    @CurrentUser('_id') userId: string,
  ) {
    return this.cvService.regenerateHtml(id, userId);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard)
  async publish(@Param('id') id: string, @CurrentUser('_id') userId: string) {
    return this.cvService.publish(id, userId);
  }
}
