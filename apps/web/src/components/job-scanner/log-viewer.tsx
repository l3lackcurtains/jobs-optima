'use client';

import { useEffect, useRef, memo } from 'react';
import { cn } from '@/lib/utils';

interface LogEntry {
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: string;
  phase?: string;
  details?: string;
}

interface LogViewerProps {
  logs: LogEntry[];
  className?: string;
  autoScroll?: boolean;
  showTimestamp?: boolean;
  maxHeight?: string;
}

// Memoized log line component for performance
const LogLine = memo(({ 
  log, 
  index, 
  showTimestamp 
}: { 
  log: LogEntry; 
  index: number; 
  showTimestamp: boolean;
}) => {
  const getLogColor = (level: string) => {
    switch (level) {
      case 'success':
        return 'text-green-400';
      case 'warning':
        return 'text-yellow-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-300';
    }
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

  // Function to render text with clickable URLs
  const renderTextWithUrls = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        // Truncate URL for display
        const truncateUrl = (url: string, maxLength: number = 60) => {
          if (url.length <= maxLength) return url;
          
          try {
            const urlObj = new URL(url);
            const domain = urlObj.hostname;
            const params = urlObj.search ? '...' + urlObj.search.slice(-20) : '';
            return `${domain}${params}`;
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
            className="underline hover:text-blue-400 transition-colors"
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

  return (
    <div
      className={cn(
        'flex items-start gap-3 py-0.5',
        'animate-in fade-in slide-in-from-bottom-1 duration-200',
      )}
    >
      {showTimestamp && (
        <span className="text-gray-600 text-xs whitespace-nowrap font-mono">
          [{formatTimestamp(log.timestamp)}]
        </span>
      )}
      <span className={cn('flex-1 whitespace-pre-wrap font-mono text-sm break-all', getLogColor(log.level))}>
        {renderTextWithUrls(log.message)}
      </span>
    </div>
  );
});

LogLine.displayName = 'LogLine';

export function LogViewer({ 
  logs, 
  className,
  autoScroll = true,
  showTimestamp = true,
  maxHeight = '400px'
}: LogViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isUserScrolling = useRef(false);
  const lastScrollTop = useRef(0);

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

  if (logs.length === 0) {
    return (
      <div className={cn("flex items-center justify-center py-8 text-gray-500", className)}>
        <div className="text-center">
          <p className="text-sm">No logs available</p>
          <p className="text-xs mt-1">Logs will appear here when the scan starts</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      className={cn(
        "overflow-y-auto overflow-x-hidden px-4 py-2",
        "scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent",
        className
      )}
      style={{ maxHeight }}
    >
      <div className="space-y-0.5">
        {logs.map((log, index) => (
          <LogLine 
            key={`${log.timestamp}-${index}`} 
            log={log} 
            index={index}
            showTimestamp={showTimestamp}
          />
        ))}
      </div>
    </div>
  );
}