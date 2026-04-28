import { Logger } from '@nestjs/common';
import { ScannedJob } from '../schemas/scanned-job.schema';
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

interface RemoteOkJob {
  position?: string;
  title?: string;
  url?: string;
  apply_url?: string;
  company?: string;
  location?: string;
  date?: string;
  epoch?: number;
  tags?: string[];
}

export class RemoteOkFetcher implements JobFetcher {
  readonly id = 'remoteok-api';
  readonly label = 'RemoteOK';
  private readonly logger = new Logger(RemoteOkFetcher.name);

  async fetch(options: FetcherSearchOptions): Promise<FetcherResult> {
    const { search, timeFilter, maxResults } = options;
    const apiUrl = 'https://remoteok.com/api';

    try {
      const json = await fetchJsonWithTimeout<RemoteOkJob[]>(apiUrl, {
        // RemoteOK requests a real UA per their docs
        headers: { 'User-Agent': 'jobsoptima.com (contact@jobsoptima.com)' },
      });

      // First entry is metadata; remainder are postings
      const rawJobs = Array.isArray(json) ? json.slice(1) : [];
      const cutoff = timeFilterToCutoffDate(timeFilter);

      const jobs: Partial<ScannedJob>[] = [];
      for (const j of rawJobs) {
        const title = j.position ?? j.title ?? '';
        const url = j.url ?? j.apply_url ?? '';
        if (!url || !title) continue;
        if (!matchesTitleQuery(title, search.title)) continue;

        const location = j.location || 'Remote';
        if (!matchesWorkMode(location, search.workMode)) continue;

        // RemoteOK returns ISO-ish string in `date` and unix in `epoch`
        const publishedAt =
          typeof j.epoch === 'number'
            ? new Date(j.epoch * 1000)
            : j.date
              ? new Date(j.date)
              : undefined;
        if (cutoff && publishedAt && publishedAt < cutoff) continue;

        jobs.push({
          searchTitle: search.title,
          url,
          site: this.id,
          title,
          company: j.company,
          location,
          workMode: 'remote',
          datePosted: publishedAt,
          scrapedAt: new Date(),
          skills: Array.isArray(j.tags) ? j.tags : undefined,
        });

        if (jobs.length >= maxResults) break;
      }

      return { jobs, errors: 0 };
    } catch (err) {
      this.logger.warn(`RemoteOK fetch failed: ${errorMessage(err)}`);
      return { jobs: [], errors: 1 };
    }
  }
}
