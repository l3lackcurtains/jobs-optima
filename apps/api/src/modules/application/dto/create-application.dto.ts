import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsDate,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  IsObject,
  IsUrl,
  IsEmail,
} from 'class-validator';
import { ApplicationStatus } from '@schemas/application.schema';

class InterviewDetailDto {
  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsOptional()
  interviewer?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  result?: string;
}

class OfferDetailDto {
  @IsOptional()
  salary?: number;

  @IsString()
  @IsOptional()
  salaryPeriod?: string;

  @IsString()
  @IsOptional()
  benefits?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  startDate?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  deadline?: Date;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateApplicationDto {
  @IsString()
  @IsNotEmpty()
  jobId: string;

  @IsString()
  @IsNotEmpty()
  optimizedResumeId: string;

  @IsString()
  @IsNotEmpty()
  baseResumeId: string;

  @IsString()
  @IsOptional()
  coverLetter?: string;

  @IsEnum(ApplicationStatus)
  @IsOptional()
  status?: ApplicationStatus;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  applicationDate?: Date;

  @IsArray()
  @IsDate({ each: true })
  @Type(() => Date)
  @IsOptional()
  followUpDates?: Date[];

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  companyResponse?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InterviewDetailDto)
  @IsOptional()
  interviewDetails?: InterviewDetailDto[];

  @ValidateNested()
  @Type(() => OfferDetailDto)
  @IsOptional()
  offerDetails?: OfferDetailDto;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  documents?: string[];

  @IsObject()
  @IsOptional()
  customFields?: Record<string, any>;

  @IsUrl()
  @IsOptional()
  applicationUrl?: string;

  @IsUrl()
  @IsOptional()
  jobPostingUrl?: string;

  @IsString()
  @IsOptional()
  contactPerson?: string;

  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;
}
