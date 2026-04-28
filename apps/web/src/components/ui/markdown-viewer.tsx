'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { cn } from '@/lib/utils'

interface MarkdownViewerProps {
  content: string
  className?: string
}

export function MarkdownViewer({ content, className }: MarkdownViewerProps) {
  return (
    <div 
      className={cn(
        'prose prose-sm max-w-none',
        'prose-headings:text-foreground prose-headings:font-semibold',
        'prose-p:text-foreground prose-p:leading-7 prose-p:mb-4',
        'prose-strong:text-foreground prose-strong:font-semibold',
        'prose-em:text-foreground/90',
        'prose-ul:my-2 prose-ul:ml-4',
        'prose-ol:my-2 prose-ol:ml-4',
        'prose-li:text-foreground prose-li:my-1',
        'prose-blockquote:text-muted-foreground prose-blockquote:border-l-primary',
        'prose-code:text-foreground prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs',
        'prose-pre:bg-muted prose-pre:text-foreground',
        'prose-a:text-primary hover:prose-a:text-primary/80 prose-a:no-underline hover:prose-a:underline',
        'prose-hr:border-border',
        'dark:prose-invert',
        className
      )}
    >
      <ReactMarkdown 
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          // Ensure proper paragraph spacing
          p: ({ children }) => (
            <p className="mb-4 last:mb-0">{children}</p>
          ),
          // Custom list rendering with better spacing
          ul: ({ children }) => (
            <ul className="list-disc ml-5 my-2 space-y-1">{children}</ul>
          ),
          // Ensure strong text stands out
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}