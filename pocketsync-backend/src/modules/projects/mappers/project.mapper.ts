import { AppUser, Device, DeviceChanges, Project, ProjectAuthTokens } from '@prisma/client';
import { ProjectResponseDto } from '../dto/responses/project.response.dto';
import { AuthTokensMapper } from './auth-tokens.mapper';
import { PaginatedResponse } from 'src/common/dto/paginated-response.dto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ProjectMapper {

    constructor(private authTokensMapper: AuthTokensMapper) { }

    toResponse(project: Project & { 
        appUsers?: (AppUser & { _count?: { devices: number }, devices?: Device[] })[], 
        _count?: { appUsers: number }, 
        deviceChanges?: DeviceChanges[] 
    }, authTokens: ProjectAuthTokens[]): ProjectResponseDto {
        const deviceCount = project.appUsers?.reduce((sum, user) => sum + (user._count?.devices || 0), 0) || 0;
        const activeUsersTodayCount = project.appUsers?.filter(user => user.devices && user.devices.length > 0).length || 0;
        const changesCount = project.deviceChanges?.length || 0;
        const onlineDevices = project.appUsers?.reduce((sum, user) => {
            return sum + (user.devices?.filter(device => {
                const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
                return device.lastSeenAt && device.lastSeenAt > fiveMinutesAgo;
            }).length || 0);
        }, 0) || 0;

        return {
            id: project.id,
            name: project.name,
            userId: project.userId,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
            authTokens: this.authTokensMapper.mapToResponse(authTokens),
            stats: {
                totalUsers: project.appUsers?.length || 0,
                activeUsersToday: activeUsersTodayCount,
                totalDevices: deviceCount,
                onlineDevices: onlineDevices,
                totalChanges: changesCount,
                pendingChanges: 0
            }
        };
    }

    mapToPaginatedResponse(data: (Project & { 
        _count?: { appUsers: number }, 
        appUsers?: (AppUser & { _count?: { devices: number }, devices?: Device[] })[], 
        deviceChanges?: DeviceChanges[] 
    })[], total: number, page: number, limit: number): PaginatedResponse<ProjectResponseDto> {
        return {
            data: data.map((project) => {
                return this.toResponse(project, []);
            }),
            total,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
        };
    }
}