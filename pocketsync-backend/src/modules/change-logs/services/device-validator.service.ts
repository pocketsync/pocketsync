import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DeviceNotFoundException } from '../exceptions/device-not-found.exception';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { DevicesService } from '../../devices/devices.service';

@Injectable()
export class DeviceValidatorService {
    private readonly logger = new Logger(DeviceValidatorService.name);
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    constructor(
        private prisma: PrismaService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        private devicesService: DevicesService,
    ) { }

    async validateDevice(userIdentifier: string, deviceId: string, projectId?: string): Promise<void> {
        const cacheKey = `device:${userIdentifier}:${deviceId}`;
        const cachedDevice = await this.cacheManager.get(cacheKey);

        if (cachedDevice) {
            await this.updateLastSeen(userIdentifier, deviceId);
            return;
        }

        const startTime = Date.now();

        try {
            // First try to find the device
            const device = await this.prisma.device.findFirst({
                where: { deviceId, userIdentifier, deletedAt: null },
                select: { userIdentifier: true },
            });

            if (!device) {
                if (projectId) {
                    this.logger.log(`Device ${deviceId} not found for user ${userIdentifier}, creating it...`);
                    await this.devicesService.getOrCreateDeviceFromId(deviceId, userIdentifier, projectId);
                } else {
                    this.logger.error(`Device validation failed: Device ${deviceId} not found for user ${userIdentifier}`);
                    throw new DeviceNotFoundException(deviceId, userIdentifier);
                }
            }

            await this.cacheManager.set(cacheKey, true, this.CACHE_TTL);
            this.logger.debug(`Device ${deviceId} validated for user ${userIdentifier}`);

        } finally {
            const duration = Date.now() - startTime;
            this.recordMetrics(duration);
        }
    }

    private async updateLastSeen(userIdentifier: string, deviceId: string): Promise<void> {
        await this.prisma.device.update({
            where: { userIdentifier, deviceId },
            data: { lastSeenAt: new Date() },
        });
    }

    private recordMetrics(duration: number): void {
        this.logger.debug(`Device validation took ${duration}ms`);
    }
}