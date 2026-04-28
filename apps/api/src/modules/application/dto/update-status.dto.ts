import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApplicationStatus } from '@schemas/application.schema';

export class UpdateStatusDto {
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}
