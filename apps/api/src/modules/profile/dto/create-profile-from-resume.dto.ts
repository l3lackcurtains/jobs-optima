import { IsString, IsNotEmpty, IsMongoId } from 'class-validator';

export class CreateProfileFromResumeDto {
  @IsString()
  @IsNotEmpty()
  profileName: string;

  @IsMongoId()
  resumeId: string;
}