import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SyncStatus } from '@prisma/client';
import { SyncSessionDto } from './dto/sync-session.dto';

@Injectable()
export class SyncSessionsService {
  private readonly logger = new Logger(SyncSessionsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new sync session
   */
  async createSession(deviceId: string, userIdentifier: string, projectId: string): Promise<SyncSessionDto> {
    this.logger.log(`Creating new sync session for device ${deviceId} and user ${userIdentifier}`);
    
    const session = await this.prisma.syncSession.create({
      data: {
        deviceId,
        userIdentifier,
        projectId,
        status: 'IN_PROGRESS'
      }
    });

    return this.mapToDto(session);
  }

  /**
   * Complete a sync session with success or failure status
   */
  async completeSession(sessionId: string, status: SyncStatus, changesCount: number): Promise<SyncSessionDto> {
    this.logger.log(`Completing sync session ${sessionId} with status ${status}`);
    
    const endTime = new Date();
    const session = await this.prisma.syncSession.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      throw new NotFoundException(`Sync session with ID ${sessionId} not found`);
    }

    // Calculate duration in milliseconds
    const startTime = session.startTime;
    const syncDuration = endTime.getTime() - startTime.getTime();

    const updatedSession = await this.prisma.syncSession.update({
      where: { id: sessionId },
      data: {
        status,
        endTime,
        changesCount,
        syncDuration
      }
    });

    return this.mapToDto(updatedSession);
  }

  /**
   * Get a sync session by ID
   */
  async getSessionById(sessionId: string): Promise<SyncSessionDto> {
    const session = await this.prisma.syncSession.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      throw new NotFoundException(`Sync session with ID ${sessionId} not found`);
    }

    return this.mapToDto(session);
  }

  /**
   * Get sync sessions for a specific device
   */
  async getSessionsByDevice(deviceId: string, userIdentifier: string, limit = 10, offset = 0): Promise<SyncSessionDto[]> {
    const sessions = await this.prisma.syncSession.findMany({
      where: {
        deviceId,
        userIdentifier
      },
      orderBy: {
        startTime: 'desc'
      },
      skip: offset,
      take: limit
    });

    return sessions.map(session => this.mapToDto(session));
  }

  /**
   * Get sync sessions for a specific project
   */
  async getSessionsByProject(projectId: string, limit = 10, offset = 0): Promise<SyncSessionDto[]> {
    // First get all app users for this project
    const appUsers = await this.prisma.appUser.findMany({
      where: { projectId }
    });

    const userIdentifiers = appUsers.map(user => user.userIdentifier);

    // Then get sessions for these users
    const sessions = await this.prisma.syncSession.findMany({
      where: {
        userIdentifier: {
          in: userIdentifiers
        }
      },
      orderBy: {
        startTime: 'desc'
      },
      skip: offset,
      take: limit
    });

    return sessions.map(session => this.mapToDto(session));
  }

  /**
   * Map database model to DTO
   */
  private mapToDto(session: any): SyncSessionDto {
    return {
      id: session.id,
      deviceId: session.deviceId,
      userIdentifier: session.userIdentifier,
      startTime: session.startTime,
      endTime: session.endTime,
      status: session.status,
      changesCount: session.changesCount,
      syncDuration: session.syncDuration
    };
  }
}
