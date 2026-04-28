'use client';

import { useEffect, useRef, memo, useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface LogEntry {
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: string;
  phase?: string;
  details?: string;
}

interface TerminalLogViewerProps {
  logs: LogEntry[];
  className?: string;
  autoScroll?: boolean;
  showTimestamp?: boolean;
  maxHeight?: string;
  isComplete?: boolean;
  scanType?: 'manual' | 'auto';
}

// ANSI-like color mapping for terminal
const terminalColors = {
  info: 'text-gray-300',
  success: 'text-green-400',
  warning: 'text-yellow-400',
  error: 'text-red-400',
  timestamp: 'text-gray-500',
  prompt: 'text-blue-400',
  phase: 'text-cyan-400',
};

// Memoized log line component for performance
const TerminalLogLine = memo(({ 
  log, 
  index,
  showTimestamp 
}: { 
  log: LogEntry; 
  index: number;
  showTimestamp: boolean;
}) => {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  // Function to render text with clickable URLs
  const renderTextWithUrls = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        const truncateUrl = (url: string, maxLength: number = 50) => {
          if (url.length <= maxLength) return url;
          
          try {
            const urlObj = new URL(url);
            const domain = urlObj.hostname;
            const path = urlObj.pathname.length > 20 
              ? urlObj.pathname.substring(0, 17) + '...' 
              : urlObj.pathname;
            return `${domain}${path}`;
          } catch {
            return url.substring(0, maxLength) + '...';
          }
        };

        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-dotted underline-offset-2 hover:text-blue-400 transition-colors"
            onClick={(e) => e.stopPropagation()}
            title={part}
          >
            {truncateUrl(part)}
          </a>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  // Format message with special prefixes
  const formatMessage = (message: string, phase?: string) => {
    // Add phase indicator if present
    if (phase) {
      return (
        <>
          <span className={terminalColors.phase}>[{phase}]</span>{' '}
          {renderTextWithUrls(message)}
        </>
      );
    }
    return renderTextWithUrls(message);
  };

  return (
    <div
      className={cn(
        'flex items-start gap-2 py-0.5 px-1 hover:bg-gray-900/50 transition-colors',
        'animate-in fade-in slide-in-from-bottom-1 duration-200',
        'font-mono text-sm',
      )}
    >
      {/* Line number */}
      <span className="text-gray-700 select-none text-xs w-8 text-right">
        {String(index + 1).padStart(3, '0')}
      </span>
      
      {/* Timestamp */}
      {showTimestamp && (
        <span className={cn(terminalColors.timestamp, 'text-xs select-none')}>
          [{formatTimestamp(log.timestamp)}]
        </span>
      )}
      
      {/* Log level indicator */}
      <span className={cn(
        'select-none',
        log.level === 'error' && 'text-red-500',
        log.level === 'warning' && 'text-yellow-500',
        log.level === 'success' && 'text-green-500',
        log.level === 'info' && 'text-blue-500',
      )}>
        {log.level === 'error' && '✗'}
        {log.level === 'warning' && '⚠'}
        {log.level === 'success' && '✓'}
        {log.level === 'info' && '›'}
      </span>
      
      {/* Message */}
      <span className={cn('flex-1 whitespace-pre-wrap break-all', terminalColors[log.level])}>
        {formatMessage(log.message, log.phase)}
      </span>
    </div>
  );
});

TerminalLogLine.displayName = 'TerminalLogLine';

export function TerminalLogViewer({ 
  logs, 
  className,
  autoScroll = true,
  showTimestamp = true,
  maxHeight = '100%',
  isComplete = false,
  scanType = 'manual'
}: TerminalLogViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isUserScrolling = useRef(false);
  const lastScrollTop = useRef(0);
  const [showCursor, setShowCursor] = useState(true);

  // Blinking cursor effect
  useEffect(() => {
    if (!isComplete) {
      const interval = setInterval(() => {
        setShowCursor(prev => !prev);
      }, 530);
      return () => clearInterval(interval);
    }
  }, [isComplete]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && containerRef.current && !isUserScrolling.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // Detect user scrolling
  const handleScroll = () => {
    if (!containerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 5;
    
    // User scrolled up
    if (scrollTop < lastScrollTop.current && !isAtBottom) {
      isUserScrolling.current = true;
    }
    // User scrolled to bottom
    else if (isAtBottom) {
      isUserScrolling.current = false;
    }
    
    lastScrollTop.current = scrollTop;
  };

  return (
    <div className={cn("flex flex-col h-full bg-black", className)}>
      {/* Terminal header bar */}
      <div className="flex items-center px-4 py-1 bg-gray-900 border-b border-gray-800">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <div className="flex-1 text-center">
          <span className="text-xs text-gray-400 font-mono">
            job-scanner@localhost: ~/scans/{scanType}
          </span>
        </div>
      </div>

      {/* Terminal content */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden",
          "scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-black",
          "bg-black"
        )}
        style={{ maxHeight }}
      >
        <div className="p-4">
          {/* Initial prompt */}
          <div className="text-gray-500 font-mono text-sm mb-4">
            <div className="flex items-center gap-2">
              <span className="text-green-400">$</span>
              <span>job-scanner --type={scanType} --verbose --color</span>
            </div>
            <div className="text-gray-700 mt-1">
              {'═'.repeat(60)}
            </div>
          </div>

          {/* Logs */}
          {logs.length === 0 ? (
            <div className="text-gray-600 font-mono text-sm">
              <span className="text-gray-500">Initializing scanner...</span>
            </div>
          ) : (
            <div className="space-y-0">
              {logs.map((log, index) => (
                <TerminalLogLine 
                  key={`${log.timestamp}-${index}`} 
                  log={log} 
                  index={index}
                  showTimestamp={showTimestamp}
                />
              ))}
            </div>
          )}

          {/* Status line */}
          {!isComplete && logs.length > 0 && (
            <div className="flex items-center gap-2 mt-4 text-gray-500 font-mono text-sm">
              <ChevronRight className="h-3 w-3" />
              <span>Processing</span>
              <span className={cn(
                "inline-block w-2 h-4 bg-green-400",
                showCursor ? "opacity-100" : "opacity-0"
              )} />
            </div>
          )}

          {/* Complete message */}
          {isComplete && (
            <div className="mt-4 pt-4 border-t border-gray-800">
              <div className="text-green-400 font-mono text-sm">
                <div className="flex items-center gap-2">
                  <span>✓</span>
                  <span>Scan completed successfully</span>
                </div>
              </div>
              <div className="text-gray-600 mt-2 font-mono text-xs">
                Process exited with code 0
              </div>
              <div className="flex items-center gap-2 mt-3 text-gray-500">
                <span className="text-green-400">$</span>
                <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}