import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ApplicationDocument = Application & Document;

export enum ApplicationStatus {
  DRAFT = 'draft',
  APPLIED = 'applied',
  REVIEWING = 'reviewing',
  INTERVIEWING = 'interviewing',
  OFFERED = 'offered',
  REJECTED = 'rejected',
  ACCEPTED = 'accepted',
  WITHDRAWN = 'withdrawn',
}

@Schema()
export class InterviewDetail {
  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  type: string; // 'phone', 'video', 'onsite', 'technical', 'behavioral'

  @Prop()
  interviewer?: string;

  @Prop()
  notes?: string;

  @Prop()
  result?: string;
}

@Schema()
export class OfferDetail {
  @Prop()
  salary?: number;

  @Prop()
  salaryPeriod?: string; // 'hourly', 'yearly', 'monthly'

  @Prop()
  benefits?: string;

  @Prop()
  startDate?: Date;

  @Prop()
  deadline?: Date;

  @Prop()
  notes?: string;
}

@Schema()
export class TimelineEvent {
  @Prop({ required: true })
  timestamp: Date;

  @Prop({ required: true })
  event: string;

  @Prop()
  description?: string;

  @Prop()
  status?: ApplicationStatus;
}

@Schema()
export class QuestionAnswer {
  @Prop({ required: true })
  question: string;

  @Prop({ required: true })
  answer: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

@Schema({ timestamps: true })
export class Application {
  @Prop({ type: String, ref: 'User', required: true })
  userId: string;

  @Prop({ type: String, ref: 'Job', required: true })
  jobId: string;

  @Prop({ type: String, ref: 'Resume', required: true })
  optimizedResumeId: string;

  @Prop({ type: String, ref: 'Resume', required: true })
  baseResumeId: string;

  @Prop()
  coverLetter?: string;

  @Prop({
    type: String,
    enum: ApplicationStatus,
    default: ApplicationStatus.DRAFT,
    required: true,
  })
  status: ApplicationStatus;

  @Prop()
  applicationDate?: Date;

  @Prop({ type: [Date], default: [] })
  followUpDates: Date[];

  @Prop()
  notes?: string;

  @Prop()
  companyResponse?: string;

  @Prop({ type: [InterviewDetail], default: [] })
  interviewDetails: InterviewDetail[];

  @Prop({ type: OfferDetail })
  offerDetails?: OfferDetail;

  @Prop({ type: [String], default: [] })
  documents: string[]; // URLs to additional documents

  @Prop({ type: [TimelineEvent], default: [] })
  timeline: TimelineEvent[];

  @Prop({ type: Object })
  customFields?: Record<string, any>;

  @Prop()
  applicationUrl?: string; // Link to the application on company website

  @Prop()
  jobPostingUrl?: string; // Original job posting URL

  @Prop()
  contactPerson?: string;

  @Prop()
  contactEmail?: string;

  @Prop()
  contactPhone?: string;

  @Prop({ type: [QuestionAnswer], default: [] })
  questionsAnswers: QuestionAnswer[];
}

export const ApplicationSchema = SchemaFactory.createForClass(Application);

// Add indexes for common queries
ApplicationSchema.index({ userId: 1, status: 1 });
ApplicationSchema.index({ userId: 1, createdAt: -1 });
ApplicationSchema.index({ jobId: 1 });
ApplicationSchema.index({ optimizedResumeId: 1 });

// Add virtual populate for related documents
ApplicationSchema.virtual('job', {
  ref: 'Job',
  localField: 'jobId',
  foreignField: '_id',
  justOne: true,
});

ApplicationSchema.virtual('optimizedResume', {
  ref: 'Resume',
  localField: 'optimizedResumeId',
  foreignField: '_id',
  justOne: true,
});

ApplicationSchema.virtual('baseResume', {
  ref: 'Resume',
  localField: 'baseResumeId',
  foreignField: '_id',
  justOne: true,
});

// Ensure virtuals are included in JSON output
ApplicationSchema.set('toJSON', { virtuals: true });
ApplicationSchema.set('toObject', { virtuals: true });
