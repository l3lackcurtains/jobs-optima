import {
  Injectable,
  Logger,
  OnModuleInit,
  forwardRef,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { JobScannerScheduler } from './job-scanner.scheduler';
import { Browser, Page, BrowserContext } from 'playwright';
import { generateObject } from 'ai';
import { AiService } from '@modules/ai/ai.service';
import { z } from 'zod';
import { browserPool } from './browser-pool';
import { AntiDetectionUtils } from './anti-detection.utils';
import { buildFetchersFromSettings } from './fetchers';
import {
  ScannedJob,
  ScannedJobDocument,
  WorkMode,
} from './schemas/scanned-job.schema';
import { Job, JobDocument } from '@schemas/job.schema';
import {
  JobScanSettings,
  JobScanSettingsDocument,
  TimeFilter,
  SearchConfig,
} from './schemas/job-scan-settings.schema';
import {
  ScanLog,
  ScanLogDocument,
  LogLevel,
  ScanType,
  LogEntry,
} from './schemas/scan-log.schema';
import { AI_CONFIG } from '@modules/ai/ai.constants';

@Injectable()
export class JobScannerService implements OnModuleInit {
  private readonly logger = new Logger(JobScannerService.name);
  private readonly activeScansCancellation = new Map<string, boolean>(); // Track cancellation requests by scanId
  private readonly USER_AGENTS = [
    // Chrome on Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    // Chrome on Mac
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    // Firefox on Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    // Safari on Mac
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    // Edge on Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0',
  ];

  constructor(
    @InjectModel(ScannedJob.name)
    private scannedJobModel: Model<ScannedJobDocument>,
    @InjectModel(JobScanSettings.name)
    private jobScanSettingsModel: Model<JobScanSettingsDocument>,
    @InjectModel(ScanLog.name)
    private scanLogModel: Model<ScanLogDocument>,
    @InjectModel(Job.name)
    private jobModel: Model<JobDocument>,
    private configService: ConfigService,
    @Inject(forwardRef(() => JobScannerScheduler))
    private scheduler: JobScannerScheduler,
    private aiService: AiService,
  ) {}

  /**
   * One-time migration: the original schema had a global unique index on `url`,
   * which prevented two different users from tracking the same job. The
   * compound `{ userId, url }` index replaces it. Mongoose only adds new
   * indexes — old ones must be dropped explicitly.
   */
  async onModuleInit() {
    try {
      const collection = this.scannedJobModel.collection;
      const indexes = await collection.indexes();
      const legacy = indexes.find(
        (idx) =>
          idx.name === 'url_1' &&
          Object.keys(idx.key ?? {}).length === 1 &&
          idx.key?.url === 1 &&
          idx.unique,
      );
      if (legacy) {
        await collection.dropIndex('url_1');
        this.logger.log(
          'Dropped legacy unique index `url_1` (replaced by compound `{ userId, url }`)',
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Index migration check failed: ${msg}`);
    }
  }

  async getUserSettings(userId: string): Promise<JobScanSettingsDocument> {
    let settings = await this.jobScanSettingsModel
      .findOne({ userId })
      .select('-__v')
      .lean();

    if (!settings) {
      const newSettings = await this.jobScanSettingsModel.create({
        userId,
        searches: [],
        sites: [
          'greenhouse.io',
          'lever.co',
          'ashbyhq.com',
          'apply.workable.com',
          'builtin.com',
        ],
        timeFilter: 'past_week',
        maxResultsPerSearch: 10,
        enableAutoScan: false,
        scanIntervalHours: 6,
      });
      settings = await this.jobScanSettingsModel
        .findById(newSettings._id)
        .select('-__v')
        .lean();
    }

    return settings as unknown as JobScanSettingsDocument;
  }

  async updateUserSettings(
    userId: string,
    updates: Partial<JobScanSettings>,
  ): Promise<JobScanSettingsDocument> {
    this.logger.log(
      `Updating settings for user ${userId}:`,
      JSON.stringify(updates),
    );

    // Update next scheduled scan if needed
    if (
      updates.enableAutoScan !== undefined ||
      updates.scanIntervalHours !== undefined ||
      updates.scanIntervalMinutes !== undefined
    ) {
      const currentSettings = await this.jobScanSettingsModel.findOne({
        userId,
      });
      this.logger.log(
        `Current settings: hours=${currentSettings?.scanIntervalHours}, minutes=${currentSettings?.scanIntervalMinutes}`,
      );
      const enableAutoScan =
        updates.enableAutoScan ?? currentSettings?.enableAutoScan ?? false;
      // Use the updated values if provided, even if they're 0
      const scanIntervalHours =
        updates.scanIntervalHours !== undefined
          ? updates.scanIntervalHours
          : (currentSettings?.scanIntervalHours ?? 6);
      const scanIntervalMinutes =
        updates.scanIntervalMinutes !== undefined
          ? updates.scanIntervalMinutes
          : (currentSettings?.scanIntervalMinutes ?? 0);

      this.logger.log(
        `Scheduling with: enableAutoScan=${enableAutoScan}, hours=${scanIntervalHours}, minutes=${scanIntervalMinutes}`,
      );

      if (enableAutoScan) {
        // Calculate nextScheduledScan immediately without waiting for BullMQ
        const totalMinutes = scanIntervalHours * 60 + scanIntervalMinutes;
        const nextScan = new Date();
        nextScan.setMinutes(nextScan.getMinutes() + totalMinutes);
        updates.nextScheduledScan = nextScan;
        this.logger.log(`Next scan will be at: ${nextScan.toISOString()}`);

        // Fire-and-forget BullMQ scheduling — don't block the HTTP response
        this.scheduler
          .handleSettingsUpdate(
            userId,
            true,
            scanIntervalHours,
            scanIntervalMinutes,
          )
          .catch((err) =>
            this.logger.error('Background scheduler update failed:', err),
          );
      } else {
        updates.nextScheduledScan = undefined;
        this.logger.log('Auto-scan disabled, no next scan scheduled');

        // Fire-and-forget cancellation — don't block the HTTP response
        this.scheduler
          .handleSettingsUpdate(userId, false)
          .catch((err) =>
            this.logger.error('Background scheduler cancel failed:', err),
          );
      }
    }

    try {
      const updatedSettings = await this.jobScanSettingsModel
        .findOneAndUpdate(
          { userId },
          { $set: updates },
          { new: true, upsert: true },
        )
        .select('-__v')
        .lean();

      this.logger.log(
        `Returning settings with nextScheduledScan: ${updatedSettings.nextScheduledScan || 'Not set'}`,
      );
      return updatedSettings as unknown as JobScanSettingsDocument;
    } catch (error) {
      this.logger.error(
        `Failed to update settings in database for user ${userId}:`,
        error,
      );
      throw new Error(`Database error: ${error.message}`);
    }
  }

  private async logScan(
    userId: string,
    scanId: string,
    level: LogLevel,
    message: string,
    phase?: string,
    details?: string,
    scanType: ScanType = ScanType.MANUAL,
  ) {
    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      phase,
      details,
    };

    // Update or create the single document for this scan type
    await this.scanLogModel.findOneAndUpdate(
      { userId, scanType },
      {
        $set: { scanId },
        $push: { logs: logEntry },
      },
      { upsert: true },
    );

    this.logger.log(`[${level}] ${message}`);
  }

  async getScanLogs(userId: string, scanId: string): Promise<LogEntry[]> {
    // Find the log document by scanId
    const scanLog = await this.scanLogModel
      .findOne({ userId, scanId })
      .lean()
      .exec();

    return scanLog?.logs || [];
  }

  async getLatestScanLogs(
    userId: string,
  ): Promise<{ auto?: any; manual?: any }> {
    const [autoLog, manualLog] = await Promise.all([
      this.scanLogModel
        .findOne({ userId, scanType: ScanType.AUTO })
        .lean()
        .exec(),
      this.scanLogModel
        .findOne({ userId, scanType: ScanType.MANUAL })
        .lean()
        .exec(),
    ]);

    return { auto: autoLog || undefined, manual: manualLog || undefined };
  }

  async clearScanLogs(
    userId: string,
    scanType?: 'auto' | 'manual',
  ): Promise<void> {
    if (scanType) {
      const scanTypeEnum =
        scanType === 'auto' ? ScanType.AUTO : ScanType.MANUAL;
      await this.scanLogModel.deleteOne({ userId, scanType: scanTypeEnum });
    } else {
      await this.scanLogModel.deleteMany({ userId });
    }
  }

  async cancelScan(
    userId: string,
    scanId: string,
  ): Promise<{ success: boolean; message: string }> {
    // Mark the scan for cancellation
    this.activeScansCancellation.set(scanId, true);

    // Update the scan status in the database
    const settings = await this.jobScanSettingsModel.findOne({ userId });

    if (!settings || settings.currentScanId !== scanId) {
      return {
        success: false,
        message: 'No active scan found with this ID',
      };
    }

    // Log the cancellation
    await this.logScan(
      userId,
      scanId,
      LogLevel.WARNING,
      '⚠️ Scan cancellation requested by user',
      'cancelled',
      undefined,
      ScanType.MANUAL,
    );

    // Update the database to set isScanning to false immediately
    await this.jobScanSettingsModel.findOneAndUpdate(
      { userId },
      {
        isScanning: false,
        currentScanId: null,
      },
    );

    return {
      success: true,
      message:
        'Scan cancellation requested. The scan will stop at the next checkpoint.',
    };
  }

  private async isScanCancelled(scanId: string): Promise<boolean> {
    return this.activeScansCancellation.get(scanId) === true;
  }

  async startScanAsync(
    userId: string,
    isManual: boolean = false,
    forceScan: boolean = false,
  ): Promise<string> {
    // Check if already scanning (unless force scan)
    const settings = await this.jobScanSettingsModel.findOne({ userId });
    if (!forceScan && settings?.isScanning) {
      // Return the existing scan ID if already scanning
      if (settings.currentScanId) {
        return settings.currentScanId;
      }
      throw new Error('A scan is already in progress');
    }

    const scanId = uuidv4();
    const scanType = isManual ? ScanType.MANUAL : ScanType.AUTO;

    // Initialize cancellation flag for this scan
    this.activeScansCancellation.set(scanId, false);

    // Replace old logs for this scan type with new document
    await this.scanLogModel.findOneAndDelete({ userId, scanType });
    await this.scanLogModel.create({
      userId,
      scanId,
      scanType,
      logs: [],
      startedAt: new Date(),
      isComplete: false,
    });

    // Mark as scanning
    await this.jobScanSettingsModel.findOneAndUpdate(
      { userId },
      {
        isScanning: true,
        currentScanId: scanId,
      },
      { upsert: true },
    );

    // Start the scan in the background
    setImmediate(async () => {
      try {
        await this.scanJobsForUser(userId, isManual, scanId, scanType);
      } catch (error: any) {
        this.logger.error(`Background scan failed for user ${userId}:`, error);
        await this.logScan(
          userId,
          scanId,
          LogLevel.ERROR,
          `❌ Scan failed: ${error.message}`,
          'error',
          error.stack,
          scanType,
        );
      } finally {
        // Mark scan as complete and clear scanning state
        await Promise.all([
          this.scanLogModel.findOneAndUpdate(
            { userId, scanType },
            {
              isComplete: true,
              completedAt: new Date(),
            },
          ),
          this.jobScanSettingsModel.findOneAndUpdate(
            { userId },
            {
              isScanning: false,
              currentScanId: null,
            },
          ),
        ]);

        // Clean up cancellation flag
        this.activeScansCancellation.delete(scanId);
      }
    });

    // Return the scanId immediately
    return scanId;
  }

  async scanJobsForUser(
    userId: string,
    isManual: boolean = false,
    providedScanId?: string,
    scanType: ScanType = ScanType.MANUAL,
  ): Promise<{ jobs: ScannedJob[]; scanId: string; cancelled?: boolean }> {
    const scanId = providedScanId || uuidv4();

    await this.logScan(
      userId,
      scanId,
      LogLevel.INFO,
      '🚀 Starting job scan...',
      'initialization',
      undefined,
      scanType,
    );

    const settings = await this.getUserSettings(userId);
    await this.logScan(
      userId,
      scanId,
      LogLevel.INFO,
      `📋 Found ${settings.searches.length} search configurations and ${settings.sites.length} sites to scan`,
      'initialization',
      undefined,
      scanType,
    );

    try {
      // Check for cancellation before starting
      if (await this.isScanCancelled(scanId)) {
        await this.logScan(
          userId,
          scanId,
          LogLevel.WARNING,
          '❌ Scan cancelled before starting',
          'cancelled',
          undefined,
          scanType,
        );

        // Ensure scan is marked as complete when cancelled
        await this.scanLogModel.findOneAndUpdate(
          { userId, scanType },
          {
            isComplete: true,
            completedAt: new Date(),
          },
        );

        return { jobs: [], scanId, cancelled: true };
      }
      // PHASE 0: Free public APIs (no captchas, fast) — runs before scraping
      const apiResult = await this.runApiFetchers(
        settings,
        userId,
        scanId,
        scanType,
      );

      // PHASE 1: Startpage Search - Complete all scraping before moving to next phase
      await this.logScan(
        userId,
        scanId,
        LogLevel.INFO,
        `\n${'═'.repeat(40)}\n🔍 PHASE 1: WEB SCRAPING`,
        'scraping',
        undefined,
        scanType,
      );

      const scrapingResult =
        await this.sequentialScrapingWithCaptchaMinimization(
          settings,
          userId,
          scanId,
          scanType,
        );

      const scrapedJobs = [...apiResult.jobs, ...scrapingResult.jobs];
      const hadErrors =
        scrapingResult.errors > 0 || scrapingResult.captchas > 0;

      // Log scraping phase completion with appropriate level
      if (hadErrors) {
        await this.logScan(
          userId,
          scanId,
          LogLevel.WARNING,
          `⚠️ Phase 1 Complete (with issues): Scraped ${scrapedJobs.length} job URLs. Errors: ${scrapingResult.errors}, CAPTCHAs: ${scrapingResult.captchas}`,
          'scraping',
          undefined,
          scanType,
        );
      } else {
        await this.logScan(
          userId,
          scanId,
          LogLevel.SUCCESS,
          `✅ Phase 1 Complete: Successfully scraped ${scrapedJobs.length} job URLs`,
          'scraping',
          undefined,
          scanType,
        );
      }

      // Check for cancellation before Phase 2
      if (await this.isScanCancelled(scanId)) {
        await this.logScan(
          userId,
          scanId,
          LogLevel.WARNING,
          '❌ Scan cancelled after scraping phase',
          'cancelled',
          undefined,
          scanType,
        );

        // Ensure scan is marked as complete when cancelled
        await this.scanLogModel.findOneAndUpdate(
          { userId, scanType },
          {
            isComplete: true,
            completedAt: new Date(),
          },
        );

        return { jobs: [], scanId, cancelled: true };
      }


      // PHASE 2: Deduplication - Process all deduplication before extraction
      await this.logScan(
        userId,
        scanId,
        LogLevel.INFO,
        `\n${'═'.repeat(40)}\n🔄 PHASE 2: DEDUPLICATION`,
        'deduplication',
        undefined,
        scanType,
      );

      const existingJobs = await this.scannedJobModel
        .find({ userId })
        .select('url')
        .lean();

      const newJobs = this.aggregateAndDeduplicate(scrapedJobs, existingJobs);

      await this.logScan(
        userId,
        scanId,
        LogLevel.INFO,
        `📊 Phase 2 Complete: ${newJobs.length} new jobs after removing duplicates`,
        'deduplication',
        undefined,
        scanType,
      );

      // Check for cancellation before Phase 3
      if (await this.isScanCancelled(scanId)) {
        await this.logScan(
          userId,
          scanId,
          LogLevel.WARNING,
          '❌ Scan cancelled after deduplication phase',
          'cancelled',
          undefined,
          scanType,
        );

        // Ensure scan is marked as complete when cancelled
        await this.scanLogModel.findOneAndUpdate(
          { userId, scanType },
          {
            isComplete: true,
            completedAt: new Date(),
          },
        );

        return { jobs: [], scanId, cancelled: true };
      }


      if (newJobs.length === 0) {
        await this.logScan(
          userId,
          scanId,
          LogLevel.WARNING,
          '⚠️ No new jobs found in this scan (all jobs may already be in your database)',
          'complete',
        );

        // Still update last scan time even with 0 results
        const updateData: any = {
          lastScanAt: new Date(),
        };

        if (settings.enableAutoScan) {
          const nextScan = new Date();
          nextScan.setHours(
            nextScan.getHours() + (settings.scanIntervalHours || 0),
          );
          nextScan.setMinutes(
            nextScan.getMinutes() + (settings.scanIntervalMinutes || 0),
          );
          updateData.nextScheduledScan = nextScan;
        }

        await this.jobScanSettingsModel.findOneAndUpdate(
          { userId },
          updateData,
        );

        return { jobs: [], scanId };
      }

      // PHASE 3: AI-Powered Extraction & Enrichment (merged)
      await this.logScan(
        userId,
        scanId,
        LogLevel.INFO,
        `\n${'═'.repeat(40)}\n🤖 PHASE 3: AI EXTRACTION & ENRICHMENT (${newJobs.length} jobs)`,
        'ai-processing',
        undefined,
        scanType,
      );

      const processedJobs = await this.extractAndEnrichWithAI(
        newJobs,
        settings,
        userId,
        scanId,
        scanType,
      );

      await this.logScan(
        userId,
        scanId,
        LogLevel.SUCCESS,
        `✅ Phase 3 Complete: ${processedJobs.length}/${newJobs.length} jobs are relevant`,
        'ai-processing',
        undefined,
        scanType,
      );


      if (processedJobs.length === 0) {
        await this.logScan(
          userId,
          scanId,
          LogLevel.WARNING,
          '⚠️ No jobs matched the search criteria after AI processing',
          'complete',
          undefined,
          scanType,
        );

        // Still update last scan time even with 0 results
        const updateData: any = {
          lastScanAt: new Date(),
        };

        if (settings.enableAutoScan) {
          const nextScan = new Date();
          nextScan.setHours(
            nextScan.getHours() + (settings.scanIntervalHours || 0),
          );
          nextScan.setMinutes(
            nextScan.getMinutes() + (settings.scanIntervalMinutes || 0),
          );
          updateData.nextScheduledScan = nextScan;
        }

        await this.jobScanSettingsModel.findOneAndUpdate(
          { userId },
          updateData,
        );

        return { jobs: [], scanId };
      }

      // PHASE 4: Save to Database - Final phase
      await this.logScan(
        userId,
        scanId,
        LogLevel.INFO,
        `\n${'═'.repeat(40)}\n💾 PHASE 4: SAVING TO DATABASE (${processedJobs.length} jobs)`,
        'saving',
        undefined,
        scanType,
      );

      const savedJobs = await this.exportToDatabase(processedJobs, userId);

      await this.logScan(
        userId,
        scanId,
        LogLevel.SUCCESS,
        `✅ Phase 4 Complete: Saved ${savedJobs.length} jobs successfully`,
        'saving',
        undefined,
        scanType,
      );

      // Update last scan time
      const updateData: any = {
        lastScanAt: new Date(),
      };

      // Note: nextScheduledScan is already handled by executeScheduledScan()
      // for auto scans, and by updateUserSettings() for manual updates

      await this.jobScanSettingsModel.findOneAndUpdate({ userId }, updateData);

      // Calculate total statistics
      const totalScraped = scrapedJobs.length;
      const totalDuplicates = scrapedJobs.length - newJobs.length;
      const totalFiltered = newJobs.length - processedJobs.length;
      const totalSaved = savedJobs.length;

      // Determine final scan status
      const scanLevel = hadErrors ? LogLevel.WARNING : LogLevel.SUCCESS;
      const statusIcon = hadErrors ? '⚠️' : '🎉';
      const statusText = hadErrors
        ? 'SCAN COMPLETE (WITH ISSUES)'
        : 'SCAN COMPLETE!';
      const errorInfo = hadErrors
        ? `\n⚠️ Errors encountered: ${scrapingResult.errors}\n🔒 CAPTCHAs blocked: ${scrapingResult.captchas}`
        : '';

      await this.logScan(
        userId,
        scanId,
        scanLevel,
        `\n${'═'.repeat(40)}\n${statusIcon} ${statusText}\n\n📊 Total scraped: ${totalScraped} jobs\n🔄 Duplicates removed: ${totalDuplicates}\n🤖 AI processed: ${newJobs.length} jobs\n❌ Filtered out: ${totalFiltered} irrelevant jobs\n✅ New jobs saved: ${totalSaved}${errorInfo}`,
        'complete',
        undefined,
        scanType,
      );
      return { jobs: savedJobs, scanId };
    } catch (error: any) {
      await this.logScan(
        userId,
        scanId,
        LogLevel.ERROR,
        `❌ Scan failed: ${error.message}`,
        'error',
        error.stack,
        scanType,
      );
      this.logger.error(`Job scan failed for user ${userId}:`, error);
      throw error;
    }
  }

  private async runApiFetchers(
    settings: JobScanSettingsDocument,
    userId: string,
    scanId: string,
    scanType: ScanType,
  ): Promise<{ jobs: Partial<ScannedJob>[]; errors: number }> {
    const { fetchers, unrecognizedUrls } = buildFetchersFromSettings(settings);

    if (unrecognizedUrls.length > 0) {
      await this.logScan(
        userId,
        scanId,
        LogLevel.WARNING,
        `⚠️ Skipping ${unrecognizedUrls.length} unrecognized careers URL(s) (only Greenhouse / Lever / Ashby / Workable are supported): ${unrecognizedUrls.join(', ')}`,
        'api-fetch',
        undefined,
        scanType,
      );
    }

    if (fetchers.length === 0 || settings.searches.length === 0) {
      return { jobs: [], errors: 0 };
    }

    await this.logScan(
      userId,
      scanId,
      LogLevel.INFO,
      `\n${'═'.repeat(40)}\n🌐 PHASE 0: PUBLIC APIs (${fetchers.length} sources × ${settings.searches.length} searches)`,
      'api-fetch',
      undefined,
      scanType,
    );

    const allJobs: Partial<ScannedJob>[] = [];
    let errorCount = 0;
    const tasks: Array<() => Promise<void>> = [];

    for (const search of settings.searches) {
      for (const fetcher of fetchers) {
        tasks.push(async () => {
          if (await this.isScanCancelled(scanId)) return;
          const result = await fetcher.fetch({
            search,
            timeFilter: settings.timeFilter,
            maxResults: settings.maxResultsPerSearch,
          });
          errorCount += result.errors;

          if (result.jobs.length > 0) {
            allJobs.push(...result.jobs);
            await this.logScan(
              userId,
              scanId,
              LogLevel.SUCCESS,
              `✅ ${fetcher.label}: ${result.jobs.length} job(s) for "${search.title}"`,
              'api-fetch',
              undefined,
              scanType,
            );
          } else if (result.errors === 0) {
            await this.logScan(
              userId,
              scanId,
              LogLevel.INFO,
              `📭 ${fetcher.label}: no matches for "${search.title}"`,
              'api-fetch',
              undefined,
              scanType,
            );
          } else {
            await this.logScan(
              userId,
              scanId,
              LogLevel.WARNING,
              `⚠️ ${fetcher.label}: fetch failed for "${search.title}"`,
              'api-fetch',
              undefined,
              scanType,
            );
          }
        });
      }
    }

    // Cap concurrency so we don't blast every endpoint at once
    const CONCURRENCY = 5;
    let cursor = 0;
    const workers = Array.from(
      { length: Math.min(CONCURRENCY, tasks.length) },
      async () => {
        while (cursor < tasks.length) {
          const idx = cursor++;
          try {
            await tasks[idx]();
          } catch (err) {
            errorCount++;
            const msg = err instanceof Error ? err.message : String(err);
            this.logger.warn(`API fetcher task crashed: ${msg}`);
          }
        }
      },
    );
    await Promise.all(workers);

    await this.logScan(
      userId,
      scanId,
      errorCount > 0 ? LogLevel.WARNING : LogLevel.SUCCESS,
      `🌐 Phase 0 Complete: ${allJobs.length} jobs from APIs (errors: ${errorCount})`,
      'api-fetch',
      undefined,
      scanType,
    );

    return { jobs: allJobs, errors: errorCount };
  }

  private async sequentialScrapingWithCaptchaMinimization(
    settings: JobScanSettingsDocument,
    userId: string,
    scanId: string,
    scanType: ScanType,
  ): Promise<{
    jobs: Partial<ScannedJob>[];
    errors: number;
    captchas: number;
  }> {
    const searchTasks = settings.searches.flatMap((search) =>
      settings.sites.map((site) => ({ search, site })),
    );

    const allJobs: Partial<ScannedJob>[] = [];
    const MAX_RETRIES = 1; // Single retry only to move faster
    const loggedSearches = new Set<string>(); // Track already logged searches to prevent duplicates
    let consecutiveCaptchas = 0; // Track consecutive captcha detections
    let consecutiveErrors = 0; // Track consecutive browser/timeout errors
    let totalErrors = 0; // Track total errors across all searches
    let totalCaptchas = 0; // Track total captchas encountered

    await this.logScan(
      userId,
      scanId,
      LogLevel.INFO,
      `🚀 Processing ${searchTasks.length} searches with minimal delays...`,
      'scraping',
      undefined,
      scanType,
    );

    // Process searches quickly with minimal delays
    for (let searchIndex = 0; searchIndex < searchTasks.length; searchIndex++) {
      // Check for cancellation
      if (await this.isScanCancelled(scanId)) {
        await this.logScan(
          userId,
          scanId,
          LogLevel.WARNING,
          `❌ Scan cancelled at search ${searchIndex + 1}/${searchTasks.length}`,
          'cancelled',
          undefined,
          scanType,
        );
        break;
      }

      const { search, site } = searchTasks[searchIndex];
      const searchNumber = searchIndex + 1;

      // No delays between searches unless we hit too many errors
      if (totalErrors > 5 && searchIndex > 0) {
        await this.randomDelay(1000, 1500); // Quick 1s delay after many errors
      }

      await this.logScan(
        userId,
        scanId,
        LogLevel.INFO,
        `🔍 Search ${searchNumber}/${searchTasks.length}: "${search.title}" on ${site}...`,
        'scraping',
        undefined,
        scanType,
      );

      let retryCount = 0;
      let result: {
        jobs: Partial<ScannedJob>[];
        captchaDetected?: boolean;
        blockedPage?: boolean;
        searchUrl?: string;
      } = { jobs: [] };

      while (retryCount < MAX_RETRIES) {
        try {
          result = await this.scrapeJobsFromStartPage(
            search,
            site,
            settings.timeFilter,
            settings.maxResultsPerSearch,
            userId,
            scanId,
            scanType,
            loggedSearches,
          );

          if (result.captchaDetected || result.blockedPage) {
            consecutiveCaptchas++;
            totalCaptchas++;
            retryCount++;

            if (retryCount < MAX_RETRIES) {
              // Quick retry with minimal delay
              const retryDelay = 2000; // Just 2 seconds
              await this.logScan(
                userId,
                scanId,
                LogLevel.WARNING,
                `⚠️ ${result.captchaDetected ? 'CAPTCHA' : 'Blocked'} - Quick retry ${retryCount}/${MAX_RETRIES}...`,
                'scraping',
                undefined,
                scanType,
              );
              await this.randomDelay(retryDelay, retryDelay + 1000);
              continue;
            } else {
              await this.logScan(
                userId,
                scanId,
                LogLevel.ERROR,
                `❌ ${result.captchaDetected ? 'CAPTCHA' : 'Block'} persists after ${MAX_RETRIES} retries for "${search.title}" on ${site}. Skipping remaining searches to avoid detection...${result.searchUrl ? `\n   📍 Manual solve: ${result.searchUrl}` : ''}`,
                'scraping',
                undefined,
                scanType,
              );

              // Don't stop for captchas - just skip and continue
              if (consecutiveCaptchas >= 5) {
                // Increased threshold
                await this.logScan(
                  userId,
                  scanId,
                  LogLevel.WARNING,
                  `⚠️ Multiple captchas detected, continuing with remaining searches...`,
                  'scraping',
                  undefined,
                  scanType,
                );
                consecutiveCaptchas = 0; // Reset to continue
              }
              break;
            }
          }

          // Success - reset error counters
          if (
            result.captchaDetected === false ||
            result.blockedPage === false
          ) {
            consecutiveCaptchas = 0; // Reset captcha counter on successful scrape
            consecutiveErrors = 0; // Reset error counter on successful scrape
          }

          // Success - exit retry loop
          if (result.jobs && result.jobs.length > 0) {
            await this.logScan(
              userId,
              scanId,
              LogLevel.SUCCESS,
              `✅ Found ${result.jobs.length} jobs for "${search.title}" on ${site}`,
              'scraping',
              undefined,
              scanType,
            );
            allJobs.push(...result.jobs);
          } else {
            // Log when no results found
            await this.logScan(
              userId,
              scanId,
              LogLevel.INFO,
              `📭 No jobs found for "${search.title}" on ${site}`,
              'scraping',
              undefined,
              scanType,
            );
          }
          break; // Exit retry loop on success
        } catch (error: any) {
          consecutiveErrors++;
          totalErrors++;
          retryCount++;

          // Check if it's a browser/timeout error
          const isBrowserError =
            error.message.includes(
              'Target page, context or browser has been closed',
            ) ||
            error.message.includes('Timeout') ||
            error.message.includes('page.goto') ||
            error.message.includes('browser.close');

          if (isBrowserError && consecutiveErrors >= 3) {
            await this.logScan(
              userId,
              scanId,
              LogLevel.ERROR,
              `❌ Too many consecutive browser errors (${consecutiveErrors}). Stopping scraping to prevent system instability.`,
              'scraping',
              undefined,
              scanType,
            );
            return {
              jobs: allJobs,
              errors: totalErrors,
              captchas: totalCaptchas,
            }; // Return what we have so far
          }

          if (retryCount < MAX_RETRIES) {
            const retryDelay = 1000; // 1 second retry for all errors
            await this.logScan(
              userId,
              scanId,
              LogLevel.WARNING,
              `⚠️ Error - Quick retry ${retryCount}/${MAX_RETRIES}...`,
              'scraping',
              undefined,
              scanType,
            );
            await this.randomDelay(retryDelay, retryDelay + 500);
          } else {
            await this.logScan(
              userId,
              scanId,
              LogLevel.ERROR,
              `❌ Failed after ${MAX_RETRIES} retries for "${search.title}" on ${site}: ${error.message.substring(0, 100)}...`,
              'scraping',
              undefined,
              scanType,
            );

            // Don't stop for individual failures, just continue to next search
            if (!isBrowserError) {
              consecutiveErrors = 0; // Reset counter for non-browser errors
            }
          }
        }
      }

      // Log progress periodically
      if (searchNumber % 5 === 0 || searchNumber === searchTasks.length) {
        await this.logScan(
          userId,
          scanId,
          LogLevel.INFO,
          `📊 Progress: ${searchNumber}/${searchTasks.length} searches completed. Total jobs found: ${allJobs.length}`,
          'scraping',
          undefined,
          scanType,
        );
      }
    }

    // Check if we collected enough jobs or had too many errors
    if (allJobs.length === 0 && (totalErrors > 0 || totalCaptchas > 0)) {
      await this.logScan(
        userId,
        scanId,
        LogLevel.WARNING,
        `⚠️ Scraping completed with issues: No jobs collected. Errors: ${totalErrors}, CAPTCHAs: ${totalCaptchas}`,
        'scraping',
        undefined,
        scanType,
      );
    } else if (totalErrors > searchTasks.length / 2) {
      await this.logScan(
        userId,
        scanId,
        LogLevel.WARNING,
        `⚠️ Scraping partially successful: ${allJobs.length} jobs collected, but ${totalErrors} searches failed`,
        'scraping',
        undefined,
        scanType,
      );
    }

    return { jobs: allJobs, errors: totalErrors, captchas: totalCaptchas };
  }

  private aggregateAndDeduplicate(
    scrapedJobs: Partial<ScannedJob>[],
    existingJobs: ScannedJob[],
  ): Partial<ScannedJob>[] {
    const uniqueScrapedJobs = Array.from(
      new Map(scrapedJobs.map((job) => [job.url, job])).values(),
    );
    const existingUrls = new Set(
      existingJobs
        .map((job) => job.url)
        .filter((url) => url && url.trim() !== ''),
    );

    const newJobs = uniqueScrapedJobs.filter((job) => {
      return job.url && job.url.trim() !== '' && !existingUrls.has(job.url);
    });
    return newJobs;
  }

  private async extractAndEnrichWithAI(
    jobs: Partial<ScannedJob>[],
    settings: JobScanSettingsDocument,
    userId: string,
    scanId: string,
    scanType: ScanType,
  ): Promise<Partial<ScannedJob>[]> {
    const processedJobs: Partial<ScannedJob>[] = [];
    let processedCount = 0;
    const PARALLEL_LIMIT = 5; // Process 5 jobs at a time

    // Jobs from public APIs already arrive with title/company/location/datePosted
    // and were filtered by query/workMode/timeFilter inside the fetcher — no need
    // to open them in Playwright or re-run the AI relevance check. Saves minutes
    // per scan when API sources return many jobs.
    const apiJobs = jobs.filter((j) => (j.site ?? '').endsWith('-api'));
    const scrapedJobs = jobs.filter((j) => !(j.site ?? '').endsWith('-api'));

    if (apiJobs.length > 0) {
      processedJobs.push(...apiJobs);
      await this.logScan(
        userId,
        scanId,
        LogLevel.SUCCESS,
        `⚡ Skipped AI enrichment for ${apiJobs.length} API-sourced job(s) (already structured)`,
        'ai-processing',
        undefined,
        scanType,
      );
    }

    if (scrapedJobs.length === 0) {
      return processedJobs;
    }

    // Get all configured job titles for better matching
    const allJobTitles = settings.searches.map((s) => s.title);

    // Process jobs in batches of 5
    for (
      let batchStart = 0;
      batchStart < scrapedJobs.length;
      batchStart += PARALLEL_LIMIT
    ) {
      // Check for cancellation at the start of each batch
      if (await this.isScanCancelled(scanId)) {
        await this.logScan(
          userId,
          scanId,
          LogLevel.WARNING,
          `❌ AI processing cancelled at job ${batchStart + 1}/${scrapedJobs.length}`,
          'ai-processing',
          undefined,
          scanType,
        );
        break; // Return what we have processed so far
      }

      const batchEnd = Math.min(batchStart + PARALLEL_LIMIT, scrapedJobs.length);
      const batch = scrapedJobs.slice(batchStart, batchEnd);

      // Add delay between batches (not for first batch)
      if (batchStart > 0) {
        const delay = 2000 + batchStart * 100; // Base 2s + progressive delay
        await this.randomDelay(delay, delay + 1000);
      }

      await this.logScan(
        userId,
        scanId,
        LogLevel.INFO,
        `🤖 Processing batch ${Math.floor(batchStart / PARALLEL_LIMIT) + 1}/${Math.ceil(scrapedJobs.length / PARALLEL_LIMIT)} (jobs ${batchStart + 1}-${batchEnd}/${scrapedJobs.length})`,
        'ai-processing',
        undefined,
        scanType,
      );

      // Process batch in parallel
      const batchPromises = batch.map(async (job, indexInBatch) => {
        const jobNumber = batchStart + indexInBatch + 1;

        try {
          // Find the search config that matches this job
          const matchingSearch = settings.searches.find(
            (search) => search.title === job.searchTitle,
          );

          // Extract job content with Playwright (no retries - if page is gone, it's gone)
          const jobContent = await this.extractJobWithPlaywright(job.url || '');

          if (!jobContent || !jobContent.text) {
            await this.logScan(
              userId,
              scanId,
              LogLevel.WARNING,
              `⚠️ [Job ${jobNumber}/${scrapedJobs.length}] Cannot access job page (may have been removed): ${this.truncateUrl(job.url || '')}`,
              'ai-processing',
              undefined,
              scanType,
            );
            return null;
          }

          // Process with AI - pass all job titles for better matching
          const aiResult = await this.processJobWithAI(
            jobContent,
            allJobTitles,
            matchingSearch?.location,
            matchingSearch?.workMode,
          );

          if (!aiResult || !aiResult.isRelevant) {
            await this.logScan(
              userId,
              scanId,
              LogLevel.INFO,
              `❌ [Job ${jobNumber}/${scrapedJobs.length}] Not a match: "${aiResult?.title || job.searchTitle}" - ${aiResult?.relevanceReason || 'Did not meet search criteria'}`,
              'ai-processing',
              undefined,
              scanType,
            );
            return null;
          }

          await this.logScan(
            userId,
            scanId,
            LogLevel.SUCCESS,
            `✅ [Job ${jobNumber}/${scrapedJobs.length}] Match found: "${aiResult.title}" at ${aiResult.company}`,
            'ai-processing',
            undefined,
            scanType,
          );

          // Parse datePosted if needed
          let datePosted = job.datePosted;
          if (!datePosted && aiResult.datePosted) {
            const parsedDate = new Date(aiResult.datePosted);
            datePosted = isNaN(parsedDate.getTime()) ? undefined : parsedDate;
          }

          return {
            ...job,
            title: aiResult.title || job.searchTitle,
            company: aiResult.company || undefined,
            location: aiResult.location || undefined,
            workMode: aiResult.workMode || undefined,
            salaryRange: aiResult.salaryRange || undefined,
            experienceLevel: aiResult.experienceLevel || undefined,
            jobType: aiResult.jobType || undefined,
            skills: aiResult.skills || undefined,
            descriptionSummary: aiResult.descriptionSummary || undefined,
            datePosted: datePosted || undefined,
            department: aiResult.department || undefined,
          };
        } catch (error: any) {
          const truncatedUrl = this.truncateUrl(job.url || '');
          this.logger.error(
            `Processing failed for job ${jobNumber}: ${truncatedUrl}: ${error.message}`,
          );
          await this.logScan(
            userId,
            scanId,
            LogLevel.WARNING,
            `⚠️ [Job ${jobNumber}/${scrapedJobs.length}] Processing failed for ${truncatedUrl}: ${error.message}`,
            'ai-processing',
            undefined,
            scanType,
          );
          return null;
        }
      });

      // Wait for batch to complete
      const batchResults = await Promise.all(batchPromises);

      // Filter out null results and add to processedJobs
      const validResults = batchResults.filter(
        (result) => result !== null,
      ) as Partial<ScannedJob>[];
      processedJobs.push(...validResults);
      processedCount += batch.length;

      // Log progress after each batch
      await this.logScan(
        userId,
        scanId,
        LogLevel.INFO,
        `📊 AI Progress: ${processedCount}/${scrapedJobs.length} scraped jobs processed. ${processedJobs.length} total matches (incl. ${apiJobs.length} from APIs).`,
        'ai-processing',
        undefined,
        scanType,
      );
    }

    return processedJobs;
  }

  private async exportToDatabase(
    newJobs: Partial<ScannedJob>[],
    userId: string,
  ): Promise<ScannedJob[]> {
    try {
      // Double-check for duplicates before saving (redundant safety check)
      const jobUrls = newJobs
        .map((job) => job.url)
        .filter((url) => url && url.trim() !== '');
      const existingJobs = await this.scannedJobModel
        .find({
          userId,
          url: { $in: jobUrls },
        })
        .select('url')
        .lean();

      const existingUrls = new Set(existingJobs.map((job) => job.url));
      const uniqueNewJobs = newJobs.filter(
        (job) => job.url && job.url.trim() !== '' && !existingUrls.has(job.url),
      );

      if (uniqueNewJobs.length === 0) {
        this.logger.log('All jobs already exist in database after final check');
        return [];
      }

      if (uniqueNewJobs.length < newJobs.length) {
        this.logger.log(
          `Filtered out ${newJobs.length - uniqueNewJobs.length} duplicate jobs during final save check`,
        );
      }

      const docsToInsert = uniqueNewJobs.map((job) => {
        // Clean up the job data before saving
        const cleanJob: any = {
          ...job,
          userId,
          scrapedAt: new Date(),
          isFavorited: false,
        };

        // Ensure datePosted is either a valid Date or undefined
        if (cleanJob.datePosted) {
          const date = new Date(cleanJob.datePosted);
          cleanJob.datePosted = isNaN(date.getTime()) ? undefined : date;
        }

        return cleanJob;
      });

      try {
        // ordered: false → continue inserting on duplicate-key, return what
        // succeeded. Useful when the dedup pre-check races with a concurrent
        // scan or when an old global unique index still exists.
        const savedJobs = await this.scannedJobModel.insertMany(docsToInsert, {
          ordered: false,
        });
        return savedJobs as any as ScannedJob[];
      } catch (err: any) {
        // Bulk write errors with `ordered: false` still throw, but
        // err.insertedDocs / err.result.insertedIds reflect what got through.
        const isBulkError = err?.code === 11000 || err?.writeErrors;
        if (isBulkError) {
          const inserted = (err.insertedDocs ?? []) as any[];
          const skipped = docsToInsert.length - inserted.length;
          this.logger.warn(
            `Saved ${inserted.length}/${docsToInsert.length} jobs; ${skipped} skipped as duplicates`,
          );
          return inserted as any as ScannedJob[];
        }
        throw err;
      }
    } catch (error: any) {
      this.logger.error('Error saving jobs to database:', error);
      throw error;
    }
  }

  private async scrapeJobsFromStartPage(
    search: SearchConfig,
    site: string,
    timeFilter: TimeFilter,
    maxResults: number,
    userId: string,
    scanId: string,
    scanType: ScanType,
    loggedSearches?: Set<string>,
  ): Promise<{
    jobs: Partial<ScannedJob>[];
    captchaDetected?: boolean;
    blockedPage?: boolean;
    searchUrl?: string;
  }> {
    let browser: Browser | null = null;
    let context: BrowserContext | null = null;
    let page: Page | null = null;
    const allJobs: Partial<ScannedJob>[] = [];

    try {
      // Randomize viewport size to appear more unique
      const viewportWidths = [1920, 1680, 1440, 1366];
      const viewportHeights = [1080, 1050, 900, 768];
      const width =
        viewportWidths[Math.floor(Math.random() * viewportWidths.length)];
      const height =
        viewportHeights[Math.floor(Math.random() * viewportHeights.length)];

      // Get browser from pool instead of creating new one
      browser = await browserPool.acquire();

      // Select random user agent
      const userAgent =
        this.USER_AGENTS[Math.floor(Math.random() * this.USER_AGENTS.length)];

      // Random locale and timezone for more variation
      const locales = ['en-US', 'en-GB', 'en-CA', 'en-AU'];
      const timezones = [
        'America/New_York',
        'America/Chicago',
        'America/Los_Angeles',
        'America/Denver',
      ];
      const locale = locales[Math.floor(Math.random() * locales.length)];
      const timezone = timezones[Math.floor(Math.random() * timezones.length)];

      context = await browser.newContext({
        viewport: { width, height },
        userAgent: userAgent,
        locale: locale,
        timezoneId: timezone,
        deviceScaleFactor: 1,
        hasTouch: false,
        isMobile: false,
        permissions: [],
        geolocation: undefined,
        colorScheme: 'light',
        reducedMotion: 'no-preference',
        forcedColors: 'none',
      });

      // Apply advanced anti-detection techniques
      await AntiDetectionUtils.applyEvasionTechniques(context);

      // Add realistic cookies for the domain
      await AntiDetectionUtils.addRealisticCookies(context, 'startpage.com');

      page = await context.newPage();

      // Apply enhanced anti-detection measures
      await page.addInitScript(() => {
        // Remove webdriver property
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });

        // Mock plugins
        Object.defineProperty(navigator, 'plugins', {
          get: () => [
            { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
            {
              name: 'Chrome PDF Viewer',
              filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai',
            },
            { name: 'Native Client', filename: 'internal-nacl-plugin' },
          ],
        });

        // Mock languages
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en'],
        });

        // Mock hardware concurrency
        Object.defineProperty(navigator, 'hardwareConcurrency', {
          get: () => 4 + Math.floor(Math.random() * 4),
        });

        // Mock device memory
        Object.defineProperty(navigator, 'deviceMemory', {
          get: () => 8,
        });

        // Make chrome object look real
        Object.defineProperty(window, 'chrome', {
          value: {
            runtime: {
              connect: () => {},
              sendMessage: () => {},
            },
            loadTimes: function () {
              return {
                requestTime: Date.now() / 1000,
                startLoadTime: Date.now() / 1000,
                commitLoadTime: Date.now() / 1000,
                finishDocumentLoadTime: Date.now() / 1000,
                finishLoadTime: Date.now() / 1000,
                firstPaintTime: Date.now() / 1000,
                firstPaintAfterLoadTime: 0,
                navigationType: 'Other',
                wasFetchedViaSpdy: false,
                wasNpnNegotiated: true,
                npnNegotiatedProtocol: 'h2',
                wasAlternateProtocolAvailable: false,
                connectionInfo: 'h2',
              };
            },
            csi: function () {
              return {
                onloadT: Date.now(),
                pageT: Date.now() + Math.random() * 1000,
                startE: Date.now() - 1000,
                tran: 15,
              };
            },
            app: {
              isInstalled: false,
            },
          },
        });

        // Mock permissions - simplified to avoid TypeScript issues
        try {
          const originalQuery = window.navigator.permissions.query;
          window.navigator.permissions.query = (parameters) => {
            return originalQuery(parameters);
          };
        } catch (e) {
          // Permissions API might not be available
        }
      });

      // Enable console logging from the page
      page.on('console', (msg) => {
        this.logger.log(`Browser console: ${msg.text()}`);
      });

      // Build query - keep it simple for better results
      let query = `${search.title} site:${site}`;

      // Add location if specified
      if (search.location && search.location.trim()) {
        query += ` ${search.location}`;
      }

      // Add work mode if specified
      if (search.workMode && search.workMode !== 'any') {
        if (search.workMode === 'remote') {
          query += ' remote';
        } else if (search.workMode === 'hybrid') {
          query += ' hybrid';
        } else if (search.workMode === 'onsite') {
          query += ' onsite';
        }
      }

      // Use Startpage with proper URL format
      const resultsPerPage = 10;
      const pagesNeeded = Math.ceil(maxResults / resultsPerPage);
      const timeFilterValue = this.mapTimeFilterToStartPage(timeFilter);
      const timeParam = timeFilterValue ? `&with_date=${timeFilterValue}` : '';

      // Scrape multiple pages if needed
      for (
        let pageNum = 1;
        pageNum <= pagesNeeded && allJobs.length < maxResults;
        pageNum++
      ) {
        const pageParam = pageNum > 1 ? `&page=${pageNum}` : '';
        const searchUrl = `https://www.startpage.com/sp/search?lui=english&language=english&query=${encodeURIComponent(query)}&cat=web&t=device&segment=startpage.brave${pageParam}&abd=0&abe=0${timeParam}`;

        // Create a unique key for this search to prevent duplicate logs
        const searchKey = `${search.title}-${site}-page${pageNum}`;

        // Only log if we haven't logged this search before
        if (!loggedSearches || !loggedSearches.has(searchKey)) {
          // Log the search URL to database for frontend display - keep full URL for clicking
          // Show both readable query and clickable URL
          const searchQuery = `${search.title} site:${site}${search.location ? ' ' + search.location : ''}${search.workMode && search.workMode !== 'any' ? ' ' + search.workMode : ''}`;
          await this.logScan(
            userId,
            scanId,
            LogLevel.INFO,
            `🔗 Searching: "${searchQuery}" (page ${pageNum})\n   📍 ${searchUrl}`,
            'scraping',
            undefined,
            scanType,
          );

          // Mark this search as logged
          if (loggedSearches) {
            loggedSearches.add(searchKey);
          }
        }

        // Navigate to search page with fallback strategy
        try {
          // First attempt with minimal wait
          await page.goto(searchUrl, {
            waitUntil: 'commit', // Fastest option - just start navigation
            timeout: 15000, // 15 second timeout
          });
          // Give page minimal time to load
          await page.waitForTimeout(1000);
        } catch (navError: any) {
          // If navigation fails, try with minimal wait
          this.logger.warn(
            `Initial navigation failed, trying with minimal wait: ${navError.message}`,
          );
          await this.logScan(
            userId,
            scanId,
            LogLevel.WARNING,
            `⚠️ Navigation timeout, retrying with minimal wait...`,
            'scraping',
            undefined,
            scanType,
          );

          try {
            await page.goto(searchUrl, {
              waitUntil: 'commit',
              timeout: 10000, // Even shorter fallback
            });
            await page.waitForTimeout(500);
          } catch (fallbackError: any) {
            // Last resort - just try to navigate without waiting
            this.logger.error(
              `Fallback navigation also failed: ${fallbackError.message}`,
            );
            throw navError; // Throw original error for better context
          }
        }

        // Skip human simulation for speed - we'll deal with captchas if they come

        // Check if we're on a privacy/captcha page
        let currentUrl = page.url();
        const pageContent = await page.content();
        const pageTitle = await page.title();

        // More specific CAPTCHA detection to avoid false positives
        const isCaptchaPage =
          currentUrl.includes('privacy-please') ||
          currentUrl.includes('/captcha') ||
          (pageContent.includes('captcha') && pageContent.includes('verify')) ||
          (pageContent.includes('CAPTCHA') && pageContent.includes('verify')) ||
          pageContent.includes("I'm not a robot") ||
          pageContent.includes('I am not a robot') ||
          pageTitle.toLowerCase().includes('captcha') ||
          pageTitle.toLowerCase().includes('access denied') ||
          pageTitle.toLowerCase().includes('blocked');

        if (isCaptchaPage) {
          this.logger.warn(
            `CAPTCHA/Privacy protection detected on ${site} for "${search.title}" - URL: ${currentUrl}, Title: ${pageTitle}`,
          );

          // Create a unique key for CAPTCHA warning
          const captchaKey = `captcha-${search.title}-${site}`;

          // Only log CAPTCHA warning once per search-site combination
          if (!loggedSearches || !loggedSearches.has(captchaKey)) {
            await this.logScan(
              userId,
              scanId,
              LogLevel.WARNING,
              `⚠️ CAPTCHA detected for "${search.title}" on ${site}\n   📍 Click here to solve manually: ${searchUrl}\n   ℹ️ Page title: "${pageTitle}"`,
              'scraping',
              undefined,
              scanType,
            );

            if (loggedSearches) {
              loggedSearches.add(captchaKey);
            }
          }

          return { jobs: allJobs, captchaDetected: true, searchUrl }; // Return with CAPTCHA flag and URL
        }

        // Wait for search results to load
        await this.randomDelay(2000, 3000);

        // Try to wait for results container
        try {
          await page.waitForSelector(
            '.w-gl__result, .result, [class*="result"]',
            {
              timeout: 5000,
            },
          );
        } catch {
          this.logger.warn(
            `No results container found for "${search.title}" on ${site}`,
          );
        }

        // Log page URL and title for debugging
        currentUrl = page.url();
        this.logger.log(`Loaded page: ${pageTitle} at ${currentUrl}`);

        // Check if we're on the search results page
        if (
          pageContent.includes('did not match any documents') ||
          pageContent.includes('No results found') ||
          pageContent.includes('0 results')
        ) {
          this.logger.warn(
            `No search results found for "${search.title}" on ${site}`,
          );
        }

        const pageJobData = await page
          .evaluate((siteFilter: string) => {
            try {
              const results: any[] = [];
              // Selectors for Startpage search results
              const selectors = [
                '.w-gl__result',
                '.result',
                'article.w-gl__result',
                'div.w-gl__result',
                '.w-gl--default__result',
                '[data-testid="result"]',
              ];
              let searchResults: NodeListOf<Element> | null = null;

              for (const selector of selectors) {
                searchResults = document.querySelectorAll(selector);
                if (searchResults && searchResults.length > 0) {
                  console.log(
                    `Found ${searchResults.length} results with selector: ${selector}`,
                  );
                  break;
                }
              }

              if (!searchResults || searchResults.length === 0) {
                // Log what we can see on the page
                console.log(
                  'No results found. Page body classes:',
                  document.body.className,
                );
                console.log(
                  'Links on page:',
                  document.querySelectorAll('a').length,
                );

                // Try to find any elements that might contain results
                const possibleResultContainers = document.querySelectorAll(
                  '[class*="result"], [id*="result"], main, section',
                );
                console.log(
                  `Found ${possibleResultContainers.length} possible result containers`,
                );

                // Log first few links to see what we're getting
                const allLinks = Array.from(
                  document.querySelectorAll('a'),
                ).slice(0, 5);
                allLinks.forEach((link, index) => {
                  console.log(`Link ${index}: ${link.href}`);
                });

                return results;
              }

              searchResults.forEach((result: Element) => {
                try {
                  const linkElement = result.querySelector('a[href]');
                  if (!linkElement) {
                    console.log('No link found in result');
                    return;
                  }

                  const url = (linkElement as HTMLAnchorElement).href;

                  if (!url.includes(siteFilter)) {
                    // Don't log every skipped URL to reduce noise
                    return;
                  }

                  if (url.includes('startpage.com')) {
                    // Skip Startpage URLs
                    return;
                  }

                  let titleText = '';
                  const h3 = result.querySelector('h3, .w-gl__result-title');
                  if (h3) {
                    titleText = h3.textContent || '';
                  } else {
                    titleText = linkElement.textContent || '';
                  }

                  if (!titleText || titleText.trim() === '') return;

                  let datePosted: string | null = null;
                  const snippetElement = result.querySelector(
                    '.w-gl__description, .w-gl__result-desc, .description',
                  );
                  if (snippetElement) {
                    const dateMatch = (snippetElement.textContent || '').match(
                      /(\d+\s*(hour|day|week|month)s?\s*ago|\w+\s+\d+,?\s+\d{4})/i,
                    );
                    if (dateMatch) datePosted = dateMatch[0];
                  }

                  console.log(`Adding job: ${titleText.trim()} - ${url}`);
                  results.push({
                    url: url,
                    title: titleText.trim(),
                    datePosted: datePosted,
                  });
                } catch (innerError) {
                  // Skip this result if there's an error
                  console.error('Error processing result:', innerError);
                }
              });

              return results;
            } catch (error) {
              console.error('Error in page evaluation:', error);
              return [];
            }
          }, site)
          .catch((error) => {
            this.logger.error(`Page evaluation failed: ${error.message}`);
            return [];
          });

        // Log raw data for debugging
        this.logger.log(
          `Page evaluation returned ${pageJobData.length} raw results for "${search.title}" on ${site}`,
        );

        const pageJobs = pageJobData.map((job: any) => ({
          searchTitle: search.title,
          url: job.url,
          site: site,
          datePosted: job.datePosted
            ? this.parseDate(job.datePosted)
            : undefined,
        }));

        if (pageJobs.length > 0) {
          this.logger.log(
            `✅ Found ${pageJobs.length} jobs on page ${pageNum} for "${search.title}" on ${site}`,
          );
        } else {
          this.logger.warn(
            `❌ No jobs found on page ${pageNum} for "${search.title}" on ${site}`,
          );
        }

        allJobs.push(...pageJobs);

        // If we got fewer results than expected, no more pages available
        if (pageJobData.length < resultsPerPage) {
          break;
        }

        // Add delay between pages to be respectful
        if (pageNum < pagesNeeded && allJobs.length < maxResults) {
          await this.randomDelay(1000, 2000);
        }
      }

      // Trim to maxResults if we got more
      const finalJobs = allJobs.slice(0, maxResults);

      // Log final results for this search
      if (finalJobs.length > 0) {
        this.logger.log(
          `🎯 Total: Found ${finalJobs.length} jobs for "${search.title}" on ${site}`,
        );
      } else {
        this.logger.warn(
          `⚠️ Total: No jobs found for "${search.title}" on ${site}`,
        );
      }

      return { jobs: finalJobs };
    } catch (error: any) {
      const errorMessage = `❌ Error scraping "${search.title}" from ${site}: ${error.message.substring(0, 100)}`;
      this.logger.error(errorMessage, error);
      await this.logScan(
        userId,
        scanId,
        LogLevel.ERROR,
        errorMessage,
        'scraping',
        undefined,
        scanType,
      );
      return { jobs: allJobs }; // Return any jobs we managed to scrape before error
    } finally {
      // Enhanced cleanup with timeout to prevent hanging
      const cleanupWithTimeout = async (
        resource: any,
        resourceName: string,
        method: string = 'close',
      ) => {
        if (!resource) return;
        try {
          await Promise.race([
            resource[method](),
            new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error(`${resourceName} cleanup timeout`)),
                5000,
              ),
            ),
          ]);
        } catch (cleanupError: any) {
          this.logger.warn(
            `Failed to cleanup ${resourceName}: ${cleanupError.message}`,
          );
        }
      };

      // Cleanup in reverse order with timeouts
      // Cleanup page and context, but return browser to pool
      await cleanupWithTimeout(page, 'page');
      await cleanupWithTimeout(context, 'context');

      // Return browser to pool instead of closing it
      if (browser) {
        await browserPool.release(browser);
      }
    }
  }

  async getScannedJobs(
    userId: string,
    filter?: {
      isFavorited?: boolean;
      searchTitle?: string;
      company?: string;
      workMode?: WorkMode;
      limit?: number;
      offset?: number;
      sortBy?: 'datePosted' | 'createdAt';
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<{ jobs: ScannedJob[]; total: number }> {
    const query: any = { userId };

    if (filter?.isFavorited !== undefined)
      query.isFavorited = filter.isFavorited;
    if (filter?.searchTitle)
      query.searchTitle = new RegExp(filter.searchTitle, 'i');
    if (filter?.company) query.company = new RegExp(filter.company, 'i');
    if (filter?.workMode) query.workMode = filter.workMode;

    // Build sort object - default to createdAt desc
    const sortField = filter?.sortBy || 'createdAt';
    const sortOrder = filter?.sortOrder === 'asc' ? 1 : -1;
    const sortObj: any = {};
    sortObj[sortField] = sortOrder;

    const total = await this.scannedJobModel.countDocuments(query);
    const jobs = await this.scannedJobModel
      .find(query)
      .select('-__v')
      .sort(sortObj)
      .limit(filter?.limit || 50)
      .skip(filter?.offset || 0)
      .lean();

    return { jobs: jobs as ScannedJob[], total };
  }

  async updateJobStatus(
    userId: string,
    jobId: string,
    updates: {
      isFavorited?: boolean;
    },
  ): Promise<ScannedJob> {
    const job = await this.scannedJobModel
      .findOneAndUpdate({ _id: jobId, userId }, updates, { new: true })
      .select('-__v')
      .lean();

    if (!job) {
      throw new Error('Job not found');
    }

    return job as ScannedJob;
  }

  async deleteScannedJob(userId: string, jobId: string): Promise<void> {
    const result = await this.scannedJobModel.deleteOne({ _id: jobId, userId });
    if (result.deletedCount === 0) {
      throw new Error('Job not found');
    }
  }

  async bulkJobAction(
    userId: string,
    jobIds: string[],
    action: 'delete' | 'markFavorited' | 'markUnfavorited',
  ): Promise<{ success: boolean; message: string; affected: number }> {
    const query = { _id: { $in: jobIds }, userId };

    switch (action) {
      case 'delete': {
        const deleteResult = await this.scannedJobModel.deleteMany(query);
        return {
          success: true,
          message: `Deleted ${deleteResult.deletedCount} jobs`,
          affected: deleteResult.deletedCount,
        };
      }
      case 'markFavorited': {
        const favoritedResult = await this.scannedJobModel.updateMany(query, {
          isFavorited: true,
        });
        return {
          success: true,
          message: `Marked ${favoritedResult.modifiedCount} jobs as favorited`,
          affected: favoritedResult.modifiedCount,
        };
      }
      case 'markUnfavorited': {
        const unfavoritedResult = await this.scannedJobModel.updateMany(query, {
          isFavorited: false,
        });
        return {
          success: true,
          message: `Marked ${unfavoritedResult.modifiedCount} jobs as unfavorited`,
          affected: unfavoritedResult.modifiedCount,
        };
      }
      default:
        throw new Error('Invalid action');
    }
  }

  private mapTimeFilterToStartPage(timeFilter: TimeFilter): string {
    // Startpage uses with_date parameter for time filtering
    const mapping: Record<TimeFilter, string> = {
      past_hour: 'h',
      past_day: 'd',
      past_week: 'w',
      past_month: 'm',
      past_year: 'y',
      anytime: '',
    };
    return mapping[timeFilter] || '';
  }

  private parseDate(dateText: string): Date | undefined {
    try {
      const now = new Date();
      const lowerDate = dateText.toLowerCase().trim();

      if (lowerDate.includes('hour') || lowerDate.includes('min')) {
        return now;
      }

      const daysMatch = lowerDate.match(/(\d+)\s*day/);
      if (daysMatch) {
        const days = parseInt(daysMatch[1]);
        const date = new Date(now);
        date.setDate(date.getDate() - days);
        return date;
      }

      const weeksMatch = lowerDate.match(/(\d+)\s*week/);
      if (weeksMatch) {
        const weeks = parseInt(weeksMatch[1]);
        const date = new Date(now);
        date.setDate(date.getDate() - weeks * 7);
        return date;
      }

      const monthsMatch = lowerDate.match(/(\d+)\s*month/);
      if (monthsMatch) {
        const months = parseInt(monthsMatch[1]);
        const date = new Date(now);
        date.setMonth(date.getMonth() - months);
        return date;
      }

      const parsedDate = new Date(dateText);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }

      return undefined;
    } catch {
      return undefined;
    }
  }

  private randomDelay(min: number = 100, max: number = 500): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  private async simulateHumanBehavior(page: Page): Promise<void> {
    try {
      // Random mouse movements
      const width = page.viewportSize()?.width || 1920;
      const height = page.viewportSize()?.height || 1080;

      // Move mouse to 2-3 random positions
      const movements = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < movements; i++) {
        const x = Math.floor(Math.random() * width * 0.8) + width * 0.1; // Avoid edges
        const y = Math.floor(Math.random() * height * 0.8) + height * 0.1;
        await page.mouse.move(x, y, {
          steps: 10 + Math.floor(Math.random() * 10),
        });
        await this.randomDelay(100, 300);
      }

      // Natural scrolling pattern
      const scrolls = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < scrolls; i++) {
        const scrollAmount = 100 + Math.floor(Math.random() * 200);
        await page.evaluate((amount) => {
          window.scrollBy({ top: amount, behavior: 'smooth' });
        }, scrollAmount);
        await this.randomDelay(200, 500);
      }

      // Sometimes scroll back up a bit
      if (Math.random() > 0.5) {
        const scrollBack = -50 - Math.floor(Math.random() * 100);
        await page.evaluate((amount) => {
          window.scrollBy({ top: amount, behavior: 'smooth' });
        }, scrollBack);
        await this.randomDelay(100, 300);
      }
    } catch (error) {
      // Silent fail - this is just for anti-detection, not critical
      this.logger.debug('Human simulation error (non-critical):', error);
    }
  }

  private truncateUrl(url: string, maxLength: number = 60): string {
    if (!url || url.length <= maxLength) return url;

    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      const pathParts = urlObj.pathname.split('/').filter((p) => p);

      // Keep domain and first part of path, truncate the rest
      if (pathParts.length > 0) {
        const firstPart = pathParts[0];
        const lastPart = pathParts[pathParts.length - 1];

        if (pathParts.length === 1) {
          // Single path segment - truncate it
          if (lastPart.length > 20) {
            return `${domain}/${lastPart.substring(0, 20)}...`;
          }
          return `${domain}/${lastPart}`;
        } else {
          // Multiple path segments - show first and truncated last
          const truncatedLast =
            lastPart.length > 15 ? lastPart.substring(0, 15) + '...' : lastPart;
          return `${domain}/${firstPart}/.../${truncatedLast}`;
        }
      }
      return domain;
    } catch {
      // If URL parsing fails, just truncate the string
      return url.substring(0, maxLength) + '...';
    }
  }

  private async extractJobWithPlaywright(
    url: string,
  ): Promise<{ title: string; text: string; url: string } | null> {
    let browser: Browser | null = null;
    let context: BrowserContext | null = null;
    let page: Page | null = null;

    try {
      // Random viewport for variation
      const viewportWidths = [1920, 1680, 1440, 1366];
      const viewportHeights = [1080, 1050, 900, 768];
      const width =
        viewportWidths[Math.floor(Math.random() * viewportWidths.length)];
      const height =
        viewportHeights[Math.floor(Math.random() * viewportHeights.length)];

      // Get browser from pool instead of creating new one
      browser = await browserPool.acquire();

      // Random user agent
      const userAgent =
        this.USER_AGENTS[Math.floor(Math.random() * this.USER_AGENTS.length)];

      // Random locale and timezone
      const locales = ['en-US', 'en-GB', 'en-CA', 'en-AU'];
      const timezones = [
        'America/New_York',
        'America/Chicago',
        'America/Los_Angeles',
        'America/Denver',
      ];
      const locale = locales[Math.floor(Math.random() * locales.length)];
      const timezone = timezones[Math.floor(Math.random() * timezones.length)];

      context = await browser.newContext({
        viewport: { width, height },
        userAgent,
        locale,
        timezoneId: timezone,
        deviceScaleFactor: 1,
        hasTouch: false,
        isMobile: false,
      });

      // Apply anti-detection techniques
      await AntiDetectionUtils.applyEvasionTechniques(context);

      page = await context.newPage();

      // Add enhanced stealth mode
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });

        // Mock plugins
        Object.defineProperty(navigator, 'plugins', {
          get: () => [
            { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
            {
              name: 'Chrome PDF Viewer',
              filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai',
            },
          ],
        });

        // Mock languages
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en'],
        });

        // Make chrome object look real
        Object.defineProperty(window, 'chrome', {
          value: {
            runtime: { connect: () => {}, sendMessage: () => {} },
            loadTimes: function () {
              return {
                requestTime: Date.now() / 1000,
                startLoadTime: Date.now() / 1000,
                commitLoadTime: Date.now() / 1000,
                finishDocumentLoadTime: Date.now() / 1000,
                finishLoadTime: Date.now() / 1000,
                firstPaintTime: Date.now() / 1000,
                firstPaintAfterLoadTime: 0,
                navigationType: 'Other',
              };
            },
            csi: function () {
              return {
                onloadT: Date.now(),
                pageT: Date.now() + Math.random() * 1000,
                startE: Date.now() - 1000,
                tran: 15,
              };
            },
            app: { isInstalled: false },
          },
        });
      });

      // Navigate to the job URL
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      // Use enhanced human simulation from anti-detection utils
      await AntiDetectionUtils.simulateHumanBehavior(page);

      // Wait for content to load
      await this.randomDelay(2000, 3000);

      // Scroll to trigger lazy loading
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2);
      });
      await this.randomDelay(500, 1000);

      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await this.randomDelay(500, 1000);

      // Get the page content
      const pageContent = await page.evaluate(() => {
        return {
          title: document.title,
          text: document.body.innerText,
          url: window.location.href,
        };
      });

      return pageContent;
    } catch (error: any) {
      this.logger.error(
        `Failed to extract job from ${url}: ${error.message.substring(0, 100)}`,
      );
      return null;
    } finally {
      // Enhanced cleanup with timeout to prevent hanging
      const cleanupWithTimeout = async (
        resource: any,
        resourceName: string,
      ) => {
        if (!resource) return;
        try {
          await Promise.race([
            resource.close(),
            new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error(`${resourceName} cleanup timeout`)),
                5000,
              ),
            ),
          ]);
        } catch (cleanupError: any) {
          this.logger.warn(
            `Failed to cleanup ${resourceName}: ${cleanupError.message}`,
          );
        }
      };

      // Cleanup page and context, but return browser to pool
      await cleanupWithTimeout(page, 'page');
      await cleanupWithTimeout(context, 'context');

      // Return browser to pool instead of closing it
      if (browser) {
        await browserPool.release(browser);
      }
    }
  }

  private async processJobWithAI(
    pageContent: { title: string; text: string; url: string },
    searchTitles: string[],
    userLocation?: string,
    workMode?: string,
  ): Promise<any> {
    try {
      const model = this.aiService.getPlatformModel();

      const prompt = `
        You are analyzing a job posting page. Extract information and determine relevance based on ALL search criteria.
        
        Page URL: ${pageContent.url}
        Page Title: ${pageContent.title}
        
        IMPORTANT Search Criteria (ALL must be considered for relevance):
        - Desired Job Titles (job should match ANY of these): ${searchTitles.map((t) => `"${t}"`).join(', ')}
        - Desired Location: ${userLocation || 'Any location'}
        - Desired Work Mode: ${workMode || 'Any work mode'}
        
        Page Content:
        ${pageContent.text}
        
        RELEVANCE RULES:
        1. Job Title: The job title should be relevant to ANY of the following: ${searchTitles.map((t) => `"${t}"`).join(', ')} (consider similar roles, seniority levels, and related positions)
        2. Location: ${userLocation ? `Job must be in or near "${userLocation}" OR explicitly allow remote work` : 'Any location is acceptable'}
        3. Work Mode: ${workMode && workMode !== 'any' ? `Job MUST offer "${workMode}" work arrangement` : 'Any work mode is acceptable'}
        
        Mark as NOT relevant if:
        - Job title is completely unrelated to ALL of: ${searchTitles.map((t) => `"${t}"`).join(', ')}
        ${userLocation ? `- Location is not "${userLocation}" AND job doesn't offer remote option` : ''}
        ${workMode && workMode !== 'any' ? `- Work mode doesn't match "${workMode}" requirement` : ''}
        
        Extract all information and explain your relevance decision based on ALL criteria.
      `;

      const { object } = await generateObject({
        model,
        schema: z.object({
          isRelevant: z
            .boolean()
            .describe(
              'Is this job relevant based on ALL search criteria (title, location, work mode)?',
            ),
          relevanceReason: z
            .string()
            .describe(
              'Detailed explanation of why this job is/isnt relevant, mentioning title match, location match, and work mode match',
            ),
          title: z
            .string()
            .nullable()
            .describe('Actual job title from the posting'),
          company: z.string().nullable().describe('Company name'),
          location: z.string().nullable().describe('Job location(s)'),
          workMode: z
            .enum(['remote', 'hybrid', 'onsite', 'flexible'])
            .nullable()
            .describe('Actual work mode offered in the job posting'),
          salaryRange: z
            .string()
            .nullable()
            .describe('Salary range if mentioned'),
          experienceLevel: z
            .enum(['Entry', 'Mid', 'Senior', 'Lead', 'Principal'])
            .nullable()
            .describe('Experience level'),
          jobType: z
            .enum(['Full-time', 'Part-time', 'Contract', 'Internship'])
            .nullable()
            .describe('Job type'),
          skills: z.array(z.string()).nullable().describe('Required skills'),
          descriptionSummary: z
            .string()
            .nullable()
            .describe('Brief summary of the job description'),
          datePosted: z.string().nullable().describe('When the job was posted'),
          department: z.string().nullable().describe('Department or team'),
        }),
        prompt,
      });

      return object;
    } catch (error: any) {
      this.logger.error(`AI processing failed: ${error.message}`);
      throw error;
    }
  }

  async promoteToJob(
    userId: string,
    scannedJobId: string,
  ): Promise<{ job: any; scannedJob: any }> {
    const scannedJob = await this.scannedJobModel.findOne({
      _id: scannedJobId,
      userId,
    });

    if (!scannedJob) {
      throw new NotFoundException('Scanned job not found');
    }

    if (scannedJob.savedJobId) {
      throw new BadRequestException('Job already saved to your jobs list');
    }

    const jobTypeMap: Record<string, string> = {
      'Full-time': 'full-time',
      'Part-time': 'part-time',
      Contract: 'contract',
      Internship: 'internship',
    };

    // Job schema only supports 'remote' | 'hybrid' | 'onsite'
    const workMode =
      scannedJob.workMode === 'flexible' ? 'remote' : scannedJob.workMode;
    const jobType = scannedJob.jobType
      ? jobTypeMap[scannedJob.jobType]
      : undefined;
    const skills = scannedJob.skills || [];

    const description =
      scannedJob.descriptionSummary ||
      `${scannedJob.title || scannedJob.searchTitle} at ${scannedJob.company || 'Unknown'}. See original posting: ${scannedJob.url}`;

    const job = await this.jobModel.create({
      userId,
      title: scannedJob.title || scannedJob.searchTitle,
      company: scannedJob.company || 'Unknown',
      location: scannedJob.location,
      description,
      url: scannedJob.url,
      source: 'scraped',
      workMode,
      jobType,
      mustHaveSkills: skills.slice(0, 5),
      niceToHaveSkills: skills.slice(5, 10),
      keywords: {
        actionVerbs: [],
        hardSkills: skills,
        softSkills: [],
      },
      summary: scannedJob.descriptionSummary,
      category: 'General',
    });

    const updatedScannedJob = await this.scannedJobModel
      .findByIdAndUpdate(
        scannedJobId,
        { savedJobId: String(job._id) },
        { new: true },
      )
      .lean();

    return { job: job.toObject(), scannedJob: updatedScannedJob };
  }
}
