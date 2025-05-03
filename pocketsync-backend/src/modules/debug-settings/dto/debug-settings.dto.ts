import { ApiProperty } from '@nestjs/swagger';
import { LogLevel } from '@prisma/client';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class DebugSettingsDto {
  @ApiProperty({
    description: 'Unique identifier for the debug settings',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  })
  id: string;

  @ApiProperty({
    description: 'Project identifier',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  })
  @IsUUID()
  projectId: string;

  @ApiProperty({
    description: 'Log level for the project',
    enum: LogLevel,
    example: 'INFO',
    default: 'INFO'
  })
  @IsEnum(LogLevel)
  logLevel: LogLevel;

  @ApiProperty({
    description: 'Number of days to retain logs and metrics',
    example: 30,
    default: 30,
    minimum: 1,
    maximum: 365
  })
  @IsInt()
  @Min(1)
  @Max(365)
  retentionDays: number;

  @ApiProperty({
    description: 'Enable data diffing for changes',
    example: true,
    default: true
  })
  @IsBoolean()
  enableDataDiffing: boolean;

  @ApiProperty({
    description: 'Enable detailed logs',
    example: false,
    default: false
  })
  @IsBoolean()
  enableDetailedLogs: boolean;

  @ApiProperty({
    description: 'Enable metrics collection',
    example: true,
    default: true
  })
  @IsBoolean()
  enableMetricsCollection: boolean;

  @ApiProperty({
    description: 'Notify on error',
    example: true,
    default: true
  })
  @IsBoolean()
  notifyOnError: boolean;

  @ApiProperty({
    description: 'Notify on warning',
    example: false,
    default: false
  })
  @IsBoolean()
  notifyOnWarning: boolean;
}
