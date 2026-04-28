import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job, JobDocument } from '@schemas/job.schema';
import { Resume, ResumeDocument } from '@schemas/resume.schema';
import {
  Application,
  ApplicationDocument,
  ApplicationStatus,
} from '@schemas/application.schema';
import {
  PaginationDto,
  PaginatedResponse,
} from '../../common/dto/pagination.dto';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { OptimizeResumeDto } from './dto/optimize-resume.dto';
import { FindJobsDto } from './dto/find-jobs.dto';
import { AiService } from '@modules/ai/ai.service';
import { KeywordsExtractorService } from './keywords-extractor.service';
import { JobParserService } from './job-parser.service';
import { ResumeManagerService } from '@modules/resume/resume-manager.service';
import { PdfService } from '@modules/documents/pdf/pdf.service';
import { AI_CONFIG, AIProvider } from '@modules/ai/ai.constants';

@Injectable()
export class JobService {
  constructor(
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
    @InjectModel(Resume.name) private resumeModel: Model<ResumeDocument>,
    @InjectModel(Application.name)
    private applicationModel: Model<ApplicationDocument>,
    private aiService: AiService,
    private keywordsExtractor: KeywordsExtractorService,
    private jobParserService: JobParserService,
    private resumeManagerService: ResumeManagerService,
    private pdfService: PdfService,
  ) {}

  async create(userId: string, createJobDto: CreateJobDto): Promise<any> {
    // Parse job description to extract title, company, location etc.
    const parsedData = await this.jobParserService.parseJobDescription(
      createJobDto.description,
      userId,
      createJobDto.url,
    );

    // Extract keywords from job description using the new API
    const keywords = await this.keywordsExtractor.extractKeywords(
      createJobDto.description,
    );

    // Prioritize skills from keywords if mustHave/niceToHave not provided by parser
    const mustHaveSkills =
      parsedData.mustHaveSkills && parsedData.mustHaveSkills.length > 0
        ? parsedData.mustHaveSkills
        : keywords.hardSkills?.slice(0, 5) || [];

    const niceToHaveSkills =
      parsedData.niceToHaveSkills && parsedData.niceToHaveSkills.length > 0
        ? parsedData.niceToHaveSkills
        : keywords.hardSkills?.slice(5, 10) || [];

    const job = await this.jobModel.create({
      description: parsedData.description, // Use the cleaned description from AI parsing
      url: createJobDto.url,
      userId: userId,
      keywords,
      // Use parsed data instead of placeholders
      title: parsedData.title,
      company: parsedData.company,
      location: parsedData.location,
      salaryMin: parsedData.salaryMin,
      salaryMax: parsedData.salaryMax,
      salaryPeriod: parsedData.salaryPeriod,
      category: parsedData.category || 'General',
      source: 'parsed',
      // New fields
      summary: parsedData.summary,
      industry: parsedData.industry,
      mustHaveSkills,
      niceToHaveSkills,
      workMode: parsedData.workMode,
      jobType: parsedData.jobType,
    });

    return {
      job: job.toObject(),
    };
  }

