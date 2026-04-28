import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type JobScanSettingsDocument = JobScanSettings & Document;

export type TimeFilter =
  | 'past_hour'
  | 'past_day'
  | 'past_week'
  | 'past_month'
  | 'past_year'
  | 'anytime';
export type WorkModeFilter =
  | 'remote'
  | 'hybrid'
  | 'onsite'
  | 'flexible'
  | 'any';

export class SearchConfig {
  @Prop({ required: true })
  title: string;

  @Prop({
    type: String,
    enum: ['remote', 'hybrid', 'onsite', 'flexible', 'any'],
  })
  workMode?: WorkModeFilter;

  @Prop()
  location?: string;
}

@Schema({ timestamps: true })
export class JobScanSettings {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  })
  userId: string;

  @Prop({ type: [SearchConfig], default: [] })
  searches: SearchConfig[];

  @Prop({
    type: [String],
    default: ['greenhouse.io', 'lever.co', 'workday.com'],
  })
  sites: string[];

  @Prop({
    type: String,
    enum: [
      'past_hour',
      'past_day',
      'past_week',
      'past_month',
      'past_year',
      'anytime',
    ],
    default: 'past_week',
  })
  timeFilter: TimeFilter;

  @Prop({ default: 10 })
  maxResultsPerSearch: number;

  @Prop({ default: false })
  enableAutoScan: boolean;

  @Prop({ default: 6 })
  scanIntervalHours: number;

  @Prop({ default: 0 })
  scanIntervalMinutes: number;

  @Prop()
  lastScanAt?: Date;

  @Prop()
  nextScheduledScan?: Date;

  @Prop({ default: false })
  isScanning: boolean;

  @Prop()
  currentScanId?: string;
}

export const JobScanSettingsSchema =
  SchemaFactory.createForClass(JobScanSettings);

// Index already created by unique: true on userId field
