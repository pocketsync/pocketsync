import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsJSON, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export enum DataExportStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export enum DataExportFormat {
  JSON = 'JSON',
  CSV = 'CSV',
  EXCEL = 'EXCEL'
}

export class DataExportJobDto {
  @ApiProperty({
    description: 'Unique identifier for the data export job',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  })
  id: string;

  @ApiProperty({
    description: 'Project identifier',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  })
  projectId: string;

  @ApiProperty({
    description: 'User identifier who requested the export',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  })
  userId: string;

  @ApiProperty({
    description: 'Status of the export job',
    enum: DataExportStatus,
    example: 'PENDING'
  })
  status: DataExportStatus;

  @ApiProperty({
    description: 'Filters applied to the export',
    example: {
      userIdentifier: 'user-123',
      deviceId: 'device-456',
      startDate: '2023-01-01T00:00:00Z',
      endDate: '2023-01-31T23:59:59Z',
      tableName: 'todos'
    }
  })
  filters: Record<string, any>;

  @ApiProperty({
    description: 'Format of the export',
    enum: DataExportFormat,
    example: 'JSON'
  })
  formatType: DataExportFormat;

  @ApiProperty({
    description: 'When the export job was created',
    example: '2023-01-01T12:00:00Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the export job was completed',
    example: '2023-01-01T12:05:00Z',
    required: false
  })
  completedAt?: Date;

  @ApiProperty({
    description: 'URL to download the exported data',
    example: 'https://example.com/exports/a1b2c3d4-e5f6-7890-abcd-ef1234567890.json',
    required: false
  })
  downloadUrl?: string;

  @ApiProperty({
    description: 'When the download URL expires',
    example: '2023-01-08T12:05:00Z',
    required: false
  })
  expiresAt?: Date;
}
