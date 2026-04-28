import { Module, OnModuleDestroy } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { JobScannerService } from './job-scanner.service';
import { JobScannerController } from './job-scanner.controller';
import { JobScannerProcessor } from './job-scanner.processor';
import { JobScannerScheduler } from './job-scanner.scheduler';
import { ScannedJob, ScannedJobSchema } from './schemas/scanned-job.schema';
import {
  JobScanSettings,
  JobScanSettingsSchema,
} from './schemas/job-scan-settings.schema';
import { ScanLog, ScanLogSchema } from './schemas/scan-log.schema';
import { Job, JobSchema } from '@schemas/job.schema';
import { AiModule } from '@modules/ai/ai.module';
import { browserPool } from './browser-pool';

// Parse Redis connection from REDIS_URL or fallback to localhost
const getRedisConnection = () => {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    // Parse redis:// or rediss:// URL
    const url = new URL(redisUrl);
    return {
      host: url.hostname,
      port: parseInt(url.port) || 6379,
      password: url.password || undefined,
      tls: redisUrl.startsWith('rediss://') ? {} : undefined,
      maxRetriesPerRequest: null,
    };
  }
  // Fallback to localhost for development
  return {
    host: 'localhost',
    port: 6379,
    maxRetriesPerRequest: null,
  };
};

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    BullModule.registerQueue({
      name: 'job-scanner',
      connection: getRedisConnection(),
    }),
    MongooseModule.forFeature([
      { name: ScannedJob.name, schema: ScannedJobSchema },
      { name: JobScanSettings.name, schema: JobScanSettingsSchema },
      { name: ScanLog.name, schema: ScanLogSchema },
      { name: Job.name, schema: JobSchema },
    ]),
    AiModule,
  ],
  controllers: [JobScannerController],
  providers: [JobScannerService, JobScannerProcessor, JobScannerScheduler],
  exports: [JobScannerService, JobScannerScheduler],
})
export class JobScannerModule implements OnModuleDestroy {
  async onModuleDestroy() {
    // Cleanup browser pool when module is destroyed
    await browserPool.shutdown();
  }
}
