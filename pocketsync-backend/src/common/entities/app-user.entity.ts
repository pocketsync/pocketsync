import { ApiExtraModels, ApiProperty } from "@nestjs/swagger";
import { DeviceDto } from "src/modules/devices/dto/device.dto";

@ApiExtraModels(DeviceDto)
export class AppUserDto {
    @ApiProperty({
        description: 'Unique identifier for the app user',
        example: 'user123'
    })
    userIdentifier: string;

    @ApiProperty({
        description: 'Project ID this user belongs to',
        example: '123e4567-e89b-12d3-a456-426614174000'
    })
    projectId: string;

    @ApiProperty({
        description: 'Devices associated with this user',
        isArray: true,
        type: () => DeviceDto
    })
    devices: DeviceDto[];

    @ApiProperty({
        description: 'When the user was created',
        example: '2024-02-12T19:32:03.000Z'
    })
    createdAt: Date;

    @ApiProperty({
        description: 'When the user was deleted, if applicable',
        example: '2024-03-15T10:45:30.000Z',
        nullable: true
    })
    deletedAt: Date | null;
}
