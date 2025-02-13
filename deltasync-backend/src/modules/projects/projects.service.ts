import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { v4 as uuidv4 } from 'uuid';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PaginatedResponse } from 'src/common/dto/paginated-response.dto';
import { Project } from '@prisma/client';
import { ProjectMapper } from './mappers/project.mapper';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private projectMapper: ProjectMapper,
  ) { }

  async create(userId: string, createProjectDto: CreateProjectDto) {
    const response = await this.prisma.$transaction(async (prisma) => {
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
          name: 'Default',
        }
      });

      return this.projectMapper.toResponse(project, 0, [defaultToken]);
    });

    return response
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

    return this.projectMapper.mapToPaginatedResponse(data, total, page, limit);
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

    const authTokens = await this.prisma.projectAuthTokens.findMany({
      where: { projectId: id },
    });

    const userCount = project._count.appUsers;

    return this.projectMapper.toResponse(project, userCount, authTokens);
  }

  async update(userId: string, id: string, updateProjectDto: UpdateProjectDto) {
    await this.findOne(userId, id); // Check ownership

    const updatedProject = await this.prisma.project.update({
      where: { id },
      data: updateProjectDto,
      include: {
        _count: {
          select: { appUsers: true },
        },
      },
    });

    const authTokens = await this.prisma.projectAuthTokens.findMany({
      where: { projectId: id },
    });

    const userCount = updatedProject._count.appUsers;

    return this.projectMapper.toResponse(updatedProject, userCount, authTokens);
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id); // Check ownership

    const updatedProject = await this.prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return this.projectMapper.toResponse(updatedProject, 0, []);
  }
}