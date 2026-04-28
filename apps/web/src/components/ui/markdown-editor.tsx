'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { 
    ssr: false,
    loading: () => <Skeleton className="h-[300px] w-full" />
  }
)

interface MarkdownEditorProps {
  value: string
  onChange: (value: string | undefined) => void
  height?: number
  preview?: 'edit' | 'live' | 'preview'
  hideToolbar?: boolean
  placeholder?: string
}

export function MarkdownEditor({
  value,
  onChange,
  height = 300,
  preview = 'live',
  hideToolbar = false,
  placeholder,
}: MarkdownEditorProps) {
  return (
    <div data-color-mode="light" className="markdown-editor-wrapper">
      <MDEditor
        value={value}
        onChange={onChange}
        height={height}
        preview={preview}
        hideToolbar={hideToolbar}
        textareaProps={{
          placeholder: placeholder || 'Enter markdown content...',
        }}
      />
      <style jsx global>{`
        .markdown-editor-wrapper .w-md-editor {
          background-color: var(--background);
          color: var(--foreground);
        }
        .markdown-editor-wrapper .w-md-editor-toolbar {
          background-color: var(--background);
          border-bottom: 1px solid var(--border);
        }
        .markdown-editor-wrapper .w-md-editor-content {
          background-color: var(--background);
        }
        .markdown-editor-wrapper .w-md-editor-preview {
          background-color: var(--background);
          color: var(--foreground);
        }
        .markdown-editor-wrapper .w-md-editor-input,
        .markdown-editor-wrapper .w-md-editor-text {
          color: var(--foreground) !important;
          background-color: var(--background) !important;
        }
        .markdown-editor-wrapper .w-md-editor.w-md-editor-focus {
          box-shadow: none;
          border-color: var(--border);
        }
        .markdown-editor-wrapper .wmde-markdown {
          background-color: var(--background) !important;
          color: var(--foreground) !important;
        }
        .markdown-editor-wrapper .wmde-markdown h1,
        .markdown-editor-wrapper .wmde-markdown h2,
        .markdown-editor-wrapper .wmde-markdown h3,
        .markdown-editor-wrapper .wmde-markdown h4,
        .markdown-editor-wrapper .wmde-markdown h5,
        .markdown-editor-wrapper .wmde-markdown h6 {
          color: var(--foreground);
        }
        .markdown-editor-wrapper .wmde-markdown code {
          background-color: var(--muted);
          color: var(--foreground);
        }
        .markdown-editor-wrapper .wmde-markdown pre {
          background-color: var(--muted);
        }
        .markdown-editor-wrapper .wmde-markdown blockquote {
          border-left-color: var(--border);
          color: var(--muted-foreground);
        }
      `}</style>
    </div>
  )
}