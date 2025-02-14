import { AppUser, Device, Project, ProjectAuthTokens } from '@prisma/client';
import { ProjectResponseDto } from '../dto/responses/project.response.dto';
import { AuthTokensMapper } from './auth-tokens.mapper';
import { PaginatedResponse } from 'src/common/dto/paginated-response.dto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ProjectMapper {

    constructor(private authTokensMapper: AuthTokensMapper) { }
    
    toResponse(project: Project & { appUsers?: (AppUser & { _count?: { devices: number }, devices?: Device[] })[] }, userCount: number, authTokens: ProjectAuthTokens[]): ProjectResponseDto {
        const deviceCount = project.appUsers?.reduce((sum, user) => sum + (user._count?.devices || 0), 0) || 0;
        const activeUsersTodayCount = project.appUsers?.filter(user => user.devices && user.devices.length > 0).length || 0;

        return {
            id: project.id,
            name: project.name,
            userId: project.userId,
            userCount: userCount,
            deviceCount: deviceCount,
            activeUsersTodayCount: activeUsersTodayCount,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
            authTokens: this.authTokensMapper.mapToResponse(authTokens),
        };
    }

    mapToPaginatedResponse(data: (Project & { _count?: { appUsers: number }, appUsers?: (AppUser & { _count?: { devices: number }, devices?: Device[] })[] })[], total: number, page: number, limit: number): PaginatedResponse<ProjectResponseDto> {
        return {
            data: data.map((project) => {
                const userCount = project._count?.appUsers || 0;
                return this.toResponse(project, userCount, []);
            }),
            total,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
        };
    }

}