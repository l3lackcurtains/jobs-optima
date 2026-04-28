import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '@modules/auth/auth.module';
import { ResumeModule } from '@modules/resume/resume.module';
import { JobModule } from '@modules/job/job.module';
import { AiModule } from '@modules/ai/ai.module';
import { ParserModule } from '@modules/resume/parser.module';
import { PdfModule } from '@modules/documents/pdf/pdf.module';
import { UploadModule } from '@modules/documents/upload/upload.module';
import { ApplicationModule } from '@modules/application/application.module';
import { JobScannerModule } from '@modules/job-scanner/job-scanner.module';
import { ProfileModule } from '@modules/profile/profile.module';
import { BillingModule } from '@modules/billing/billing.module';
import configuration from '@config/configuration';
import { validationSchema } from '@config/validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    ResumeModule,
    JobModule,
    AiModule,
    ParserModule,
    PdfModule,
    UploadModule,
    ApplicationModule,
    JobScannerModule,
    ProfileModule,
    BillingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
