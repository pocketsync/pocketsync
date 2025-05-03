import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsObject, IsEnum, IsOptional } from 'class-validator';
import { ConflictResolutionStrategy } from '@prisma/client';

export class ReportConflictDto {
  @ApiProperty({
    description: 'Table name where the conflict occurred',
    example: 'todos'
  })
  @IsNotEmpty()
  @IsString()
  tableName: string;

  @ApiProperty({
    description: 'Record ID that has a conflict',
    example: 'todo-123'
  })
  @IsNotEmpty()
  @IsString()
  recordId: string;

  @ApiProperty({
    description: 'Client data that caused the conflict',
    example: { title: 'Buy milk', completed: true }
  })
  @IsNotEmpty()
  @IsObject()
  clientData: Record<string, any>;

  @ApiProperty({
    description: 'Server data that conflicts with client data',
    example: { title: 'Buy milk', completed: false }
  })
  @IsNotEmpty()
  @IsObject()
  serverData: Record<string, any>;

  @ApiProperty({
    description: 'Strategy used to resolve the conflict',
    enum: ConflictResolutionStrategy,
    example: 'CLIENT_WINS'
  })
  @IsNotEmpty()
  @IsEnum(ConflictResolutionStrategy)
  resolutionStrategy: ConflictResolutionStrategy;

  @ApiProperty({
    description: 'Data after conflict resolution',
    example: { title: 'Buy milk', completed: true }
  })
  @IsNotEmpty()
  @IsObject()
  resolvedData: Record<string, any>;

  @ApiProperty({
    description: 'Additional metadata for the conflict',
    example: { conflictFields: ['completed'] },
    required: false
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
