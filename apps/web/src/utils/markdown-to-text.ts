import removeMd from 'remove-markdown';

/**
 * Strips markdown formatting from text and returns plain text
 */
export function stripMarkdown(markdown: string): string {
  if (!markdown) return '';
  
  // Use remove-markdown library for comprehensive markdown stripping
  return removeMd(markdown).trim();
}

/**
 * Converts Q&A to plain text format for copying
 */
export function formatQAForCopy(question: string, answer: string): string {
  const plainQuestion = stripMarkdown(question);
  const plainAnswer = stripMarkdown(answer);
  
  return `Q: ${plainQuestion}\n\nA: ${plainAnswer}`;
}