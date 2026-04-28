/**
 * Truncates a string in the middle, keeping the start and end visible
 * @param str - The string to truncate
 * @param maxLength - Maximum length of the resulting string
 * @param startChars - Number of characters to keep at the start (optional)
 * @param endChars - Number of characters to keep at the end (optional)
 * @returns The truncated string with "..." in the middle
 */
export function truncateMiddle(
  str: string,
  maxLength: number = 30,
  startChars?: number,
  endChars?: number
): string {
  if (!str || str.length <= maxLength) {
    return str;
  }

  // Default to roughly equal distribution if not specified
  const ellipsis = '...';
  const availableChars = maxLength - ellipsis.length;
  
  const start = startChars ?? Math.ceil(availableChars / 2);
  const end = endChars ?? Math.floor(availableChars / 2);

  return str.slice(0, start) + ellipsis + str.slice(-end);
}

/**
 * Specially formatted truncation for resume names
 * Keeps the person's name and "Resume" visible, truncates the middle
 * @param fullName - The full resume name
 * @param maxLength - Maximum length
 * @returns Truncated resume name
 */
export function truncateResumeName(fullName: string, maxLength: number = 35): string {
  if (!fullName || fullName.length <= maxLength) {
    return fullName;
  }

  // Try to identify key parts
  const lowerName = fullName.toLowerCase();
  const resumeIndex = lowerName.lastIndexOf('resume');
  
  if (resumeIndex === -1) {
    // No "Resume" word found, just truncate in middle
    return truncateMiddle(fullName, maxLength);
  }

  // Extract the ending part (including "Resume")
  const ending = fullName.slice(resumeIndex);
  const beginning = fullName.slice(0, resumeIndex).trim();
  
  // Calculate how much space we have for the beginning
  const ellipsis = '...';
  const availableForBeginning = maxLength - ending.length - ellipsis.length;
  
  if (availableForBeginning <= 0) {
    // Not enough space, just truncate normally
    return truncateMiddle(fullName, maxLength);
  }

  // Try to keep the person's name (usually the first part)
  const parts = beginning.split(/['-]/);
  const personName = parts[0] || '';
  
  if (personName.length <= availableForBeginning) {
    // We can fit the whole person's name
    if (beginning.length <= availableForBeginning) {
      // Everything fits
      return fullName;
    } else {
      // Truncate the middle part
      return personName + ellipsis + ending;
    }
  } else {
    // Even the person's name is too long, truncate it
    return personName.slice(0, availableForBeginning) + ellipsis + ending;
  }
}