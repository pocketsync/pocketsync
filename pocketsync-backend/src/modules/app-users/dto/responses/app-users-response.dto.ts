import { DeviceResponseDto } from "src/modules/devices/dto/device-response.dto";
import { ApiProperty } from '@nestjs/swagger';

export class AppUserResponseDto {
    @ApiProperty({
        description: 'Unique identifier of the app user',
        example: 'user123',
        nullable: false
    })
    userIdentifier: string;

    @ApiProperty({
        description: 'ID of the project the user belongs to',
        example: 'project456',
        nullable: false
    })
    projectId: string;

    @ApiProperty({
        description: 'Timestamp when the user was created',
        example: '2023-01-01T00:00:00Z',
        nullable: false
    })
    createdAt: Date;

    @ApiProperty({
        description: 'Timestamp when the user was last updated',
        example: '2023-01-01T00:00:00Z',
        nullable: true
    })
    lastSeenAt?: Date | null;

    @ApiProperty({
        description: 'List of devices associated with the user',
        type: [DeviceResponseDto]
    })
    devices: DeviceResponseDto[]
}