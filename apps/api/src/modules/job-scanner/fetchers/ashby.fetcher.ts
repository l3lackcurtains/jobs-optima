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

interface AshbyJob {
  title?: string;
  jobUrl?: string;
  location?: string;
  publishedAt?: string;
  updatedAt?: string;
}

interface AshbyResponse {
  jobs?: AshbyJob[];
}

export class AshbyFetcher implements JobFetcher {
  readonly id = 'ashby-api';
  readonly label = 'Ashby';
  private readonly logger = new Logger(AshbyFetcher.name);

  constructor(private readonly target: AtsTarget) {}

  async fetch(options: FetcherSearchOptions): Promise<FetcherResult> {
    const { search, timeFilter, maxResults } = options;
    const apiUrl = `https://api.ashbyhq.com/posting-api/job-board/${this.target.slug}?includeCompensation=true`;

    try {
      const json = await fetchJsonWithTimeout<AshbyResponse>(apiUrl);
      const rawJobs = Array.isArray(json.jobs) ? json.jobs : [];
      const cutoff = timeFilterToCutoffDate(timeFilter);

      const jobs: Partial<ScannedJob>[] = [];
      for (const j of rawJobs) {
        const title = j.title ?? '';
        const url = j.jobUrl ?? '';
        if (!url || !title) continue;
        if (!matchesTitleQuery(title, search.title)) continue;

        const location = j.location ?? '';
        if (!matchesWorkMode(location, search.workMode)) continue;

        const publishedAt = j.publishedAt
          ? new Date(j.publishedAt)
          : j.updatedAt
            ? new Date(j.updatedAt)
            : undefined;
        if (cutoff && publishedAt && publishedAt < cutoff) continue;

        jobs.push({
          searchTitle: search.title,
          url,
          site: this.id,
          title,
          location,
          datePosted: publishedAt,
          scrapedAt: new Date(),
        });

        if (jobs.length >= maxResults) break;
      }

      return { jobs, errors: 0 };
    } catch (err) {
      this.logger.warn(
        `Ashby fetch failed for ${this.target.slug}: ${errorMessage(err)}`,
      );
      return { jobs: [], errors: 1 };
    }
  }
}
