import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  jobScannerAPI,
  JobScanSettings,
  ScannedJob,
  GetScannedJobsParams,
  UpdateJobStatusParams,
} from "@/lib/api/job-scanner";

export interface ScanLog {
  _id: string;
  userId: string;
  scanId: string;
  level: "info" | "success" | "warning" | "error";
  message: string;
  phase?: string;
  details?: string;
  timestamp: string;
}

// Settings hooks
export function useJobScanSettings() {
  return useQuery({
    queryKey: ["job-scan-settings"],
    queryFn: jobScannerAPI.getSettings,
    refetchInterval: (query) => {
      const data = query.state.data as JobScanSettings | undefined;
      return data?.isScanning ? 1000 : false;
    },
  });
}

export function useUpdateJobScanSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: Partial<JobScanSettings>) =>
      jobScannerAPI.updateSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-scan-settings"] });
      toast.success("Settings updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update settings");
    },
  });
}

// Scan hooks
export function useTriggerJobScan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (force?: boolean) => jobScannerAPI.triggerManualScan(force),
    onSettled: () => {
      // Always invalidate queries after mutation settles
      queryClient.invalidateQueries({ queryKey: ["scanned-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["job-scan-settings"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to trigger scan");
    },
  });
}

export function useCancelScan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (scanId: string) => jobScannerAPI.cancelScan(scanId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-scan-settings"] });
      queryClient.invalidateQueries({ queryKey: ["scan-logs"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to cancel scan");
    },
  });
}

// Jobs hooks
export function useScannedJobs(
  params?: GetScannedJobsParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ["scanned-jobs", params],
    queryFn: () => jobScannerAPI.getScannedJobs(params),
    enabled: options?.enabled !== undefined ? options.enabled : true,
  });
}

export function useUpdateJobStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      jobId,
      status,
    }: {
      jobId: string;
      status: UpdateJobStatusParams;
    }) => jobScannerAPI.updateJobStatus(jobId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scanned-jobs"] });
      toast.success("Job status updated");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update job status",
      );
    },
  });
}

export function useDeleteScannedJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => jobScannerAPI.deleteJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scanned-jobs"] });
      toast.success("Job deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete job");
    },
  });
}

export function useBulkJobAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      jobIds,
      action,
    }: {
      jobIds: string[];
      action:
        | "delete"
        | "markViewed"
        | "markUnviewed"
        | "markFavorited"
        | "markUnfavorited";
    }) => jobScannerAPI.bulkAction(jobIds, action),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["scanned-jobs"] });
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Bulk operation failed");
    },
  });
}

export function useSaveScannedJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => jobScannerAPI.saveToJobs(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scanned-jobs"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to save job");
    },
  });
}

// Scan logs hook
export function useScanLogs(scanId: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: ["scan-logs", scanId],
    queryFn: () =>
      scanId ? jobScannerAPI.getScanLogs(scanId) : Promise.resolve([]),
    enabled: enabled && !!scanId,
    refetchInterval: (query) => {
      const logs = query.state.data as { phase?: string }[] | undefined;
      // Only stop on the final completion log (phase: 'complete'). The previous
      // checks matched any message containing "Complete", which fires after every
      // phase ("Phase 1 Complete: ...") and stopped polling early.
      const isDone = logs?.some((l) => l.phase === "complete") ?? false;
      return isDone ? false : 500;
    },
  });
}

export function useLatestScanLogs() {
  return useQuery({
    queryKey: ["scan-logs-latest"],
    queryFn: jobScannerAPI.getLatestScanLogs,
    refetchInterval: (query) => {
      const data = query.state.data as { auto?: any; manual?: any } | undefined;
      const isScanning =
        (data?.manual && !data.manual.isComplete) ||
        (data?.auto && !data.auto.isComplete);
      return isScanning ? 1000 : false;
    },
  });
}

export function useClearScanLogs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (scanType: "auto" | "manual") =>
      jobScannerAPI.clearScanLogs(scanType),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["scan-logs-latest"] });
      toast.success(data.message || "Logs cleared successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to clear logs");
    },
  });
}
