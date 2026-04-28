import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import type { WorkMode } from '../schemas/scanned-job.schema';
import type {
  TimeFilter,
  WorkModeFilter,
} from '../schemas/job-scan-settings.schema';

export class SearchConfigDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsEnum(['remote', 'hybrid', 'onsite', 'flexible', 'any'])
  workMode?: WorkModeFilter;

  @IsOptional()
  @IsString()
  location?: string;
}

export class UpdateJobScanSettingsDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SearchConfigDto)
  searches?: SearchConfigDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sites?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  apiCompanies?: string[];

  @IsOptional()
  @IsBoolean()
  enableRemotive?: boolean;

  @IsOptional()
  @IsBoolean()
  enableRemoteOk?: boolean;

  @IsOptional()
  @IsEnum([
    'past_hour',
    'past_day',
    'past_week',
    'past_month',
    'past_year',
    'anytime',
  ])
  timeFilter?: TimeFilter;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  maxResultsPerSearch?: number;

  @IsOptional()
  @IsBoolean()
  enableAutoScan?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(24)
  scanIntervalHours?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(59)
  scanIntervalMinutes?: number;
}

export class GetScannedJobsDto {
  @IsOptional()
  isFavorited?: any;

  @IsOptional()
  isViewed?: any;

  @IsOptional()
  isApplied?: any;

  @IsOptional()
  @IsString()
  searchTitle?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsEnum(['remote', 'hybrid', 'onsite', 'flexible'])
  workMode?: WorkMode;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  offset?: number;

  @IsOptional()
  @IsEnum(['datePosted', 'createdAt'])
  sortBy?: 'datePosted' | 'createdAt';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

export class UpdateJobStatusDto {
  @IsOptional()
  @IsBoolean()
  isFavorited?: boolean;
}

export class BulkJobActionDto {
  @IsArray()
  @IsString({ each: true })
  jobIds: string[];

  @IsEnum(['delete', 'markFavorited', 'markUnfavorited'])
  action: 'delete' | 'markFavorited' | 'markUnfavorited';
}

export class ManualScanDto {
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
