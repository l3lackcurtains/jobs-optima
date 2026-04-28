import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Application,
  ApplicationDocument,
  ApplicationStatus,
  TimelineEvent,
} from '@schemas/application.schema';
import {
  PaginationDto,
  PaginatedResponse,
} from '../../common/dto/pagination.dto';
import { Job, JobDocument } from '@schemas/job.schema';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import PDFDocument from 'pdfkit';
import { marked } from 'marked';

@Injectable()
export class ApplicationService {
  constructor(
    @InjectModel(Application.name)
    private applicationModel: Model<ApplicationDocument>,
    @InjectModel(Job.name)
    private jobModel: Model<JobDocument>,
  ) {}

  async create(
    userId: string,
    createApplicationDto: CreateApplicationDto,
  ): Promise<ApplicationDocument> {
    // Validate that the job exists and belongs to the user
    const job = await this.jobModel
      .findOne({
        _id: createApplicationDto.jobId,
        userId,
      })
      .exec();

    if (!job) {
      throw new NotFoundException('Job not found or access denied');
    }

    // Check if job already has an application
    const existingApplication = await this.applicationModel
      .findOne({
        jobId: createApplicationDto.jobId,
        userId,
      })
      .exec();

    if (existingApplication) {
      throw new BadRequestException(
        'Job already has an application. Each job can only have one application.',
      );
    }

    // Validate that the optimizedResumeId belongs to the job's optimizedResumeIds
    if (
      !job.optimizedResumeIds.includes(createApplicationDto.optimizedResumeId)
    ) {
      throw new BadRequestException(
        'Selected resume must be one of the optimized resumes for this job',
      );
    }

    // Add initial timeline event
    const timeline: TimelineEvent[] = [
      {
        timestamp: new Date(),
        event: 'Application created',
        description: 'Application record created',
        status: createApplicationDto.status || ApplicationStatus.DRAFT,
      },
    ];

    // If status is APPLIED, add application date and timeline event
    if (createApplicationDto.status === ApplicationStatus.APPLIED) {
      if (!createApplicationDto.applicationDate) {
        createApplicationDto.applicationDate = new Date();
      }
      timeline.push({
        timestamp: createApplicationDto.applicationDate,
        event: 'Application submitted',
        description: 'Applied to position',
        status: ApplicationStatus.APPLIED,
      });
    }

    const application = await this.applicationModel.create({
      ...createApplicationDto,
      userId,
      timeline,
    });

    // Update the job's applicationId field to link to this application
    await this.jobModel.findByIdAndUpdate(
      createApplicationDto.jobId,
      { applicationId: application._id },
      { new: true },
    );

    return application.populate(['job', 'optimizedResume', 'baseResume']);
  }

  async findAll(
    userId: string,
    paginationDto: PaginationDto,
    status?: ApplicationStatus,
  ): Promise<PaginatedResponse<ApplicationDocument>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const query: any = { userId };
    if (status) {
      query.status = status;
    }

