import { ApiProperty } from '@nestjs/swagger';
import { SyncLogDto } from '../sync-log.dto';

export class SyncLogResponseDto {
  @ApiProperty({
    description: 'Sync log details',
    type: [SyncLogDto]
  })
  logs: SyncLogDto[];

  @ApiProperty({
    description: 'Total count of logs matching the filter criteria',
    example: 100
  })
  total: number;

  @ApiProperty({
    description: 'Success status of the operation',
    example: true
  })
  success: boolean;
}
