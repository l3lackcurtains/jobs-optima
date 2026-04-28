import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UpdateProfileSchemaDto } from './dto/update-profile-schema.dto';
import { FindProfilesDto } from './dto/find-profiles.dto';
import { CreateProfileFromResumeDto } from './dto/create-profile-from-resume.dto';
import { JwtAuthGuard } from '@modules/auth/jwt-auth.guard';

interface AuthRequest {
  user: {
    userId: string;
    email: string;
  };
}

@Controller('profiles')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post()
  async create(
    @Request() req: AuthRequest,
    @Body() createProfileFromResumeDto: CreateProfileFromResumeDto,
  ) {
    return this.profileService.createFromResume(
      req.user.userId,
      createProfileFromResumeDto,
    );
  }

  @Get()
  findAll(
    @Request() req: AuthRequest,
    @Query() findProfilesDto: FindProfilesDto,
  ) {
    return this.profileService.findAll(req.user.userId, findProfilesDto);
  }

  @Get('default')
  getDefaultProfile(@Request() req: AuthRequest) {
    return this.profileService.getDefaultProfile(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.profileService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Body() updateProfileDto: UpdateProfileSchemaDto,
  ) {
    return this.profileService.update(id, req.user.userId, updateProfileDto);
  }

  @Patch(':id/set-default')
  setAsDefault(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.profileService.setAsDefault(id, req.user.userId);
  }

  @Patch(':id/increment-usage')
  incrementUsageCount(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.profileService.incrementUsageCount(id, req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.profileService.remove(id, req.user.userId);
  }
}