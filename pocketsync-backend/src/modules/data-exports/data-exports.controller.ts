import { Controller, Get, Post, Body, Param, Query, UseGuards, Res } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DataExportsService } from './data-exports.service';
import { DataExportJobDto } from './dto/data-export-job.dto';
import { CreateDataExportJobDto } from './dto/create-data-export-job.dto';
import { DataExportJobResponseDto } from './dto/responses/data-export-job-response.dto';
import { DataExportJobsResponseDto } from './dto/responses/data-export-jobs-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

@ApiTags('Data Exports')
@Controller('data-exports')
@UseGuards(JwtAuthGuard)
export class DataExportsController {
  private readonly exportsDir: string;

  constructor(private readonly dataExportsService: DataExportsService) {
    this.exportsDir = path.join(os.tmpdir(), 'pocketsync-exports');
  }

  @Post()
  @ApiOperation({ summary: 'Create a new data export job' })
  @ApiResponse({
    status: 201,
    description: 'Data export job created',
    type: DataExportJobResponseDto
  })
  async createExportJob(
    @Body() createDto: CreateDataExportJobDto,
    @Query('projectId') projectId: string,
    @Query('userId') userId: string
  ): Promise<DataExportJobResponseDto> {
    const job = await this.dataExportsService.createExportJob(
      projectId,
      userId,
      createDto
    );

    return {
      job,
      success: true
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a data export job by ID' })
  @ApiParam({ name: 'id', description: 'Data export job ID' })
  @ApiResponse({
    status: 200,
    description: 'Data export job found',
    type: DataExportJobResponseDto
  })
  @ApiResponse({ status: 404, description: 'Data export job not found' })
  async getExportJob(@Param('id') id: string): Promise<DataExportJobResponseDto> {
    const job = await this.dataExportsService.getExportJob(id);

    return {
      job,
      success: true
    };
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get data export jobs for a specific project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiQuery({ name: 'limit', description: 'Number of jobs to return', required: false, type: Number })
  @ApiQuery({ name: 'offset', description: 'Number of jobs to skip', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Data export jobs found',
    type: DataExportJobsResponseDto
  })
  async getExportJobsByProject(
    @Param('projectId') projectId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ): Promise<DataExportJobsResponseDto> {
    const { jobs, total } = await this.dataExportsService.getExportJobsByProject(
      projectId,
      limit ? Number(limit) : 50,
      offset ? Number(offset) : 0
    );

    return {
      jobs,
      total,
      success: true
    };
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get data export jobs for a specific user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'limit', description: 'Number of jobs to return', required: false, type: Number })
  @ApiQuery({ name: 'offset', description: 'Number of jobs to skip', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Data export jobs found',
    type: DataExportJobsResponseDto
  })
  async getExportJobsByUser(
    @Param('userId') userId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ): Promise<DataExportJobsResponseDto> {
    const { jobs, total } = await this.dataExportsService.getExportJobsByUser(
      userId,
      limit ? Number(limit) : 50,
      offset ? Number(offset) : 0
    );

    return {
      jobs,
      total,
      success: true
    };
  }

  @Get('download/:id')
  @ApiOperation({ summary: 'Download a data export file' })
  @ApiParam({ name: 'id', description: 'Data export job ID' })
  @ApiResponse({
    status: 200,
    description: 'Data export file'
  })
  @ApiResponse({ status: 404, description: 'Data export job or file not found' })
  async downloadExport(
    @Param('id') id: string,
    @Res() res: Response
  ): Promise<any> {
    const job = await this.dataExportsService.getExportJob(id);

    if (!job.downloadUrl || !job.completedAt) {
      res.status(404).json({
        message: 'Export file not ready or not found',
        success: false
      });
      return;
    }

    if (job.expiresAt && new Date() > job.expiresAt) {
      res.status(404).json({
        message: 'Export file has expired',
        success: false
      });
      return;
    }

    // Extract filename from the download URL
    const filename = path.basename(job.downloadUrl);
    
    // Determine file extension based on format type
    let fileExtension = '.json';
    switch (job.formatType) {
      case 'CSV':
        fileExtension = '.csv';
        break;
      case 'EXCEL':
        fileExtension = '.xlsx';
        break;
    }

    // Find the file in the exports directory
    const files = fs.readdirSync(this.exportsDir);
    const exportFile = files.find(file => 
      file.includes(`export_${id}`) && file.endsWith(fileExtension)
    );

    if (!exportFile) {
      res.status(404).json({
        message: 'Export file not found',
        success: false
      });
      return;
    }

    const filePath = path.join(this.exportsDir, exportFile);
    
    // Set appropriate content type
    let contentType = 'application/json';
    switch (job.formatType) {
      case 'CSV':
        contentType = 'text/csv';
        break;
      case 'EXCEL':
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
    }

    // Set headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=${filename}${fileExtension}`);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  }
}
