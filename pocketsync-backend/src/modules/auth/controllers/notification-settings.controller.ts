import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { NotificationSettingsService } from '../services/notification-settings.service';
import { NotificationSettingsDto } from '../dto/notification-settings.dto';
import { User } from '../decorators/user.decorator';

@ApiTags('notification-settings')
@Controller('notification-settings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationSettingsController {
  constructor(private readonly notificationSettingsService: NotificationSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notification settings' })
  @ApiResponse({ status: 200, type: NotificationSettingsDto })
  async getSettings(@User('id') userId: string) {
    return this.notificationSettingsService.getNotificationSettings(userId);
  }

  @Put()
  @ApiOperation({ summary: 'Update user notification settings' })
  @ApiResponse({ status: 200, type: NotificationSettingsDto })
  async updateSettings(
    @User('id') userId: string,
    @Body() dto: NotificationSettingsDto,
  ) {
    return this.notificationSettingsService.updateNotificationSettings(userId, dto);
  }
}