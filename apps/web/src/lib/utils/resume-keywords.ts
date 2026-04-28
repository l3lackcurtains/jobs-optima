/**
 * Count the number of occurrences of a keyword in the text (case-insensitive, whole word match)
 * @param text - The text to search in (resume content)
 * @param keyword - The keyword to search for
 * @returns The number of occurrences found
 */
export function countKeywordOccurrences(
  text: string,
  keyword: string
): number {
  if (!text || !keyword) return 0

  const lowerText = text.toLowerCase()
  const lowerKeyword = keyword.toLowerCase()

  // Helper function to count whole word matches
  const countWholeWordMatches = (text: string, word: string): number => {
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    
    // For keywords with special characters (like C++, C#, .NET), we need custom boundary logic
    const startsWithWord = /^\w/.test(word)
    const endsWithWord = /\w$/.test(word)
    
    // Build regex pattern with appropriate boundaries
    let pattern = ''
    if (startsWithWord) {
      pattern = `(^|\\W)${escapedWord}`
    } else {
      pattern = escapedWord
    }
    
    if (endsWithWord) {
      pattern = pattern + '($|\\W)'
    }
    
    const regex = new RegExp(pattern, 'gi')
    const matches = text.match(regex)
    return matches ? matches.length : 0
  }

  return countWholeWordMatches(lowerText, lowerKeyword)
}

/**
 * Count occurrences of multiple keywords in text
 * @param text - The text to search in
 * @param keywords - Array of keywords to count
 * @returns Object with keyword as key and count as value
 */
export function countAllKeywordOccurrences(
  text: string,
  keywords: string[]
): Record<string, number> {
  const counts: Record<string, number> = {}
  
  keywords.forEach(keyword => {
    counts[keyword] = countKeywordOccurrences(text, keyword)
  })
  
  return counts
}

/**
 * Get keyword density (percentage of words that are keywords)
 * @param text - The text to analyze
 * @param keyword - The keyword to check density for
 * @returns Keyword density as a percentage
 */
export function getKeywordDensity(
  text: string,
  keyword: string
): number {
  if (!text || !keyword) return 0
  
  const wordCount = text.split(/\s+/).filter(word => word.length > 0).length
  if (wordCount === 0) return 0
  
  const keywordCount = countKeywordOccurrences(text, keyword)
  return (keywordCount / wordCount) * 100
}

/**
 * Check if a keyword exists in the text
 * @param text - The text to search in
 * @param keyword - The keyword to search for
 * @returns true if keyword exists, false otherwise
 */
export function hasKeyword(
  text: string,
  keyword: string
): boolean {
  return countKeywordOccurrences(text, keyword) > 0
}

/**
 * Get keywords that are missing from the text
 * @param text - The text to search in
 * @param keywords - Array of keywords to check
 * @returns Array of keywords that are not found in the text
 */
export function getMissingKeywords(
  text: string,
  keywords: string[]
): string[] {
  return keywords.filter(keyword => !hasKeyword(text, keyword))
}

/**
 * Get keywords that are present in the text
 * @param text - The text to search in
 * @param keywords - Array of keywords to check
 * @returns Array of keywords that are found in the text
 */
export function getPresentKeywords(
  text: string,
  keywords: string[]
): string[] {
  return keywords.filter(keyword => hasKeyword(text, keyword))
}

/**
 * Calculate keyword match percentage
 * @param text - The text to search in
 * @param keywords - Array of keywords to check
 * @returns Percentage of keywords found in the text (0-100)
 */
export function calculateKeywordMatchPercentage(
  text: string,
  keywords: string[]
): number {
  if (!keywords || keywords.length === 0) return 0
  
  const presentCount = getPresentKeywords(text, keywords).length
  return (presentCount / keywords.length) * 100
}

/**
 * Extract all text content from a resume
 * @param resume - The resume object to extract content from
 * @returns Combined text content from all resume sections
 */
