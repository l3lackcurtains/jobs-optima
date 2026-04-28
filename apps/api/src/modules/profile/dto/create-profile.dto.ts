import { Type } from 'class-transformer';
import {
  IsString,
  IsArray,
  IsOptional,
  ValidateNested,
  IsNotEmpty,
  IsEmail,
  IsPhoneNumber,
  IsBoolean,
  IsNumber,
  IsDateString,
  IsMongoId,
} from 'class-validator';

class LanguageDto {
  @IsString()
  @IsNotEmpty()
  language: string;

  @IsString()
  @IsNotEmpty()
  proficiency: string;
}

class CertificationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  issuer: string;

  @IsDateString()
  date: Date;

  @IsOptional()
  @IsDateString()
  expiryDate?: Date;
}

class WorkExperienceDto {
  @IsString()
  @IsNotEmpty()
  company: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsDateString()
  startDate: Date;

  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @IsBoolean()
  currentlyWorking: boolean;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsArray()
  @IsString({ each: true })
  responsibilities: string[];
}

class EducationDto {
  @IsString()
  @IsNotEmpty()
  school: string;

  @IsString()
  @IsNotEmpty()
  degree: string;

  @IsString()
  @IsNotEmpty()
  fieldOfStudy: string;

  @IsOptional()
  @IsNumber()
  gpa?: number;

  @IsDateString()
  startDate: Date;

  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @IsBoolean()
  currentlyEnrolled: boolean;

  @IsString()
  @IsNotEmpty()
  location: string;
}

class ReferenceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  company: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  relationship: string;
}

class EmergencyContactDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  relationship: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

export class CreateProfileDto {
  @IsString()
  @IsNotEmpty()
  profileName: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsOptional()
  @IsString()
  preferredName?: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsOptional()
  @IsString()
  alternatePhone?: string;

  // Social Media & Online Presence
  @IsOptional()
  @IsString()
  linkedin?: string;

  @IsOptional()
  @IsString()
  github?: string;

  @IsOptional()
  @IsString()
  twitter?: string;

  @IsOptional()
  @IsString()
  personalWebsite?: string;

  // Address
  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  apartment?: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  // Professional Information
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

  @IsString()
  @IsNotEmpty()
  workAuthorization: string;

  @IsOptional()
  @IsBoolean()
  requiresSponsorship?: boolean;


  @IsOptional()
  @IsDateString()
  availableStartDate?: Date;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredWorkTypes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredJobTypes?: string[];

  // Skills
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  technicalSkills?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  softSkills?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LanguageDto)
  languages?: LanguageDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CertificationDto)
  certifications?: CertificationDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkExperienceDto)
  workExperiences?: WorkExperienceDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationDto)
  education?: EducationDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  projects?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  achievements?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReferenceDto)
  references?: ReferenceDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  emergencyContact?: EmergencyContactDto;

  // EEO Information
  @IsOptional()
  @IsBoolean()
  authorizedToWorkInUS?: boolean;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  race?: string;

  @IsOptional()
  @IsString()
  hispanicLatino?: string;

  @IsOptional()
  @IsString()
  veteranStatus?: string;

  @IsOptional()
  @IsString()
  disabilityStatus?: string;

  @IsOptional()
  @IsBoolean()
  lgbtq?: boolean;

  @IsOptional()
  @IsString()
  sexualOrientation?: string;

  @IsOptional()
  customFields?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsMongoId()
  linkedResumeId?: string;

  @IsOptional()
  @IsDateString()
  lastImportedFromResume?: Date;
}