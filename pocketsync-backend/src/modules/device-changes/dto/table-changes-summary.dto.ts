import { ApiProperty } from '@nestjs/swagger';

export class TableChangeCountDto {
  @ApiProperty({ description: 'Number of CREATE operations' })
  creates: number;

  @ApiProperty({ description: 'Number of UPDATE operations' })
  updates: number;

  @ApiProperty({ description: 'Number of DELETE operations' })
  deletes: number;

  @ApiProperty({ description: 'Total number of changes' })
  total: number;
}

export class TableChangesSummaryDto {
  @ApiProperty({ description: 'Table name' })
  tableName: string;

  @ApiProperty({ type: TableChangeCountDto })
  counts: TableChangeCountDto;
}

export class TableChangesSummaryResponseDto {
  @ApiProperty({ type: [TableChangesSummaryDto] })
  tables: TableChangesSummaryDto[];
}
