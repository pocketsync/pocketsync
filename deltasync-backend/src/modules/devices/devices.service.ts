import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { AppUsersService } from '../app-users/app-users.service';
import { Device } from '@prisma/client';

@Injectable()
export class DevicesService {
  constructor(
    private prisma: PrismaService,
    private appUsersService: AppUsersService,
  ) { }

  async findByDeviceId(deviceId: string): Promise<Device | null> {
    return this.prisma.device.findFirst({
      where: { deviceId },
      include: {
        appUser: true,
      },
    });
  }

  async create(userId: string, createDeviceDto: CreateDeviceDto) {
    await this.validateAppUserAccess(userId, createDeviceDto.userIdentifier);

    return this.prisma.device.create({
      data: {
        ...createDeviceDto,
        lastSeenAt: new Date(),
      },
      include: {
        appUser: true,
      },
    });
  }

  async createFromSdk(data: { deviceId: string; userIdentifier: string, projectId: string }): Promise<Device> {
    let appUser = await this.appUsersService.findByUserIdentifier(data.userIdentifier, data.projectId);

    if (!appUser) {
      throw new NotFoundException('App user not found');
    }

    return this.prisma.device.create({
      data: {
        deviceId: data.deviceId,
        userIdentifier: appUser.userIdentifier,
        lastSeenAt: new Date(),
      },
      include: {
        appUser: true,
      },
    });
  }

  async findAll(userId: string, userIdentifier: string, { page = 1, limit = 10 }: PaginationQueryDto) {
    await this.validateAppUserAccess(userId, userIdentifier);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.device.findMany({
        where: { userIdentifier },
        include: {
          _count: {
            select: { changeLogs: true },
          },
        },
        skip,
        take: limit,
        orderBy: { lastSeenAt: 'desc' },
      }),
      this.prisma.device.count({
        where: { userIdentifier },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: skip + limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(userId: string, deviceId: string) {
    const device = await this.prisma.device.findUnique({
      where: { deviceId },
      include: {
        appUser: {
          include: {
            project: true,
          },
        },
        changeLogs: {
          take: 10,
          orderBy: { receivedAt: 'desc' },
        },
      },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    await this.validateAppUserAccess(userId, device.userIdentifier);

    return device;
  }

  async remove(userId: string, deviceId: string) {
    await this.findOne(userId, deviceId);

    return this.prisma.device.delete({
      where: { deviceId },
    });
  }

  private async validateAppUserAccess(userId: string, userIdentifier: string) {
    const appUser = await this.prisma.appUser.findUnique({
      where: { userIdentifier },
      include: { project: true },
    });

    if (!appUser) {
      throw new NotFoundException('App user not found');
    }

    if (appUser.userIdentifier !== userId) {
      throw new ForbiddenException('Access denied to this app user');
    }
  }

  async getOrCreateDeviceFromId(deviceId: string, userId: string, projectId: string) {
    let device = await this.findByDeviceId(deviceId);
    if (!device) {
      device = await this.createFromSdk({
        deviceId: deviceId,
        userIdentifier: userId,
        projectId: projectId,
      });
    }

    return device
  }
}