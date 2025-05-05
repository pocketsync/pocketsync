import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { v4 as uuidv4 } from 'uuid';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ProjectMapper } from './mappers/project.mapper';
import { CreateAuthTokenDto } from './dto/create-auth-token.dto';
import { SyncActivityDto, SyncActivityPeriod, SyncActivityDataPoint } from './dto/responses/sync-activity.dto';
import { SyncSession } from '@prisma/client';

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

      return this.projectMapper.toResponse(project, [defaultToken]);
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
            },
          },
          deviceChanges: {
            take: 100,
            orderBy: {
              createdAt: 'desc'
            }
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

    // Fetch sync sessions for each project
    const projectsWithSessions = await Promise.all(
      data.map(async (project) => {
        const syncSessions = await this.getSyncSessionsForProject(project.id);
        return { ...project, syncSessions } as typeof project & { syncSessions: SyncSession[] };
      })
    );

    return this.projectMapper.mapToPaginatedResponse(projectsWithSessions, total, page, limit);
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
          },
        },
        deviceChanges: {
          take: 100,
          orderBy: {
            createdAt: 'desc'
          }
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

    const syncSessions = await this.getSyncSessionsForProject(id);

    return this.projectMapper.toResponse(
      { ...project, syncSessions } as typeof project & { syncSessions: SyncSession[] },
      authTokens
    );
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
          },
        },
        deviceChanges: {
          take: 100,
          orderBy: {
            createdAt: 'desc'
          }
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
        },
      },
    });

    const authTokens = await this.prisma.projectAuthTokens.findMany({
      where: { projectId: id },
    });

    const syncSessions = await this.getSyncSessionsForProject(id);

    return this.projectMapper.toResponse(
      { ...updatedProject, syncSessions } as typeof updatedProject & { syncSessions: SyncSession[] },
      authTokens
    );
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    const updatedProject = await this.prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return this.projectMapper.toResponse(updatedProject, []);
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

  /**
   * Get sync sessions associated with a project through sync logs
   * @param projectId The project ID
   * @returns Array of sync sessions
   */
  private async getSyncSessionsForProject(projectId: string): Promise<SyncSession[]> {
    const syncLogs = await this.prisma.syncLog.findMany({
      where: { projectId },
      select: { syncSessionId: true },
      distinct: ['syncSessionId'],
      take: 100,
    });

    const sessionIds = syncLogs
      .map(log => log.syncSessionId)
      .filter(id => id !== null) as string[];

    if (sessionIds.length === 0) {
      return [];
    }

    return this.prisma.syncSession.findMany({
      where: {
        id: { in: sessionIds }
      },
      orderBy: {
        startTime: 'desc'
      },
      take: 100
    });
  }

  /**
   * Get sync activity data for a project over different time periods
   * @param userId The ID of the user requesting the data
   * @param projectId The ID of the project to get sync activity for
   * @returns Sync activity data for the last 24 hours, 7 days, and 30 days
   */
  async getSyncActivity(userId: string, projectId: string): Promise<SyncActivityDto> {
    // Check if project exists and user has access
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
        deletedAt: null
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const now = new Date();
    const last24h = new Date(now);
    last24h.setHours(now.getHours() - 24);

    const last7d = new Date(now);
    last7d.setDate(now.getDate() - 7);

    const last30d = new Date(now);
    last30d.setDate(now.getDate() - 30);

    const last24hActivity = await this.getActivityForPeriod(projectId, last24h, now, 'hour');

    const last7dActivity = await this.getActivityForPeriod(projectId, last7d, now, 'day');

    const last30dActivity = await this.getActivityForPeriod(projectId, last30d, now, 'day');

    return {
      last24h: last24hActivity,
      last7d: last7dActivity,
      last30d: last30dActivity,
      success: true
    };
  }

  /**
   * Get activity data for a specific time period
   * @param projectId The project ID
   * @param startDate Start date for the period
   * @param endDate End date for the period
   * @param interval Time interval for grouping ('hour' or 'day')
   * @returns Formatted activity data for the period
   */
  private async getActivityForPeriod(
    projectId: string,
    startDate: Date,
    endDate: Date,
    interval: 'hour' | 'day'
  ): Promise<SyncActivityPeriod> {
    const truncFunction = interval === 'hour' ? 'hour' : 'day';

    const syncActivity = await this.prisma.$queryRaw<Array<{ timestamp: Date, count: number }>>`
      SELECT 
        date_trunc(${truncFunction}, "start_time") as timestamp,
        COUNT(*) as count
      FROM 
        sync_sessions
      WHERE 
        "start_time" >= ${startDate} AND
        "start_time" <= ${endDate} AND
        EXISTS (
          SELECT 1 FROM sync_logs 
          WHERE 
            sync_logs."sync_session_id" = sync_sessions.id AND
            sync_logs."project_id" = ${projectId}::uuid
        )
      GROUP BY 
        1
      ORDER BY 
        timestamp ASC
    `;

    const total = syncActivity.reduce((sum, point) => sum + Number(point.count), 0);

    const data = syncActivity.map(point => ({
      timestamp: point.timestamp,
      count: Number(point.count)
    }));

    return {
      data,
      total
    };
  }
}
