import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PaginationQueryDto {
  @ApiProperty({
    description: 'Page number (starts from 1)',
    minimum: 1,
    default: 1,
    required: false,
    type: Number
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
    default: 10,
    required: false,
    type: Number
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}