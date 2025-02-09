import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { AppUsersService } from '../app-users/app-users.service';

@Injectable()
export class DevicesService {
  constructor(
    private prisma: PrismaService,
    private appUsersService: AppUsersService,
  ) { }

  async findByDeviceId(deviceId: string) {
    return this.prisma.device.findFirst({
      where: { deviceId },
      include: {
        appUser: true,
      },
    });
  }

  async create(userId: string, createDeviceDto: CreateDeviceDto) {
    await this.validateAppUserAccess(userId, createDeviceDto.appUserId);

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

  async createFromSdk(data: { deviceId: string; userIdentifier: string, projectId: string }) {
    let appUser = await this.appUsersService.findByUserIdentifier(data.userIdentifier, data.projectId);
    
    if (!appUser) {
      throw new NotFoundException('App user not found');
    }

    return this.prisma.device.create({
      data: {
        deviceId: data.deviceId,
        appUserId: appUser.id,
        lastSeenAt: new Date(),
      },
      include: {
        appUser: true,
      },
    });
  }

  async findAll(userId: string, appUserId: string, { page = 1, limit = 10 }: PaginationQueryDto) {
    await this.validateAppUserAccess(userId, appUserId);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.device.findMany({
        where: { appUserId },
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
        where: { appUserId },
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

  async findOne(userId: string, id: string) {
    const device = await this.prisma.device.findUnique({
      where: { id },
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

    await this.validateAppUserAccess(userId, device.appUserId);

    return device;
  }
  
  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    return this.prisma.device.delete({
      where: { id },
    });
  }

  async updateLastSeen(userId: string, id: string) {
    await this.findOne(userId, id);

    return this.prisma.device.update({
      where: { id },
      data: { lastSeenAt: new Date() },
    });
  }

  private async validateAppUserAccess(userId: string, appUserId: string) {
    const appUser = await this.prisma.appUser.findUnique({
      where: { id: appUserId },
      include: { project: true },
    });

    if (!appUser) {
      throw new NotFoundException('App user not found');
    }

    if (appUser.project.userId !== userId) {
      throw new ForbiddenException('Access denied to this app user');
    }
  }
}