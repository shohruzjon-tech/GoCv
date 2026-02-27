import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('api/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  async getAll(
    @CurrentUser('_id') userId: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return this.notificationsService.findByUser(userId, unreadOnly === 'true');
  }

  @Get('count')
  async getUnreadCount(@CurrentUser('_id') userId: string) {
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  @Put(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser('_id') userId: string,
  ) {
    await this.notificationsService.markAsRead(id, userId);
    return { success: true };
  }

  @Put('read-all')
  async markAllAsRead(@CurrentUser('_id') userId: string) {
    await this.notificationsService.markAllAsRead(userId);
    return { success: true };
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser('_id') userId: string) {
    await this.notificationsService.delete(id, userId);
    return { success: true };
  }
}
