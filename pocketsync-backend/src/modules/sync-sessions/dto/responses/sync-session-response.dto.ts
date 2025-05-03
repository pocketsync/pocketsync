import { ApiProperty } from '@nestjs/swagger';
import { SyncSessionDto } from '../sync-session.dto';

export class SyncSessionResponseDto {
  @ApiProperty({
    description: 'Sync session details',
    type: SyncSessionDto
  })
  session: SyncSessionDto;

  @ApiProperty({
    description: 'Success status of the operation',
    example: true
  })
  success: boolean;

  @ApiProperty({
    description: 'Timestamp of the response',
    example: 1609459200000
  })
  timestamp: number;
}
