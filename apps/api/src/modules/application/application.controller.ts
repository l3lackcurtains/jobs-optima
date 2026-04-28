import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApplicationService } from './application.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '@modules/auth/jwt-auth.guard';
import { ApplicationStatus } from '@schemas/application.schema';
import type { Response } from 'express';
import { PaginationDto } from '../../common/dto/pagination.dto';

interface AuthRequest {
  user: {
    userId: string;
    email: string;
  };
}

@Controller('applications')
@UseGuards(JwtAuthGuard)
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Post()
  create(
    @Request() req: AuthRequest,
    @Body() createApplicationDto: CreateApplicationDto,
  ) {
    return this.applicationService.create(
      req.user.userId,
      createApplicationDto,
    );
  }

  @Get()
  findAll(
    @Request() req: AuthRequest,
    @Query() paginationDto: PaginationDto,
    @Query('status') status?: ApplicationStatus,
  ) {
    return this.applicationService.findAll(
      req.user.userId,
      paginationDto,
      status,
    );
  }

  @Get('stats')
  getStats(@Request() req: AuthRequest) {
    return this.applicationService.getStats(req.user.userId);
  }

  @Get('by-job/:jobId')
  findByJob(@Request() req: AuthRequest, @Param('jobId') jobId: string) {
    return this.applicationService.findByJob(jobId, req.user.userId);
  }

  @Get('for-job/:jobId')
  findApplicationForJob(
    @Request() req: AuthRequest,
    @Param('jobId') jobId: string,
  ) {
    return this.applicationService.findApplicationForJob(
      jobId,
      req.user.userId,
    );
  }

  @Get('by-resume/:resumeId')
  findByResume(
    @Request() req: AuthRequest,
    @Param('resumeId') resumeId: string,
  ) {
    return this.applicationService.findByResume(resumeId, req.user.userId);
  }

  @Get(':id')
  findOne(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.applicationService.findOne(id, req.user.userId);
  }

  @Get(':id/cover-letter/pdf')
  async downloadCoverLetterPdf(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    try {
      const { buffer, filename } =
        await this.applicationService.generateCoverLetterPdf(
          id,
          req.user.userId,
        );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );
      res.send(buffer);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to generate cover letter PDF',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id')
  update(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() updateApplicationDto: UpdateApplicationDto,
  ) {
    return this.applicationService.update(
      id,
      req.user.userId,
      updateApplicationDto,
    );
  }

  @Patch(':id/status')
  updateStatus(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    return this.applicationService.updateStatus(
      id,
      req.user.userId,
      updateStatusDto,
    );
  }

  @Delete(':id')
  remove(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.applicationService.remove(id, req.user.userId);
  }
}
