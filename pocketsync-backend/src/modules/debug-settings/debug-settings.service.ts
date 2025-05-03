import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DebugSettingsDto } from './dto/debug-settings.dto';
import { UpdateDebugSettingsDto } from './dto/update-debug-settings.dto';
import { LogLevel } from '@prisma/client';

@Injectable()
export class DebugSettingsService {
  private readonly logger = new Logger(DebugSettingsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get debug settings for a project
   */
  async getDebugSettings(projectId: string): Promise<DebugSettingsDto> {
    const settings = await this.prisma.debugSettings.findUnique({
      where: { projectId }
    });

    if (!settings) {
      // Create default settings if none exist
      return this.createDefaultDebugSettings(projectId);
    }

    return this.mapToDto(settings);
  }

  /**
   * Update debug settings for a project
   */
  async updateDebugSettings(
    projectId: string,
    updateDto: UpdateDebugSettingsDto
  ): Promise<DebugSettingsDto> {
    // Check if settings exist
    const existingSettings = await this.prisma.debugSettings.findUnique({
      where: { projectId }
    });

    if (!existingSettings) {
      // Create with default values and apply updates
      const defaultSettings = await this.createDefaultDebugSettings(projectId);
      
      // Apply updates to default settings
      return this.updateDebugSettings(projectId, updateDto);
    }

    // Update existing settings
    const updatedSettings = await this.prisma.debugSettings.update({
      where: { projectId },
      data: {
        ...updateDto.logLevel !== undefined && { logLevel: updateDto.logLevel },
        ...updateDto.retentionDays !== undefined && { retentionDays: updateDto.retentionDays },
        ...updateDto.enableDataDiffing !== undefined && { enableDataDiffing: updateDto.enableDataDiffing },
        ...updateDto.enableDetailedLogs !== undefined && { enableDetailedLogs: updateDto.enableDetailedLogs },
        ...updateDto.enableMetricsCollection !== undefined && { enableMetricsCollection: updateDto.enableMetricsCollection },
        ...updateDto.notifyOnError !== undefined && { notifyOnError: updateDto.notifyOnError },
        ...updateDto.notifyOnWarning !== undefined && { notifyOnWarning: updateDto.notifyOnWarning }
      }
    });

    return this.mapToDto(updatedSettings);
  }

  /**
   * Reset debug settings to defaults for a project
   */
  async resetDebugSettings(projectId: string): Promise<DebugSettingsDto> {
    // Check if settings exist
    const existingSettings = await this.prisma.debugSettings.findUnique({
      where: { projectId }
    });

    if (!existingSettings) {
      return this.createDefaultDebugSettings(projectId);
    }

    // Update with default values
    const updatedSettings = await this.prisma.debugSettings.update({
      where: { projectId },
      data: {
        logLevel: LogLevel.INFO,
        retentionDays: 30,
        enableDataDiffing: true,
        enableDetailedLogs: false,
        enableMetricsCollection: true,
        notifyOnError: true,
        notifyOnWarning: false
      }
    });

    return this.mapToDto(updatedSettings);
  }

  /**
   * Create default debug settings for a project
   */
  private async createDefaultDebugSettings(projectId: string): Promise<DebugSettingsDto> {
    try {
      const settings = await this.prisma.debugSettings.create({
        data: {
          projectId,
          logLevel: LogLevel.INFO,
          retentionDays: 30,
          enableDataDiffing: true,
          enableDetailedLogs: false,
          enableMetricsCollection: true,
          notifyOnError: true,
          notifyOnWarning: false
        }
      });

      return this.mapToDto(settings);
    } catch (error) {
      this.logger.error(`Failed to create default debug settings for project ${projectId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if detailed logging is enabled for a project
   */
  async isDetailedLoggingEnabled(projectId: string): Promise<boolean> {
    const settings = await this.getDebugSettings(projectId);
    return settings.enableDetailedLogs;
  }

  /**
   * Check if metrics collection is enabled for a project
   */
  async isMetricsCollectionEnabled(projectId: string): Promise<boolean> {
    const settings = await this.getDebugSettings(projectId);
    return settings.enableMetricsCollection;
  }

  /**
   * Get the log level for a project
   */
  async getLogLevel(projectId: string): Promise<LogLevel> {
    const settings = await this.getDebugSettings(projectId);
    return settings.logLevel;
  }

  /**
   * Map database model to DTO
   */
  private mapToDto(settings: any): DebugSettingsDto {
    return {
      id: settings.id,
      projectId: settings.projectId,
      logLevel: settings.logLevel,
      retentionDays: settings.retentionDays,
      enableDataDiffing: settings.enableDataDiffing,
      enableDetailedLogs: settings.enableDetailedLogs,
      enableMetricsCollection: settings.enableMetricsCollection,
      notifyOnError: settings.notifyOnError,
      notifyOnWarning: settings.notifyOnWarning
    };
  }
}
