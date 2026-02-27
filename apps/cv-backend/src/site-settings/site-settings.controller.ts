import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { SiteSettingsService } from './site-settings.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '../common/enums/role.enum.js';

@Controller('api/site-settings')
export class SiteSettingsController {
  constructor(private siteSettingsService: SiteSettingsService) {}

  // Public endpoint — anyone can read creator info
  @Get('creator')
  async getCreatorInfo() {
    return this.siteSettingsService.getCreatorInfo();
  }

  // Admin-only: get full settings
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getSettings() {
    return this.siteSettingsService.get();
  }

  // Admin-only: update settings
  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateSettings(@Body() data: any) {
    return this.siteSettingsService.update(data);
  }
}
