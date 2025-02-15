import { ApiProperty } from '@nestjs/swagger';
import { AuthTokenResponseDto } from './auth-token.response.dto';
import { ProjectStatsResponseDto } from './project-stats.response.dto';

export class ProjectResponseDto {
  @ApiProperty({
    description: 'The unique identifier of the project',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string;

  @ApiProperty({
    description: 'The name of the project',
    example: 'My Awesome Project'
  })
  name: string;

  @ApiProperty({
    description: 'The ID of the user who owns this project',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  userId: string;

  @ApiProperty({
    description: 'Number of app users in this project',
    example: 42
  })
  appUsersCount?: number;

  @ApiProperty({
    description: 'When the project was created',
    example: '2024-02-12T19:32:03.000Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the project was last updated',
    example: '2024-02-12T19:32:03.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Auth tokens for the project',
    type: () => AuthTokenResponseDto,
    isArray: true
  })
  authTokens: AuthTokenResponseDto[];

  @ApiProperty({
    description: 'Project statistics including user counts, device counts, and change logs',
    type: () => ProjectStatsResponseDto
  })
  stats: ProjectStatsResponseDto;
}