import { IsString, IsOptional } from 'class-validator';

export class OptimizeCoverLetterDto {
  @IsString()
  coverLetter: string;

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
