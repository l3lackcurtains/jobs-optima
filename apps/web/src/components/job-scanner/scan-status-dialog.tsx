"use client";

import { useState } from "react";
import {
  Terminal,
  Activity,
  Clock,
  Copy,
  Download,
  CheckCircle,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TerminalLogViewer } from "./terminal-log-viewer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  useLatestScanLogs,
  useJobScanSettings,
  useClearScanLogs,
  useCancelScan,
} from "@/hooks/api/use-job-scanner";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface ScanStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface LogEntry {
  level: "info" | "success" | "warning" | "error";
  message: string;
  timestamp: string;
  phase?: string;
  details?: string;
}

interface ScanLogData {
  _id: string;
  userId: string;
  scanId: string;
  scanType: "auto" | "manual";
  logs: LogEntry[];
  startedAt?: string;
  completedAt?: string;
  isComplete: boolean;
}

export function ScanStatusDialog({
  open,
  onOpenChange,
}: ScanStatusDialogProps) {
  const [activeTab, setActiveTab] = useState<"manual" | "auto">("manual");
  const [copied, setCopied] = useState(false);

  const { data: settings, refetch: refetchSettings } = useJobScanSettings();
  const { data: logsData, refetch: refetchLogs } = useLatestScanLogs();
  const clearLogs = useClearScanLogs();
  const cancelScan = useCancelScan();

  const autoLogs = logsData?.auto as ScanLogData | undefined;
  const manualLogs = logsData?.manual as ScanLogData | undefined;

  const isScanning = settings?.isScanning || false;
  const currentLogs = activeTab === "manual" ? manualLogs : autoLogs;

  const copyLogs = () => {
    if (!currentLogs || !currentLogs.logs) return;

    const logText = currentLogs.logs
      .map((log) => {
        const date = new Date(log.timestamp);
        const time = date.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        return `[${time}] ${log.message}`;
      })
      .join("\n");
    navigator.clipboard.writeText(logText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadLogs = () => {
    if (!currentLogs || !currentLogs.logs) return;

    const logText = currentLogs.logs
      .map((log) => {
        const date = new Date(log.timestamp);
        const time = date.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        return `[${time}] [${log.level.toUpperCase()}] ${log.message}${log.details ? `\n${log.details}` : ""}`;
      })
      .join("\n");

    const blob = new Blob([logText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scan-log-${activeTab}-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearLogs = async () => {
    if (confirm(`Are you sure you want to clear ${activeTab} scan logs?`)) {
      await clearLogs.mutateAsync(activeTab);
      refetchLogs();
    }
  };

  const handleCancelScan = async () => {
    // Prefer currentScanId from settings, fall back to the active scan log's scanId
    const scanId =
      settings?.currentScanId || manualLogs?.scanId || autoLogs?.scanId;
    if (!scanId) return;

    try {
      await cancelScan.mutateAsync(scanId);
      toast.success("Scan cancellation requested");
      // Refetch settings to get updated isScanning status
      setTimeout(() => {
        refetchSettings();
        refetchLogs();
      }, 500);
    } catch (error) {
      toast.error("Failed to cancel scan");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-none sm:!max-w-[900px] h-[85vh] flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-gray-950">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Terminal className="h-5 w-5 text-green-400" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-lg font-semibold">
                  Scan Logs & History
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  View and manage job scanner logs
                </p>
              </div>
              {isScanning && (
                <Badge
                  variant="outline"
                  className="text-green-400 border-green-400 animate-pulse ml-4"
                >
                  <Activity className="h-3 w-3 mr-1" />
                  SCANNING
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Tabs and Actions Bar */}
        <div className="px-6 py-3 bg-gray-900 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "manual" | "auto")}
              className="flex-1"
            >
              <TabsList className="grid w-full max-w-md grid-cols-2 bg-gray-800">
                <TabsTrigger
                  value="manual"
                  className="data-[state=active]:bg-gray-700 data-[state=active]:text-green-400"
                >
                  Manual Scan
                  {manualLogs && !manualLogs.isComplete && isScanning && (
                    <span className="ml-2 text-xs text-green-400 animate-pulse">
                      ●
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="auto"
                  className="data-[state=active]:bg-gray-700 data-[state=active]:text-green-400"
                >
                  Auto Scan
                  {autoLogs && !autoLogs.isComplete && isScanning && (
                    <span className="ml-2 text-xs text-green-400 animate-pulse">
                      ●
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              {isScanning && settings?.currentScanId && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-red-400 hover:text-red-300 hover:bg-red-950/20"
                    onClick={handleCancelScan}
                    disabled={cancelScan.isPending}
                  >
                    <XCircle className="h-4 w-4" />
                    <span className="ml-1.5 text-xs">
                      {cancelScan.isPending ? "Cancelling..." : "Cancel Scan"}
                    </span>
                  </Button>
                  <div className="w-px h-5 bg-gray-700 mx-1" />
                </>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-gray-400 hover:text-white hover:bg-gray-800"
                onClick={copyLogs}
                disabled={
                  !currentLogs ||
                  !currentLogs.logs ||
                  currentLogs.logs.length === 0
                }
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="ml-1.5 text-xs">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span className="ml-1.5 text-xs">Copy</span>
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-gray-400 hover:text-white hover:bg-gray-800"
                onClick={downloadLogs}
                disabled={
                  !currentLogs ||
                  !currentLogs.logs ||
                  currentLogs.logs.length === 0
                }
              >
                <Download className="h-4 w-4" />
                <span className="ml-1.5 text-xs">Export</span>
              </Button>
              <div className="w-px h-5 bg-gray-700 mx-1" />
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-red-400 hover:text-red-300 hover:bg-red-950/20"
                onClick={handleClearLogs}
                disabled={
                  !currentLogs ||
                  !currentLogs.logs ||
                  currentLogs.logs.length === 0 ||
                  clearLogs.isPending
                }
              >
                <Trash2 className="h-4 w-4" />
                <span className="ml-1.5 text-xs">Clear</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Terminal Content */}
        <div className="flex-1 bg-black overflow-hidden min-h-0">
          {!currentLogs ||
          !currentLogs.logs ||
          currentLogs.logs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Terminal className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No {activeTab} scan logs available</p>
                <p className="text-xs mt-1">
                  Run a {activeTab} scan to see logs here
                </p>
              </div>
            </div>
          ) : (
            <TerminalLogViewer
              logs={currentLogs.logs}
              className="h-full"
              maxHeight="100%"
              autoScroll={!currentLogs.isComplete && isScanning}
              showTimestamp={true}
              isComplete={currentLogs.isComplete}
              scanType={activeTab}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
