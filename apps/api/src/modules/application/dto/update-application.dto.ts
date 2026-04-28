import { PartialType } from '@nestjs/mapped-types';
import { CreateApplicationDto } from './create-application.dto';
import {
  IsArray,
  IsOptional,
  ValidateNested,
  IsString,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';

class QuestionAnswerDto {
  @IsString()
  question: string;

  @IsString()
  answer: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  createdAt?: Date;
}

export class UpdateApplicationDto extends PartialType(CreateApplicationDto) {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionAnswerDto)
  @IsOptional()
  questionsAnswers?: QuestionAnswerDto[];
}
