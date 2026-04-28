import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '@modules/auth/jwt-auth.guard';
import { JobScannerService } from './job-scanner.service';
import {
  UpdateJobScanSettingsDto,
  GetScannedJobsDto,
  UpdateJobStatusDto,
  BulkJobActionDto,
  ManualScanDto,
} from './dto/job-scanner.dto';

interface AuthRequest {
  user: {
    userId: string;
    email: string;
  };
}

@Controller('job-scanner')
@UseGuards(JwtAuthGuard)
export class JobScannerController {
  constructor(private readonly jobScannerService: JobScannerService) {}

  @Get('settings')
  async getSettings(@Request() req: AuthRequest) {
    const userId = req.user.userId;
    return this.jobScannerService.getUserSettings(userId);
  }

  @Put('settings')
  async updateSettings(
    @Request() req: AuthRequest,
    @Body() updateDto: UpdateJobScanSettingsDto,
  ) {
    const userId = req.user.userId;
    try {
      return await this.jobScannerService.updateUserSettings(userId, updateDto);
    } catch (error) {
      console.error('Error updating job scanner settings:', error);
      throw new HttpException(
        error.message || 'Failed to update settings',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('scan')
  async manualScan(
    @Request() req: AuthRequest,
    @Body() scanDto: ManualScanDto,
  ) {
    const userId = req.user.userId;
    try {
      // Start scan asynchronously and return immediately with scanId
      const scanId = await this.jobScannerService.startScanAsync(
        userId,
        true,
        scanDto.force,
      );
      return {
        success: true,
        message: `Scan started`,
        jobsFound: 0,
        scanId: scanId,
      };
    } catch (error) {
      if (error.message === 'Scan already in progress for this user') {
        throw new HttpException(
          'A scan is already in progress. Please wait for it to complete or use force option.',
          HttpStatus.BAD_REQUEST,
        );
      }
      throw error;
    }
  }

  @Post('scan/:scanId/cancel')
  async cancelScan(
    @Request() req: AuthRequest,
    @Param('scanId') scanId: string,
  ) {
    const userId = req.user.userId;
    const result = await this.jobScannerService.cancelScan(userId, scanId);

    if (!result.success) {
      throw new HttpException(result.message, HttpStatus.NOT_FOUND);
    }

    return result;
  }

  @Get('scan-logs/:scanId')
  async getScanLogs(
    @Request() req: AuthRequest,
    @Param('scanId') scanId: string,
  ) {
    const userId = req.user.userId;
    return this.jobScannerService.getScanLogs(userId, scanId);
  }

  @Get('scan-logs')
  async getLatestScanLogs(@Request() req: AuthRequest) {
    const userId = req.user.userId;
    return this.jobScannerService.getLatestScanLogs(userId);
  }

  @Delete('scan-logs/:scanType')
  async clearScanLogs(
    @Request() req: AuthRequest,
    @Param('scanType') scanType: 'auto' | 'manual',
  ) {
    const userId = req.user.userId;
    await this.jobScannerService.clearScanLogs(userId, scanType);
    return { success: true, message: `${scanType} scan logs cleared` };
  }

  @Get('jobs')
  async getJobs(
    @Request() req: AuthRequest,
    @Query() query: GetScannedJobsDto,
  ) {
    const userId = req.user.userId;

    // Convert string values to booleans
    const filter: any = { ...query };

    if (filter.isFavorited !== undefined) {
      filter.isFavorited =
        filter.isFavorited === 'true' || filter.isFavorited === true;
    }

    if (filter.isViewed !== undefined) {
      filter.isViewed = filter.isViewed === 'true' || filter.isViewed === true;
    }

    if (filter.isApplied !== undefined) {
      filter.isApplied =
        filter.isApplied === 'true' || filter.isApplied === true;
    }

    return this.jobScannerService.getScannedJobs(userId, filter);
  }

  @Put('jobs/:jobId')
  async updateJobStatus(
    @Request() req: AuthRequest,
    @Param('jobId') jobId: string,
    @Body() updateDto: UpdateJobStatusDto,
  ) {
    const userId = req.user.userId;
    try {
      return await this.jobScannerService.updateJobStatus(
        userId,
        jobId,
        updateDto,
      );
    } catch (error) {
      if (error.message === 'Job not found') {
        throw new HttpException('Job not found', HttpStatus.NOT_FOUND);
      }
      throw error;
    }
  }

  @Delete('jobs/:jobId')
  async deleteJob(@Request() req: AuthRequest, @Param('jobId') jobId: string) {
    const userId = req.user.userId;
    try {
      await this.jobScannerService.deleteScannedJob(userId, jobId);
      return { success: true, message: 'Job deleted successfully' };
    } catch (error) {
      if (error.message === 'Job not found') {
        throw new HttpException('Job not found', HttpStatus.NOT_FOUND);
      }
      throw error;
    }
  }

  @Post('jobs/:jobId/save')
  async saveToJobs(
    @Request() req: AuthRequest,
    @Param('jobId') jobId: string,
  ) {
    const userId = req.user.userId;
    try {
      return await this.jobScannerService.promoteToJob(userId, jobId);
    } catch (error) {
      if (error.status === 404) {
        throw new HttpException('Scanned job not found', HttpStatus.NOT_FOUND);
      }
      if (error.status === 400) {
        throw new HttpException(
          error.message || 'Job already saved',
          HttpStatus.BAD_REQUEST,
        );
      }
      throw error;
    }
  }

  @Post('jobs/bulk')
  async bulkJobAction(
    @Request() req: AuthRequest,
    @Body() bulkDto: BulkJobActionDto,
  ) {
    const userId = req.user.userId;
    try {
      return await this.jobScannerService.bulkJobAction(
        userId,
        bulkDto.jobIds,
        bulkDto.action,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Bulk operation failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('test-auto-scan')
  async testAutoScan(@Request() req: AuthRequest) {
    const userId = req.user.userId;
    // Manually trigger a scan
    const scanId = await this.jobScannerService.startScanAsync(userId, true);
    return {
      success: true,
      message: 'Manual scan triggered',
      scanId,
    };
  }
}
