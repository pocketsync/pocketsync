import { Controller, Get, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DevicesService } from './devices.service';
import { DeviceDto } from './dto/device.dto';
import { DeviceResponseDto } from './dto/responses/device-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SyncStatus } from '@prisma/client';
import { SdkAuthGuard } from 'src/common/guards/sdk-auth.guard';

@ApiTags('Devices')
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get('user/:userIdentifier')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get devices for a specific user' })
  @ApiParam({ name: 'userIdentifier', description: 'User identifier' })
  @ApiQuery({ name: 'includeDeleted', description: 'Include deleted devices', required: false, type: Boolean })
  @ApiQuery({ name: 'limit', description: 'Number of devices to return', required: false, type: Number })
  @ApiQuery({ name: 'offset', description: 'Number of devices to skip', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Devices found',
    type: DeviceResponseDto
  })
  async getDevicesByUser(
    @Param('userIdentifier') userIdentifier: string,
    @Query('includeDeleted') includeDeleted?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ): Promise<DeviceResponseDto> {
    const parsedIncludeDeleted = includeDeleted === 'true';
    const { devices, total } = await this.devicesService.getDevicesByUser(
      userIdentifier,
      parsedIncludeDeleted,
      limit ? Number(limit) : 50,
      offset ? Number(offset) : 0
    );

    return {
      devices,
      total,
      success: true
    };
  }

  @Get('project/:projectId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get devices for a specific project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiQuery({ name: 'includeDeleted', description: 'Include deleted devices', required: false, type: Boolean })
  @ApiQuery({ name: 'limit', description: 'Number of devices to return', required: false, type: Number })
  @ApiQuery({ name: 'offset', description: 'Number of devices to skip', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Devices found',
    type: DeviceResponseDto
  })
  async getDevicesByProject(
    @Param('projectId') projectId: string,
    @Query('includeDeleted') includeDeleted?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ): Promise<DeviceResponseDto> {
    const parsedIncludeDeleted = includeDeleted === 'true';
    const { devices, total } = await this.devicesService.getDevicesByProject(
      projectId,
      parsedIncludeDeleted,
      limit ? Number(limit) : 50,
      offset ? Number(offset) : 0
    );

    return {
      devices,
      total,
      success: true
    };
  }

  @Get(':deviceId/user/:userIdentifier')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a device by ID and user identifier' })
  @ApiParam({ name: 'deviceId', description: 'Device ID' })
  @ApiParam({ name: 'userIdentifier', description: 'User identifier' })
  @ApiResponse({
    status: 200,
    description: 'Device found',
    type: DeviceDto
  })
  @ApiResponse({ status: 404, description: 'Device not found' })
  async getDevice(
    @Param('deviceId') deviceId: string,
    @Param('userIdentifier') userIdentifier: string
  ): Promise<DeviceDto> {
    return this.devicesService.getDevice(deviceId, userIdentifier);
  }

  @Put(':deviceId/user/:userIdentifier/info')
  @ApiOperation({ summary: 'Update device information' })
  @ApiParam({ name: 'deviceId', description: 'Device ID' })
  @ApiParam({ name: 'userIdentifier', description: 'User identifier' })
  @ApiResponse({
    status: 200,
    description: 'Device information updated',
    type: DeviceDto
  })
  @ApiResponse({ status: 404, description: 'Device not found' })
  @UseGuards(SdkAuthGuard)
  async updateDeviceInfo(
    @Param('deviceId') deviceId: string,
    @Param('userIdentifier') userIdentifier: string,
    @Body() deviceInfo: Record<string, any>
  ): Promise<DeviceDto> {
    return this.devicesService.updateDeviceInfo(deviceId, userIdentifier, deviceInfo);
  }

  @Put(':deviceId/user/:userIdentifier/status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update device sync status' })
  @ApiParam({ name: 'deviceId', description: 'Device ID' })
  @ApiParam({ name: 'userIdentifier', description: 'User identifier' })
  @ApiResponse({
    status: 200,
    description: 'Device sync status updated',
    type: DeviceDto
  })
  @ApiResponse({ status: 404, description: 'Device not found' })
  async updateSyncStatus(
    @Param('deviceId') deviceId: string,
    @Param('userIdentifier') userIdentifier: string,
    @Body() body: { status: SyncStatus }
  ): Promise<DeviceDto> {
    return this.devicesService.updateSyncStatus(deviceId, userIdentifier, body.status);
  }

  @Delete(':deviceId/user/:userIdentifier')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a device (soft delete)' })
  @ApiParam({ name: 'deviceId', description: 'Device ID' })
  @ApiParam({ name: 'userIdentifier', description: 'User identifier' })
  @ApiResponse({
    status: 200,
    description: 'Device deleted',
    type: DeviceDto
  })
  @ApiResponse({ status: 404, description: 'Device not found' })
  async deleteDevice(
    @Param('deviceId') deviceId: string,
    @Param('userIdentifier') userIdentifier: string
  ): Promise<DeviceDto> {
    return this.devicesService.deleteDevice(deviceId, userIdentifier);
  }
}
