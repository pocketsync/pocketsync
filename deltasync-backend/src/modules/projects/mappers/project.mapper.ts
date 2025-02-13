import { Project, ProjectAuthTokens } from '@prisma/client';
import { ProjectResponseDto } from '../dto/responses/project.response.dto';
import { AuthTokensMapper } from './auth-tokens.mapper';
import { PaginatedResponse } from 'src/common/dto/paginated-response.dto';

export class ProjectMapper {

    constructor(private authTokensMapper: AuthTokensMapper) { }
    
    toResponse(project: Project, userCount: number, authTokens: ProjectAuthTokens[]): ProjectResponseDto {
        return {
            id: project.id,
            name: project.name,
            userId: project.userId,
            userCount: userCount,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
            authTokens: this.authTokensMapper.mapToResponse(authTokens),
        };
    }

    mapToPaginatedResponse(data: Project[], total: number, page: number, limit: number): PaginatedResponse<ProjectResponseDto> {
        return {
            data: data.map((project) => this.toResponse(project, 0, [])),
            total,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
        };
    }

}