import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncChange, SyncChangeBatchDto } from './dto/sync-change-batch.dto';
import { ApiHeader, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DefaultSuccessResponse } from 'src/common/dto/default-success.response';
import { SdkAuthGuard } from 'src/common/guards/sdk-auth.guard';
import { UseGuards } from '@nestjs/common';
import { IUserDevice, UserDevice } from './decorators/user-device.decorator';


@ApiHeader({
  name: 'Authorization',
  description: 'Project auth token',
  required: true
})
@ApiHeader({
  name: 'x-project-id',
  description: 'Project ID',
  required: true
})
@Controller('sync')
@UseGuards(SdkAuthGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) { }

  @Post('/upload')
  @ApiOperation({ summary: 'Upload changes' })
  @ApiResponse({
    status: 200,
    description: 'Changes uploaded successfully',
    type: DefaultSuccessResponse
  })
  uploadChanges(@UserDevice() userDevice: IUserDevice, @Body() changes: SyncChangeBatchDto) {
    return this.syncService.uploadChanges(userDevice.appUser, userDevice.device, changes);
  }

  @Get('/download')
  @ApiOperation({ summary: 'Download changes' })
  @ApiResponse({
    status: 200,
    description: 'Changes downloaded successfully',
    type: [SyncChange]
  })
  downloadChanges(@UserDevice() userDevice: IUserDevice, @Query('since') since: number) {
    return this.syncService.downloadChanges(userDevice.appUser, userDevice.device, since);
  }
}