    const [data, total] = await Promise.all([
      this.applicationModel
        .find(query)
        .populate(['job', 'optimizedResume', 'baseResume'])
        .sort({ updatedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.applicationModel.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async findOne(id: string, userId: string): Promise<ApplicationDocument> {
    const application = await this.applicationModel
      .findById(id)
      .populate(['job', 'optimizedResume', 'baseResume'])
      .exec();

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (String(application.userId) !== userId) {
      throw new ForbiddenException(
        'You do not have access to this application',
      );
    }

    return application;
  }

  async update(
    id: string,
    userId: string,
    updateApplicationDto: UpdateApplicationDto,
  ): Promise<ApplicationDocument> {
    const application = await this.findOne(id, userId);

    // Track status changes in timeline
    if (
      updateApplicationDto.status &&
      updateApplicationDto.status !== application.status
    ) {
      const timelineEvent: TimelineEvent = {
        timestamp: new Date(),
        event: `Status changed to ${updateApplicationDto.status}`,
        description: `Status updated from ${application.status} to ${updateApplicationDto.status}`,
        status: updateApplicationDto.status,
      };

      if (!application.timeline) {
        application.timeline = [];
      }
      application.timeline.push(timelineEvent);

      // Set application date if changing to APPLIED
      if (
        updateApplicationDto.status === ApplicationStatus.APPLIED &&
        !application.applicationDate
      ) {
        application.applicationDate = new Date();
      }
    }

    // Update the application
    Object.assign(application, updateApplicationDto);
    await application.save();

    return application.populate(['job', 'optimizedResume', 'baseResume']);
  }

  async updateStatus(
    id: string,
    userId: string,
    updateStatusDto: UpdateStatusDto,
  ): Promise<ApplicationDocument> {
    const application = await this.findOne(id, userId);

    // Validate status transition
    if (
      !this.isValidStatusTransition(application.status, updateStatusDto.status)
    ) {
      throw new BadRequestException(
        `Invalid status transition from ${application.status} to ${updateStatusDto.status}`,
      );
    }

    // Add timeline event
    const timelineEvent: TimelineEvent = {
      timestamp: new Date(),
      event: `Status changed to ${updateStatusDto.status}`,
      description:
        updateStatusDto.notes ||
        `Status updated from ${application.status} to ${updateStatusDto.status}`,
      status: updateStatusDto.status,
    };

    if (!application.timeline) {
      application.timeline = [];
    }
    application.timeline.push(timelineEvent);

    // Update status
    application.status = updateStatusDto.status;

    // Set application date if changing to APPLIED
    if (
      updateStatusDto.status === ApplicationStatus.APPLIED &&
      !application.applicationDate
    ) {
      application.applicationDate = new Date();
    }

    await application.save();

    return application.populate(['job', 'optimizedResume', 'baseResume']);
  }

  async remove(id: string, userId: string): Promise<void> {
    const application = await this.findOne(id, userId);

    // Clear the applicationId from the associated job
    if (application.jobId) {
      await this.jobModel.findByIdAndUpdate(
        application.jobId,
        { $unset: { applicationId: 1 } },
        { new: true },
      );
    }

    await application.deleteOne();
  }

  async getStats(userId: string): Promise<any> {
    const applications = await this.applicationModel.find({ userId }).exec();

    const stats = {
      total: applications.length,
      byStatus: {} as Record<string, number>,
      recentActivity: [] as any[],
      successRate: 0,
    };

    // Count by status
    for (const status of Object.values(ApplicationStatus)) {
      stats.byStatus[status] = applications.filter(
        (app) => app.status === status,
      ).length;
    }

    // Calculate success rate
    const completed = applications.filter(
      (app) =>
        app.status === ApplicationStatus.ACCEPTED ||
        app.status === ApplicationStatus.REJECTED,
    ).length;
    const accepted = stats.byStatus[ApplicationStatus.ACCEPTED] || 0;
    stats.successRate = completed > 0 ? (accepted / completed) * 100 : 0;

    // Get recent activity (last 5 timeline events)
    const allEvents: any[] = [];
    applications.forEach((app) => {
      if (app.timeline && app.timeline.length > 0) {
        app.timeline.forEach((event) => {
          allEvents.push({
            applicationId: app._id,
            jobId: app.jobId,
            ...event,
          });
        });
      }
    });

    stats.recentActivity = allEvents
      .filter((event) => event.timestamp) // Filter out events without timestamps
      .sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return timeB - timeA;
      })
      .slice(0, 5);

    return stats;
  }

  async findByJob(
    jobId: string,
    userId: string,
  ): Promise<ApplicationDocument[]> {
    return this.applicationModel
      .find({ jobId, userId })
      .populate(['job', 'optimizedResume', 'baseResume'])
      .sort({ createdAt: -1 })
      .exec();
  }

  async findApplicationForJob(
    jobId: string,
    userId: string,
  ): Promise<ApplicationDocument | null> {
    return this.applicationModel
      .findOne({ jobId, userId })
      .populate(['job', 'optimizedResume', 'baseResume'])
      .exec();
  }

  async findByResume(
    resumeId: string,
    userId: string,
  ): Promise<ApplicationDocument[]> {
    return this.applicationModel
      .find({
        userId,
        $or: [{ optimizedResumeId: resumeId }, { baseResumeId: resumeId }],
      })
      .populate(['job', 'optimizedResume', 'baseResume'])
      .sort({ createdAt: -1 })
      .exec();
  }

  private isValidStatusTransition(
    currentStatus: ApplicationStatus,
    newStatus: ApplicationStatus,
  ): boolean {
    // Allow any status transition for flexibility
    // Users may need to correct status or move backwards in the process
    return true;
  }

  async generateCoverLetterPdf(
    applicationId: string,
    userId: string,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const application = await this.applicationModel
      .findOne({ _id: applicationId, userId })
      .populate(['job', 'optimizedResume'])
      .exec();

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (!application.coverLetter) {
      throw new BadRequestException(
        'No cover letter found for this application',
      );
    }

    // Generate filename from resume slug
    const resume = (application as any).optimizedResume;
    let filename = `cover-letter-${applicationId}.pdf`; // fallback
    if (resume && resume.slug) {
      filename = `cover-letter-${resume.slug}.pdf`;
    }

    // Convert markdown to plain text with proper formatting
    const htmlContent = await marked(application.coverLetter);
    const plainText = this.convertHtmlToPlainText(htmlContent);

    // Create PDF document
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 72,
          bottom: 72,
          left: 72,
          right: 72,
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', (buffer) => buffers.push(buffer));
      doc.on('end', () =>
        resolve({ buffer: Buffer.concat(buffers), filename }),
      );
      doc.on('error', reject);

      // Add the cover letter content
      const lines = plainText.split('\n');

      for (const line of lines) {
        if (line.trim() === '') {
          // Empty line - add paragraph spacing
          doc.moveDown(1);
        } else if (line.startsWith('# ')) {
          // H1 headers
          doc.fontSize(14).font('Helvetica-Bold').text(line.substring(2), {
            align: 'left',
          });
          doc.moveDown(0.5);
        } else if (line.startsWith('## ')) {
          // H2 headers
          doc.fontSize(12).font('Helvetica-Bold').text(line.substring(3), {
            align: 'left',
          });
          doc.moveDown(0.5);
        } else if (line.startsWith('### ')) {
          // H3 headers
          doc.fontSize(11).font('Helvetica-Bold').text(line.substring(4), {
            align: 'left',
          });
          doc.moveDown(0.5);
        } else if (line.startsWith('- ') || line.startsWith('• ')) {
          // Bullet points
          doc.fontSize(11).font('Helvetica').text(`  ${line}`, {
            align: 'left',
            indent: 20,
          });
          doc.moveDown(0.2);
        } else {
          // Regular text - treat as paragraph
          doc.fontSize(11).font('Helvetica').text(line, {
            align: 'justify',
            lineGap: 3,
          });
          doc.moveDown(0.8); // Add spacing after each paragraph
        }
      }

      doc.end();
    });
  }

  private convertHtmlToPlainText(html: string): string {
    // Remove HTML tags and convert to plain text with markdown-like formatting
    const text = html
      // Convert headers
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
      // Convert bold and italic
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '$1')
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '$1')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '$1')
      .replace(/<i[^>]*>(.*?)<\/i>/gi, '$1')
      // Convert lists
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n')
      .replace(/<ul[^>]*>/gi, '')
      .replace(/<\/ul>/gi, '\n')
      .replace(/<ol[^>]*>/gi, '')
      .replace(/<\/ol>/gi, '\n')
      // Convert paragraphs and breaks
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      // Remove remaining HTML tags
      .replace(/<[^>]*>/g, '')
      // Decode HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // Clean up extra whitespace
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return text;
  }
}
