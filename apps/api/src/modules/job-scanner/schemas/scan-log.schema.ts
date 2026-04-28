import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ScanLogDocument = ScanLog & Document;

export enum LogLevel {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

export enum ScanType {
  AUTO = 'auto',
  MANUAL = 'manual',
}

export class LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  phase?: string;
  details?: string;
}

@Schema({ timestamps: true })
export class ScanLog {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop({ required: true })
  scanId: string;

  @Prop({ required: true, enum: ScanType })
  scanType: ScanType;

  @Prop({ type: [Object], default: [] })
  logs: LogEntry[];

  @Prop()
  startedAt: Date;

  @Prop()
  completedAt?: Date;

  @Prop({ default: false })
  isComplete: boolean;
}

export const ScanLogSchema = SchemaFactory.createForClass(ScanLog);

// Index for efficient querying
ScanLogSchema.index({ userId: 1, scanType: 1, timestamp: -1 });
ScanLogSchema.index({ userId: 1, scanId: 1 });
