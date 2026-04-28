import { IsString, IsArray, IsOptional, IsEnum } from 'class-validator';

export enum SkillType {
  TECHNICAL = 'technical',
  SOFT = 'soft',
  DEVELOPMENT = 'development',
}

export class SkillsOptimizationDto {
  @IsArray()
  @IsString({ each: true })
  currentSkills: string[];

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

  @IsEnum(SkillType)
  skillType: SkillType;
}
