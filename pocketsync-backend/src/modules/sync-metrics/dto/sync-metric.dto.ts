import { ApiProperty } from '@nestjs/swagger';
import { TrackedSyncMetric } from 'src/modules/sync/dto/tracked-sync-metric.enum';

export class SyncMetricDto {
  @ApiProperty({
    description: 'Unique identifier for the sync metric',
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
    description: 'Type of metric being recorded',
    example: 'sync_duration',
    enum: TrackedSyncMetric
  })
  metricType: TrackedSyncMetric;

  @ApiProperty({
    description: 'Value of the metric',
    example: 1500.5
  })
  value: number;

  @ApiProperty({
    description: 'Timestamp when the metric was recorded',
    example: '2023-01-01T12:00:00Z'
  })
  timestamp: Date;

  @ApiProperty({
    description: 'Additional metadata for the metric',
    example: { changeCount: 10, syncSessionId: 'session-123' },
    required: false
  })
  metadata?: Record<string, any>;
}
