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
import { AdminService } from './admin.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '../common/enums/role.enum.js';

@Controller('api/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private adminService: AdminService) {}

  // Dashboard
  @Get('dashboard')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // Users
  @Get('users')
  async getUsers(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getUsers(Number(page) || 1, Number(limit) || 20);
  }

  @Get('users/:id')
  async getUser(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Put('users/:id/toggle-active')
  async toggleUserActive(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.adminService.toggleUserActive(id, isActive);
  }

  @Put('users/:id/role')
  async changeUserRole(@Param('id') id: string, @Body('role') role: Role) {
    return this.adminService.changeUserRole(id, role);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  // Sessions
  @Get('sessions')
  async getSessions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getSessions(
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  @Get('sessions/user/:userId')
  async getUserSessions(@Param('userId') userId: string) {
    return this.adminService.getUserSessions(userId);
  }

  @Delete('sessions/:id')
  async terminateSession(@Param('id') id: string) {
    return this.adminService.terminateSession(id);
  }

  @Delete('sessions/user/:userId')
  async terminateAllUserSessions(@Param('userId') userId: string) {
    return this.adminService.terminateAllUserSessions(userId);
  }

  // CVs
  @Get('cvs')
  async getAllCvs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getAllCvs(Number(page) || 1, Number(limit) || 20);
  }
}
