import { IsString, IsOptional } from 'class-validator';

export class OptimizeQnADto {
  @IsString()
  question: string;

  @IsString()
  currentAnswer: string;

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
