import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ChangeStatsService {
  private readonly logger = new Logger(ChangeStatsService.name);
  private skippedChangeStats = {
    invalidTimestamp: 0,
    olderVersion: 0,
    total: 0,
    lastReset: new Date()
  };

  constructor() {
    // Reset stats every hour
    setInterval(() => this.resetSkippedChangeStats(), 60 * 60 * 1000);
  }

  incrementInvalidTimestamp(timestamp: number) {
    this.skippedChangeStats.invalidTimestamp++;
    this.skippedChangeStats.total++;
    this.logger.warn(`Change skipped: Invalid timestamp ${timestamp}, drift: ${Date.now() - timestamp}ms`);
  }

  incrementOlderVersion(tableName: string, primaryKey: string, currentVersion: number, incomingVersion: number) {
    this.skippedChangeStats.olderVersion++;
    this.skippedChangeStats.total++;
    this.logger.debug(
      `Change skipped: Older version for ${tableName}:${primaryKey} ` +
      `(current: v${currentVersion}, incoming: v${incomingVersion})`
    );
  }

  getStats() {
    return { ...this.skippedChangeStats };
  }

  private resetSkippedChangeStats() {
    const previousStats = { ...this.skippedChangeStats };
    this.skippedChangeStats = {
      invalidTimestamp: 0,
      olderVersion: 0,
      total: 0,
      lastReset: new Date()
    };
    this.logger.log('Reset skipped change stats', {
      previousStats,
      timePeriod: `${Math.round((Date.now() - previousStats.lastReset.getTime()) / 1000 / 60)}m`
    });
  }
}