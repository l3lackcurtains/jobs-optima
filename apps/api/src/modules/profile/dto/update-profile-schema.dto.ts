import {
  IsString,
  IsArray,
  IsOptional,
  ValidateNested,
  IsBoolean,
  IsNumber,
  IsMongoId,
  IsEnum,
  IsNotIn,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

// Helper transform to remove _id fields
const RemoveIdTransform = () => Transform(({ value }) => {
  if (!value) return value;
  const { _id, ...rest } = value;
  return rest;
});

// Matching the Profile schema structure exactly

class ContactInfoDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  linkedin?: string;

  @IsOptional()
  @IsString()
  github?: string;

  @IsOptional()
  @IsString()
  personalWebsite?: string;

  @IsOptional()
  @IsString()
  twitter?: string;

  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  apartment?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsOptional()
  @IsString()
  country?: string;
  
  @IsOptional()
  @IsString()
  @IsEnum([
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
  ])
  pronouns?: string;
  
  @IsOptional()
  @IsString()
  customPronouns?: string;
}

class ExperienceDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  dates?: string; // String format like "Jan 2020 - Present"

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  responsibilities?: string[];
}

class ProjectDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  technologies?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  role?: string;
}

class EducationDto {
  @IsOptional()
  @IsString()
  institution?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  dates?: string; // String format like "2016 - 2020"

  @IsOptional()
  @IsString()
  degree?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  achievements?: string[];
}

class SkillsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  technicalSkills?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  developmentPracticesMethodologies?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  personalSkills?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  softSkills?: string[];
}

export class UpdateProfileSchemaDto {
  @IsOptional()
  @IsString()
  profileName?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @RemoveIdTransform()
  @ValidateNested()
  @Type(() => ContactInfoDto)
  contactInfo?: ContactInfoDto;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value?.map((item: any) => {
    const { _id, ...rest } = item || {};
    return rest;
  }))
  @ValidateNested({ each: true })
  @Type(() => ExperienceDto)
  experience?: ExperienceDto[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value?.map((item: any) => {
    const { _id, ...rest } = item || {};
    return rest;
  }))
  @ValidateNested({ each: true })
  @Type(() => ProjectDto)
  projects?: ProjectDto[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value?.map((item: any) => {
    const { _id, ...rest } = item || {};
    return rest;
  }))
  @ValidateNested({ each: true })
  @Type(() => EducationDto)
  education?: EducationDto[];

  @IsOptional()
  @RemoveIdTransform()
  @ValidateNested()
  @Type(() => SkillsDto)
  skills?: SkillsDto;

  @IsOptional()
  @IsString()
  @IsEnum([
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
  ])
  category?: string;

  @IsOptional()
  @IsString()
  professionalSummary?: string;

  @IsOptional()
  @IsString()
  objective?: string;

  @IsOptional()
  @IsNumber()
  totalYearsExperience?: number;

  @IsOptional()
  @IsNumber()
  currentSalary?: number;

  @IsOptional()
  @IsNumber()
  desiredSalary?: number;

  @IsOptional()
  @IsString()
  workAuthorization?: string;

  @IsOptional()
  @IsBoolean()
  requiresSponsorship?: boolean;

  @IsOptional()
  @IsString() // Changed from Date to string for flexibility
  availableStartDate?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredWorkTypes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredJobTypes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  achievements?: string[];
  
  // Job application specific fields
  @IsOptional()
  @IsString()
  currentCompany?: string;
  
  @IsOptional()
  @IsString()
  salaryExpectations?: string;
  
  @IsOptional()
  @IsBoolean()
  intendSecondaryEmployment?: boolean;
  
  @IsOptional()
  @IsBoolean()
  previouslyWorkedAtCompany?: boolean;
  
  @IsOptional()
  @IsString()
  coverLetter?: string;
  
  @IsOptional()
  @IsString()
  distributedSystemsExperience?: string;
  
  @IsOptional()
  @IsString()
  golangProficiency?: string;
  
  @IsOptional()
  @IsBoolean()
  adtechExperience?: boolean;
  
  @IsOptional()
  @IsBoolean()
  livesInUSOrCanada?: boolean;

  // EEO Information
  @IsOptional()
  @IsBoolean()
  authorizedToWorkInUS?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ethnicity?: string[];

  @IsOptional()
  @IsString()
  @IsEnum([
    'female', 
    'male', 
    'non-binary', 
    'agender', 
    'two-spirit', 
    'other', 
    'prefer not to say'
  ])
  gender?: string;

  @IsOptional()
  @IsString()
  @IsEnum([
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
  ])
  sexualOrientation?: string;
  
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  disabilities?: string[];

  @IsOptional()
  @IsString()
  veteranStatus?: string;

  @IsOptional()
  customFields?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  usageCount?: number;

  @IsOptional()
  @IsString()
  lastUsedAt?: string;

  @IsOptional()
  @IsMongoId()
  linkedResumeId?: string;

  @IsOptional()
  @IsString()
  lastImportedFromResume?: string;
}