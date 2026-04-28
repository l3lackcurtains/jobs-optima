'use client'

import { useState, useEffect } from 'react'
import { X, Sparkles, Check, Copy } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { PrimaryButton, OutlineButton, GhostButton, IconButton, SparkButton } from '@/components/custom/Button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api/client'

interface ContentImprovementDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  content: string
  contentType: 'responsibility' | 'project_description' | 'achievement'
  onSelect: (optimizedContent: string) => void
}

export function ContentImprovementDrawer({
  open,
  onOpenChange,
  content,
  contentType,
  onSelect,
}: ContentImprovementDrawerProps) {
  const [prompt, setPrompt] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  // Reset state when content changes or drawer opens with new content
  useEffect(() => {
    if (open && content) {
      setPrompt('')
      setSuggestions([])
      setSelectedIndex(null)
      setCopiedIndex(null)
    }
  }, [open, content])

  const handleOptimize = async () => {
    setIsLoading(true)
    try {
      const response = await apiClient.post('/ai/improve-content-ats', {
        content,
        prompt,
        contentType,
      })

      setSuggestions(response.data.suggestions || [])
      setSelectedIndex(null)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to optimize content')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async (suggestion: string, index: number) => {
    try {
      await navigator.clipboard.writeText(suggestion)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
      toast.success('Copied to clipboard')
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const handleSelect = (suggestion: string, index: number) => {
    setSelectedIndex(index)
    onSelect(suggestion)
    onOpenChange(false)
    toast.success('Content updated successfully')
  }

  const getContentTypeLabel = () => {
    switch (contentType) {
      case 'responsibility':
        return 'Responsibility'
      case 'project_description':
        return 'Project Description'
      case 'achievement':
        return 'Achievement'
      default:
        return 'Content'
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px] p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-600" />
            AI Content Improvement
          </SheetTitle>
          <SheetDescription>
            Improve your {getContentTypeLabel().toLowerCase()} with ATS-optimized suggestions
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 pb-6">
          {/* Original Content */}
          <div className="space-y-2">
            <Label>Original Content</Label>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">{content}</p>
            </Card>
          </div>

          {/* Custom Prompt */}
          <div className="space-y-2">
            <Label htmlFor="prompt">
              Custom Instructions (Optional)
            </Label>
            <Textarea
              id="prompt"
              placeholder="E.g., Focus on leadership skills, emphasize results, mention specific technologies..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Generate Button */}
          <SparkButton
            onClick={handleOptimize}
            loading={isLoading}
            loadingText="Generating..."
            className="w-full">
            Generate Improved Versions
          </SparkButton>

          {/* Suggestions */}
          {suggestions.length> 0 && (
            <div className="space-y-3">
              <Label>Select an Improved Version</Label>
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <Card
                    key={index}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedIndex === index
                        ? 'bg-orange-50 border-orange-300 dark:bg-orange-950/20 dark:border-orange-800'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-900'
                    }`}>
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <Badge variant="outline" className="text-xs">
                          Version {index + 1}
                        </Badge>
                        <div className="flex gap-1">
                          <GhostButton
                            size="sm"
                           
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCopy(suggestion, index)
                            }}>
                            {copiedIndex === index ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </GhostButton>
                          {selectedIndex === index ? (
                            <PrimaryButton
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSelect(suggestion, index)
                              }}>
                              Use This
                            </PrimaryButton>
                          ) : (
                            <OutlineButton
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSelect(suggestion, index)
                              }}>
                              Use This
                            </OutlineButton>
                          )}
                        </div>
                      </div>
                      <p className="text-sm">{suggestion}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}