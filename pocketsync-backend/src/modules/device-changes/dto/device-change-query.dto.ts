import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class DeviceChangeQueryDto {
  @ApiProperty({ required: false, description: 'Filter by table name' })
  @IsString()
  @IsOptional()
  tableName?: string;

  @ApiProperty({ required: false, description: 'Filter by record ID' })
  @IsString()
  @IsOptional()
  recordId?: string;

  @ApiProperty({ required: false, description: 'Filter by change type (CREATE, UPDATE, DELETE)' })
  @IsEnum(['CREATE', 'UPDATE', 'DELETE'])
  @IsOptional()
  changeType?: 'CREATE' | 'UPDATE' | 'DELETE';

  @ApiProperty({ required: false, description: 'Filter by device ID' })
  @IsString()
  @IsOptional()
  deviceId?: string;

  @ApiProperty({ required: false, description: 'Filter by user identifier' })
  @IsString()
  @IsOptional()
  userIdentifier?: string;

  @ApiProperty({ required: false, description: 'Start date for filtering (ISO format)' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ required: false, description: 'End date for filtering (ISO format)' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ required: false, description: 'Page number for pagination', default: 1 })
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ required: false, description: 'Items per page for pagination', default: 20 })
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;
}
