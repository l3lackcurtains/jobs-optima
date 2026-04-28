import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateJobDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  url?: string;
}
