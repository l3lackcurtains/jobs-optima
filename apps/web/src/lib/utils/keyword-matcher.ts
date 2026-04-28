/**
 * Checks if a keyword exists as a whole word in the given text (case-insensitive)
 * @param text - The text to search in
 * @param keyword - The keyword to search for
 * @returns true if the keyword exists as a whole word, false otherwise
 */
export function isKeywordInText(text: string, keyword: string): boolean {
  if (!text || !keyword) return false
  
  const lowerText = text.toLowerCase()
  const lowerKeyword = keyword.toLowerCase()
  
  // Escape special regex characters in the keyword
  const escapedKeyword = lowerKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  
  // For keywords with special characters (like C++, C#, .NET), we need custom boundary logic
  // Check if keyword starts/ends with word characters
  const startsWithWord = /^\w/.test(keyword)
  const endsWithWord = /\w$/.test(keyword)
  
  // Build regex pattern with appropriate boundaries
  let pattern = ''
  if (startsWithWord) {
    pattern = `(^|\\W)${escapedKeyword}`
  } else {
    pattern = escapedKeyword
  }
  
  if (endsWithWord) {
    pattern = pattern + '($|\\W)'
  }
  
  const regex = new RegExp(pattern, 'i')
  return regex.test(lowerText)
}

/**
 * Filters keywords that exist as whole words in the given text
 * @param text - The text to search in
 * @param keywords - Array of keywords to check
 * @returns Array of keywords that exist as whole words in the text
 */
export function getMatchedKeywords(text: string, keywords: string[]): string[] {
  if (!text || !keywords || keywords.length === 0) return []
  
  return keywords.filter(keyword => 
    keyword && isKeywordInText(text, keyword)
  )
}