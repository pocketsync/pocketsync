import { ApiProperty } from '@nestjs/swagger';

export class DeviceChangeDto {
  @ApiProperty({ description: 'Unique identifier for the device change' })
  id: string;

  @ApiProperty({ description: 'Change identifier' })
  changeId: string;

  @ApiProperty({ description: 'Project identifier' })
  projectId: string;

  @ApiProperty({ description: 'User identifier' })
  userIdentifier: string;

  @ApiProperty({ description: 'Device identifier' })
  deviceId: string;

  @ApiProperty({ description: 'Type of change (CREATE, UPDATE, DELETE)' })
  changeType: string;

  @ApiProperty({ description: 'Name of the table being changed' })
  tableName: string;

  @ApiProperty({ description: 'ID of the record being changed' })
  recordId: string;

  @ApiProperty({ description: 'Change data (JSON)' })
  data: Record<string, any>;

  @ApiProperty({ description: 'Timestamp when the change was made on the client' })
  clientTimestamp: Date;

  @ApiProperty({ description: 'Client version number' })
  clientVersion: number;

  @ApiProperty({ description: 'Timestamp when the change was created on the server' })
  createdAt: Date;

  @ApiProperty({ description: 'Timestamp when the change was deleted (if applicable)' })
  deletedAt: Date | null;

  @ApiProperty({ description: 'Sync session identifier (if applicable)' })
  syncSessionId: string | null;
}

export class DeviceChangeResponseDto {
  @ApiProperty({ type: [DeviceChangeDto] })
  items: DeviceChangeDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  pages: number;
}

export class DeviceChangeTimelineDto {
  @ApiProperty({ description: 'Record identifier' })
  recordId: string;

  @ApiProperty({ description: 'Table name' })
  tableName: string;

  @ApiProperty({ type: [DeviceChangeDto] })
  changes: DeviceChangeDto[];
}
