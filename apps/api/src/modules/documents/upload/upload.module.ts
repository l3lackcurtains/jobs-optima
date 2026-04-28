import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { ParserModule } from '@modules/resume/parser.module';
import { ResumeModule } from '@modules/resume/resume.module';
import { AiModule } from '@modules/ai/ai.module';

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
    ParserModule,
    ResumeModule,
    AiModule,
  ],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
