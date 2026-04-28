'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Eye, Edit, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MarkdownViewer } from '@/components/ui/markdown-viewer'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { 
    ssr: false,
    loading: () => <Skeleton className="h-[300px] w-full" />
  }
)

interface MarkdownEditorWithToggleProps {
  value: string
  onChange?: (value: string | undefined) => void
  height?: number
  placeholder?: string
  readOnly?: boolean
  className?: string
  defaultView?: 'edit' | 'preview'
  showFullscreenToggle?: boolean
}

export function MarkdownEditorWithToggle({
  value,
  onChange,
  height = 400,
  placeholder,
  readOnly = false,
  className,
  defaultView = 'preview',
  showFullscreenToggle = false,
}: MarkdownEditorWithToggleProps) {
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>(defaultView)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const containerHeight = isFullscreen ? 'calc(100vh - 120px)' : `${height}px`

  return (
    <div className={cn("markdown-editor-container border rounded-lg", className, {
      "fixed inset-4 z-50 bg-background": isFullscreen
    })}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            Cover Letter
          </span>
        </div>
        <div className="flex items-center gap-1">
          {!readOnly && (
            <>
              <Button
                variant={viewMode === 'edit' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('edit')}
                className="h-7 px-2"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button
                variant={viewMode === 'preview' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('preview')}
                className="h-7 px-2"
              >
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>
            </>
          )}
          {showFullscreenToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-7 px-2 ml-2"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div 
        className="overflow-auto"
        style={{ height: containerHeight }}
      >
        {viewMode === 'edit' && !readOnly ? (
          <div data-color-mode="light" className="markdown-editor-wrapper">
            <MDEditor
              value={value}
              onChange={onChange}
              height={isFullscreen ? window.innerHeight - 120 : height}
              preview="edit"
              hideToolbar={false}
              textareaProps={{
                placeholder: placeholder || 'Enter your cover letter here...\n\nUse **bold** for emphasis\nUse *italics* for subtle emphasis\nUse bullet points:\n• Point 1\n• Point 2',
              }}
            />
            <style jsx global>{`
              .markdown-editor-wrapper .w-md-editor {
                background-color: var(--background);
                color: var(--foreground);
                border: none;
                box-shadow: none;
              }
              .markdown-editor-wrapper .w-md-editor-toolbar {
                background-color: var(--muted);
                border-bottom: 1px solid var(--border);
                padding: 8px;
              }
              .markdown-editor-wrapper .w-md-editor-content {
                background-color: var(--background);
              }
              .markdown-editor-wrapper .w-md-editor-input,
              .markdown-editor-wrapper .w-md-editor-text,
              .markdown-editor-wrapper .w-md-editor-text-pre {
                color: var(--foreground) !important;
                background-color: var(--background) !important;
                font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
                font-size: 14px;
                line-height: 1.6;
              }
              .markdown-editor-wrapper .w-md-editor.w-md-editor-focus {
                box-shadow: none;
                border: none;
              }
              .markdown-editor-wrapper .w-md-editor-toolbar button {
                color: var(--foreground);
              }
              .markdown-editor-wrapper .w-md-editor-toolbar button:hover {
                background-color: var(--accent);
              }
              .markdown-editor-wrapper .w-md-editor-toolbar svg {
                fill: currentColor;
              }
            `}</style>
          </div>
        ) : (
          <div className="p-6">
            <MarkdownViewer 
              content={value || '*No content yet. Click Edit to start writing your cover letter.*'} 
              className="prose prose-sm max-w-none"
            />
          </div>
        )}
      </div>
    </div>
  )
}