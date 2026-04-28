import { IsString, IsOptional } from 'class-validator';

export class GenerateQnADto {
  @IsString()
  question: string;

  @IsString()
  optimizedResumeId: string;

  @IsString()
  jobId: string;

  @IsOptional()
  @IsString()
  customInstructions?: string;
}
