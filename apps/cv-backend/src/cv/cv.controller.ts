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

  // ─── Versioning Endpoints ───

  @Get(':id/versions')
  @UseGuards(JwtAuthGuard)
  async getVersions(
    @Param('id') id: string,
    @CurrentUser('_id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.cvVersionService.getVersions(
      id,
      userId,
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  @Get(':id/versions/:version')
  @UseGuards(JwtAuthGuard)
  async getVersion(
    @Param('id') id: string,
    @Param('version') version: string,
    @CurrentUser('_id') userId: string,
  ) {
    return this.cvVersionService.getVersion(id, parseInt(version), userId);
  }

  @Post(':id/versions/:version/restore')
  @UseGuards(JwtAuthGuard)
  async restoreVersion(
    @Param('id') id: string,
    @Param('version') version: string,
    @CurrentUser('_id') userId: string,
  ) {
    return this.cvVersionService.restoreVersion(id, parseInt(version), userId);
  }

  @Post(':id/versions/snapshot')
  @UseGuards(JwtAuthGuard)
  async createSnapshot(
    @Param('id') id: string,
    @CurrentUser('_id') userId: string,
    @Body() body: { label?: string; description?: string },
  ) {
    return this.cvVersionService.createVersion(
      id,
      userId,
      'manual',
      body.description,
      body.label,
    );
  }

  @Post(':id/branches')
  @UseGuards(JwtAuthGuard)
  async createBranch(
    @Param('id') id: string,
    @CurrentUser('_id') userId: string,
    @Body('name') name: string,
  ) {
    return this.cvVersionService.createBranch(id, userId, name);
  }

  @Get(':id/branches')
  @UseGuards(JwtAuthGuard)
  async getBranches(
    @Param('id') id: string,
    @CurrentUser('_id') userId: string,
  ) {
    return this.cvVersionService.getBranches(id, userId);
  }

  @Get(':id/versions/compare')
  @UseGuards(JwtAuthGuard)
  async compareVersions(
    @Param('id') id: string,
    @Query('a') versionA: string,
    @Query('b') versionB: string,
    @CurrentUser('_id') userId: string,
  ) {
    return this.cvVersionService.compareVersions(
      id,
      parseInt(versionA),
      parseInt(versionB),
      userId,
    );
  }
}
