import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Res,
  HttpStatus,
  Delete,
  Patch,
  Query,
} from '@nestjs/common';
import type { Response } from 'express';
import { JobService } from './job.service';
import { JobParserService } from './job-parser.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { OptimizeResumeDto } from './dto/optimize-resume.dto';
import { FindJobsDto } from './dto/find-jobs.dto';
import { JwtAuthGuard } from '@modules/auth/jwt-auth.guard';
import { PaginationDto } from '../../common/dto/pagination.dto';

interface AuthRequest {
  user: {
    userId: string;
    email: string;
  };
}

@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobController {
  constructor(
    private readonly jobService: JobService,
    private readonly jobParserService: JobParserService,
  ) {}

  @Post()
  create(@Request() req: AuthRequest, @Body() createJobDto: CreateJobDto) {
    return this.jobService.create(req.user.userId, createJobDto);
  }

  @Post('parse')
  async parseJobDescription(
    @Request() req: AuthRequest,
    @Body() body: { description: string; url?: string },
  ) {
    const parsedData = await this.jobParserService.parseJobDescription(
      body.description,
      req.user.userId,
      body.url,
    );

    // Return parsed data for frontend preview
    return parsedData;
  }

  @Post('parse-and-create')
  async parseAndCreateJob(
    @Request() req: AuthRequest,
    @Body() body: { description: string; url?: string },
  ) {
    // Create job with parsed data
    const createJobDto: CreateJobDto = {
      description: body.description, // Use original description
      url: body.url,
    };

    return this.jobService.create(req.user.userId, createJobDto);
  }

  @Get()
  findAll(@Request() req: AuthRequest, @Query() findJobsDto: FindJobsDto) {
    return this.jobService.findAll(req.user.userId, findJobsDto);
  }

  @Get(':id')
  findOne(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.jobService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  update(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() updateJobDto: UpdateJobDto,
  ) {
    // Remove any Mongoose internal fields that might have been sent
    const { __v, _id, ...cleanDto } = updateJobDto as any;
    return this.jobService.update(id, req.user.userId, cleanDto);
  }

  @Post('optimize')
  async optimizeResume(
    @Request() req: AuthRequest,
    @Body() optimizeDto: OptimizeResumeDto,
  ) {
    return this.jobService.optimizeResume(req.user.userId, optimizeDto);
  }

  @Get('resume/:resumeId/pdf')
  async downloadResumePdf(
    @Param('resumeId') resumeId: string,
    @Request() req: AuthRequest,
    @Res() res: Response,
  ) {
    try {
      const pdfBuffer = await this.jobService.generateResumePdf(
        req.user.userId,
        resumeId,
      );

      // Get resume info for better filename
      const resume = await this.jobService.getResumeForPdf(
        req.user.userId,
        resumeId,
      );

      // Use the slug if available, otherwise fallback to slugified title
      let filename: string;
      if (resume.slug) {
        filename = `${resume.slug}.pdf`;
      } else {
        // Fallback for resumes without slugs (before migration)
        const slugify = (text: string): string => {
          return text
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '_') // Replace spaces with underscores
            .replace(/-+/g, '_') // Replace hyphens with underscores
            .replace(/_+/g, '_') // Remove consecutive underscores
            .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
        };
        filename = `${slugify(resume.title)}.pdf`;
      }

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length,
      });

      res.status(HttpStatus.OK).send(pdfBuffer);
    } catch (error) {
      console.error('PDF download error:', error);
      throw error;
    }
  }

  @Get('resume/:resumeId/job/:jobId/ats-report')
  async downloadAtsReport(
    @Param('resumeId') resumeId: string,
    @Param('jobId') jobId: string,
    @Request() req: AuthRequest,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.jobService.generateAtsReportPdf(
      req.user.userId,
      resumeId,
      jobId,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="ats-report.pdf"',
      'Content-Length': pdfBuffer.length,
    });

    res.status(HttpStatus.OK).send(pdfBuffer);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.jobService.remove(id, req.user.userId);
  }
}
