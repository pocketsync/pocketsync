import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { v4 as uuidv4 } from 'uuid';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ProjectMapper } from './mappers/project.mapper';
import { CreateAuthTokenDto } from './dto/create-auth-token.dto';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private projectMapper: ProjectMapper,
  ) { }

  private generateToken(): string {
    return `ps_${Buffer.from(uuidv4().replace(/-/g, '')).toString('base64').replace(/[+/]/g, '').slice(0, 60)}`;
  }

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
          token: this.generateToken(),
          userId,
          name: 'Default',
        }
      });

      return this.projectMapper.toResponse(project, [defaultToken], 0);
    });

    return response
  }

  async findAll(userId: string, { page = 1, limit = 10 }: PaginationQueryDto) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where: { userId, deletedAt: null },
        include: {
          _count: {
            select: {
              appUsers: true,
              changeLogs: true,
            },
          },
          appUsers: {
            include: {
              _count: {
                select: { devices: true }
              },
              devices: {
                where: {
                  lastSeenAt: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0))
                  }
                }
              }
            }
          }
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
    const project = await this.prisma.project.findFirst({
      where: {
        id,
        deletedAt: null
      },
      include: {
        _count: {
          select: {
            appUsers: true,
            changeLogs: true,
          },
        },
        appUsers: {
          include: {
            _count: {
              select: { devices: true }
            },
            devices: {
              where: {
                lastSeenAt: {
                  gte: new Date(new Date().setHours(0, 0, 0, 0))
                }
              }
            }
          }
        }
      },
    });

    const pendingChangeLogs = await this.prisma.changeLog.count({
      where: { projectId: id, processedAt: null },
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

    return this.projectMapper.toResponse(project, authTokens, pendingChangeLogs);
  }

  async update(userId: string, id: string, updateProjectDto: UpdateProjectDto) {
    await this.findOne(userId, id); // Check ownership

    const updatedProject = await this.prisma.project.update({
      where: { id, deletedAt: null },
      data: updateProjectDto,
      include: {
        _count: {
          select: {
            appUsers: true,
            changeLogs: true,
          },
        },
        appUsers: {
          include: {
            _count: {
              select: { devices: true }
            },
            devices: {
              where: {
                lastSeenAt: {
                  gte: new Date(new Date().setHours(0, 0, 0, 0))
                }
              }
            }
          }
        }
      },
    });

    const authTokens = await this.prisma.projectAuthTokens.findMany({
      where: { projectId: id },
    });

    const pendingChangeLogs = await this.prisma.changeLog.count({
      where: { projectId: id, processedAt: null },
    });

    return this.projectMapper.toResponse(updatedProject, authTokens, pendingChangeLogs);
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    const updatedProject = await this.prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return this.projectMapper.toResponse(updatedProject, [], 0);
  }

  async createAuthToken(userId: string, projectId: string, data: CreateAuthTokenDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    if (project.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    const token = await this.prisma.projectAuthTokens.create({
      data: {
        projectId,
        token: this.generateToken(),
        userId,
        name: data.name,
      }
    });
    return { token: token.token };
  }

  async revokeAuthToken(userId: string, tokenId: string) {
    const token = await this.prisma.projectAuthTokens.findUnique({
      where: { id: tokenId },
      include: { project: true },
    });

    if (!token) {
      throw new NotFoundException('Auth token not found');
    }

    if (token.project.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const tokenCount = await this.prisma.projectAuthTokens.count({
      where: { projectId: token.projectId }
    });

    if (tokenCount <= 1) {
      throw new ForbiddenException('Cannot delete the last authentication token for the project.');
    }

    await this.prisma.projectAuthTokens.delete({
      where: { id: tokenId },
    });

    return { message: 'Auth token revoked successfully' };
  }
}