export function extractResumeContent(resume: any): string {
  if (!resume) return '';

  const sections: string[] = [];

  // Contact info
  if (resume.contactInfo) {
    const { name, location, email, phone } = resume.contactInfo;
    sections.push([name, location, email, phone].filter(Boolean).join(' '));
  }

  // Experience
  if (resume.experience?.length > 0) {
    resume.experience.forEach((exp: any) => {
      sections.push(exp.title || '');
      sections.push(exp.company || '');
      sections.push(exp.location || '');
      sections.push(exp.dates || '');
      if (exp.responsibilities?.length > 0) {
        sections.push(exp.responsibilities.join(' '));
      }
    });
  }

  // Projects
  if (resume.projects?.length > 0) {
    resume.projects.forEach((project: any) => {
      sections.push(project.name || '');
      sections.push(project.technologies || '');
      sections.push(project.description || '');
    });
  }

  // Education
  if (resume.education?.length > 0) {
    resume.education.forEach((edu: any) => {
      sections.push(edu.institution || '');
      sections.push(edu.location || '');
      sections.push(edu.dates || '');
      sections.push(edu.degree || '');
      if (edu.achievements?.length > 0) {
        sections.push(edu.achievements.join(' '));
      }
    });
  }

  // Skills
  if (resume.skills) {
    if (resume.skills.technicalSkills?.length > 0) {
      sections.push(resume.skills.technicalSkills.join(' '));
    }
    if (resume.skills.developmentPracticesMethodologies?.length > 0) {
      sections.push(resume.skills.developmentPracticesMethodologies.join(' '));
    }
    if (resume.skills.personalSkills?.length > 0) {
      sections.push(resume.skills.personalSkills.join(' '));
    }
  }

  return sections.filter(Boolean).join(' ');
}

/**
 * Get keywords sorted by their occurrence count in the text
 * @param keywords - Array of keywords to count and sort
 * @param text - The text to search in
 * @returns Array of keywords with counts, sorted by count descending
 */
export function getSortedKeywordsWithCounts(
  keywords: string[] | undefined,
  text: string
): Array<{ keyword: string; count: number }> {
  if (!keywords || keywords.length === 0 || !text) return [];

  const keywordCounts = keywords.map(keyword => ({
    keyword,
    count: countKeywordOccurrences(text, keyword)
  }));

  // Sort by count descending, then alphabetically
  return keywordCounts.sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return a.keyword.localeCompare(b.keyword);
  });
}

/**
 * Get all keywords from a resume for highlighting purposes
 * @param resume - The resume object
 * @returns Set of all keywords (matched, unmatched, and general keywords)
 */
export function getAllKeywordsForHighlighting(resume: any): Set<string> {
  if (!resume) return new Set();

  const allKeywords: string[] = [];

  if (resume.keywords?.length > 0) {
    allKeywords.push(...resume.keywords);
  }
  if (resume.matchedKeywords?.length > 0) {
    allKeywords.push(...resume.matchedKeywords);
  }
  if (resume.unmatchedKeywords?.length > 0) {
    allKeywords.push(...resume.unmatchedKeywords);
  }

  return new Set(allKeywords);
}

/**
 * Get all keywords from a resume
 * @param resume - The resume object
 * @returns Array of all unique keywords
 */
export function getAllResumeKeywords(resume: any): string[] {
  if (!resume) return [];

  const allKeywords: string[] = [];

  if (resume.keywords?.length > 0) {
    allKeywords.push(...resume.keywords);
  }
  if (resume.matchedKeywords?.length > 0) {
    allKeywords.push(...resume.matchedKeywords);
  }
  if (resume.unmatchedKeywords?.length > 0) {
    allKeywords.push(...resume.unmatchedKeywords);
  }

  // Return unique keywords
  return [...new Set(allKeywords)];
}

/**
 * Extract keywords from text based on a list of keywords
 * @param text - The text to search in (can be string or array of strings)
 * @param keywords - Array of keywords to search for
 * @returns Array of keywords found in the text
 */
export function getKeywordsFromText(
  text: string | string[] | undefined,
  keywords: string[]
): string[] {
  if (!text || !keywords || keywords.length === 0) return [];

  // Convert text to string if it's an array
  const textStr = Array.isArray(text) ? text.join(' ') : text;

  return keywords.filter(keyword => hasKeyword(textStr, keyword));
}