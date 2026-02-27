import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TemplatesService } from './templates.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { CreateTemplateDto, UpdateTemplateDto } from './dto/template.dto.js';

@Controller('api/templates')
export class TemplatesController {
  constructor(private templatesService: TemplatesService) {}

  // Public: List active templates (filtered by user's plan)
  @Get()
  async findAll(
    @Query('category') category?: string,
    @Query('isPremium') isPremium?: string,
  ) {
    return this.templatesService.findAll({
      category,
      isPremium: isPremium ? isPremium === 'true' : undefined,
    });
  }

  // Public: Get template by slug
  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.templatesService.findBySlug(slug);
  }

  // Authenticated: Get templates for user's plan
  @Get('my-plan')
  @UseGuards(JwtAuthGuard)
  async findForMyPlan(@CurrentUser() user: any) {
    // Default to free if no subscription info
    const plan = user.subscriptionPlan || 'free';
    return this.templatesService.findByPlan(plan);
  }

  // Public: Get template by ID
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.templatesService.findById(id);
  }

  // Admin: Create template
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async create(@Body() dto: CreateTemplateDto) {
    return this.templatesService.create(dto);
  }

  // Admin: Update template
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.templatesService.update(id, dto);
  }

  // Admin: Delete template
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async delete(@Param('id') id: string) {
    return this.templatesService.delete(id);
  }

  // Admin: List all with pagination
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async findAllAdmin(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.templatesService.findAllAdmin(
      Number(page) || 1,
      Number(limit) || 20,
    );
  }
}
