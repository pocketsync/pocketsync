import { ApiProperty } from '@nestjs/swagger';

export class SyncActivityDataPoint {
  @ApiProperty({ description: 'Timestamp for the data point' })
  timestamp: Date;

  @ApiProperty({ description: 'Number of sync operations at this timestamp' })
  count: number;
}

export class SyncActivityPeriod {
  @ApiProperty({ description: 'Data points for the period', type: [SyncActivityDataPoint] })
  data: SyncActivityDataPoint[];

  @ApiProperty({ description: 'Total number of sync operations in this period' })
  total: number;
}

export class SyncActivityDto {
  @ApiProperty({ description: 'Sync activity for the last 24 hours' })
  last24h: SyncActivityPeriod;

  @ApiProperty({ description: 'Sync activity for the last 7 days' })
  last7d: SyncActivityPeriod;

  @ApiProperty({ description: 'Sync activity for the last 30 days' })
  last30d: SyncActivityPeriod;

  @ApiProperty({ description: 'Whether the operation was successful' })
  success: boolean;
}
