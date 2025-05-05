import { ApiProperty } from '@nestjs/swagger';

export class ProjectStatsResponseDto {
  @ApiProperty({
    description: 'Total number of users in the project',
    example: 1000,
    default: 0
  })
  totalUsers: number;

  @ApiProperty({
    description: 'Number of users active today',
    example: 150,
    default: 0
  })
  activeUsersToday: number;

  @ApiProperty({
    description: 'Total number of devices registered in the project',
    example: 2000,
    default: 0
  })
  totalDevices: number;

  @ApiProperty({
    description: 'Number of devices currently online (seen in last 5 minutes)',
    example: 500,
    default: 0
  })
  onlineDevices: number;

  @ApiProperty({
    description: 'Total number of changes in the project',
    example: 10000,
    default: 0
  })
  totalChanges: number;


  @ApiProperty({
    description: 'Sync success rate',
    example: 95,
    default: 0
  })
  syncSuccessRate: number;

  @ApiProperty({
    description: 'Sync failure rate',
    example: 5,
    default: 0
  })
  syncFailureRate: number;

  @ApiProperty({
    description: 'Last sync time',
    example: '2023-01-01T00:00:00.000Z',
    default: null,
    nullable: true,
    type: Date,
  })
  lastSync: Date | null;
}