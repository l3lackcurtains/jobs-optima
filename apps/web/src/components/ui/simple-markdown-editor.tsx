'use client'

import dynamic from 'next/dynamic'
import { useState, useMemo } from 'react'
import { Eye, Edit2, Maximize2, Minimize2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MarkdownViewer } from '@/components/ui/markdown-viewer'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import 'easymde/dist/easymde.min.css'

const SimpleMDE = dynamic(() => import('react-simplemde-editor'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full animate-pulse bg-muted rounded-lg" />
  ),
})

interface SimpleMarkdownEditorProps {
  value: string
  onChange?: (value: string) => void
  placeholder?: string
  height?: number
  readOnly?: boolean
  className?: string
}

export function SimpleMarkdownEditor({
  value,
  onChange,
  placeholder = 'Write your content in markdown...',
  height = 400,
  readOnly = false,
  className,
}: SimpleMarkdownEditorProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write')

  const options = useMemo(
    () => ({
      spellChecker: false,
      placeholder,
      status: false,
      toolbar: [
        'bold',
        'italic',
        'heading',
        '|' as const,
        'quote',
        'unordered-list',
        'ordered-list',
        '|' as const,
        'link',
        'image',
        '|' as const,
        'preview',
        'side-by-side',
        'fullscreen',
        '|' as const,
        'guide',
      ] as const,
      previewRender: (text: string) => {
        // Return raw text for preview - we'll use our own viewer
        return text
      },
      minHeight: `${height}px`,
      maxHeight: isFullscreen ? '100vh' : `${height}px`,
      autofocus: false,
      lineWrapping: true, // Enable line wrapping
    }),
    [placeholder, height, isFullscreen]
  )

  if (readOnly) {
    return (
      <div className={cn("rounded-lg border bg-card", className)}>
        <div className="p-6">
          <MarkdownViewer 
            content={value || '*No content*'} 
            className="prose prose-sm max-w-none dark:prose-invert"
          />
        </div>
      </div>
    )
  }

  return (
    <div 
      className={cn(
        "simple-markdown-editor rounded-lg border bg-card overflow-hidden",
        isFullscreen && "fixed inset-4 z-50",
        className
      )}
    >
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'write' | 'preview')}>
        <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
          <TabsList className="h-8">
            <TabsTrigger value="write" className="h-7 text-xs">
              <Edit2 className="w-3 h-3 mr-1" />
              Write
            </TabsTrigger>
            <TabsTrigger value="preview" className="h-7 text-xs">
              <Eye className="w-3 h-3 mr-1" />
              Preview
            </TabsTrigger>
          </TabsList>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-7 px-2"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>

        <TabsContent value="write" className="m-0">
          <div 
            className="simplemde-container"
            style={{ 
              minHeight: isFullscreen ? 'calc(100vh - 120px)' : `${height}px`,
              maxHeight: isFullscreen ? 'calc(100vh - 120px)' : `${height}px`,
            }}
          >
            <SimpleMDE
              value={value}
              onChange={onChange}
              options={options}
            />
          </div>
        </TabsContent>

        <TabsContent value="preview" className="m-0">
          <div 
            className="overflow-auto p-6"
            style={{ 
              minHeight: isFullscreen ? 'calc(100vh - 120px)' : `${height}px`,
              maxHeight: isFullscreen ? 'calc(100vh - 120px)' : `${height}px`,
            }}
          >
            <MarkdownViewer 
              content={value || '*No content yet*'} 
              className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-p:mb-4"
            />
          </div>
        </TabsContent>
      </Tabs>

      <style jsx global>{`
        .simple-markdown-editor .EasyMDEContainer {
          height: 100%;
        }

        .simple-markdown-editor .EasyMDEContainer .CodeMirror {
          border: none;
          background: hsl(var(--background));
          color: hsl(var(--foreground));
          height: 100%;
          min-height: inherit;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
        }

        .simple-markdown-editor .editor-toolbar {
          background: hsl(var(--muted) / 0.5);
          border: none;
          border-bottom: 1px solid hsl(var(--border));
          opacity: 1;
        }

        .simple-markdown-editor .editor-toolbar button {
          color: hsl(var(--foreground));
          border: none;
        }

        .simple-markdown-editor .editor-toolbar button:hover {
          background: hsl(var(--accent));
          color: hsl(var(--accent-foreground));
        }

        .simple-markdown-editor .editor-toolbar button.active {
          background: hsl(var(--accent));
          color: hsl(var(--accent-foreground));
        }

        .simple-markdown-editor .editor-toolbar i.separator {
          border-left: 1px solid hsl(var(--border));
        }

        .simple-markdown-editor .CodeMirror-cursor {
          border-left-color: hsl(var(--foreground));
        }

        .simple-markdown-editor .CodeMirror-selected {
          background: hsl(var(--primary) / 0.1);
        }

        .simple-markdown-editor .CodeMirror-focused .CodeMirror-selected {
          background: hsl(var(--primary) / 0.2);
        }

        /* Markdown syntax highlighting colors */
        .simple-markdown-editor .cm-header {
          color: hsl(var(--primary));
          font-weight: 600;
        }
        
        .simple-markdown-editor .cm-header-1 { font-size: 1.4em; }
        .simple-markdown-editor .cm-header-2 { font-size: 1.3em; }
        .simple-markdown-editor .cm-header-3 { font-size: 1.2em; }
        
        .simple-markdown-editor .cm-strong {
          color: hsl(var(--foreground));
          font-weight: 700;
        }
        
        .simple-markdown-editor .cm-em {
          color: hsl(var(--foreground));
          font-style: italic;
        }
        
        .simple-markdown-editor .cm-link {
          color: hsl(var(--primary));
          text-decoration: none;
        }
        
        .simple-markdown-editor .cm-url {
          color: hsl(var(--primary) / 0.7);
        }
        
        .simple-markdown-editor .cm-quote {
          color: hsl(var(--muted-foreground));
          font-style: italic;
        }
        
        .simple-markdown-editor .cm-comment {
          color: hsl(var(--muted-foreground));
        }
        
        .simple-markdown-editor .cm-variable-2,
        .simple-markdown-editor .cm-variable-3,
        .simple-markdown-editor .cm-keyword {
          color: hsl(var(--foreground));
        }
        
        .simple-markdown-editor .cm-formatting {
          color: hsl(var(--muted-foreground));
          opacity: 0.6;
        }
        
        .simple-markdown-editor .cm-formatting-strong,
        .simple-markdown-editor .cm-formatting-em {
          color: hsl(var(--muted-foreground));
          opacity: 0.6;
        }
        
        .simple-markdown-editor .cm-formatting-list,
        .simple-markdown-editor .cm-formatting-list-ul,
        .simple-markdown-editor .cm-formatting-list-ol {
          color: hsl(var(--primary));
        }

        .simple-markdown-editor .cm-hr {
          color: hsl(var(--border));
        }

        .simple-markdown-editor .cm-code {
          color: hsl(var(--primary));
          background: hsl(var(--muted) / 0.3);
          padding: 0.1em 0.3em;
          border-radius: 3px;
        }

        .simple-markdown-editor .cm-code-block {
          color: hsl(var(--foreground));
          background: hsl(var(--muted) / 0.5);
        }

        .simple-markdown-editor .editor-preview {
          background: hsl(var(--background));
          color: hsl(var(--foreground));
        }

        .simple-markdown-editor .editor-preview-side {
          background: hsl(var(--background));
          color: hsl(var(--foreground));
          border-left: 1px solid hsl(var(--border));
        }

        .simple-markdown-editor .CodeMirror-scroll {
          min-height: inherit;
        }

        .simple-markdown-editor .CodeMirror-lines {
          padding: 1rem;
        }

        .simple-markdown-editor .CodeMirror pre.CodeMirror-line,
        .simple-markdown-editor .CodeMirror pre.CodeMirror-line-like {
          font-size: 14px;
          line-height: 1.6;
          word-wrap: break-word;
          white-space: pre-wrap;
        }
        
        .simple-markdown-editor .CodeMirror-wrap pre.CodeMirror-line,
        .simple-markdown-editor .CodeMirror-wrap pre.CodeMirror-line-like {
          word-wrap: break-word;
          white-space: pre-wrap;
          word-break: break-word;
        }
        
        .simple-markdown-editor .CodeMirror-wrap {
          white-space: pre-wrap;
          word-break: break-word;
        }

        /* Hide SimpleMDE's built-in preview since we use our own */
        .simple-markdown-editor .editor-preview,
        .simple-markdown-editor .editor-preview-side {
          display: none;
        }

        /* When tabs show preview, hide the editor */
        .simple-markdown-editor [data-state="inactive"] .simplemde-container {
          display: none;
        }
      `}</style>
    </div>
  )
}