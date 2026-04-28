import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class OptimizeResumeDto {
  @IsString()
  @IsNotEmpty()
  resumeId: string;

  @IsString()
  @IsNotEmpty()
  jobId: string;

  @IsOptional()
  @IsString()
  provider?: string;
}
