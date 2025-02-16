import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationSettingsDto } from '../dto/notification-settings.dto';

@Injectable()
export class NotificationSettingsService {
  constructor(private prisma: PrismaService) {}

  async getNotificationSettings(userId: string) {
    const settings = await this.prisma.notificationSettings.findUnique({
      where: { userId }
    });

    if (!settings) {
      // Create default settings if they don't exist
      return this.prisma.notificationSettings.create({
        data: {
          userId,
          marketingEnabled: true,
          emailEnabled: true
        }
      });
    }

    return settings;
  }

  async updateNotificationSettings(userId: string, dto: NotificationSettingsDto) {
    return this.prisma.notificationSettings.upsert({
      where: { userId },
      create: {
        userId,
        marketingEnabled: dto.marketingEnabled,
        emailEnabled: dto.emailEnabled
      },
      update: {
        marketingEnabled: dto.marketingEnabled,
        emailEnabled: dto.emailEnabled
      }
    });
  }
}