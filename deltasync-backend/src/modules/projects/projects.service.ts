import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { v4 as uuidv4 } from 'uuid';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) { }

  async create(userId: string, createProjectDto: CreateProjectDto) {
    const [project, defaultToken] = await this.prisma.$transaction(async (prisma) => {
      const project = await prisma.project.create({
        data: {
          ...createProjectDto,
          userId,
        },
      });

      const defaultToken = await prisma.projectAuthTokens.create({
        data: {
          projectId: project.id,
          token: `ds_${Buffer.from(uuidv4().replace(/-/g, '')).toString('base64').replace(/[+/]/g, '').slice(0, 60)}`,
          userId,
        }
      });

      return [project, defaultToken];
    });

    return {
      project,
      defaultToken,
    }
  }

  async findAll(userId: string, { page = 1, limit = 10 }: PaginationQueryDto) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where: { userId },
        include: {
          _count: {
            select: { appUsers: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.project.count({
        where: { userId },
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
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        _count: {
          select: { appUsers: true },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return project;
  }

  async update(userId: string, id: string, updateProjectDto: UpdateProjectDto) {
    await this.findOne(userId, id); // Check ownership

    return this.prisma.project.update({
      where: { id },
      data: updateProjectDto,
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id); // Check ownership

    return this.prisma.project.delete({
      where: { id },
    });
  }
}