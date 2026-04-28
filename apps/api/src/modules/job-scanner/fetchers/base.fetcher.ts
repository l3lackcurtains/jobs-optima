import { ScannedJob } from '../schemas/scanned-job.schema';
import { SearchConfig, TimeFilter } from '../schemas/job-scan-settings.schema';

export interface FetcherSearchOptions {
  search: SearchConfig;
  timeFilter: TimeFilter;
  maxResults: number;
}

export interface FetcherResult {
  jobs: Partial<ScannedJob>[];
  errors: number;
}

export interface JobFetcher {
  /** Stable identifier used in logs and source tagging on ScannedJob.site */
  readonly id: string;

  /** Human-readable label shown in logs */
  readonly label: string;

  fetch(options: FetcherSearchOptions): Promise<FetcherResult>;
}

const TIME_FILTER_TO_DAYS: Record<TimeFilter, number | null> = {
  past_hour: 1, // round up — APIs rarely have hour granularity
  past_day: 1,
  past_week: 7,
  past_month: 31,
  past_year: 365,
  anytime: null,
};

export function timeFilterToCutoffDate(timeFilter: TimeFilter): Date | null {
  const days = TIME_FILTER_TO_DAYS[timeFilter];
  if (days === null) return null;
  const cutoff = new Date();
  // past_hour gets a real 1h cutoff, everything else uses day granularity
  if (timeFilter === 'past_hour') {
    cutoff.setHours(cutoff.getHours() - 1);
  } else {
    cutoff.setDate(cutoff.getDate() - days);
  }
  return cutoff;
}

export function matchesTitleQuery(title: string, query: string): boolean {
  if (!query.trim()) return true;
  const haystack = title.toLowerCase();
  // any whitespace-separated token from the query that appears in the title
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .some((token) => haystack.includes(token));
}

export function matchesWorkMode(
  jobLocation: string | undefined,
  workMode: SearchConfig['workMode'],
): boolean {
  if (!workMode || workMode === 'any') return true;
  const loc = (jobLocation || '').toLowerCase();
  if (workMode === 'remote') return loc.includes('remote');
  if (workMode === 'hybrid') return loc.includes('hybrid');
  if (workMode === 'onsite')
    return !loc.includes('remote') && !loc.includes('hybrid');
  return true;
}

export type AtsType = 'greenhouse' | 'lever' | 'ashby' | 'workable';

export interface AtsTarget {
  ats: AtsType;
  slug: string;
  /** Original careers URL the user provided, kept for logs */
  sourceUrl: string;
}

const ATS_PATTERNS: Array<{
  ats: AtsType;
  pattern: RegExp;
}> = [
  { ats: 'ashby', pattern: /jobs\.ashbyhq\.com\/([^/?#]+)/ },
  { ats: 'lever', pattern: /jobs\.lever\.co\/([^/?#]+)/ },
  {
    ats: 'greenhouse',
    pattern: /(?:job-boards(?:\.eu)?|boards)\.greenhouse\.io\/([^/?#]+)/,
  },
  { ats: 'workable', pattern: /apply\.workable\.com\/([^/?#]+)/ },
];

export function detectAts(careersUrl: string): AtsTarget | null {
  const url = (careersUrl || '').trim();
  if (!url) return null;
  for (const { ats, pattern } of ATS_PATTERNS) {
    const match = url.match(pattern);
    if (match) return { ats, slug: match[1], sourceUrl: url };
  }
  return null;
}

export async function fetchJsonWithTimeout<T = unknown>(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<T> {
  const { timeoutMs = 10_000, ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // Spread caller options first so our timeout signal cannot be overridden
    const res = await fetch(url, { ...rest, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
