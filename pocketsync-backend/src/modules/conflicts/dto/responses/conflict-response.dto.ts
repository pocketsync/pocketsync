import { ApiProperty } from '@nestjs/swagger';
import { ConflictDto } from '../conflict.dto';

export class ConflictResponseDto {
  @ApiProperty({
    description: 'Conflict details',
    type: [ConflictDto]
  })
  conflicts: ConflictDto[];

  @ApiProperty({
    description: 'Total count of conflicts matching the filter criteria',
    example: 100
  })
  total: number;

  @ApiProperty({
    description: 'Success status of the operation',
    example: true
  })
  success: boolean;
}
