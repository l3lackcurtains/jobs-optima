import { IsString, IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class FindJobsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['applied', 'not-applied'])
  applicationStatus?: 'applied' | 'not-applied';

  @IsOptional()
  @IsEnum(['remote', 'hybrid', 'onsite', 'flexible'])
  workMode?: 'remote' | 'hybrid' | 'onsite' | 'flexible';

  @IsOptional()
  @IsEnum(['createdAt', 'updatedAt'])
  sortBy?: 'createdAt' | 'updatedAt';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
