import { Logger } from '@nestjs/common';
import { JobType, ScannedJob } from '../schemas/scanned-job.schema';
import {
  errorMessage,
  FetcherResult,
  FetcherSearchOptions,
  JobFetcher,
  fetchJsonWithTimeout,
  matchesTitleQuery,
  matchesWorkMode,
  timeFilterToCutoffDate,
} from './base.fetcher';

interface RemotiveJob {
  title?: string;
  url?: string;
  company_name?: string;
  candidate_required_location?: string;
  publication_date?: string;
  job_type?: string;
}

interface RemotiveResponse {
  jobs?: RemotiveJob[];
}

export class RemotiveFetcher implements JobFetcher {
  readonly id = 'remotive-api';
  readonly label = 'Remotive';
  private readonly logger = new Logger(RemotiveFetcher.name);

  async fetch(options: FetcherSearchOptions): Promise<FetcherResult> {
    const { search, timeFilter, maxResults } = options;
    const params = new URLSearchParams();
    if (search.title) params.set('search', search.title);
    const apiUrl = `https://remotive.com/api/remote-jobs${
      params.toString() ? `?${params.toString()}` : ''
    }`;

    try {
      const json = await fetchJsonWithTimeout<RemotiveResponse>(apiUrl);
      const rawJobs = Array.isArray(json.jobs) ? json.jobs : [];
      const cutoff = timeFilterToCutoffDate(timeFilter);

      const jobs: Partial<ScannedJob>[] = [];
      for (const j of rawJobs) {
        const title = j.title ?? '';
        const url = j.url ?? '';
        if (!url || !title) continue;
        if (!matchesTitleQuery(title, search.title)) continue;

        const location = j.candidate_required_location ?? 'Remote';
        if (!matchesWorkMode(location, search.workMode)) continue;

        const publishedAt = j.publication_date
          ? new Date(j.publication_date)
          : undefined;
        if (cutoff && publishedAt && publishedAt < cutoff) continue;

        jobs.push({
          searchTitle: search.title,
          url,
          site: this.id,
          title,
          company: j.company_name,
          location,
          workMode: 'remote',
          datePosted: publishedAt,
          scrapedAt: new Date(),
          jobType: this.normalizeJobType(j.job_type),
        });

        if (jobs.length >= maxResults) break;
      }

      return { jobs, errors: 0 };
    } catch (err) {
      this.logger.warn(`Remotive fetch failed: ${errorMessage(err)}`);
      return { jobs: [], errors: 1 };
    }
  }

  private normalizeJobType(raw: string | undefined): JobType | undefined {
    if (!raw) return undefined;
    const v = raw.toLowerCase();
    if (v.includes('full')) return 'Full-time';
    if (v.includes('part')) return 'Part-time';
    if (v.includes('contract') || v.includes('freelance')) return 'Contract';
    if (v.includes('intern')) return 'Internship';
    return undefined;
  }
}
