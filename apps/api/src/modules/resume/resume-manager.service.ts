import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Resume, ResumeDocument } from '@schemas/resume.schema';
import {
  PaginationDto,
  PaginatedResponse,
} from '../../common/dto/pagination.dto';
import { User, UserDocument } from '@schemas/user.schema';
import { Job, JobDocument } from '@schemas/job.schema';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { AiService } from '@modules/ai/ai.service';
import { KeywordsExtractorService } from '@modules/job/keywords-extractor.service';
import slugify from 'slugify';

@Injectable()
export class ResumeManagerService {
  private readonly logger = new Logger(ResumeManagerService.name);

  constructor(
    @InjectModel(Resume.name) private resumeModel: Model<ResumeDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
    private aiService: AiService,
    @Inject(forwardRef(() => KeywordsExtractorService))
    private keywordsExtractor: KeywordsExtractorService,
  ) {}

  private generateResumeSlug(title: string): string {
    const baseSlug = slugify(title, {
      lower: true,
      strict: true,
      trim: true,
    });
    return baseSlug;
  }

  async createBase(
    userId: string,
    createResumeDto: CreateResumeDto,
  ): Promise<ResumeDocument> {
    const resume = await this.resumeModel.create({
      ...createResumeDto,
      userId: userId,
      slug: this.generateResumeSlug(createResumeDto.title),
      isOptimized: false,
      source: createResumeDto.source || 'manual',
      keywords: [],
      matchedKeywords: [],
      unmatchedKeywords: [],
    });

    await this.userModel
      .findByIdAndUpdate(userId, {
        $push: { resumeIds: String(resume._id) },
      })
      .exec();

    return resume;
  }

  async createOptimized(
    userId: string,
    resumeData: any,
    parentResumeId: string,
    jobId: string,
    initialATSScore: number,
    finalATSScore: number,
    initialKeywordScore: number,
    finalKeywordScore: number,
    keywords: string[],
    matchedKeywords: string[],
    unmatchedKeywords: string[],
    provider: string,
    matchedKeywordsByCategory?: any,
    unmatchedKeywordsByCategory?: any,
  ): Promise<ResumeDocument> {
    const optimizedResume = await this.resumeModel.create({
      ...resumeData,
      userId: userId,
      slug: this.generateResumeSlug(resumeData.title),
      isOptimized: true,
      source: 'optimization',
      parentResumeId,
      jobId,
      initialATSScore,
      finalATSScore,
      initialKeywordScore,
      finalKeywordScore,
      keywords,
      matchedKeywords,
      unmatchedKeywords,
      matchedKeywordsByCategory,
      unmatchedKeywordsByCategory,
      optimizationProvider: provider,
    });

    await this.userModel
      .findByIdAndUpdate(userId, {
        $push: { resumeIds: String(optimizedResume._id) },
      })
      .exec();

    return optimizedResume;
  }

  async findAll(
    userId: string,
    paginationDto: PaginationDto,
    isOptimized?: boolean,
  ): Promise<PaginatedResponse<ResumeDocument>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    // Build query with optional isOptimized filter
    let query: any = { userId };
    if (isOptimized !== undefined) {
      if (isOptimized === false) {
        // For base resumes, include documents where isOptimized is false, null, or doesn't exist
        query = {
          userId,
          $or: [
            { isOptimized: false },
            { isOptimized: null },
            { isOptimized: { $exists: false } },
          ],
        };
      } else {
        // For optimized resumes, explicitly check for true
        query.isOptimized = true;
      }
    }

