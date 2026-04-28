import { IsString, IsArray, IsOptional, IsEnum } from 'class-validator';

export enum ContentType {
  RESPONSIBILITY = 'responsibility',
  PROJECT_DESCRIPTION = 'project_description',
  ACHIEVEMENT = 'achievement',
}

export class ContentOptimizationDto {
  @IsString()
  content: string;

  @IsString()
  @IsOptional()
  prompt?: string;

  @IsArray()
  @IsString({ each: true })
  keywords: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  excludeKeywords?: string[];

  @IsEnum(ContentType)
  contentType: ContentType;
}
