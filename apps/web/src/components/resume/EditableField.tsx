'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { HighlightedText } from '@/lib/utils/text-highlighter'

interface EditableFieldProps {
  value: string
  onChange: (value: string) => void
  isEditing: boolean
  placeholder?: string
  className?: string
  multiline?: boolean
  rows?: number
  highlightedKeywords?: Set<string>
  allKeywordsForHighlight?: Set<string>
  renderViewMode?: (value: string) => React.ReactNode
}

export function EditableField({
  value,
  onChange,
  isEditing,
  placeholder = '',
  className = '',
  multiline = false,
  rows = 1,
  highlightedKeywords = new Set(),
  allKeywordsForHighlight = new Set(),
  renderViewMode
}: EditableFieldProps) {
  const [localValue, setLocalValue] = useState(value)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  useEffect(() => {
    // Auto-resize textarea to fit content
    if (multiline && textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = `${scrollHeight}px`
    }
  }, [localValue, multiline, isEditing])

  // Also resize on mount and when switching to edit mode
  useEffect(() => {
    if (multiline && textareaRef.current && isEditing) {
      textareaRef.current.style.height = 'auto'
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = `${scrollHeight}px`
    }
  }, [isEditing, multiline])

  const handleBlur = () => {
    if (localValue !== value) {
      onChange(localValue)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!multiline && e.key === 'Enter') {
      e.preventDefault()
      handleBlur()
      ;(e.target as HTMLElement).blur()
    }
  }

  if (!isEditing) {
    // View mode - maintain same dimensions as edit mode
    const viewClassName = cn(
      'w-full transition-all duration-200',
      multiline ? 'whitespace-pre-wrap break-words' : 'truncate',
      !value && 'text-muted-foreground italic',
      className
    )

    if (renderViewMode) {
      return <div className={viewClassName}>{renderViewMode(value)}</div>
    }

    return (
      <div className={viewClassName}>
        {value ? (
          <HighlightedText 
            text={value}
            keywords={highlightedKeywords}
            mode="text"
            alwaysHighlight={allKeywordsForHighlight}
          />
        ) : (
          placeholder
        )}
      </div>
    )
  }

  // Edit mode - Professional input styling with better padding
  const editClassName = cn(
    'w-full transition-all duration-200',
    'border rounded-md px-3 py-2 text-sm',
    'border-gray-300/70 dark:border-gray-600/50',
    'focus:border-orange-400 dark:focus:border-orange-500',
    'focus:outline-none focus:ring-1 focus:ring-orange-400/30',
    'bg-white dark:bg-gray-950',
    'text-gray-900 dark:text-gray-100',
    !value && 'text-muted-foreground',
    className
  )

  if (multiline) {
    return (
      <textarea
        ref={textareaRef}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(editClassName, 'resize-none overflow-hidden')}
        rows={rows}
        style={{ minHeight: 'auto' }}
      />
    )
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={editClassName}
    />
  )
}