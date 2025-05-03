import { ApiProperty } from '@nestjs/swagger';
import { ConflictResolutionStrategy } from '@prisma/client';

export class ConflictDto {
  @ApiProperty({
    description: 'Unique identifier for the conflict',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  })
  id: string;

  @ApiProperty({
    description: 'Project identifier',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  })
  projectId: string;

  @ApiProperty({
    description: 'User identifier',
    example: 'user-456'
  })
  userIdentifier: string;

  @ApiProperty({
    description: 'Device identifier',
    example: 'device-123'
  })
  deviceId: string;

  @ApiProperty({
    description: 'Table name where the conflict occurred',
    example: 'todos'
  })
  tableName: string;

  @ApiProperty({
    description: 'Record ID that has a conflict',
    example: 'todo-123'
  })
  recordId: string;

  @ApiProperty({
    description: 'Client data that caused the conflict',
    example: { title: 'Buy milk', completed: true }
  })
  clientData: Record<string, any>;

  @ApiProperty({
    description: 'Server data that conflicts with client data',
    example: { title: 'Buy milk', completed: false }
  })
  serverData: Record<string, any>;

  @ApiProperty({
    description: 'Strategy used to resolve the conflict',
    enum: ConflictResolutionStrategy,
    example: 'CLIENT_WINS'
  })
  resolutionStrategy: ConflictResolutionStrategy;

  @ApiProperty({
    description: 'Data after conflict resolution',
    example: { title: 'Buy milk', completed: true }
  })
  resolvedData: Record<string, any>;

  @ApiProperty({
    description: 'When the conflict was detected',
    example: '2023-01-01T12:00:00Z'
  })
  detectedAt: Date;

  @ApiProperty({
    description: 'When the conflict was resolved',
    example: '2023-01-01T12:01:00Z'
  })
  resolvedAt: Date;

  @ApiProperty({
    description: 'Associated sync session ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    required: false
  })
  syncSessionId?: string;

  @ApiProperty({
    description: 'Additional metadata for the conflict',
    example: { conflictFields: ['completed'] },
    required: false
  })
  metadata?: Record<string, any>;
}
