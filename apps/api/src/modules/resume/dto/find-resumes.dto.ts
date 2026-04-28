import { IsOptional } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class FindResumesDto extends PaginationDto {
  @IsOptional()
  isOptimized?: any;
}
