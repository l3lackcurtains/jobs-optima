import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { JobController } from './job.controller';
import { JobService } from './job.service';
import { JobParserService } from './job-parser.service';
import { KeywordsExtractorService } from './keywords-extractor.service';
import { Job, JobSchema } from '@schemas/job.schema';
import { Resume, ResumeSchema } from '@schemas/resume.schema';
import { Application, ApplicationSchema } from '@schemas/application.schema';
import { AiModule } from '@modules/ai/ai.module';
import { ResumeModule } from '@modules/resume/resume.module';
import { PdfModule } from '@modules/documents/pdf/pdf.module';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Job.name, schema: JobSchema },
      { name: Resume.name, schema: ResumeSchema },
      { name: Application.name, schema: ApplicationSchema },
    ]),
    AiModule,
    forwardRef(() => ResumeModule),
    PdfModule,
  ],
  controllers: [JobController],
  providers: [JobService, JobParserService, KeywordsExtractorService],
  exports: [JobService, KeywordsExtractorService],
})
export class JobModule {}
