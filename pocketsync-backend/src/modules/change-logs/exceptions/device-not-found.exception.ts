import { NotFoundException } from '@nestjs/common';

export class DeviceNotFoundException extends NotFoundException {
  constructor(deviceId: string, userIdentifier: string) {
    super(`Device ${deviceId} not found for user ${userIdentifier}`);
  }
}