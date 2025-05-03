import { Controller, Get, Post, Body, Param, Put, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DebugSettingsService } from './debug-settings.service';
import { DebugSettingsDto } from './dto/debug-settings.dto';
import { UpdateDebugSettingsDto } from './dto/update-debug-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Debug Settings')
@Controller('debug-settings')
@UseGuards(JwtAuthGuard)
export class DebugSettingsController {
  constructor(private readonly debugSettingsService: DebugSettingsService) {}

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get debug settings for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: 200,
    description: 'Debug settings found',
    type: DebugSettingsDto
  })
  async getDebugSettings(@Param('projectId') projectId: string): Promise<DebugSettingsDto> {
    return this.debugSettingsService.getDebugSettings(projectId);
  }

  @Put('project/:projectId')
  @ApiOperation({ summary: 'Update debug settings for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: 200,
    description: 'Debug settings updated',
    type: DebugSettingsDto
  })
  async updateDebugSettings(
    @Param('projectId') projectId: string,
    @Body() updateDto: UpdateDebugSettingsDto
  ): Promise<DebugSettingsDto> {
    return this.debugSettingsService.updateDebugSettings(projectId, updateDto);
  }

  @Post('project/:projectId/reset')
  @ApiOperation({ summary: 'Reset debug settings to defaults for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: 200,
    description: 'Debug settings reset to defaults',
    type: DebugSettingsDto
  })
  async resetDebugSettings(@Param('projectId') projectId: string): Promise<DebugSettingsDto> {
    return this.debugSettingsService.resetDebugSettings(projectId);
  }
}
