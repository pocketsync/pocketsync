import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DeviceDto } from './dto/device.dto';
import { SyncStatus } from '@prisma/client';

@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get a device by ID and user identifier
   */
  async getDevice(deviceId: string, userIdentifier: string): Promise<DeviceDto> {
    const device = await this.prisma.device.findUnique({
      where: {
        deviceId_userIdentifier: {
          deviceId,
          userIdentifier
        }
      }
    });

    if (!device) {
      throw new NotFoundException(`Device with ID ${deviceId} for user ${userIdentifier} not found`);
    }

    return this.mapToDto(device);
  }

  /**
   * Get devices for a specific user
   */
  async getDevicesByUser(
    userIdentifier: string,
    includeDeleted = false,
    limit = 50,
    offset = 0
  ): Promise<{ devices: DeviceDto[]; total: number }> {
    const where: any = {
      userIdentifier,
      ...!includeDeleted && { deletedAt: null }
    };

    const [devices, total] = await Promise.all([
      this.prisma.device.findMany({
        where,
        orderBy: {
          lastSeenAt: 'desc'
        },
        skip: offset,
        take: limit
      }),
      this.prisma.device.count({ where })
    ]);

    return {
      devices: devices.map(device => this.mapToDto(device)),
      total
    };
  }

  /**
   * Get devices for a specific project
   */
  async getDevicesByProject(
    projectId: string,
    includeDeleted = false,
    limit = 50,
    offset = 0
  ): Promise<{ devices: DeviceDto[]; total: number }> {
    // First get all app users for this project
    const appUsers = await this.prisma.appUser.findMany({
      where: { 
        projectId,
        ...!includeDeleted && { deletedAt: null }
      }
    });

    const userIdentifiers = appUsers.map(user => user.userIdentifier);

    // Then get devices for these users
    const where: any = {
      userIdentifier: {
        in: userIdentifiers
      },
      ...!includeDeleted && { deletedAt: null }
    };

    const [devices, total] = await Promise.all([
      this.prisma.device.findMany({
        where,
        orderBy: {
          lastSeenAt: 'desc'
        },
        skip: offset,
        take: limit
      }),
      this.prisma.device.count({ where })
    ]);

    return {
      devices: devices.map(device => this.mapToDto(device)),
      total
    };
  }

  /**
   * Update device information
   */
  async updateDeviceInfo(
    deviceId: string,
    userIdentifier: string,
    deviceInfo: Record<string, any>
  ): Promise<DeviceDto> {
    const device = await this.prisma.device.update({
      where: {
        deviceId_userIdentifier: {
          deviceId,
          userIdentifier
        }
      },
      data: {
        deviceInfo,
        lastSeenAt: new Date()
      }
    });

    return this.mapToDto(device);
  }

  /**
   * Update device last seen timestamp
   */
  async updateLastSeen(deviceId: string, userIdentifier: string): Promise<DeviceDto> {
    const device = await this.prisma.device.update({
      where: {
        deviceId_userIdentifier: {
          deviceId,
          userIdentifier
        }
      },
      data: {
        lastSeenAt: new Date()
      }
    });

    return this.mapToDto(device);
  }

  /**
   * Update device sync status
   */
  async updateSyncStatus(
    deviceId: string,
    userIdentifier: string,
    status: SyncStatus
  ): Promise<DeviceDto> {
    const device = await this.prisma.device.update({
      where: {
        deviceId_userIdentifier: {
          deviceId,
          userIdentifier
        }
      },
      data: {
        lastSyncStatus: status,
        lastSeenAt: new Date()
      }
    });

    return this.mapToDto(device);
  }

  /**
   * Delete a device (soft delete)
   */
  async deleteDevice(deviceId: string, userIdentifier: string): Promise<DeviceDto> {
    const device = await this.prisma.device.update({
      where: {
        deviceId_userIdentifier: {
          deviceId,
          userIdentifier
        }
      },
      data: {
        deletedAt: new Date()
      }
    });

    return this.mapToDto(device);
  }

  /**
   * Map database model to DTO
   */
  private mapToDto(device: any): DeviceDto {
    return {
      deviceId: device.deviceId,
      userIdentifier: device.userIdentifier,
      lastSeenAt: device.lastSeenAt,
      lastChangeAt: device.lastChangeAt,
      createdAt: device.createdAt,
      deletedAt: device.deletedAt,
      deviceInfo: device.deviceInfo,
      lastSyncStatus: device.lastSyncStatus
    };
  }
}
