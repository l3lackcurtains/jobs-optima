import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class QuestionDto {
  @IsString()
  question: string;
}

export class GenerateMultipleQnADto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions: QuestionDto[];

  @IsString()
  optimizedResumeId: string;

  @IsString()
  jobId: string;

  @IsOptional()
  @IsString()
  customInstructions?: string;

  @IsOptional()
  @IsString()
  provider?: string;
}
