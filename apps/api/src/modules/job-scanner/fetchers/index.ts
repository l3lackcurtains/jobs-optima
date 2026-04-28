import { JobScanSettingsDocument } from '../schemas/job-scan-settings.schema';
import { AshbyFetcher } from './ashby.fetcher';
import { detectAts, JobFetcher } from './base.fetcher';
import { GreenhouseFetcher } from './greenhouse.fetcher';
import { LeverFetcher } from './lever.fetcher';
import { RemoteOkFetcher } from './remoteok.fetcher';
import { RemotiveFetcher } from './remotive.fetcher';
import { WorkableFetcher } from './workable.fetcher';

export * from './base.fetcher';

/**
 * Build the list of fetchers enabled by the user's settings.
 * Per-company ATS fetchers are derived from `apiCompanies` careers URLs;
 * unrecognized URLs are silently dropped (the service logs them).
 */
export function buildFetchersFromSettings(
  settings: Pick<
    JobScanSettingsDocument,
    'apiCompanies' | 'enableRemotive' | 'enableRemoteOk'
  >,
): { fetchers: JobFetcher[]; unrecognizedUrls: string[] } {
  const fetchers: JobFetcher[] = [];
  const unrecognizedUrls: string[] = [];

  for (const url of settings.apiCompanies ?? []) {
    const target = detectAts(url);
    if (!target) {
      unrecognizedUrls.push(url);
      continue;
    }
    switch (target.ats) {
      case 'greenhouse':
        fetchers.push(new GreenhouseFetcher(target));
        break;
      case 'lever':
        fetchers.push(new LeverFetcher(target));
        break;
      case 'ashby':
        fetchers.push(new AshbyFetcher(target));
        break;
      case 'workable':
        fetchers.push(new WorkableFetcher(target));
        break;
    }
  }

  if (settings.enableRemotive) fetchers.push(new RemotiveFetcher());
  if (settings.enableRemoteOk) fetchers.push(new RemoteOkFetcher());

  return { fetchers, unrecognizedUrls };
}
