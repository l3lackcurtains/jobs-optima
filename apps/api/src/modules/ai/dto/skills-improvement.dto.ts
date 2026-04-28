import { IsString, IsArray, IsOptional, IsEnum } from 'class-validator';

export enum SkillType {
  TECHNICAL = 'technical',
  SOFT = 'soft',
  DEVELOPMENT = 'development',
}

export class SkillsImprovementDto {
  @IsArray()
  @IsString({ each: true })
  currentSkills: string[];

  @IsString()
  @IsOptional()
  prompt?: string;

  @IsEnum(SkillType)
  skillType: SkillType;
}
