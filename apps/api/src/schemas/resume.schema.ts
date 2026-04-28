import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ResumeDocument = Resume & Document;

@Schema()
export class ContactInfo {
  @Prop({ default: '' })
  name: string;

  @Prop({ default: '' })
  location: string;

  @Prop({ default: '' })
  email: string;

  @Prop({ default: '' })
  phone: string;

  @Prop()
  linkedin?: string;

  @Prop()
  github?: string;

  @Prop()
  personalWebsite?: string;
}

@Schema()
export class Experience {
  @Prop({ default: '' })
  title: string;

  @Prop({ default: '' })
  company: string;

  @Prop({ default: '' })
  location: string;

  @Prop({ default: '' })
  dates: string;

  @Prop({ type: [String], default: [] })
  responsibilities: string[];
}

@Schema()
export class Project {
  @Prop({ default: '' })
  name: string;

  @Prop({ default: '' })
  technologies: string;

  @Prop({ default: '' })
  description: string;
}

@Schema()
export class Education {
  @Prop({ default: '' })
  institution: string;

  @Prop({ default: '' })
  location: string;

  @Prop({ default: '' })
  dates: string;

  @Prop({ default: '' })
  degree: string;

  @Prop({ type: [String] })
  achievements?: string[];
}

@Schema()
export class Skills {
  @Prop({ type: [String], default: [] })
  technicalSkills: string[];

  @Prop({ type: [String], default: [] })
  developmentPracticesMethodologies: string[];

  @Prop({ type: [String], default: [] })
  personalSkills: string[];
}

@Schema({ timestamps: true })
export class Resume {
  @Prop({ type: String, ref: 'User', required: true })
  userId: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  slug?: string;

  @Prop({ type: ContactInfo, required: true })
  contactInfo: ContactInfo;

  @Prop({ type: [Experience], default: [] })
  experience: Experience[];

  @Prop({ type: [Project], default: [] })
  projects: Project[];

  @Prop({ type: [Education], default: [] })
  education: Education[];

  @Prop({ type: Skills, required: true })
  skills: Skills;

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

  @Prop({ default: 'upload', enum: ['upload', 'manual', 'optimization'] })
  source: string;

  // Optimization fields (null for base resumes)
  @Prop({ default: false })
  isOptimized: boolean;

  @Prop({ type: String, ref: 'Resume' })
  parentResumeId?: string;

  @Prop({ type: String, ref: 'Job' })
  jobId?: string;

  @Prop()
  initialATSScore?: number;

  @Prop()
  finalATSScore?: number;

  @Prop()
  initialKeywordScore?: number;

  @Prop()
  finalKeywordScore?: number;

  @Prop({ type: [String], default: [] })
  keywords?: string[];

  // Legacy flat arrays for backward compatibility
  @Prop({ type: [String], default: [] })
  matchedKeywords?: string[];

  @Prop({ type: [String], default: [] })
  unmatchedKeywords?: string[];

  // New categorized keywords structure
  @Prop({
    type: {
      actionVerbs: { type: [String], default: [] },
      hardSkills: { type: [String], default: [] },
      softSkills: { type: [String], default: [] },
      knowledge: { type: [String], default: [] },
    },
    _id: false,
  })
  matchedKeywordsByCategory?: {
    actionVerbs: string[];
    hardSkills: string[];
    softSkills: string[];
    knowledge: string[];
  };

  @Prop({
    type: {
      actionVerbs: { type: [String], default: [] },
      hardSkills: { type: [String], default: [] },
      softSkills: { type: [String], default: [] },
      knowledge: { type: [String], default: [] },
    },
    _id: false,
  })
  unmatchedKeywordsByCategory?: {
    actionVerbs: string[];
    hardSkills: string[];
    softSkills: string[];
    knowledge: string[];
  };

  @Prop({ enum: ['openai', 'anthropic'] })
  optimizationProvider?: string;
}

export const ResumeSchema = SchemaFactory.createForClass(Resume);

// Configure schema to exclude __v from JSON responses
ResumeSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete (ret as any).__v;
    return ret;
  },
});
