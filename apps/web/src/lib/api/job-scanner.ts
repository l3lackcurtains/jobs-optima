import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export interface SearchConfig {
  title: string;
  workMode?: 'remote' | 'hybrid' | 'onsite' | 'flexible' | 'any';
  location?: string;
}

export interface JobScanSettings {
  _id: string;
  userId: string;
  searches: SearchConfig[];
  sites: string[];
  apiCompanies: string[];
  enableRemotive: boolean;
  enableRemoteOk: boolean;
  timeFilter: 'past_hour' | 'past_day' | 'past_week' | 'past_month' | 'past_year' | 'anytime';
  maxResultsPerSearch: number;
  enableAutoScan: boolean;
  scanIntervalHours: number;
  scanIntervalMinutes?: number;
  notifyOnNewJobs: boolean;
  lastScanAt?: string;
  nextScheduledScan?: string;
  isScanning: boolean;
  currentScanId?: string;
}

export interface ScannedJob {
  _id: string;
  userId: string;
  searchTitle: string;
  url: string;
  site: string;
  datePosted?: string;
  scrapedAt: string;
  title?: string;
  company?: string;
  location?: string;
  workMode?: 'remote' | 'hybrid' | 'onsite' | 'flexible';
  salaryRange?: string;
  experienceLevel?: 'Entry' | 'Mid' | 'Senior' | 'Lead' | 'Principal';
  jobType?: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  skills?: string[];
  descriptionSummary?: string;
  department?: string;
  isFavorited: boolean;
  savedJobId?: string;
}

export interface GetScannedJobsParams {
  isFavorited?: boolean;
  searchTitle?: string;
  company?: string;
  workMode?: 'remote' | 'hybrid' | 'onsite' | 'flexible';
  limit?: number;
  offset?: number;
  sortBy?: 'datePosted' | 'createdAt';
  sortOrder?: 'desc' | 'asc';
}

export interface UpdateJobStatusParams {
  isFavorited?: boolean;
}

export const jobScannerAPI = {
  // Settings
  getSettings: async (): Promise<JobScanSettings> => {
    const response = await apiClient.get(API_ENDPOINTS.JOB_SCANNER_SETTINGS);
    return response.data;
  },

  updateSettings: async (settings: Partial<JobScanSettings>): Promise<JobScanSettings> => {
    const response = await apiClient.put(API_ENDPOINTS.JOB_SCANNER_SETTINGS, settings);
    return response.data;
  },

  // Scanning
  triggerScan: async (): Promise<{ success: boolean; message: string; jobsFound: number; scanId: string }> => {
    const response = await apiClient.post(API_ENDPOINTS.JOB_SCANNER_SCAN);
    return response.data;
  },
  
  triggerManualScan: async (force?: boolean): Promise<{ success: boolean; message: string; jobsFound: number; scanId: string }> => {
    const response = await apiClient.post(API_ENDPOINTS.JOB_SCANNER_SCAN, { force });
    return response.data;
  },

  cancelScan: async (scanId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/job-scanner/scan/${scanId}/cancel`);
    return response.data;
  },

  // Scan Logs
  getScanLogs: async (scanId: string): Promise<any[]> => {
    const response = await apiClient.get(API_ENDPOINTS.JOB_SCANNER_SCAN_LOGS(scanId));
    return response.data;
  },

  getLatestScanLogs: async (): Promise<{ auto?: any; manual?: any }> => {
    const response = await apiClient.get(API_ENDPOINTS.JOB_SCANNER_SCAN_LOGS_LATEST);
    return response.data;
  },

  clearScanLogs: async (scanType: 'auto' | 'manual'): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/job-scanner/scan-logs/${scanType}`);
    return response.data;
  },

  // Jobs
  getScannedJobs: async (params?: GetScannedJobsParams): Promise<{ jobs: ScannedJob[]; total: number }> => {
    const response = await apiClient.get(API_ENDPOINTS.JOB_SCANNER_JOBS, { params });
    return response.data;
  },

  updateJobStatus: async (jobId: string, status: UpdateJobStatusParams): Promise<ScannedJob> => {
    const response = await apiClient.put(API_ENDPOINTS.JOB_SCANNER_JOB_BY_ID(jobId), status);
    return response.data;
  },

  deleteJob: async (jobId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(API_ENDPOINTS.JOB_SCANNER_JOB_BY_ID(jobId));
    return response.data;
  },

  bulkAction: async (
    jobIds: string[],
    action: 'delete' | 'markFavorited' | 'markUnfavorited'
  ): Promise<{ success: boolean; message: string; affected: number }> => {
    const response = await apiClient.post(API_ENDPOINTS.JOB_SCANNER_BULK_ACTION, {
      jobIds,
      action,
    });
    return response.data;
  },

  saveToJobs: async (jobId: string): Promise<{ job: any; scannedJob: ScannedJob }> => {
    const response = await apiClient.post(API_ENDPOINTS.JOB_SCANNER_SAVE_JOB(jobId));
    return response.data;
  },

  // Auto-scan specific
  testAutoScan: async (): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post('/api/job-scanner/test-auto-scan');
    return response.data;
  },
};