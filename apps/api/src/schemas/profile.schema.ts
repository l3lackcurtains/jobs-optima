import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProfileDocument = Profile & Document;

// Core contact information matching resume structure  
@Schema({ _id: false })
export class ContactInfo {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  phone: string;

  @Prop()
  linkedin?: string;

  @Prop()
  github?: string;

  @Prop()
  personalWebsite?: string;

  // Additional profile fields
  @Prop()
  twitter?: string;

  // Detailed address fields for profile
  @Prop()
  street?: string;

  @Prop()
  apartment?: string;

  @Prop()
  city?: string;

  @Prop()
  state?: string;

  @Prop()
  zipCode?: string;

  @Prop()
  country?: string;
  
  // Pronouns for inclusive communication
  @Prop({ 
    enum: [
      'he/him', 
      'she/her', 
      'they/them', 
      'xe/xem', 
      'ze/hir', 
      'ey/em', 
      'hir/hir', 
      'fae/faer', 
      'hu/hu', 
      'use name only', 
      'custom'
    ] 
  })
  pronouns?: string;
  
  @Prop()
  customPronouns?: string; // If pronouns is 'custom'
  
  @Prop()
  preferredFirstName?: string; // Preferred name for job applications
}

// Experience matching resume structure
@Schema({ _id: false })
export class Experience {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  company: string;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true })
  dates: string;

  @Prop({ type: [String], required: true })
  responsibilities: string[];
}

// Project matching resume structure
@Schema({ _id: false })
export class Project {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  technologies: string;

  @Prop({ required: true })
  description: string;

  // Additional profile fields
  @Prop()
  url?: string;

  @Prop()
  role?: string;
}

// Education matching resume structure
@Schema({ _id: false })
export class Education {
  @Prop({ required: true })
  institution: string;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true })
  dates: string;

  @Prop({ required: true })
  degree: string;

  @Prop({ type: [String] })
  achievements?: string[];
}

// Skills matching resume structure
@Schema({ _id: false })
export class Skills {
  @Prop({ type: [String], default: [] })
  technicalSkills: string[];

  @Prop({ type: [String], default: [] })
  developmentPracticesMethodologies: string[];

  @Prop({ type: [String], default: [] })
  personalSkills: string[];

  // Additional profile field - soft skills separated
  @Prop({ type: [String], default: [] })
  softSkills?: string[];
}


@Schema({ timestamps: true })
export class Profile {
  @Prop({ required: true })
  profileName: string;

  @Prop({ default: false })
  isDefault: boolean;

  // Core resume-compatible fields
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

  // Additional profile-specific fields
  @Prop()
  professionalSummary?: string;

  @Prop()
  objective?: string;

  @Prop()
  totalYearsExperience?: number;

  @Prop()
  currentSalary?: number;

  @Prop()
  desiredSalary?: number;

  @Prop({ required: true, default: 'Authorized' })
  workAuthorization: string;

  @Prop({ default: false })
  requiresSponsorship?: boolean;

  @Prop()
  availableStartDate?: Date;

  @Prop({ type: [String], default: [] })
  preferredWorkTypes?: string[];

  @Prop({ type: [String], default: [] })
  preferredJobTypes?: string[];

  @Prop({ type: [String], default: [] })
  achievements?: string[];
  
  // Job application specific fields
  @Prop()
  currentCompany?: string;
  
  @Prop()
  currentLocation?: string;
  
  @Prop()
  salaryExpectations?: string; // Free text field for expectations
  
  @Prop({ default: false })
  intendSecondaryEmployment?: boolean; // For secondary employment question
  
  @Prop({ default: false })
  previouslyWorkedAtCompany?: boolean; // If they worked at this company before
  
  @Prop()
  coverLetter?: string; // Additional information/cover letter
  
  // Experience level fields for specific technologies
  @Prop()
  distributedSystemsExperience?: string; // Enum: beginner, intermediate, advanced, expert
  
  @Prop()
  golangProficiency?: string; // Enum: none, beginner, intermediate, advanced, expert
  
  @Prop({ default: false })
  adtechExperience?: boolean; // If they have adtech experience
  
  @Prop({ default: false })
  livesInUSOrCanada?: boolean; // Location preference question

  // EEO Information (Optional)
  @Prop()
  authorizedToWorkInUS?: boolean;

  // Detailed ethnicity options based on job application form
  @Prop({ type: [String] })
  ethnicity?: string[]; // Multiple selections allowed
  
  // Gender identity
  @Prop({ 
    enum: [
      'female', 
      'male', 
      'non-binary', 
      'agender', 
      'two-spirit', 
      'other', 
      'prefer not to say'
    ] 
  })
  gender?: string;

  // Sexual orientation
  @Prop({ 
    enum: [
      'asexual',
      'bisexual', 
      'gay', 
      'heterosexual', 
      'lesbian', 
      'pansexual', 
      'queer', 
      'two-spirit', 
      'other', 
      'prefer not to say'
    ] 
  })
  sexualOrientation?: string;
  
  // Disability information
  @Prop({ type: [String] })
  disabilities?: string[]; // Multiple selections: no disabilities, mental health, physical disability, cognitive/learning, other, prefer not to say
  
  @Prop()
  veteranStatus?: string;

  // Custom fields for flexibility
  @Prop({ type: Object })
  customFields?: Record<string, any>;

  // Metadata
  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  usageCount: number;

  @Prop()
  lastUsedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'Resume' })
  linkedResumeId?: Types.ObjectId;

  @Prop()
  lastImportedFromResume?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);

// Add indexes for common queries
ProfileSchema.index({ userId: 1 });
ProfileSchema.index({ userId: 1, isDefault: 1 });
ProfileSchema.index({ userId: 1, isActive: 1 });

// Configure schema to exclude __v from JSON responses
ProfileSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete (ret as any).__v;
    return ret;
  },
});