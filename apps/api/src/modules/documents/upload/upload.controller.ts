import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '@modules/auth/jwt-auth.guard';

interface AuthRequest {
  user: {
    userId: string;
    email: string;
  };
}

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('resume')
  @UseInterceptors(FileInterceptor('file'))
  async uploadResume(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: AuthRequest,
    @Body('title') title?: string,
    @Body('category') category?: string,
  ) {
    return this.uploadService.processResumeUpload(
      req.user.userId,
      file,
      title,
      category,
    );
  }
}
