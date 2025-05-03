import { ApiProperty } from '@nestjs/swagger';
import { SyncStatus } from '@prisma/client';

export class SyncSessionDto {
  @ApiProperty({
    description: 'Unique identifier for the sync session',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  })
  id: string;

  @ApiProperty({
    description: 'Device identifier',
    example: 'device-123'
  })
  deviceId: string;

  @ApiProperty({
    description: 'User identifier',
    example: 'user-456'
  })
  userIdentifier: string;

  @ApiProperty({
    description: 'Start time of the sync session',
    example: '2023-01-01T12:00:00Z'
  })
  startTime: Date;

  @ApiProperty({
    description: 'End time of the sync session',
    example: '2023-01-01T12:01:00Z',
    required: false
  })
  endTime?: Date;

  @ApiProperty({
    description: 'Status of the sync session',
    enum: SyncStatus,
    example: 'SUCCESS'
  })
  status: SyncStatus;

  @ApiProperty({
    description: 'Number of changes processed in this session',
    example: 10
  })
  changesCount: number;

  @ApiProperty({
    description: 'Duration of the sync session in milliseconds',
    example: 1500,
    required: false
  })
  syncDuration?: number;
}
