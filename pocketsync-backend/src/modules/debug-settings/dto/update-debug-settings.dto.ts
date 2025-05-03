import { ApiProperty } from '@nestjs/swagger';
import { LogLevel } from '@prisma/client';
import { IsBoolean, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateDebugSettingsDto {
  @ApiProperty({
    description: 'Log level for the project',
    enum: LogLevel,
    example: 'INFO',
    required: false
  })
  @IsEnum(LogLevel)
  @IsOptional()
  logLevel?: LogLevel;

  @ApiProperty({
    description: 'Number of days to retain logs and metrics',
    example: 30,
    minimum: 1,
    maximum: 365,
    required: false
  })
  @IsInt()
  @Min(1)
  @Max(365)
  @IsOptional()
  retentionDays?: number;

  @ApiProperty({
    description: 'Enable data diffing for changes',
    example: true,
    required: false
  })
  @IsBoolean()
  @IsOptional()
  enableDataDiffing?: boolean;

  @ApiProperty({
    description: 'Enable detailed logs',
    example: false,
    required: false
  })
  @IsBoolean()
  @IsOptional()
  enableDetailedLogs?: boolean;

  @ApiProperty({
    description: 'Enable metrics collection',
    example: true,
    required: false
  })
  @IsBoolean()
  @IsOptional()
  enableMetricsCollection?: boolean;

  @ApiProperty({
    description: 'Notify on error',
    example: true,
    required: false
  })
  @IsBoolean()
  @IsOptional()
  notifyOnError?: boolean;

  @ApiProperty({
    description: 'Notify on warning',
    example: false,
    required: false
  })
  @IsBoolean()
  @IsOptional()
  notifyOnWarning?: boolean;
}
