import { ApiProperty } from '@nestjs/swagger';
import { SyncStatus } from '@prisma/client';

export class DeviceDto {
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
    description: 'Last time the device was seen',
    example: '2023-01-01T12:00:00Z',
    required: false
  })
  lastSeenAt?: Date;

  @ApiProperty({
    description: 'Last time the device made a change',
    example: '2023-01-01T12:00:00Z',
    required: false
  })
  lastChangeAt?: Date;

  @ApiProperty({
    description: 'When the device was created',
    example: '2023-01-01T12:00:00Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the device was deleted',
    example: '2023-01-01T12:00:00Z',
    required: false
  })
  deletedAt?: Date;

  @ApiProperty({
    description: 'Device information',
    example: {
      os: 'iOS',
      version: '15.0',
      model: 'iPhone 13',
      appVersion: '1.0.0'
    },
    required: false
  })
  deviceInfo?: Record<string, any>;

  @ApiProperty({
    description: 'Last sync status',
    enum: SyncStatus,
    example: 'SUCCESS',
    required: false
  })
  lastSyncStatus?: SyncStatus;
}