    const [data, total] = await Promise.all([
      this.resumeModel
        .find(query)
        .sort({ updatedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.resumeModel.countDocuments(query),
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

  /**
   * Recalculate ONLY final scores and keywords for an edited optimized resume
   * Initial scores should never change as they represent the base resume
   */
  private async recalculateFinalScoresOnly(
    resume: ResumeDocument,
    job: JobDocument,
  ): Promise<{
    finalATSScore: number;
    finalKeywordScore: number;
    keywords: string[];
    matchedKeywords: string[];
    unmatchedKeywords: string[];
    matchedKeywordsByCategory?: any;
    unmatchedKeywordsByCategory?: any;
  }> {
    // Use AI service's centralized function to extract only content
    const resumeText = this.aiService.extractResumeContent(resume.toObject());

    // Use the optimized method that calculates everything at once
    const scores = this.keywordsExtractor.calculateAllScores(
      resumeText,
      job.keywords,
    );

    // Flatten keywords for storage
    const allKeywords = this.keywordsExtractor.getAllKeywordsFlat(job.keywords);
    const matchedFlat = this.keywordsExtractor.getAllKeywordsFlat(
      scores.matched,
    );
    const unmatchedFlat = this.keywordsExtractor.getAllKeywordsFlat(
      scores.unmatched,
    );

    return {
      finalATSScore: scores.atsScore,
      finalKeywordScore: scores.keywordScore,
      keywords: allKeywords,
      matchedKeywords: matchedFlat,
      unmatchedKeywords: unmatchedFlat,
      matchedKeywordsByCategory: scores.matched,
      unmatchedKeywordsByCategory: scores.unmatched,
    };
  }

  async findOne(id: string, userId: string): Promise<ResumeDocument> {
    const resume = await this.resumeModel.findById(id).exec();

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    if (String(resume.userId) !== userId) {
      throw new ForbiddenException('You do not have access to this resume');
    }

    return resume;
  }

  async update(
    id: string,
    userId: string,
    updateResumeDto: UpdateResumeDto,
  ): Promise<ResumeDocument> {
    const resume = await this.resumeModel.findById(id).exec();

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    if (String(resume.userId) !== userId) {
      throw new ForbiddenException('You do not have access to this resume');
    }

    // Update the resume with the provided data
    Object.assign(resume, updateResumeDto);

    // Regenerate slug if title changed
    if (updateResumeDto.title && updateResumeDto.title !== resume.title) {
      resume.slug = this.generateResumeSlug(updateResumeDto.title);
    }

    // If this is an optimized resume, recalculate ONLY final scores and keywords
    if (resume.isOptimized && resume.jobId) {
      try {
        // Get the job (we don't need base resume for final scores)
        const job = await this.jobModel.findById(resume.jobId).exec();

        if (job && job.keywords) {
          // Recalculate only final scores (initial scores never change)
          const scores = await this.recalculateFinalScoresOnly(resume, job);

          // Update resume with recalculated FINAL scores and keywords only
          // Initial scores remain unchanged as they represent the base resume
          resume.finalATSScore = scores.finalATSScore;
          resume.finalKeywordScore = scores.finalKeywordScore;
          resume.keywords = scores.keywords;
          resume.matchedKeywords = scores.matchedKeywords;
          resume.unmatchedKeywords = scores.unmatchedKeywords;
          if (scores.matchedKeywordsByCategory) {
            resume.matchedKeywordsByCategory = scores.matchedKeywordsByCategory;
          }
          if (scores.unmatchedKeywordsByCategory) {
            resume.unmatchedKeywordsByCategory =
              scores.unmatchedKeywordsByCategory;
          }
        }
      } catch (error) {
        // Log error but don't fail the update
        console.error(
          'Error recalculating scores for optimized resume:',
          error,
        );
      }
    }

    // Save and return the updated resume
    return resume.save();
  }

  async fixOptimizedField(userId: string) {
    try {
      // Find all resumes for the user
      const allResumes = await this.resumeModel.find({ userId });

      let baseFixed = 0;
      let optimizedFixed = 0;
      let alreadyCorrect = 0;

      for (const resume of allResumes) {
        // Check if isOptimized field needs fixing
        if (resume.isOptimized === undefined || resume.isOptimized === null) {
          // Determine if it's an optimized resume by checking if it has a parentResumeId
          if (resume.parentResumeId) {
            // It's an optimized resume
            resume.isOptimized = true;
            optimizedFixed++;
          } else {
            // It's a base resume
            resume.isOptimized = false;
            baseFixed++;
          }
          await resume.save();
        } else {
          alreadyCorrect++;
        }
      }

      return {
        totalResumes: allResumes.length,
        baseFixed,
        optimizedFixed,
        alreadyCorrect,
        message: `Fixed ${baseFixed} base resumes and ${optimizedFixed} optimized resumes`,
      };
    } catch (error) {
      this.logger.error('Error fixing isOptimized field:', error);
      throw error;
    }
  }

  async remove(id: string, userId: string): Promise<void> {
    const resume = await this.resumeModel.findById(id).exec();

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    if (String(resume.userId) !== userId) {
      throw new ForbiddenException('You do not have access to this resume');
    }

    // If this is a base resume, remove all optimized resumes based on it
    if (!resume.isOptimized) {
      await this.resumeModel
        .deleteMany({
          parentResumeId: resume._id,
          userId,
        })
        .exec();
    }

    // Remove the resume ID from user's resume list
    await this.userModel
      .findByIdAndUpdate(userId, {
        $pull: { resumeIds: id },
      })
      .exec();

    // Use findByIdAndDelete for consistency
    await this.resumeModel.findByIdAndDelete(id).exec();
  }

  async getOptimizedResumes(
    baseResumeId: string,
    userId: string,
  ): Promise<ResumeDocument[]> {
    // Verify access to base resume
    const baseResume = await this.resumeModel.findById(baseResumeId).exec();

    if (!baseResume) {
      throw new NotFoundException('Base resume not found');
    }

    if (String(baseResume.userId) !== userId) {
      throw new ForbiddenException('You do not have access to this resume');
    }

    if (baseResume.isOptimized) {
      throw new ForbiddenException(
        'Cannot get optimized resumes for an already optimized resume',
      );
    }

    return this.resumeModel
      .find({
        parentResumeId: baseResumeId,
        isOptimized: true,
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getBaseResumes(userId: string): Promise<ResumeDocument[]> {
    return this.resumeModel
      .find({
        userId,
        isOptimized: false,
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getOptimizedResumesByUser(userId: string): Promise<ResumeDocument[]> {
    return this.resumeModel
      .find({
        userId,
        isOptimized: true,
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByJobId(jobId: string, userId: string): Promise<ResumeDocument[]> {
    return this.resumeModel
      .find({
        jobId,
        userId,
        isOptimized: true,
      })
      .sort({ finalATSScore: -1 })
      .exec();
  }

  async countOptimizedByJob(jobId: string, userId: string): Promise<number> {
    return this.resumeModel
      .countDocuments({
        jobId,
        userId,
        isOptimized: true,
      })
      .exec();
  }

  // Migration method to add slugs to existing resumes without them
  async fixMissingSlugs(): Promise<{ updated: number }> {
    const resumesWithoutSlugs = await this.resumeModel
      .find({
        $or: [{ slug: null }, { slug: { $exists: false } }, { slug: '' }],
      })
      .exec();

    let updated = 0;
    for (const resume of resumesWithoutSlugs) {
      const slug = this.generateResumeSlug(resume.title);
      await this.resumeModel.findByIdAndUpdate(resume._id, { slug }).exec();
      updated++;
    }

    return { updated };
  }
}
