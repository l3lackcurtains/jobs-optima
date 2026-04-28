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
  Res,
  HttpStatus,
  Query,
} from '@nestjs/common';
import type { Response } from 'express';
import { ResumeManagerService } from './resume-manager.service';
import { ResumeMigrationService } from './resume-migration.service';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { JwtAuthGuard } from '@modules/auth/jwt-auth.guard';
import { PdfService } from '@modules/documents/pdf/pdf.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Resume, ResumeDocument } from '@schemas/resume.schema';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { FindResumesDto } from './dto/find-resumes.dto';

interface AuthRequest {
  user: {
    userId: string;
    email: string;
  };
}

@Controller('resumes')
@UseGuards(JwtAuthGuard)
export class ResumeController {
  constructor(
    private readonly resumeManagerService: ResumeManagerService,
    private readonly resumeMigrationService: ResumeMigrationService,
    private readonly pdfService: PdfService,
    @InjectModel(Resume.name) private resumeModel: Model<ResumeDocument>,
  ) {}

  @Post()
  async create(
    @Request() req: AuthRequest,
    @Body() createResumeDto: CreateResumeDto,
  ) {
    const resumeData = {
      ...createResumeDto,
      source: 'manual' as const,
      category: 'General', // Default category, can be updated later
    };
    return this.resumeManagerService.createBase(req.user.userId, resumeData);
  }

  @Get()
  findAll(
    @Request() req: AuthRequest,
    @Query() findResumesDto: FindResumesDto,
  ) {
    // Convert string value to boolean for isOptimized
    let isOptimized = findResumesDto.isOptimized;
    if (isOptimized !== undefined) {
      if (isOptimized === 'true' || isOptimized === true) {
        isOptimized = true;
      } else if (isOptimized === 'false' || isOptimized === false) {
        isOptimized = false;
      }
    }

    return this.resumeManagerService.findAll(
      req.user.userId,
      findResumesDto,
      isOptimized,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.resumeManagerService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Body() updateResumeDto: UpdateResumeDto,
  ) {
    // Remove any Mongoose internal fields that might have been sent
    const { __v, _id, ...cleanDto } = updateResumeDto as any;
    return this.resumeManagerService.update(id, req.user.userId, cleanDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.resumeManagerService.remove(id, req.user.userId);
  }

  @Get(':id/optimized')
  getOptimizedResumes(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.resumeManagerService.getOptimizedResumes(id, req.user.userId);
  }

  @Post('fix-slugs')
  async fixMissingSlugs(@Request() req: AuthRequest) {
    // This is a temporary migration endpoint - can be removed after migration
    return this.resumeManagerService.fixMissingSlugs();
  }

  @Get(':id/pdf')
  async downloadResumePdf(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Res() res: Response,
  ) {
    try {
      // Get the resume (works for both BaseResume and OptimizedResume)
      const resume = await this.resumeManagerService.findOne(
        id,
        req.user.userId,
      );

      // Generate PDF
      const pdfBuffer = await this.pdfService.generateResumePdf(resume);

      // Use the slug if available, otherwise fallback to slugified title
      let filename: string;
      if (resume.slug && resume.slug.trim()) {
        filename = `${resume.slug}.pdf`;
      } else {
        // Fallback for resumes without slugs - create one on the fly
        const slugify = (text: string): string => {
          return text
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Remove consecutive hyphens
            .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
        };
        const baseSlug = slugify(
          resume.title || resume.contactInfo?.name || 'resume',
        );
        filename = `${baseSlug}.pdf`;

        // Also update the resume with the generated slug for future use
        try {
          await this.resumeModel
            .findByIdAndUpdate(id, { slug: baseSlug })
            .exec();
        } catch (error) {
          console.warn('Failed to update resume slug:', error);
        }
      }

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length,
      });

      res.status(HttpStatus.OK).send(pdfBuffer);
    } catch (error) {
      console.error('PDF export error:', error);
      throw error;
    }
  }

  @Post('migrate/categorized-keywords')
  async migrateCategorizesKeywords(@Request() req: AuthRequest) {
    // Only allow migration for development purposes
    // In production, this should be done via a database migration script
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Migration not allowed in production');
    }

    return this.resumeMigrationService.migrateCategorizesKeywords();
  }

  @Post('migrate/fix-optimized-field')
  async fixOptimizedField(@Request() req: AuthRequest) {
    const userId = req.user.userId;

    // Update all resumes without isOptimized field or with null value
    const result = await this.resumeManagerService.fixOptimizedField(userId);

    return {
      success: true,
      ...result,
      message: 'Fixed isOptimized field for all resumes',
    };
  }

  @Get('migrate/verify')
  async verifyMigration(@Request() req: AuthRequest) {
    // Only allow verification for development purposes
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Verification not allowed in production');
    }

    return this.resumeMigrationService.verifyMigration();
  }
}
