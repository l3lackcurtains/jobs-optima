import { Logger } from '@nestjs/common';
import { ScannedJob } from '../schemas/scanned-job.schema';
import {
  AtsTarget,
  errorMessage,
  FetcherResult,
  FetcherSearchOptions,
  JobFetcher,
  fetchJsonWithTimeout,
  matchesTitleQuery,
  matchesWorkMode,
  timeFilterToCutoffDate,
} from './base.fetcher';

interface LeverJob {
  text?: string;
  hostedUrl?: string;
  applyUrl?: string;
  createdAt?: number;
  categories?: { location?: string };
}

export class LeverFetcher implements JobFetcher {
  readonly id = 'lever-api';
  readonly label = 'Lever';
  private readonly logger = new Logger(LeverFetcher.name);

  constructor(private readonly target: AtsTarget) {}

  async fetch(options: FetcherSearchOptions): Promise<FetcherResult> {
    const { search, timeFilter, maxResults } = options;
    const apiUrl = `https://api.lever.co/v0/postings/${this.target.slug}?mode=json`;

    try {
      const json = await fetchJsonWithTimeout<LeverJob[]>(apiUrl);
      const rawJobs = Array.isArray(json) ? json : [];
      const cutoff = timeFilterToCutoffDate(timeFilter);

      const jobs: Partial<ScannedJob>[] = [];
      for (const j of rawJobs) {
        const title = j.text ?? '';
        const url = j.hostedUrl ?? j.applyUrl ?? '';
        if (!url || !title) continue;
        if (!matchesTitleQuery(title, search.title)) continue;

        const location = j.categories?.location ?? '';
        if (!matchesWorkMode(location, search.workMode)) continue;

        // Lever exposes ms timestamps; prefer createdAt for "fresh post" semantics
        const createdAt =
          typeof j.createdAt === 'number' ? new Date(j.createdAt) : undefined;
        if (cutoff && createdAt && createdAt < cutoff) continue;

        jobs.push({
          searchTitle: search.title,
          url,
          site: this.id,
          title,
          location,
          datePosted: createdAt,
          scrapedAt: new Date(),
        });

        if (jobs.length >= maxResults) break;
      }

      return { jobs, errors: 0 };
    } catch (err) {
      this.logger.warn(
        `Lever fetch failed for ${this.target.slug}: ${errorMessage(err)}`,
      );
      return { jobs: [], errors: 1 };
    }
  }
}
