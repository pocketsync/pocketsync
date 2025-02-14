import { ApiProperty } from '@nestjs/swagger';
import { AuthTokenResponseDto } from './auth-token.response.dto';

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
    description: 'When the project was deleted',
    example: '2024-02-12T19:32:03.000Z',
    nullable: false,
    default: 0,
  })
  userCount: number;

  @ApiProperty({
    description: 'Number of active users today',
    example: 150,
    default: 0
  })
  activeUsersTodayCount: number;

  @ApiProperty({
    description: 'Total number of devices registered in the project',
    example: 1000,
    default: 0
  })
  deviceCount: number;

  @ApiProperty({
    description: 'Total number of changes in the project',
    example: 500,
    default: 0
  })
  changesCount: number;

  @ApiProperty({
    description: 'Number of changes pending synchronization',
    example: 25,
    default: 0
  })
  pendingChangesCount: number;

  @ApiProperty({
    description: 'Auth tokens for the project',
    type: () => AuthTokenResponseDto,
    isArray: true
  })
  authTokens: AuthTokenResponseDto[];
}