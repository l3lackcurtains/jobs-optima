import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export type UserPlan = 'free' | 'pro';

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ type: [String], default: [] })
  resumeIds: string[];

  @Prop({ type: String, default: null })
  aiProvider: string;

  @Prop({ type: String, default: null })
  aiApiKey: string;

  @Prop({ type: String, default: null })
  aiModel: string;

  @Prop({ type: String, enum: ['free', 'pro'], default: 'free' })
  plan: UserPlan;

  @Prop({ type: Number, default: 0 })
  creditsRemaining: number;

  @Prop({ type: Date, default: null })
  creditsResetAt: Date | null;

  @Prop({ type: String, default: null })
  polarCustomerId: string | null;

  @Prop({ type: String, default: null })
  polarSubscriptionId: string | null;

  @Prop({ type: Number, default: 0 })
  dailyCallsCount: number;

  @Prop({ type: Date, default: null })
  dailyCallsResetAt: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
