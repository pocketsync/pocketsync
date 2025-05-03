import { ApiProperty } from '@nestjs/swagger';
import { DeviceDto } from '../device.dto';

export class DeviceResponseDto {
  @ApiProperty({
    description: 'Device details',
    type: [DeviceDto]
  })
  devices: DeviceDto[];

  @ApiProperty({
    description: 'Total count of devices matching the filter criteria',
    example: 100
  })
  total: number;

  @ApiProperty({
    description: 'Success status of the operation',
    example: true
  })
  success: boolean;
}
