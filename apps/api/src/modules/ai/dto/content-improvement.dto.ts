import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum ContentType {
  RESPONSIBILITY = 'responsibility',
  PROJECT_DESCRIPTION = 'project_description',
  ACHIEVEMENT = 'achievement',
}

export class ContentImprovementDto {
  @IsString()
  content: string;

  @IsString()
  @IsOptional()
  prompt?: string;

  @IsEnum(ContentType)
  contentType: ContentType;
}
