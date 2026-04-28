import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Cron } from '@nestjs/schedule';
import {
  JobScanSettings,
  JobScanSettingsDocument,
} from './schemas/job-scan-settings.schema';

@Injectable()
export class JobScannerScheduler implements OnModuleInit {
  private readonly logger = new Logger(JobScannerScheduler.name);

  constructor(
    @InjectModel(JobScanSettings.name)
    private jobScanSettingsModel: Model<JobScanSettingsDocument>,
    @InjectQueue('job-scanner') private jobQueue: Queue,
  ) {}

  async onModuleInit() {
    // Add a small delay to ensure queue is ready
    setTimeout(() => {
      this.initializeScheduledScans();
    }, 1000);
  }

  /**
   * Initialize scheduled scans on server startup
   * Reschedules all active auto-scans
   */
  private async initializeScheduledScans() {
    try {
      this.logger.log('🚀 Initializing BullMQ job scheduler...');
      const now = new Date();

      // Clear any existing jobs in the queue first (for clean restart)
      await this.clearAllScheduledJobs();

      // Find all users with auto-scan enabled
      const settings = await this.jobScanSettingsModel.find({
        enableAutoScan: true,
      });

      this.logger.log(`Found ${settings.length} users with auto-scan enabled`);

      for (const setting of settings) {
        const userId = setting.userId.toString();

        // Calculate when the next scan should be
        // Always schedule based on current interval settings from now
        const nextScan = this.calculateNextScanTime(
          setting.scanIntervalHours ?? 6,
          setting.scanIntervalMinutes ?? 0,
        );

        this.logger.log(
          `📅 Scheduling scan for user ${userId} at ${nextScan.toISOString()} ` +
            `(interval: ${setting.scanIntervalHours || 6}h ${setting.scanIntervalMinutes || 0}m from now)`,
        );

        // Update the database with the next scheduled scan time
        await this.updateNextScheduledScan(
          (setting as any)._id.toString(),
          nextScan,
        );

        // Schedule the job in BullMQ
        await this.scheduleUserScan(userId, nextScan);
      }

      this.logger.log('✅ Job scheduler initialization complete');
    } catch (error) {
      this.logger.error('Failed to initialize scheduled scans:', error);
    }
  }

  /**
   * Schedule a scan job for a specific user
   */
  async scheduleUserScan(userId: string, scheduledTime: Date): Promise<void> {
    try {
      // Check if queue is connected
      if (!this.jobQueue) {
        this.logger.error(
          `❌ Queue is null/undefined, cannot schedule scan for user ${userId}`,
        );
        return;
      }

      if (!this.jobQueue.client) {
        this.logger.error(
          `❌ Queue client is not initialized, cannot schedule scan for user ${userId}`,
        );
        return;
      }

      // Remove any existing jobs for this user
      await this.removeUserJobs(userId);

      const now = new Date();
      const delay = Math.max(0, scheduledTime.getTime() - now.getTime());

      // Add the job to the queue with a delay
      const job = await this.jobQueue.add(
        `scan-${userId}`,
        { userId, scheduledTime: scheduledTime.toISOString() },
        {
          delay,
          jobId: `user-${userId}-scan`, // Unique job ID per user
          removeOnComplete: true,
          removeOnFail: false,
        },
      );

      this.logger.log(
        `📅 Scheduled job ${job.id} for user ${userId} ${
          delay > 0 ? `in ${Math.round(delay / 60000)} minutes` : 'immediately'
        }`,
      );
    } catch (error) {
      this.logger.error(`Failed to schedule scan for user ${userId}:`, error);
      // Don't throw, just log the error
      if (
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('Redis')
      ) {
        this.logger.warn('Redis is not available. Job scheduling is disabled.');
      }
    }
  }

  /**
   * Schedule the next scan for a user after completing a scan
   */
  async scheduleNextScan(userId: string): Promise<void> {
    try {
      const settings = await this.jobScanSettingsModel.findOne({ userId });
      if (!settings?.enableAutoScan) {
        this.logger.log(
          `Auto-scan disabled for user ${userId}, not scheduling next scan`,
        );
        return;
      }

      const nextScan = this.calculateNextScanTime(
        settings.scanIntervalHours ?? 6,
        settings.scanIntervalMinutes ?? 0,
      );

      // Update database
      await this.jobScanSettingsModel.findByIdAndUpdate(settings._id, {
        nextScheduledScan: nextScan,
        lastScanAt: new Date(),
      });

      // Schedule next job
      await this.scheduleUserScan(userId, nextScan);
      this.logger.log(
        `📅 Next scan scheduled for user ${userId} at ${nextScan.toISOString()}`,
      );
    } catch (error) {
      this.logger.error(
        `Error scheduling next scan for user ${userId}:`,
        error,
      );
    }
  }

