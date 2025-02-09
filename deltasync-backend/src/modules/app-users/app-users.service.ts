import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppUserDto } from './dto/create-app-user.dto';
import { UpdateAppUserDto } from './dto/update-app-user.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Injectable()
export class AppUsersService {
  constructor(private prisma: PrismaService) { }

  async create(userId: string, createAppUserDto: CreateAppUserDto) {
    await this.validateProjectAccess(userId, createAppUserDto.projectId);

    return this.prisma.appUser.create({
      data: createAppUserDto,
      include: {
        _count: {
          select: { devices: true },
        },
      },
    });
  }

  async findAll(userId: string, projectId: string, { page = 1, limit = 10 }: PaginationQueryDto) {
    await this.validateProjectAccess(userId, projectId);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.appUser.findMany({
        where: { projectId },
        include: {
          _count: {
            select: { devices: true },
          },
          userDatabase: {
            select: {
              lastSyncedAt: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.appUser.count({
        where: { projectId },
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
    const appUser = await this.prisma.appUser.findUnique({
      where: { id },
      include: {
        devices: true,
        userDatabase: true,
        project: true,
      },
    });

    if (!appUser) {
      throw new NotFoundException('App user not found');
    }

    await this.validateProjectAccess(userId, appUser.projectId);

    return appUser;
  }

  async update(userId: string, id: string, updateAppUserDto: UpdateAppUserDto) {
    const appUser = await this.findOne(userId, id);

    if (updateAppUserDto.projectId) {
      await this.validateProjectAccess(userId, updateAppUserDto.projectId);
    }

    return this.prisma.appUser.update({
      where: { id },
      data: updateAppUserDto,
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    return this.prisma.appUser.delete({
      where: { id },
    });
  }

  private async validateProjectAccess(userId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('Access denied to this project');
    }
  }

  async findByUserIdentifier(userIdentifier: string) {
    return this.prisma.appUser.findFirst({
      where: { id: userIdentifier },
    });
  }

  async createFromSdk(data: { userIdentifier: string; projectId: string }) {
    const project = await this.prisma.project.findUnique({
      where: { id: data.projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.prisma.appUser.create({
      data: {
        userIdentifier: data.userIdentifier,
        projectId: data.projectId,
      },
      include: {
        project: true,
      },
    });
  }
}