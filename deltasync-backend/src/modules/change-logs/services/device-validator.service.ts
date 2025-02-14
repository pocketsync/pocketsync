import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DeviceValidatorService {
  private readonly logger = new Logger(DeviceValidatorService.name);

  constructor(private prisma: PrismaService) {}

  async validateDevice(userIdentifier: string, deviceId: string): Promise<void> {
    const device = await this.prisma.device.findFirst({
      where: { deviceId, userIdentifier },
      select: { userIdentifier: true },
    });

    if (!device) {
      this.logger.error(`Device validation failed: Device ${deviceId} not found for user ${userIdentifier}`);
      throw new Error(`Device ${deviceId} not found for user ${userIdentifier}`);
    }

    this.logger.debug(`Device ${deviceId} validated for user ${userIdentifier}`);
  }
}