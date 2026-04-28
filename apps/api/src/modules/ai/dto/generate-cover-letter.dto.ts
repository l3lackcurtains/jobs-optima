import { IsString, IsOptional } from 'class-validator';

export class GenerateCoverLetterDto {
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
