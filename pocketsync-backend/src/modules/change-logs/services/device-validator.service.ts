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
        const startTime = Date.now();
        const cacheKey = `device:${userIdentifier}:${deviceId}`;

        try {
            // Check cache first
            const cachedValidation = await this.cacheManager.get(cacheKey);
            if (cachedValidation) {
                this.logger.debug(`Using cached validation for device ${deviceId}`);
                return;
            }

            // Attempt to find or create the device
            if (projectId) {
                const device = await this.devicesService.getOrCreateDeviceFromId(deviceId, userIdentifier, projectId);
                if (device) {
                    await this.cacheManager.set(cacheKey, true, this.CACHE_TTL);
                    this.logger.debug(`Device ${deviceId} validated and cached for user ${userIdentifier}`);
                    return;
                }
            }

            // If no projectId provided or device creation failed, check if device exists
            const device = await this.prisma.device.findFirst({
                where: { deviceId, userIdentifier, deletedAt: null },
                select: { userIdentifier: true },
            });

            if (!device) {
                this.logger.error(`Device validation failed: Device ${deviceId} not found for user ${userIdentifier}`);
                throw new DeviceNotFoundException(deviceId, userIdentifier);
            }

            await this.cacheManager.set(cacheKey, true, this.CACHE_TTL);
            this.logger.debug(`Device ${deviceId} validated for user ${userIdentifier}`);

        } finally {
            const duration = Date.now() - startTime;
            this.recordMetrics(duration);
        }
    }

    private recordMetrics(duration: number): void {
        this.logger.debug(`Device validation took ${duration}ms`);
    }
}