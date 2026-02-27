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
import { FeatureFlagsService } from './feature-flags.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('api/feature-flags')
export class FeatureFlagsController {
  constructor(private featureFlagsService: FeatureFlagsService) {}

  // Check if a feature is enabled for current user
  @Get('check/:key')
  @UseGuards(JwtAuthGuard)
  async checkFlag(@Param('key') key: string, @CurrentUser() user: any) {
    const enabled = await this.featureFlagsService.isEnabled(
      key,
      user._id?.toString(),
      user.subscriptionPlan,
    );
    return { key, enabled };
  }

  // Get all flags (for client-side feature gating)
  @Get('client')
  @UseGuards(JwtAuthGuard)
  async getClientFlags(@CurrentUser() user: any) {
    const allFlags = await this.featureFlagsService.getAll();
    const result: Record<string, boolean> = {};

    for (const flag of allFlags) {
      result[flag.key] = await this.featureFlagsService.isEnabled(
        flag.key,
        user._id?.toString(),
        user.subscriptionPlan,
      );
    }

    return result;
  }

  // Admin endpoints
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getAll() {
    return this.featureFlagsService.getAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async create(@Body() data: any) {
    return this.featureFlagsService.create(data);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async update(@Param('id') id: string, @Body() data: any) {
    return this.featureFlagsService.update(id, data);
  }

  @Put(':id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async toggle(@Param('id') id: string) {
    return this.featureFlagsService.toggle(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async delete(@Param('id') id: string) {
    return this.featureFlagsService.delete(id);
  }
}
