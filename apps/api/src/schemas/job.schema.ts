import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type JobDocument = Job & Document;

@Schema({ timestamps: true })
export class Job {
  @Prop({ type: String, ref: 'User', required: true })
  userId: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  company: string;

  @Prop()
  location?: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  salaryMin?: number;

  @Prop()
  salaryMax?: number;

  @Prop()
  salaryPeriod?: string; // 'hourly', 'yearly', 'monthly'

  @Prop({
    type: Object,
    default: { actionVerbs: [], hardSkills: [], softSkills: [] },
  })
  keywords: {
    actionVerbs: string[];
    hardSkills: string[];
    softSkills: string[];
  };

  @Prop({ type: [String], ref: 'Resume', default: [] })
  optimizedResumeIds: string[];

  @Prop({ type: String, ref: 'Application', default: null })
  applicationId?: string;

  @Prop()
  url?: string;

  @Prop({ default: 'manual' })
  source: string; // 'manual', 'parsed', 'scraped'

  @Prop({ default: true })
  isActive: boolean;

  @Prop({
    type: String,
    enum: [
      'Frontend',
      'Backend',
      'FullStack',
      'AI/ML',
      'Blockchain',
      'DevOps',
      'Mobile',
      'DataEngineering',
      'Security',
      'General',
    ],
    default: 'General',
  })
  category: string;

  // New fields for enhanced sidebar display
  @Prop()
  summary?: string; // Brief 2-3 sentence job overview

  @Prop()
  industry?: string; // Domain context e.g., "FinTech - Digital Payments"

  @Prop({ type: [String], default: [] })
  mustHaveSkills: string[]; // Top 5 critical skills for sidebar

  @Prop({ type: [String], default: [] })
  niceToHaveSkills: string[]; // Secondary skills for sidebar

  @Prop({
    type: String,
    enum: ['remote', 'hybrid', 'onsite'],
  })
  workMode?: string; // More specific than isRemote boolean

  @Prop({
    type: String,
    enum: [
      'full-time',
      'part-time',
      'contract',
      'internship',
      'freelance',
      'temporary',
    ],
  })
  jobType?: string; // Employment type
}

export const JobSchema = SchemaFactory.createForClass(Job);

// Configure schema to exclude __v from JSON responses
JobSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete (ret as any).__v;
    return ret;
  },
});
