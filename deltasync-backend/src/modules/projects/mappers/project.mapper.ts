import { Project } from '@prisma/client';
import { ProjectResponseDto } from '../dto/responses/project.response.dto';

export class ProjectMapper {
  static toResponse(project: Project & { _count?: { appUsers: number } }): ProjectResponseDto {
    return {
      id: project.id,
      name: project.name,
      userId: project.userId,
      appUsersCount: project._count?.appUsers,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  static toResponseList(projects: (Project & { _count?: { appUsers: number } })[]): ProjectResponseDto[] {
    return projects.map(project => this.toResponse(project));
  }
}