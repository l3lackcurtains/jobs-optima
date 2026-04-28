import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { JobScannerService } from './job-scanner.service';
import { JobScannerScheduler } from './job-scanner.scheduler';

@Processor('job-scanner')
export class JobScannerProcessor extends WorkerHost {
  private readonly logger = new Logger(JobScannerProcessor.name);

  constructor(
    private readonly jobScannerService: JobScannerService,
    private readonly jobScannerScheduler: JobScannerScheduler,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { userId } = job.data;
    this.logger.log(`🔄 Processing scheduled scan job for user ${userId}`);

    try {
      // Execute the scan
      const scanId = await this.jobScannerService.startScanAsync(userId, false);
      this.logger.log(`✅ Completed scan ${scanId} for user ${userId}`);

      // Schedule the next scan
      await this.jobScannerScheduler.scheduleNextScan(userId);

      return { scanId, userId, success: true };
    } catch (error) {
      this.logger.error(
        `Failed to process scan job for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`✅ Job ${job.id} completed successfully`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`❌ Job ${job?.id} failed:`, error);
  }
}
