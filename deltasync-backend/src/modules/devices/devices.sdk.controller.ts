import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { ApiKeyAuthGuard } from '../../common/guards/api-key-auth.guard';

@Controller('sdk/devices')
@UseGuards(ApiKeyAuthGuard)
export class DevicesSdkController {
  constructor(private readonly devicesService: DevicesService) {}
}