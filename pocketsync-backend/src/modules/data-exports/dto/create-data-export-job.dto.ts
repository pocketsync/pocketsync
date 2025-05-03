import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsObject, IsOptional } from 'class-validator';
import { DataExportFormat } from './data-export-job.dto';

export class CreateDataExportJobDto {
  @ApiProperty({
    description: 'Filters to apply to the export',
    example: {
      userIdentifier: 'user-123',
      deviceId: 'device-456',
      startDate: '2023-01-01T00:00:00Z',
      endDate: '2023-01-31T23:59:59Z',
      tableName: 'todos'
    }
  })
  @IsNotEmpty()
  @IsObject()
  filters: Record<string, any>;

  @ApiProperty({
    description: 'Format of the export',
    enum: DataExportFormat,
    example: 'JSON',
    default: 'JSON'
  })
  @IsEnum(DataExportFormat)
  @IsOptional()
  formatType: DataExportFormat = DataExportFormat.JSON;
}
