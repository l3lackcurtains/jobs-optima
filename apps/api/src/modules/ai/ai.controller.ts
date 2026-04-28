import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtAuthGuard } from '@modules/auth/jwt-auth.guard';
import { AiService } from './ai.service';
import { ContentOptimizationDto } from './dto/content-optimization.dto';
import { SkillsOptimizationDto } from './dto/skills-optimization.dto';
import { ContentImprovementDto } from './dto/content-improvement.dto';
import { SkillsImprovementDto } from './dto/skills-improvement.dto';
import { GenerateCoverLetterDto } from './dto/generate-cover-letter.dto';
import { OptimizeCoverLetterDto } from './dto/optimize-cover-letter.dto';
import { OptimizeQnADto } from './dto/optimize-qna.dto';
import { GenerateMultipleQnADto } from './dto/generate-multiple-qna.dto';
import { Resume, ResumeDocument } from '@schemas/resume.schema';
import { Job, JobDocument } from '@schemas/job.schema';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    private readonly aiService: AiService,
    @InjectModel(Resume.name) private resumeModel: Model<ResumeDocument>,
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
  ) {}

  @Post('optimize-content-with-keywords')
  async optimizeContentWithKeywords(
    @Request() req,
    @Body() dto: ContentOptimizationDto,
  ) {
    return this.aiService.optimizeContent(
      dto.content,
      dto.prompt,
      dto.keywords,
      dto.excludeKeywords,
      req.user.userId,
    );
  }

  @Post('optimize-skills-with-keywords')
  async optimizeSkillsWithKeywords(
    @Request() req,
    @Body() dto: SkillsOptimizationDto,
  ) {
    return this.aiService.optimizeSkills(
      dto.currentSkills,
      dto.prompt,
      dto.keywords,
      dto.excludeKeywords,
      dto.skillType,
      req.user.userId,
    );
  }

  @Post('improve-content-ats')
  async improveContentAts(@Request() req, @Body() dto: ContentImprovementDto) {
    return this.aiService.optimizeBaseContent(dto.content, dto.prompt, req.user.userId);
  }

  @Post('improve-skills-ats')
  async improveSkillsAts(@Request() req, @Body() dto: SkillsImprovementDto) {
    return this.aiService.optimizeBaseSkills(
      dto.currentSkills,
      dto.prompt,
      dto.skillType,
      req.user.userId,
    );
  }

  @Post('generate-cover-letter')
  async generateCoverLetter(
    @Request() req,
    @Body() dto: GenerateCoverLetterDto,
  ) {
    // Fetch optimized resume
    const resume = await this.resumeModel
      .findOne({
        _id: dto.optimizedResumeId,
        userId: req.user.userId, // Use userId from JWT payload
        isOptimized: true, // Verify it's an optimized resume
      })
      .exec();

    if (!resume) {
      throw new NotFoundException(
        'Optimized resume not found. Cover letters can only be generated for optimized resumes.',
      );
    }

    // Fetch job
    const job = await this.jobModel
      .findOne({ _id: dto.jobId, userId: req.user.userId }) // Use userId from JWT payload
      .exec();

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Extract resume data
    const resumeData = {
      contactInfo: resume.contactInfo,
      experience: resume.experience,
      education: resume.education,
      skills: resume.skills,
      projects: resume.projects,
    };

    // Create enhanced job description with all relevant details
    const enhancedJobDescription = `
Company: ${job.company}
Position: ${job.title}
Category: ${job.category || 'General'}
Industry/Domain: ${job.industry || 'Not specified'}
Location: ${job.location || 'Not specified'}
Work Mode: ${job.workMode || 'Not specified'}

MUST-HAVE SKILLS:
${job.mustHaveSkills?.length > 0 ? job.mustHaveSkills.join(', ') : 'Not specified'}

NICE-TO-HAVE SKILLS:
${job.niceToHaveSkills?.length > 0 ? job.niceToHaveSkills.join(', ') : 'Not specified'}

JOB DESCRIPTION:
${job.description}
    `.trim();

    return this.aiService.generateCoverLetter(
      resumeData,
      enhancedJobDescription,
      dto.customInstructions,
      req.user.userId,
    );
  }

  @Post('optimize-cover-letter')
  async optimizeCoverLetter(
    @Request() req,
    @Body() dto: OptimizeCoverLetterDto,
  ) {
    // Fetch optimized resume
    const resume = await this.resumeModel
      .findOne({
        _id: dto.optimizedResumeId,
        userId: req.user.userId,
        isOptimized: true,
      })
      .exec();

    if (!resume) {
      throw new NotFoundException(
        'Optimized resume not found. Cover letters can only be optimized for optimized resumes.',
      );
    }

    // Fetch job
    const job = await this.jobModel
      .findOne({ _id: dto.jobId, userId: req.user.userId })
      .exec();

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Extract resume data
    const resumeData = {
      contactInfo: resume.contactInfo,
      experience: resume.experience,
      education: resume.education,
      skills: resume.skills,
      projects: resume.projects,
    };

    // Create enhanced job description with all relevant details
    const enhancedJobDescription = `
Company: ${job.company}
Position: ${job.title}
Category: ${job.category || 'General'}
Industry/Domain: ${job.industry || 'Not specified'}
Location: ${job.location || 'Not specified'}
Work Mode: ${job.workMode || 'Not specified'}

MUST-HAVE SKILLS:
${job.mustHaveSkills?.length > 0 ? job.mustHaveSkills.join(', ') : 'Not specified'}

NICE-TO-HAVE SKILLS:
${job.niceToHaveSkills?.length > 0 ? job.niceToHaveSkills.join(', ') : 'Not specified'}

JOB DESCRIPTION:
${job.description}
    `.trim();

    return this.aiService.optimizeCoverLetter(
      dto.coverLetter,
      resumeData,
      enhancedJobDescription,
      dto.customInstructions,
      req.user.userId,
    );
  }

  @Post('optimize-qna')
  async optimizeQnA(@Request() req, @Body() dto: OptimizeQnADto) {
    // Fetch optimized resume
    const resume = await this.resumeModel
      .findOne({
        _id: dto.optimizedResumeId,
        userId: req.user.userId,
        isOptimized: true,
      })
      .exec();

    if (!resume) {
      throw new NotFoundException('Optimized resume not found.');
    }

    // Fetch job
    const job = await this.jobModel
      .findOne({ _id: dto.jobId, userId: req.user.userId })
      .exec();

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Extract resume data
    const resumeData = {
      contactInfo: resume.contactInfo,
      experience: resume.experience,
      education: resume.education,
      skills: resume.skills,
      projects: resume.projects,
    };

    // Create enhanced job description
    const enhancedJobDescription = `
Company: ${job.company}
Position: ${job.title}
Category: ${job.category || 'General'}
Industry/Domain: ${job.industry || 'Not specified'}

MUST-HAVE SKILLS:
${job.mustHaveSkills?.length > 0 ? job.mustHaveSkills.join(', ') : 'Not specified'}

JOB DESCRIPTION:
${job.description}
    `.trim();

    return this.aiService.optimizeQnA(
      dto.question,
      dto.currentAnswer,
      resumeData,
      enhancedJobDescription,
      dto.customInstructions,
      req.user.userId,
    );
  }

  @Post('generate-multiple-qna')
  async generateMultipleQnA(
    @Request() req,
    @Body() dto: GenerateMultipleQnADto,
  ) {
    // Fetch optimized resume
    const resume = await this.resumeModel
      .findOne({
        _id: dto.optimizedResumeId,
        userId: req.user.userId,
        isOptimized: true,
      })
      .exec();

    if (!resume) {
      throw new NotFoundException(
        'Optimized resume not found. Q&A can only be generated for optimized resumes.',
      );
    }

    // Fetch job
    const job = await this.jobModel
      .findOne({ _id: dto.jobId, userId: req.user.userId })
      .exec();

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Extract resume data
    const resumeData = {
      contactInfo: resume.contactInfo,
      experience: resume.experience,
      education: resume.education,
      skills: resume.skills,
      projects: resume.projects,
    };

    // Create enhanced job description
    const enhancedJobDescription = `
Company: ${job.company}
Position: ${job.title}
Category: ${job.category || 'General'}
Industry/Domain: ${job.industry || 'Not specified'}

MUST-HAVE SKILLS:
${job.mustHaveSkills?.length > 0 ? job.mustHaveSkills.join(', ') : 'Not specified'}

JOB DESCRIPTION:
${job.description}
    `.trim();

    // Generate answers for all questions
    const results = await Promise.all(
      dto.questions.map(async (q) => {
        const response = await this.aiService.generateQnA(
          q.question,
          resumeData,
          enhancedJobDescription,
          dto.customInstructions,
          req.user.userId,
        );
        return {
          question: q.question,
          suggestions: response.suggestions,
        };
      }),
    );

    return { results };
  }
}
