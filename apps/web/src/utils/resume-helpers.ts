import { Resume } from "@/types/resume";
import { getKeywordsFromText as getKeywordsFromTextHelper, getAllResumeKeywords } from "@/lib/utils/resume-keywords";

/**
 * Get keywords from text based on resume keywords
 */
export const getKeywordsFromText = (
  text: string | string[] | undefined,
  resume: Resume,
  showATSFeatures: boolean
) => {
  if (!showATSFeatures || !text) return [];

  const allKeywords = getAllResumeKeywords(resume);
  if (allKeywords.length === 0) return [];

  return getKeywordsFromTextHelper(text, allKeywords);
};

/**
 * Get badge styling based on keyword highlighting
 */
export const getKeywordBadgeClassName = (
  keyword: string,
  highlightedKeywords: Set<string>,
  allKeywordsForHighlight: Set<string>
) => {
  if (highlightedKeywords.has(keyword)) {
    return "bg-blue-500 text-white border-blue-600";
  } else if (
    allKeywordsForHighlight.size > 0 &&
    allKeywordsForHighlight.has(keyword)
  ) {
    return "bg-orange-100 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400 border-orange-200/60 dark:border-orange-900/60";
  } else {
    return "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 border-green-200/60 dark:border-green-900/60";
  }
};

/**
 * Determine if a keyword should be shown
 */
export const shouldShowKeyword = (
  keyword: string,
  highlightedKeywords: Set<string>,
  allKeywordsForHighlight: Set<string>
) => {
  if (highlightedKeywords.has(keyword)) return true;
  if (allKeywordsForHighlight.size > 0) return true;
  return false;
};

/**
 * Get available keywords for skills (not already in skills)
 */
export const getAvailableSkillKeywords = (
  currentSkills: string[],
  resume: Resume
) => {
  const skillsLower = currentSkills.map((s) => s.toLowerCase());
  const allKeywords = [
    ...(resume.keywords || []),
    ...(resume.matchedKeywords || []),
    ...(resume.unmatchedKeywords || []),
  ].filter((k, i, arr) => arr.indexOf(k) === i);

  return allKeywords.filter(
    (keyword) => !skillsLower.includes(keyword.toLowerCase())
  );
};

/**
 * Separate matched and unmatched available keywords
 */
export const getFilteredSkillKeywords = (
  availableKeywords: string[],
  search: string,
  matchedKeywords: string[] = []
) => {
  const matched = availableKeywords.filter((k) =>
    matchedKeywords.includes(k)
  );
  const unmatched = availableKeywords.filter(
    (k) => !matchedKeywords.includes(k)
  );

  const searchLower = search.toLowerCase();
  if (!searchLower) return { matched, unmatched };

  return {
    matched: matched.filter((k) => k.toLowerCase().includes(searchLower)),
    unmatched: unmatched.filter((k) => k.toLowerCase().includes(searchLower)),
  };
};