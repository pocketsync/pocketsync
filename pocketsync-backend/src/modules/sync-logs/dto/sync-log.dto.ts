import { ApiProperty } from '@nestjs/swagger';
import { LogLevel } from '@prisma/client';

export class SyncLogDto {
  @ApiProperty({
    description: 'Unique identifier for the sync log',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  })
  id: string;

  @ApiProperty({
    description: 'Project identifier',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  })
  projectId: string;

  @ApiProperty({
    description: 'User identifier',
    example: 'user-456',
    required: false
  })
  userIdentifier?: string;

  @ApiProperty({
    description: 'Device identifier',
    example: 'device-123',
    required: false
  })
  deviceId?: string;

  @ApiProperty({
    description: 'Log message',
    example: 'Sync completed successfully'
  })
  message: string;

  @ApiProperty({
    description: 'Log level',
    enum: LogLevel,
    example: 'INFO'
  })
  level: LogLevel;

  @ApiProperty({
    description: 'Timestamp of the log',
    example: '2023-01-01T12:00:00Z'
  })
  timestamp: Date;

  @ApiProperty({
    description: 'Additional metadata for the log',
    example: { changeCount: 10, duration: 1500 },
    required: false
  })
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Associated sync session ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    required: false
  })
  syncSessionId?: string;
}
