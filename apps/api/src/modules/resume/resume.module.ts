import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResumeController } from './resume.controller';
import { ResumeManagerService } from './resume-manager.service';
import { ResumeMigrationService } from './resume-migration.service';
import { Resume, ResumeSchema } from '@schemas/resume.schema';
import { User, UserSchema } from '@schemas/user.schema';
import { Job, JobSchema } from '@schemas/job.schema';
import { PdfModule } from '@modules/documents/pdf/pdf.module';
import { AiModule } from '@modules/ai/ai.module';
import { JobModule } from '@modules/job/job.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Resume.name, schema: ResumeSchema },
      { name: User.name, schema: UserSchema },
      { name: Job.name, schema: JobSchema },
    ]),
    PdfModule,
    AiModule,
    forwardRef(() => JobModule),
  ],
  controllers: [ResumeController],
  providers: [ResumeManagerService, ResumeMigrationService],
  exports: [ResumeManagerService, ResumeMigrationService],
})
export class ResumeModule {}