  async findAll(
    userId: string,
    findJobsDto: FindJobsDto,
  ): Promise<PaginatedResponse<any>> {
    const {
      page = 1,
      limit = 10,
      search,
      applicationStatus,
      workMode,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = findJobsDto;

    const skip = (page - 1) * limit;

    // Build query
    const query: any = { userId };

    // Add work mode filter
    if (workMode) {
      query.workMode = workMode;
    }

    // Add search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    // Add application status filter
    if (applicationStatus === 'applied') {
      query.applicationId = { $ne: null };
    } else if (applicationStatus === 'not-applied') {
      query.applicationId = null;
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [jobs, total] = await Promise.all([
      this.jobModel
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.jobModel.countDocuments(query),
    ]);

    // Get application statuses for jobs that have applicationId
    const applicationIds = jobs
      .filter((job) => job.applicationId)
      .map((job) => job.applicationId);

    const applications =
      applicationIds.length > 0
        ? await this.applicationModel
            .find({ _id: { $in: applicationIds } })
            .select('_id status')
            .lean()
            .exec()
        : [];

    // Create a map of applicationId to status for quick lookup
    const statusMap = new Map();
    applications.forEach((app) => {
      statusMap.set(String(app._id), app.status);
    });

    // Add isApplied flag and application status to each job
    const jobsWithApplicationStatus = jobs.map((job) => {
      const hasApplication = !!job.applicationId;
      const applicationStatus = hasApplication
        ? statusMap.get(String(job.applicationId)) || null
        : null;

      return {
        ...job,
        _id: String(job._id),
        userId: String(job.userId),
        isApplied: hasApplication,
        applicationStatus: applicationStatus as ApplicationStatus | null,
      };
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: jobsWithApplicationStatus,
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

  async findOne(id: string, userId: string): Promise<Job> {
    const job = await this.jobModel.findById(id).lean().exec();

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (String(job.userId) !== userId) {
      throw new ForbiddenException('You do not have access to this job');
    }

    return job;
  }

  async update(
    id: string,
    userId: string,
    updateJobDto: UpdateJobDto,
  ): Promise<Job> {
    const job = await this.jobModel.findById(id).exec();

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (String(job.userId) !== userId) {
      throw new ForbiddenException('You do not have access to this job');
    }

    // Update the job with the provided data
    Object.assign(job, updateJobDto);

    // If description changed and keywords not provided, re-extract keywords
    if (
      !updateJobDto.keywords &&
      updateJobDto.description &&
      updateJobDto.description !== job.description
    ) {
      const keywords = await this.keywordsExtractor.extractKeywords(
        updateJobDto.description,
      );

      // Update keywords on the job object
      job.keywords = keywords;
    }

    // Save and return the updated job
    return job.save();
  }

  async optimizeResume(
    userId: string,
    optimizeDto: OptimizeResumeDto,
  ): Promise<{
    optimizedResume: any;
    optimizationStats: {
      initialATSScore: number;
      finalATSScore: number;
      improvement: number;
      keywordScore: number;
      matchedKeywords: string[];
      unmatchedKeywords: string[];
      totalKeywords: number;
      matchPercentage: number;
      keywordsByCategory?: {
        matched: any;
        unmatched: any;
      };
    };
  }> {
    const {
      resumeId,
      jobId,
      provider = AIProvider.GEMINI,
    } = optimizeDto;

    // Get the job and verify access
    const job = await this.jobModel.findById(jobId).exec();
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    if (String(job.userId) !== userId) {
      throw new ForbiddenException('You do not have access to this job');
    }

    // Get the base resume and verify access
    const baseResume = await this.resumeModel
      .findOne({ _id: resumeId, isOptimized: false })
      .exec();

    if (!baseResume) {
      throw new NotFoundException('Resume not found');
    }
    if (String(baseResume.userId) !== userId) {
      throw new ForbiddenException('You do not have access to this resume');
    }

    // Convert Mongoose document to plain object before sending to AI
    const baseResumeData = baseResume.toObject();

    // Get job keywords for scoring
    let jobKeywords = job.keywords;
    if (
      !jobKeywords ||
      ((!jobKeywords.actionVerbs || jobKeywords.actionVerbs.length === 0) &&
        (!jobKeywords.hardSkills || jobKeywords.hardSkills.length === 0) &&
        (!jobKeywords.softSkills || jobKeywords.softSkills.length === 0))
    ) {
      // Extract keywords if they don't exist or are all empty
      jobKeywords = await this.keywordsExtractor.extractKeywords(
        job.description,
      );

      // Update the job with the extracted keywords
      await this.jobModel
        .findByIdAndUpdate(job._id, { keywords: jobKeywords })
        .exec();
    }

    // Ensure we have valid keywords before optimization
    if (
      !jobKeywords ||
      (!jobKeywords.actionVerbs?.length &&
        !jobKeywords.hardSkills?.length &&
        !jobKeywords.softSkills?.length)
    ) {
      throw new Error(
        'Failed to extract keywords from job description. Cannot optimize resume without keywords.',
      );
    }

    // Calculate initial scores for base resume using AI service function
    const initialScores = this.aiService.calculateResumeScores(
      baseResumeData,
      jobKeywords,
    );

    // Optimize the resume using AI with keyword variations
    // The AI service now handles provider selection internally
    const optimizedData = await this.aiService.optimizeResume(
      baseResumeData,
      job.description,
      jobKeywords,
      userId,
    );

    // Calculate matches for optimized resume
    // Use AI service's centralized function to extract only content
    const optimizedResumeText = this.aiService.extractResumeContent(
      optimizedData.resume,
    );
    const analysis = this.keywordsExtractor.calculateMatchedKeywords(
      optimizedResumeText,
      jobKeywords,
    );
    const allKeywords = this.keywordsExtractor.getAllKeywordsFlat(jobKeywords);
    const matchedFlat = this.keywordsExtractor.getAllKeywordsFlat(
      analysis.matched,
    );
    const unmatchedFlat = this.keywordsExtractor.getAllKeywordsFlat(
      analysis.unmatched,
    );

    // Calculate final scores for optimized resume BEFORE creating it in DB
    const finalScores = this.aiService.calculateResumeScores(
      optimizedData.resume,
      jobKeywords,
    );

    // Get counter for this job's optimized resumes
    const existingCount = await this.resumeManagerService.countOptimizedByJob(
      String(job._id),
      userId,
    );
    const counter = existingCount + 1;

    // Create the optimized resume in database using ResumeManagerService
    const optimizedResumeData = {
      ...optimizedData.resume,
      title: `${baseResume.title} - ${job.company} - ${job.title} - ${counter}`,
      category: job.category || baseResume.category,
    };

    const optimizedResume = await this.resumeManagerService.createOptimized(
      userId,
      optimizedResumeData,
      String(baseResume._id),
      String(job._id),
      initialScores.atsScore, // Use calculated initial score, not AI's
      finalScores.atsScore, // Use calculated final score, not AI's
      initialScores.keywordScore, // Initial keyword score
      finalScores.keywordScore, // Final keyword score
      allKeywords,
      matchedFlat,
      unmatchedFlat,
      provider,
      analysis.matched, // Pass categorized matched keywords
      analysis.unmatched, // Pass categorized unmatched keywords
    );

    // Update job with optimized resume ID
    await this.jobModel
      .findByIdAndUpdate(job._id, {
        $push: { optimizedResumeIds: String(optimizedResume._id) },
      })
      .exec();

    // Calculate optimization stats
    const initialATSScore = initialScores.atsScore;
    const finalATSScore = finalScores.atsScore;
    const improvement = finalATSScore - initialATSScore;
    const matchPercentage = analysis.matchPercentage;

    return {
      optimizedResume: optimizedResume.toObject(),
      optimizationStats: {
        initialATSScore,
        finalATSScore, // This is the ATS score
        improvement,
        keywordScore: finalScores.keywordScore,
        matchedKeywords: matchedFlat,
        unmatchedKeywords: unmatchedFlat,
        totalKeywords: allKeywords.length,
        matchPercentage,
        keywordsByCategory: {
          matched: analysis.matched,
          unmatched: analysis.unmatched,
        },
      },
    };
  }

  async getResumeForPdf(userId: string, resumeId: string): Promise<any> {
    return this.resumeManagerService.findOne(resumeId, userId);
  }

  async generateResumePdf(userId: string, resumeId: string): Promise<Buffer> {
    try {
      const resume = await this.resumeManagerService.findOne(resumeId, userId);
      return this.pdfService.generateResumePdf(resume);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  async generateAtsReportPdf(
    userId: string,
    resumeId: string,
    jobId: string,
  ): Promise<Buffer> {
    const resume = await this.resumeManagerService.findOne(resumeId, userId);
    const job = await this.findOne(jobId, userId);

    return this.pdfService.generateAtsReport(
      resume,
      job.description,
      resume.keywords || [],
      resume.matchedKeywords || [],
      resume.unmatchedKeywords || [],
    );
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    const job = await this.jobModel.findById(id).exec();

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (String(job.userId) !== userId) {
      throw new ForbiddenException('You do not have access to this job');
    }

    // Delete any application associated with this job
    if (job.applicationId) {
      await this.applicationModel.deleteOne({ _id: job.applicationId });
    }

    // Also delete all optimized resumes associated with this job
    if (job.optimizedResumeIds?.length > 0) {
      await this.resumeModel.deleteMany({
        _id: { $in: job.optimizedResumeIds },
      });
    }

    // Delete the job
    await this.jobModel.findByIdAndDelete(id).exec();

    return { message: 'Job deleted successfully' };
  }
}
