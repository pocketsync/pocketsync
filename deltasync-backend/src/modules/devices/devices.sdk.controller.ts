import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { ApiKeyAuthGuard } from '../../common/guards/api-key-auth.guard';
import { CreateDeviceDto } from './dto/create-device.dto';

@Controller('sdk/devices')
@UseGuards(ApiKeyAuthGuard)
export class DevicesSdkController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  create(@Body() createDeviceDto: CreateDeviceDto) {
    return this.devicesService.createFromSdk(createDeviceDto);
  }
}