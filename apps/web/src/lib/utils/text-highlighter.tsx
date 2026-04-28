import React from 'react'

type HighlightMode = 'background' | 'text' | 'both'

/**
 * Highlights keywords in text with specified style
 * @param text - The text to highlight keywords in
 * @param keywords - Set of keywords to highlight (toggled/selected keywords)
 * @param mode - How to highlight: 'background' (colored bg), 'text' (colored text), or 'both'
 * @param alwaysHighlight - Set of keywords that should always be highlighted (e.g., all matched keywords)
 * @returns React element with highlighted text
 */
export function highlightKeywords(
  text: string,
  keywords: Set<string>,
  mode: HighlightMode = 'background',
  alwaysHighlight?: Set<string>
): React.ReactNode {
  if (!text) return text
  
  // Build sets for exact keyword matching
  const toggledKeywordsSet = new Set<string>()
  const alwaysKeywordsSet = new Set<string>()
  
  // Process toggled keywords (case-insensitive)
  keywords.forEach(keyword => {
    toggledKeywordsSet.add(keyword.toLowerCase())
  })
  
  // Process always highlighted keywords (case-insensitive)
  if (alwaysHighlight) {
    alwaysHighlight.forEach(keyword => {
      alwaysKeywordsSet.add(keyword.toLowerCase())
    })
  }
  
  // Combine all keywords for the regex pattern
  const allKeywords = new Set<string>()
  toggledKeywordsSet.forEach(k => allKeywords.add(k))
  alwaysKeywordsSet.forEach(k => allKeywords.add(k))
  
  if (allKeywords.size === 0) return text

  // Create an array of keywords sorted by length (longest first) to match longer keywords first
  const sortedKeywords = Array.from(allKeywords).sort((a, b) => b.length - a.length)
  
  // Build regex patterns for each keyword
  const keywordPatterns: string[] = []
  sortedKeywords.forEach(keyword => {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    
    // For keywords with special characters, use custom boundary logic
    const startsWithWord = /^\w/.test(keyword)
    const endsWithWord = /\w$/.test(keyword)
    
    let pattern = ''
    if (startsWithWord) {
      pattern = `(^|\\W)(${escaped})`
    } else {
      pattern = `(${escaped})`
    }
    
    if (endsWithWord) {
      pattern = pattern + '(?=$|\\W)'
    }
    
    keywordPatterns.push(pattern)
  })
  
  // Use a single regex with all patterns
  const pattern = new RegExp(keywordPatterns.join('|'), 'gi')
  
  // Use a different approach: find matches and rebuild the text
  const matches: Array<{ start: number; end: number; keyword: string }> = []
  let match
  
  while ((match = pattern.exec(text)) !== null) {
    // Find the actual keyword (could be in different capture groups)
    const actualMatch = match[0]
    const keywordMatch = sortedKeywords.find(k => 
      actualMatch.toLowerCase().includes(k.toLowerCase())
    )
    
    if (keywordMatch) {
      // Find where the keyword actually starts in the match
      const keywordStart = actualMatch.toLowerCase().indexOf(keywordMatch.toLowerCase())
      matches.push({
        start: match.index + keywordStart,
        end: match.index + keywordStart + keywordMatch.length,
        keyword: keywordMatch
      })
    }
  }
  
  // Sort matches by position
  matches.sort((a, b) => a.start - b.start)
  
  // Build the result
  const parts: React.ReactNode[] = []
  let lastEnd = 0
  
  matches.forEach((match, index) => {
    // Add text before the match
    if (match.start > lastEnd) {
      parts.push(<span key={`text-${index}`}>{text.slice(lastEnd, match.start)}</span>)
    }
    
    const matchedText = text.slice(match.start, match.end)
    const lowerKeyword = match.keyword.toLowerCase()
    const isToggled = toggledKeywordsSet.has(lowerKeyword)
    const isAlwaysHighlighted = alwaysKeywordsSet.has(lowerKeyword)
    
    // Add the highlighted keyword
    if (isToggled) {
      if (mode === 'background') {
        parts.push(
          <span
            key={`keyword-${index}`}
            className="bg-blue-300 dark:bg-blue-800 text-blue-900 dark:text-blue-100 px-0.5 rounded font-semibold"
          >
            {matchedText}
          </span>
        )
      } else if (mode === 'text') {
        parts.push(
          <span
            key={`keyword-${index}`}
            className="text-blue-600 dark:text-blue-400 font-bold"
          >
            {matchedText}
          </span>
        )
      } else { // both
        parts.push(
          <span
            key={`keyword-${index}`}
            className="bg-blue-300 dark:bg-blue-800 text-blue-900 dark:text-blue-100 px-0.5 rounded font-bold"
          >
            {matchedText}
          </span>
        )
      }
    } else if (isAlwaysHighlighted) {
      parts.push(
        <span
          key={`keyword-${index}`}
          className="text-orange-600 dark:text-orange-400 font-semibold"
        >
          {matchedText}
        </span>
      )
    } else {
      parts.push(<span key={`keyword-${index}`}>{matchedText}</span>)
    }
    
    lastEnd = match.end
  })
  
  // Add remaining text
  if (lastEnd < text.length) {
    parts.push(<span key="text-final">{text.slice(lastEnd)}</span>)
  }
  
  return <>{parts}</>
}

/**
 * Component wrapper for highlighting text
 */
export function HighlightedText({ 
  text, 
  keywords,
  mode = 'background',
  alwaysHighlight
}: { 
  text: string
  keywords: Set<string>
  mode?: HighlightMode
  alwaysHighlight?: Set<string>
}) {
  return <>{highlightKeywords(text, keywords, mode, alwaysHighlight)}</>
}