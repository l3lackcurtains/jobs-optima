'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote, 
  Link2, 
  Heading2,
  Eye,
  Edit3,
  Maximize2,
  Minimize2,
  Copy,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MarkdownViewer } from '@/components/ui/markdown-viewer'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

interface CleanMarkdownEditorProps {
  value: string
  onChange?: (value: string) => void
  placeholder?: string
  height?: number
  className?: string
  readOnly?: boolean
}

export function CleanMarkdownEditor({
  value,
  onChange,
  placeholder = 'Write your content here...\n\nUse **bold** for emphasis\nUse *italics* for subtle emphasis\nUse - or * for bullet points\nUse 1. for numbered lists',
  height = 500,
  className,
  readOnly = false,
}: CleanMarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Insert markdown formatting
  const insertFormatting = (before: string, after: string = '') => {
    if (!textareaRef.current || readOnly) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end)
    
    onChange?.(newText)
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus()
      if (selectedText) {
        textarea.setSelectionRange(start + before.length, end + before.length)
      } else {
        textarea.setSelectionRange(start + before.length, start + before.length)
      }
    }, 0)
  }

  const insertLinePrefix = (prefix: string) => {
    if (!textareaRef.current || readOnly) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    
    // Find start of current line
    let lineStart = start
    while (lineStart > 0 && value[lineStart - 1] !== '\n') {
      lineStart--
    }
    
    const newText = value.substring(0, lineStart) + prefix + value.substring(lineStart)
    onChange?.(newText)
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + prefix.length, start + prefix.length)
    }, 0)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value)
    setIsCopied(true)
    toast.success('Copied to clipboard')
    setTimeout(() => setIsCopied(false), 2000)
  }

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault()
          insertFormatting('**', '**')
          break
        case 'i':
          e.preventDefault()
          insertFormatting('*', '*')
          break
        case 'k':
          e.preventDefault()
          insertFormatting('[', '](url)')
          break
      }
    }
  }

  if (readOnly) {
    return (
      <div className={cn("rounded-lg border bg-card p-6", className)}>
        <MarkdownViewer 
          content={value || '*No content*'} 
          className="prose prose-sm max-w-none dark:prose-invert"
        />
      </div>
    )
  }

  return (
    <div 
      className={cn(
        "clean-markdown-editor rounded-lg border bg-card overflow-hidden",
        isFullscreen && "fixed inset-4 z-50",
        className
      )}
    >
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'write' | 'preview')}>
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-muted/30">
          <div className="flex items-center">
            <TabsList className="h-10 rounded-none bg-transparent border-0 p-0">
              <TabsTrigger 
                value="write" 
                className="h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Write
              </TabsTrigger>
              <TabsTrigger 
                value="preview" 
                className="h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4"
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </TabsTrigger>
            </TabsList>

            {activeTab === 'write' && (
              <div className="flex items-center gap-1 px-2 border-l">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting('**', '**')}
                  className="h-8 w-8 p-0"
                  title="Bold (Ctrl+B)"
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting('*', '*')}
                  className="h-8 w-8 p-0"
                  title="Italic (Ctrl+I)"
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertLinePrefix('## ')}
                  className="h-8 w-8 p-0"
                  title="Heading"
                >
                  <Heading2 className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-border mx-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertLinePrefix('> ')}
                  className="h-8 w-8 p-0"
                  title="Quote"
                >
                  <Quote className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertLinePrefix('- ')}
                  className="h-8 w-8 p-0"
                  title="Bullet List"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertLinePrefix('1. ')}
                  className="h-8 w-8 p-0"
                  title="Numbered List"
                >
                  <ListOrdered className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting('[', '](url)')}
                  className="h-8 w-8 p-0"
                  title="Link (Ctrl+K)"
                >
                  <Link2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 px-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8 px-3"
            >
              {isCopied ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-8 w-8 p-0"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Content */}
        <TabsContent value="write" className="m-0">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(
              "w-full resize-none border-0 bg-transparent p-4",
              "focus:outline-none focus:ring-0 focus-visible:ring-0",
              "font-mono text-sm leading-relaxed",
              "placeholder:text-muted-foreground/50"
            )}
            style={{ 
              minHeight: isFullscreen ? 'calc(100vh - 120px)' : `${height}px`,
              maxHeight: isFullscreen ? 'calc(100vh - 120px)' : `${height}px`,
            }}
          />
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
              content={value || '*Write something to see preview*'} 
              className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-p:mb-4"
            />
          </div>
        </TabsContent>
      </Tabs>

      <style jsx global>{`
        .clean-markdown-editor textarea {
          field-sizing: content;
        }
      `}</style>
    </div>
  )
}