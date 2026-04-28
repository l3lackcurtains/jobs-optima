'use client'

import { Editor, Viewer } from '@bytemd/react'
import gfm from '@bytemd/plugin-gfm'
import highlight from '@bytemd/plugin-highlight'
import 'bytemd/dist/index.css'
import 'highlight.js/styles/github.css'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

const plugins = [
  gfm(),
  highlight(),
]

interface ByteMDEditorProps {
  value: string
  onChange?: (value: string) => void
  mode?: 'split' | 'tab' | 'auto'
  height?: number | string
  placeholder?: string
  readOnly?: boolean
}

export function ByteMDEditor({
  value,
  onChange,
  mode = 'tab',
  height = 400,
  placeholder = 'Write your content in markdown...',
  readOnly = false,
}: ByteMDEditorProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div 
        className="border rounded-lg bg-background animate-pulse" 
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      />
    )
  }

  if (readOnly) {
    return (
      <div className="bytemd-viewer-wrapper prose prose-sm max-w-none">
        <Viewer value={value} plugins={plugins} />
      </div>
    )
  }

  return (
    <div 
      className="bytemd-editor-wrapper"
      data-theme={theme}
      style={{ 
        '--editor-height': typeof height === 'number' ? `${height}px` : height 
      } as React.CSSProperties}
    >
      <Editor
        value={value}
        plugins={plugins}
        onChange={(v) => onChange?.(v)}
        mode={mode}
        placeholder={placeholder}
      />
      <style jsx global>{`
        .bytemd-editor-wrapper {
          --bytemd-color-border: hsl(var(--border));
          --bytemd-color-bg: hsl(var(--background));
          --bytemd-color-hover-bg: hsl(var(--muted));
          --bytemd-color-text: hsl(var(--foreground));
          --bytemd-color-placeholder: hsl(var(--muted-foreground));
        }

        .bytemd-editor-wrapper .bytemd {
          height: var(--editor-height);
          border: 1px solid var(--bytemd-color-border);
          border-radius: 0.5rem;
          overflow: hidden;
          background: var(--bytemd-color-bg);
        }

        .bytemd-editor-wrapper .bytemd-toolbar {
          background: var(--bytemd-color-bg);
          border-bottom: 1px solid var(--bytemd-color-border);
          padding: 0.5rem;
        }

        .bytemd-editor-wrapper .bytemd-toolbar-icon {
          color: var(--bytemd-color-text);
          transition: all 0.2s;
        }

        .bytemd-editor-wrapper .bytemd-toolbar-icon:hover {
          background: var(--bytemd-color-hover-bg);
          color: hsl(var(--primary));
        }

        .bytemd-editor-wrapper .bytemd-toolbar-icon.bytemd-toolbar-icon-active {
          color: hsl(var(--primary));
          background: var(--bytemd-color-hover-bg);
        }

        .bytemd-editor-wrapper .CodeMirror {
          background: var(--bytemd-color-bg);
          color: var(--bytemd-color-text);
          font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
          font-size: 14px;
        }

        .bytemd-editor-wrapper .CodeMirror-gutters {
          background: var(--bytemd-color-bg);
          border-right: 1px solid var(--bytemd-color-border);
        }

        .bytemd-editor-wrapper .CodeMirror-cursor {
          border-left-color: var(--bytemd-color-text);
        }

        .bytemd-editor-wrapper .CodeMirror-selected {
          background: hsl(var(--primary) / 0.1);
        }

        .bytemd-editor-wrapper .bytemd-preview {
          background: var(--bytemd-color-bg);
        }

        .bytemd-editor-wrapper .markdown-body {
          background: transparent;
          color: var(--bytemd-color-text);
        }

        .bytemd-editor-wrapper[data-theme="dark"] .markdown-body {
          color-scheme: dark;
        }

        .bytemd-editor-wrapper .markdown-body h1,
        .bytemd-editor-wrapper .markdown-body h2,
        .bytemd-editor-wrapper .markdown-body h3,
        .bytemd-editor-wrapper .markdown-body h4,
        .bytemd-editor-wrapper .markdown-body h5,
        .bytemd-editor-wrapper .markdown-body h6 {
          color: var(--bytemd-color-text);
          border-bottom-color: var(--bytemd-color-border);
        }

        .bytemd-editor-wrapper .markdown-body code {
          background: var(--bytemd-color-hover-bg);
          color: var(--bytemd-color-text);
        }

        .bytemd-editor-wrapper .markdown-body pre {
          background: var(--bytemd-color-hover-bg);
        }

        .bytemd-editor-wrapper .markdown-body blockquote {
          color: var(--bytemd-color-placeholder);
          border-left-color: var(--bytemd-color-border);
        }

        .bytemd-editor-wrapper .markdown-body table {
          color: var(--bytemd-color-text);
        }

        .bytemd-editor-wrapper .markdown-body table tr {
          background: var(--bytemd-color-bg);
          border-color: var(--bytemd-color-border);
        }

        .bytemd-editor-wrapper .markdown-body table th,
        .bytemd-editor-wrapper .markdown-body table td {
          border-color: var(--bytemd-color-border);
        }

        .bytemd-editor-wrapper .markdown-body table tr:nth-child(2n) {
          background: var(--bytemd-color-hover-bg);
        }

        .bytemd-editor-wrapper .markdown-body hr {
          background: var(--bytemd-color-border);
        }

        .bytemd-editor-wrapper .bytemd-status {
          border-top: 1px solid var(--bytemd-color-border);
          background: var(--bytemd-color-bg);
          color: var(--bytemd-color-placeholder);
        }

        .bytemd-editor-wrapper .bytemd-split {
          border-left: 1px solid var(--bytemd-color-border);
        }

        .bytemd-viewer-wrapper .markdown-body {
          background: transparent;
          color: hsl(var(--foreground));
        }
      `}</style>
    </div>
  )
}

export function ByteMDViewer({ value }: { value: string }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="animate-pulse h-32 bg-muted rounded" />
  }

  return (
    <div className="bytemd-viewer-wrapper prose prose-sm max-w-none">
      <Viewer value={value} plugins={plugins} />
      <style jsx global>{`
        .bytemd-viewer-wrapper .markdown-body {
          background: transparent;
          color: hsl(var(--foreground));
        }
        
        .bytemd-viewer-wrapper .markdown-body h1,
        .bytemd-viewer-wrapper .markdown-body h2,
        .bytemd-viewer-wrapper .markdown-body h3,
        .bytemd-viewer-wrapper .markdown-body h4,
        .bytemd-viewer-wrapper .markdown-body h5,
        .bytemd-viewer-wrapper .markdown-body h6 {
          color: hsl(var(--foreground));
        }

        .bytemd-viewer-wrapper .markdown-body a {
          color: hsl(var(--primary));
        }

        .bytemd-viewer-wrapper .markdown-body code {
          background: hsl(var(--muted));
          color: hsl(var(--foreground));
        }

        .bytemd-viewer-wrapper .markdown-body pre {
          background: hsl(var(--muted));
        }

        .bytemd-viewer-wrapper .markdown-body blockquote {
          color: hsl(var(--muted-foreground));
          border-left-color: hsl(var(--border));
        }
      `}</style>
    </div>
  )
}