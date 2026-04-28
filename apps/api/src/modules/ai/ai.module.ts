import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { KeywordsExtractorService } from '@modules/job/keywords-extractor.service';
import { Resume, ResumeSchema } from '@schemas/resume.schema';
import { Job, JobSchema } from '@schemas/job.schema';
import { User, UserSchema } from '@schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Resume.name, schema: ResumeSchema },
      { name: Job.name, schema: JobSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [AiController],
  providers: [AiService, KeywordsExtractorService],
  exports: [AiService],
})
export class AiModule {}
