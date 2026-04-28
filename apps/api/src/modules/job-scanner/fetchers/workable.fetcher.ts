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

interface WorkableJob {
  title?: string;
  shortlink?: string;
  url?: string;
  published_on?: string;
  location?: { city?: string; country?: string };
}

interface WorkableResponse {
  results?: WorkableJob[];
}

export class WorkableFetcher implements JobFetcher {
  readonly id = 'workable-api';
  readonly label = 'Workable';
  private readonly logger = new Logger(WorkableFetcher.name);

  constructor(private readonly target: AtsTarget) {}

  async fetch(options: FetcherSearchOptions): Promise<FetcherResult> {
    const { search, timeFilter, maxResults } = options;
    const apiUrl = 'https://apply.workable.com/api/v1/widget/search';

    try {
      const json = await fetchJsonWithTimeout<WorkableResponse>(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Workable-Client-Id': this.target.slug,
        },
        body: JSON.stringify({
          query: search.title || '',
          location: search.location || '',
          department: '',
          limit: 100,
          offset: 0,
        }),
      });

      const rawJobs = Array.isArray(json.results) ? json.results : [];
      const cutoff = timeFilterToCutoffDate(timeFilter);

      const jobs: Partial<ScannedJob>[] = [];
      for (const j of rawJobs) {
        const title = j.title ?? '';
        const url = j.shortlink ?? j.url ?? '';
        if (!url || !title) continue;
        // Server already filtered by query but recheck for safety
        if (!matchesTitleQuery(title, search.title)) continue;

        const location = [j.location?.city, j.location?.country]
          .filter(Boolean)
          .join(', ');
        if (!matchesWorkMode(location, search.workMode)) continue;

        const publishedAt = j.published_on
          ? new Date(j.published_on)
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
        `Workable fetch failed for ${this.target.slug}: ${errorMessage(err)}`,
      );
      return { jobs: [], errors: 1 };
    }
  }
}
