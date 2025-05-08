import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Redis } from '@upstash/redis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService implements OnModuleInit {
  private readonly logger = new Logger(RedisService.name);
  private redisClient: Redis;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    try {
      this.redisClient = new Redis({
        url: this.configService.get<string>('UPSTASH_REDIS_URL'),
        token: this.configService.get<string>('UPSTASH_REDIS_REST_TOKEN'),
      });
      this.logger.log('Redis client initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize Redis client: ${error.message}`);
      throw error;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      return await this.redisClient.get(key);
    } catch (error) {
      this.logger.error(`Error getting key ${key}: ${error.message}`);
      return null;
    }
  }

  async set(key: string, value: any, expireInSeconds?: number): Promise<void> {
    try {
      if (expireInSeconds) {
        await this.redisClient.set(key, value, { ex: expireInSeconds });
      } else {
        await this.redisClient.set(key, value);
      }
    } catch (error) {
      this.logger.error(`Error setting key ${key}: ${error.message}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redisClient.del(key);
    } catch (error) {
      this.logger.error(`Error deleting key ${key}: ${error.message}`);
    }
  }

  async hset(key: string, field: string, value: any): Promise<void> {
    try {
      await this.redisClient.hset(key, { [field]: value });
    } catch (error) {
      this.logger.error(`Error setting hash field ${key}:${field}: ${error.message}`);
    }
  }

  async hget<T>(key: string, field: string): Promise<T | null> {
    try {
      return await this.redisClient.hget(key, field);
    } catch (error) {
      this.logger.error(`Error getting hash field ${key}:${field}: ${error.message}`);
      return null;
    }
  }

  async hdel(key: string, field: string): Promise<void> {
    try {
      await this.redisClient.hdel(key, field);
    } catch (error) {
      this.logger.error(`Error deleting hash field ${key}:${field}: ${error.message}`);
    }
  }

  async hgetall<T>(key: string): Promise<Record<string, T> | null> {
    try {
      return await this.redisClient.hgetall(key);
    } catch (error) {
      this.logger.error(`Error getting all hash fields for ${key}: ${error.message}`);
      return null;
    }
  }

  // Methods specifically for online device tracking
  async addOnlineDevice(userId: string, deviceId: string, clientId: string): Promise<void> {
    const deviceKey = `online:user:${userId}`;
    await this.hset(deviceKey, deviceId, {
      clientId,
      lastSeen: Date.now()
    });
  }

  async removeOnlineDevice(userId: string, deviceId: string): Promise<void> {
    const deviceKey = `online:user:${userId}`;
    await this.hdel(deviceKey, deviceId);
  }

  async getOnlineDevices(userId: string): Promise<Record<string, { clientId: string, lastSeen: number }>> {
    const deviceKey = `online:user:${userId}`;
    return await this.hgetall(deviceKey) || {};
  }

  async storeClientInfo(clientId: string, userId: string, deviceId: string): Promise<void> {
    await this.set(`client:${clientId}`, { userId, deviceId }, 86400); // Store for 24 hours
  }

  async getClientInfo(clientId: string): Promise<{ userId: string, deviceId: string } | null> {
    return await this.get(`client:${clientId}`);
  }

  async removeClientInfo(clientId: string): Promise<void> {
    await this.del(`client:${clientId}`);
  }
}
