'use client';

import { useEffect, useState, useRef } from 'react';
import { Terminal, Download, Copy, CheckCircle, RefreshCw, AlertTriangle, Activity, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useScanLogs, type ScanLog, useCancelScan } from '@/hooks/api/use-job-scanner';
import { TerminalLogViewer } from './terminal-log-viewer';
import { toast } from 'sonner';

interface ScanTerminalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scanId: string | null;
  onComplete?: () => void;
  onStartScan?: (force: boolean) => void;
  isScanning?: boolean;
  scanSettings?: any;
}

export function ScanTerminalDialog({
  open,
  onOpenChange,
  scanId,
  onComplete,
  onStartScan,
  isScanning = false,
  scanSettings,
}: ScanTerminalDialogProps) {
  const [isComplete, setIsComplete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [forceScan, setForceScan] = useState(false);
  const [confirmMode, setConfirmMode] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const completeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use the scan logs hook
  const { data: logs = [], refetch } = useScanLogs(scanId, open);
  const cancelScan = useCancelScan();

  useEffect(() => {
    if (open) {
      if (scanId) {
        // We have a scan ID, show logs
        setConfirmMode(false);
        setIsComplete(false);
        refetch();
      } else {
        // No scan ID, show confirmation
        setConfirmMode(true);
        setForceScan(false);
      }
    }

    return () => {
      if (completeTimeoutRef.current) {
        clearTimeout(completeTimeoutRef.current);
        completeTimeoutRef.current = null;
      }
    };
  }, [open, scanId, refetch]);

  useEffect(() => {
    // Auto-scroll to bottom when new logs arrive
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }

    // Check if scan is complete or cancelled
    const completeLog = logs.find(
      (log: ScanLog) => log.phase === 'complete' || log.phase === 'error' || log.phase === 'cancelled'
    );
    
    if (completeLog && !isComplete) {
      setIsComplete(true);
      
      // Check if it was cancelled
      if (completeLog.phase === 'cancelled' || 
          completeLog.message.includes('cancelled') || 
          completeLog.message.includes('Cancelled')) {
        setIsCancelled(true);
      }
      
      // Don't auto-close the dialog - just refresh the job list
      if (completeLog.phase === 'complete' && onComplete) {
        onComplete();
      }
    }
  }, [logs, isComplete, onComplete]);


  const copyLogs = () => {
    const logText = logs
      .map((log) => {
        const date = new Date(log.timestamp);
        const time = date.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        return `[${time}] ${log.message}`;
      })
      .join('\n');
    navigator.clipboard.writeText(logText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const downloadLogs = () => {
    const logText = logs
      .map((log) => `[${formatTimestamp(log.timestamp)}] [${log.level.toUpperCase()}] ${log.message}${log.details ? `\n${log.details}` : ''}`)
      .join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scan-log-${scanId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleStartScan = () => {
    if (onStartScan) {
      onStartScan(forceScan);
      setConfirmMode(false);
    }
  };

  const handleCancelScan = async () => {
    if (!scanId) return;
    
    try {
      await cancelScan.mutateAsync(scanId);
      toast.success('Scan cancellation requested');
    } catch (error) {
      toast.error('Failed to cancel scan');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="!max-w-none sm:!max-w-[900px] h-[85vh] flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-gray-950">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Terminal className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">
                  Job Scanner Terminal
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {confirmMode ? 'Configure and start scan' : 'Live scan progress'}
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>
        
        {/* Tab-style header for logs view */}
        {!confirmMode && (
          <div className="px-6 py-3 bg-gray-900 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-green-400 border-green-400">
                  Manual Scan
                </Badge>
                {!isComplete && (
                  <Badge variant="outline" className="text-green-400 border-green-400 animate-pulse">
                    <Activity className="h-3 w-3 mr-1" />
                    IN PROGRESS
                  </Badge>
                )}
                {isComplete && !isCancelled && (
                  <Badge variant="outline" className="text-gray-400 border-gray-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    COMPLETED
                  </Badge>
                )}
                {isComplete && isCancelled && (
                  <Badge variant="outline" className="text-yellow-400 border-yellow-600">
                    <XCircle className="h-3 w-3 mr-1" />
                    CANCELLED
                  </Badge>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                {!isComplete && scanId && (
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
                        {cancelScan.isPending ? 'Cancelling...' : 'Cancel Scan'}
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
                  disabled={logs.length === 0}
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
                  disabled={logs.length === 0}
                >
                  <Download className="h-4 w-4" />
                  <span className="ml-1.5 text-xs">Export</span>
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex-1 bg-black overflow-hidden min-h-0">
          {confirmMode ? (
            /* Confirmation View */
            <div className="p-6 h-full flex flex-col justify-center">
              <div className="max-w-md mx-auto w-full space-y-6">
                <div className="text-center space-y-2">
                  <RefreshCw className="h-12 w-12 text-green-400 mx-auto" />
                  <h3 className="text-xl font-semibold text-green-400">Start Manual Scan</h3>
                  <p className="text-gray-400 text-sm">
                    This will search for new job postings based on your configured settings.
                  </p>
                </div>
                
                {scanSettings && (
                  <div className="bg-gray-900 rounded-lg p-4 space-y-2">
                    <p className="text-green-400 font-mono text-sm">Current Settings:</p>
                    <ul className="space-y-1 text-gray-300 text-xs font-mono">
                      <li>• {scanSettings.searches?.length || 0} search configurations</li>
                      <li>• {scanSettings.sites?.length || 0} job sites</li>
                      <li>• Time filter: {scanSettings.timeFilter?.replace('_', ' ')}</li>
                      <li>• Max results per search: {scanSettings.maxResultsPerSearch}</li>
                    </ul>
                  </div>
                )}
                
                {isScanning ? (
                  <div className="border border-yellow-600 rounded-lg p-4 bg-yellow-950/20">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <div className="space-y-3 flex-1">
                        <div>
                          <p className="text-yellow-400 font-semibold text-sm">
                            A scan is currently in progress
                          </p>
                          <p className="text-yellow-500 text-xs mt-1">
                            You can force start a new scan. This will stop the current scan and clear any stuck states.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="force-scan"
                            checked={forceScan}
                            onCheckedChange={(checked) => setForceScan(checked as boolean)}
                            className="border-yellow-600 data-[state=checked]:bg-yellow-600"
                          />
                          <label
                            htmlFor="force-scan"
                            className="text-sm text-yellow-400 cursor-pointer"
                          >
                            Force stop current scan and start new
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-900 rounded-lg p-4">
                    <p className="text-green-400 font-mono text-sm mb-2">Ready to scan</p>
                    <p className="text-gray-400 text-xs">
                      Click "Start Scan" to begin searching for jobs with your configured settings.
                    </p>
                  </div>
                )}
                
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="flex-1 bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleStartScan}
                    disabled={isScanning && !forceScan}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-700 disabled:text-gray-500"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {isScanning && !forceScan ? 'Check Force Option' : isScanning && forceScan ? 'Force Start New Scan' : 'Start Scan'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Logs View - Full Terminal UI */
            <TerminalLogViewer 
              logs={logs} 
              className="h-full"
              maxHeight="100%"
              autoScroll={!isComplete}
              showTimestamp={true}
              isComplete={isComplete}
              scanType="manual"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}