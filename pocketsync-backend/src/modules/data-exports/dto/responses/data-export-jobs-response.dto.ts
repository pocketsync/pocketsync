import { ApiProperty } from '@nestjs/swagger';
import { DataExportJobDto } from '../data-export-job.dto';

export class DataExportJobsResponseDto {
  @ApiProperty({
    description: 'Data export jobs',
    type: [DataExportJobDto]
  })
  jobs: DataExportJobDto[];

  @ApiProperty({
    description: 'Total count of jobs matching the filter criteria',
    example: 100
  })
  total: number;

  @ApiProperty({
    description: 'Success status of the operation',
    example: true
  })
  success: boolean;
}
