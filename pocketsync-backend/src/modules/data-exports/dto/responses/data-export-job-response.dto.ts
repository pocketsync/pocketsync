import { ApiProperty } from '@nestjs/swagger';
import { DataExportJobDto } from '../data-export-job.dto';

export class DataExportJobResponseDto {
  @ApiProperty({
    description: 'Data export job details',
    type: DataExportJobDto
  })
  job: DataExportJobDto;

  @ApiProperty({
    description: 'Success status of the operation',
    example: true
  })
  success: boolean;
}
