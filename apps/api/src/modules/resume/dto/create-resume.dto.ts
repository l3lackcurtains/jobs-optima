import { Type } from 'class-transformer';
import {
  IsString,
  IsArray,
  IsOptional,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';

class ContactInfoDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  linkedin?: string;

  @IsString()
  @IsOptional()
  github?: string;

  @IsString()
  @IsOptional()
  personalWebsite?: string;
}

class ExperienceDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  company: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsNotEmpty()
  dates: string;

  @IsArray()
  @IsString({ each: true })
  responsibilities: string[];
}

class ProjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  technologies: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}

class EducationDto {
  @IsString()
  @IsNotEmpty()
  institution: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsNotEmpty()
  dates: string;

  @IsString()
  @IsNotEmpty()
  degree: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  achievements?: string[];
}

class SkillsDto {
  @IsArray()
  @IsString({ each: true })
  technicalSkills: string[];

  @IsArray()
  @IsString({ each: true })
  developmentPracticesMethodologies: string[];

  @IsArray()
  @IsString({ each: true })
  personalSkills: string[];
}

class LinksDto {
  @IsString()
  @IsOptional()
  github?: string;

  @IsString()
  @IsOptional()
  personalWebsite?: string;
}

export class CreateResumeDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @ValidateNested()
  @Type(() => ContactInfoDto)
  contactInfo: ContactInfoDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceDto)
  experience: ExperienceDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectDto)
  @IsOptional()
  projects?: ProjectDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationDto)
  education: EducationDto[];

  @ValidateNested()
  @Type(() => SkillsDto)
  skills: SkillsDto;

  @ValidateNested()
  @Type(() => LinksDto)
  @IsOptional()
  links?: LinksDto;

  @IsString()
  @IsOptional()
  source?: string;
}
