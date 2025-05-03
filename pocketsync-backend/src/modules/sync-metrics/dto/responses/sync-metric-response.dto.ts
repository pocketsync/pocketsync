import { ApiProperty } from '@nestjs/swagger';
import { SyncMetricDto } from '../sync-metric.dto';

export class SyncMetricResponseDto {
  @ApiProperty({
    description: 'Sync metrics',
    type: [SyncMetricDto]
  })
  metrics: SyncMetricDto[];

  @ApiProperty({
    description: 'Total count of metrics matching the filter criteria',
    example: 100
  })
  total: number;

  @ApiProperty({
    description: 'Success status of the operation',
    example: true
  })
  success: boolean;
}
