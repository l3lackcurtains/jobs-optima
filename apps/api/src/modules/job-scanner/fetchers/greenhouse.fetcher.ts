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

interface GreenhouseJob {
  title?: string;
  absolute_url?: string;
  updated_at?: string;
  location?: { name?: string };
}

interface GreenhouseResponse {
  jobs?: GreenhouseJob[];
}

export class GreenhouseFetcher implements JobFetcher {
  readonly id = 'greenhouse-api';
  readonly label = 'Greenhouse';
  private readonly logger = new Logger(GreenhouseFetcher.name);

  constructor(private readonly target: AtsTarget) {}

  async fetch(options: FetcherSearchOptions): Promise<FetcherResult> {
    const { search, timeFilter, maxResults } = options;
    const apiUrl = `https://boards-api.greenhouse.io/v1/boards/${this.target.slug}/jobs`;

    try {
      const json = await fetchJsonWithTimeout<GreenhouseResponse>(apiUrl);
      const cutoff = timeFilterToCutoffDate(timeFilter);
      const rawJobs = Array.isArray(json.jobs) ? json.jobs : [];

      const jobs: Partial<ScannedJob>[] = [];
      for (const j of rawJobs) {
        const title = j.title ?? '';
        const url = j.absolute_url ?? '';
        if (!url || !title) continue;
        if (!matchesTitleQuery(title, search.title)) continue;

        const location = j.location?.name ?? '';
        if (!matchesWorkMode(location, search.workMode)) continue;

        const updatedAt = j.updated_at ? new Date(j.updated_at) : undefined;
        if (cutoff && updatedAt && updatedAt < cutoff) continue;

        jobs.push({
          searchTitle: search.title,
          url,
          site: this.id,
          title,
          location,
          datePosted: updatedAt,
          scrapedAt: new Date(),
        });

        if (jobs.length >= maxResults) break;
      }

      return { jobs, errors: 0 };
    } catch (err) {
      this.logger.warn(
        `Greenhouse fetch failed for ${this.target.slug}: ${errorMessage(err)}`,
      );
      return { jobs: [], errors: 1 };
    }
  }
}
