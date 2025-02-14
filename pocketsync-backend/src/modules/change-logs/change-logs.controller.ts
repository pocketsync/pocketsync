import { Controller, Post, Body, UseGuards, Headers, UnauthorizedException, Get, HttpException, HttpStatus, Logger, NotFoundException } from '@nestjs/common';
import { ChangeLogsService } from './change-logs.service';
import { DevicesService } from '../devices/devices.service';
import { SdkAuthGuard } from '../../common/guards/sdk-auth.guard';
import { ChangeSubmissionDto } from './dto/change-submission.dto';
import { AppUsersService } from '../app-users/app-users.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('sdk/changes')
@UseGuards(SdkAuthGuard)
export class ChangeLogsController {
  private readonly logger = new Logger(ChangeLogsController.name);

  constructor(
    private readonly changesService: ChangeLogsService,
    private readonly devicesService: DevicesService,
    private readonly appUsersService: AppUsersService,
    private readonly prisma: PrismaService,
  ) { }

  @Post()
  async submitChange(
    @Headers('x-user-id') userIdentifier: string,
    @Headers('x-project-id') projectId: string,
    @Headers('x-device-id') deviceId: string,
    @Body() submission: ChangeSubmissionDto,
  ) {
    if (!userIdentifier || !deviceId) {
      throw new UnauthorizedException('User identifier and device id are required');
    }

    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        deletedAt: null
      }
    });

    if (!project) {
      throw new NotFoundException('Project not found or has been deleted');
    }

    const appUser = await this.appUsersService.getOrCreateUserFromId(userIdentifier, projectId)
    const device = await this.devicesService.getOrCreateDeviceFromId(deviceId, userIdentifier, projectId)

    try {
      await this.changesService.processChange(
        projectId,
        appUser.userIdentifier,
        device.deviceId,
        submission.changeSets,
      );
      return {
        status: 'success',
        processed: true,
        message: 'Changes processed successfully'
      };
    } catch (error) {
      this.logger.error('Error processing change', {
        error: error.message,
        userIdentifier,
        deviceId: device.deviceId,
        stack: error.stack,
      });
      throw new HttpException(
        {
          status: 'error',
          processed: false,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}