  /**
   * Handle user settings update - reschedule if needed
   */
  async handleSettingsUpdate(
    userId: string,
    enableAutoScan: boolean,
    intervalHours?: number,
    intervalMinutes?: number,
  ): Promise<Date | undefined> {
    try {
      this.logger.log(
        `handleSettingsUpdate called with: hours=${intervalHours}, minutes=${intervalMinutes}`,
      );

      if (enableAutoScan) {
        // Calculate and schedule next scan
        const hoursToUse = intervalHours ?? 6;
        const minutesToUse = intervalMinutes ?? 0;

        this.logger.log(
          `Using interval: ${hoursToUse} hours, ${minutesToUse} minutes`,
        );

        const nextScan = this.calculateNextScanTime(hoursToUse, minutesToUse);

        await this.scheduleUserScan(userId, nextScan);
        this.logger.log(
          `📅 Updated schedule for user ${userId} - next scan at ${nextScan.toISOString()}`,
        );

        return nextScan;
      } else {
        // Cancel any existing scheduled jobs
        await this.cancelUserScans(userId);
        return undefined;
      }
    } catch (error) {
      this.logger.error(
        `Error handling settings update for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Cancel all scheduled scans for a user
   */
  async cancelUserScans(userId: string): Promise<void> {
    try {
      await this.removeUserJobs(userId);
      this.logger.log(`🛑 Cancelled all scheduled scans for user ${userId}`);
    } catch (error) {
      this.logger.error(`Error cancelling scans for user ${userId}:`, error);
    }
  }

  /**
   * Check for any missed schedules (runs every 30 minutes as backup)
   */
  @Cron('0 */30 * * * *')
  async checkMissedSchedules() {
    try {
      const now = new Date();
      this.logger.log(`🔍 Checking for missed scheduled scans...`);

      // Find users with auto-scan enabled and nextScheduledScan in the past
      const missedSettings = await this.jobScanSettingsModel
        .find({
          enableAutoScan: true,
          nextScheduledScan: { $lte: now },
        })
        .lean();

      if (missedSettings.length > 0) {
        this.logger.warn(
          `⚠️ Found ${missedSettings.length} users with missed scans`,
        );

        for (const setting of missedSettings) {
          const userId = setting.userId.toString();

          try {
            // Check if this user already has a scheduled job
            const existingJob = await this.jobQueue.getJob(
              `user-${userId}-scan`,
            );
            if (!existingJob) {
              this.logger.log(`📅 Rescheduling missed scan for user ${userId}`);

              // Schedule immediate scan and then regular schedule
              await this.scheduleUserScan(userId, new Date());
            }
          } catch (jobError) {
            this.logger.warn(
              `Could not check/reschedule job for user ${userId}:`,
              jobError,
            );
            // Try to schedule anyway in case the error was just from checking
            try {
              await this.scheduleUserScan(userId, new Date());
            } catch (scheduleError) {
              this.logger.error(
                `Failed to reschedule for user ${userId}:`,
                scheduleError,
              );
            }
          }
        }
      }
    } catch (error) {
      this.logger.error('Error checking missed schedules:', error);
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    try {
      const waiting = await this.jobQueue.getWaitingCount();
      const delayed = await this.jobQueue.getDelayedCount();
      const active = await this.jobQueue.getActiveCount();
      const completed = await this.jobQueue.getCompletedCount();
      const failed = await this.jobQueue.getFailedCount();

      return {
        waiting,
        delayed,
        active,
        completed,
        failed,
        total: waiting + delayed + active,
      };
    } catch (error) {
      this.logger.error('Error getting queue stats:', error);
      return null;
    }
  }

  /**
   * Helper: Calculate next scan time based on interval
   */
  private calculateNextScanTime(hours: number, minutes: number): Date {
    const nextScan = new Date();
    const totalMinutes = hours * 60 + minutes;
    nextScan.setMinutes(nextScan.getMinutes() + totalMinutes);
    return nextScan;
  }

  /**
   * Helper: Remove all jobs for a specific user
   */
  private async removeUserJobs(userId: string): Promise<void> {
    try {
      const jobs = await this.jobQueue.getJobs([
        'delayed',
        'waiting',
        'active',
      ]);

      // Handle case where jobs might not be an array (ioredis-mock compatibility)
      if (!jobs || !Array.isArray(jobs)) {
        this.logger.warn(
          `No jobs array returned for user ${userId}, skipping removal`,
        );
        return;
      }

      for (const job of jobs) {
        if (job?.data?.userId === userId) {
          await job.remove();
          this.logger.log(
            `🗑️ Removed existing job ${job.id} for user ${userId}`,
          );
        }
      }
    } catch (error) {
      this.logger.warn(`Could not remove jobs for user ${userId}:`, error);
      // Continue execution even if job removal fails
    }
  }

  /**
   * Helper: Clear all scheduled jobs (used on startup)
   */
  private async clearAllScheduledJobs(): Promise<void> {
    try {
      // Try to use obliterate if available (may not work with ioredis-mock)
      if (typeof this.jobQueue.obliterate === 'function') {
        await this.jobQueue.obliterate({ force: true });
        this.logger.log(
          '🗑️ Cleared all existing scheduled jobs using obliterate',
        );
      } else {
        // Fallback: manually remove jobs
        const jobTypes = [
          'delayed',
          'waiting',
          'active',
          'completed',
          'failed',
        ];
        for (const type of jobTypes) {
          try {
            const jobs = await this.jobQueue.getJobs([type as any]);
            if (Array.isArray(jobs)) {
              for (const job of jobs) {
                await job.remove();
              }
            }
          } catch (error) {
            // Continue even if one type fails
            this.logger.debug(`Could not clear ${type} jobs:`, error);
          }
        }
        this.logger.log('🗑️ Cleared existing scheduled jobs manually');
      }
    } catch (error) {
      this.logger.warn(
        'Could not clear all scheduled jobs, continuing anyway:',
        error,
      );
    }
  }

  /**
   * Helper: Update next scheduled scan in database
   */
  private async updateNextScheduledScan(
    settingId: string,
    nextScan: Date,
  ): Promise<void> {
    await this.jobScanSettingsModel.findByIdAndUpdate(settingId, {
      nextScheduledScan: nextScan,
    });
  }
}
