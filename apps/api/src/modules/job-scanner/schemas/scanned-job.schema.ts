import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ScannedJobDocument = ScannedJob & Document;

export type WorkMode = 'remote' | 'hybrid' | 'onsite' | 'flexible';
export type ExperienceLevel = 'Entry' | 'Mid' | 'Senior' | 'Lead' | 'Principal';
export type JobType = 'Full-time' | 'Part-time' | 'Contract' | 'Internship';

@Schema({ timestamps: true })
export class ScannedJob {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: string;

  // From search/scraping
  @Prop({ required: true })
  searchTitle: string;

  // Uniqueness is per-user (compound index below) — same URL can be tracked by
  // multiple users, and re-scanning the same URL for one user is a no-op.
  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  site: string;

  @Prop({ type: Date })
  datePosted?: Date;

  @Prop({ type: Date, required: true })
  scrapedAt: Date;

  // From AI extraction
  @Prop()
  title?: string;

  @Prop()
  company?: string;

  @Prop()
  location?: string;

  @Prop({ type: String, enum: ['remote', 'hybrid', 'onsite', 'flexible'] })
  workMode?: WorkMode;

  @Prop()
  salaryRange?: string;

  @Prop({ type: String, enum: ['Entry', 'Mid', 'Senior', 'Lead', 'Principal'] })
  experienceLevel?: ExperienceLevel;

  @Prop({
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
  })
  jobType?: JobType;

  @Prop([String])
  skills?: string[];

  @Prop()
  descriptionSummary?: string;

  @Prop()
  department?: string;

  @Prop({ default: false })
  isFavorited: boolean;

  @Prop({ type: String, ref: 'Job', default: null })
  savedJobId?: string;
}

export const ScannedJobSchema = SchemaFactory.createForClass(ScannedJob);

// Create compound index for efficient querying
ScannedJobSchema.index({ userId: 1, datePosted: -1, scrapedAt: -1 });
ScannedJobSchema.index({ userId: 1, scrapedAt: -1 });
ScannedJobSchema.index({ userId: 1, url: 1 }, { unique: true });
ScannedJobSchema.index({ userId: 1, isFavorited: 1 });
