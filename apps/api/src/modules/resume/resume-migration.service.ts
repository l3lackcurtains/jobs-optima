import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Resume, ResumeDocument } from '@schemas/resume.schema';
import { Job, JobDocument } from '@schemas/job.schema';
import { KeywordsExtractorService } from '@modules/job/keywords-extractor.service';
import { AiService } from '@modules/ai/ai.service';

@Injectable()
export class ResumeMigrationService {
  constructor(
    @InjectModel(Resume.name) private resumeModel: Model<ResumeDocument>,
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
    private keywordsExtractor: KeywordsExtractorService,
    private aiService: AiService,
  ) {}

  /**
   * Migrate existing resumes to add categorized keywords
   */
  async migrateCategorizesKeywords(): Promise<{
    totalResumes: number;
    migratedResumes: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let migratedResumes = 0;

    // Find all optimized resumes that have flat keywords but not categorized ones
    const resumesToMigrate = await this.resumeModel
      .find({
        isOptimized: true,
        jobId: { $exists: true },
        $or: [
          { matchedKeywordsByCategory: { $exists: false } },
          { unmatchedKeywordsByCategory: { $exists: false } },
        ],
      })
      .exec();

    const totalResumes = resumesToMigrate.length;
    console.log(`Found ${totalResumes} resumes to migrate`);

    for (const resume of resumesToMigrate) {
      try {
        // Get the associated job
        const job = await this.jobModel.findById(resume.jobId).exec();

        if (!job || !job.keywords) {
          errors.push(
            `Resume ${resume._id}: Job ${resume.jobId} not found or has no keywords`,
          );
          continue;
        }

        // Extract resume content
        const resumeText = this.aiService.extractResumeContent(
          resume.toObject(),
        );

        // Calculate matched and unmatched keywords by category
        const analysis = this.keywordsExtractor.calculateMatchedKeywords(
          resumeText,
          job.keywords,
        );

        // Update the resume with categorized keywords
        await this.resumeModel
          .findByIdAndUpdate(
            resume._id,
            {
              $set: {
                matchedKeywordsByCategory: analysis.matched,
                unmatchedKeywordsByCategory: analysis.unmatched,
              },
            },
            { new: true },
          )
          .exec();

        migratedResumes++;
        console.log(`Migrated resume ${resume._id}`);
      } catch (error) {
        const errorMsg = `Failed to migrate resume ${resume._id}: ${error.message}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    console.log(
      `Migration completed: ${migratedResumes}/${totalResumes} resumes migrated`,
    );
    if (errors.length > 0) {
      console.error('Errors during migration:', errors);
    }

    return {
      totalResumes,
      migratedResumes,
      errors,
    };
  }

  /**
   * Verify the migration by checking if categorized keywords match flat keywords
   */
  async verifyMigration(): Promise<{
    totalChecked: number;
    valid: number;
    mismatches: string[];
  }> {
    const mismatches: string[] = [];
    let valid = 0;

    const resumes = await this.resumeModel
      .find({
        isOptimized: true,
        matchedKeywordsByCategory: { $exists: true },
        unmatchedKeywordsByCategory: { $exists: true },
      })
      .exec();

    const totalChecked = resumes.length;

    for (const resume of resumes) {
      // Flatten categorized keywords
      const matchedFlat = resume.matchedKeywordsByCategory
        ? this.keywordsExtractor.getAllKeywordsFlat(
            resume.matchedKeywordsByCategory,
          )
        : [];
      const unmatchedFlat = resume.unmatchedKeywordsByCategory
        ? this.keywordsExtractor.getAllKeywordsFlat(
            resume.unmatchedKeywordsByCategory,
          )
        : [];

      // Compare with existing flat arrays
      const matchedMatch = this.arraysEqual(
        resume.matchedKeywords || [],
        matchedFlat,
      );
      const unmatchedMatch = this.arraysEqual(
        resume.unmatchedKeywords || [],
        unmatchedFlat,
      );

      if (matchedMatch && unmatchedMatch) {
        valid++;
      } else {
        mismatches.push(
          `Resume ${resume._id}: Matched=${matchedMatch}, Unmatched=${unmatchedMatch}`,
        );
      }
    }

    return {
      totalChecked,
      valid,
      mismatches,
    };
  }

  private arraysEqual(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((val, index) => val === sortedB[index]);
  }
}
