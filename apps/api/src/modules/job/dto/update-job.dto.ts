import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsIn,
} from 'class-validator';

export class UpdateJobDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  company?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  salaryMin?: number;

  @IsNumber()
  @IsOptional()
  salaryMax?: number;

  @IsString()
  @IsOptional()
  salaryPeriod?: string;

  @IsString()
  @IsOptional()
  url?: string;

  @IsString()
  @IsOptional()
  source?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsOptional()
  keywords?: {
    actionVerbs?: string[];
    hardSkills?: string[];
    softSkills?: string[];
  };

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  // New fields
  @IsString()
  @IsOptional()
  summary?: string;

  @IsString()
  @IsOptional()
  industry?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  mustHaveSkills?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  niceToHaveSkills?: string[];

  @IsString()
  @IsIn(['remote', 'hybrid', 'onsite'])
  @IsOptional()
  workMode?: 'remote' | 'hybrid' | 'onsite';

  @IsString()
  @IsIn([
    'full-time',
    'part-time',
    'contract',
    'internship',
    'freelance',
    'temporary',
  ])
  @IsOptional()
  jobType?:
    | 'full-time'
    | 'part-time'
    | 'contract'
    | 'internship'
    | 'freelance'
    | 'temporary';
}
