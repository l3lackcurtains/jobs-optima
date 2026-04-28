/**
 * Weighted Keyword Scoring System
 * 
 * Priority levels for different keyword categories:
 * 1. Hard Skills (Technical Skills) - 40% weight - Most important for ATS
 * 2. Action Verbs - 25% weight - Critical for demonstrating achievements
 * 3. Knowledge Areas - 20% weight - Domain expertise indicators
 * 4. Soft Skills - 15% weight - Important but less weighted for technical roles
 */

export interface KeywordCategoryWeights {
  hardSkills: number;
  actionVerbs: number;
  knowledge: number;
  softSkills: number;
}

export interface KeywordCategoryScores {
  hardSkills: { matched: number; total: number; score: number };
  actionVerbs: { matched: number; total: number; score: number };
  knowledge: { matched: number; total: number; score: number };
  softSkills: { matched: number; total: number; score: number };
  overall: number;
}

// Default weights for different resume types
// Priority order: Hard Skills > Soft Skills > Knowledge > Action Verbs
export const DEFAULT_WEIGHTS: KeywordCategoryWeights = {
  hardSkills: 0.40,   // 40% - Technical skills are most important
  softSkills: 0.25,   // 25% - Soft skills (communication, leadership, teamwork)
  knowledge: 0.25,    // 25% - Domain knowledge and industry terms
  actionVerbs: 0.10   // 10% - Action verbs are least important
};

// Weights for different job categories
// Following priority: Hard Skills > Soft Skills > Knowledge > Action Verbs
export const CATEGORY_WEIGHTS: Record<string, KeywordCategoryWeights> = {
  'Frontend': {
    hardSkills: 0.45,   // Frameworks, libraries, tools (highest)
    softSkills: 0.20,   // Collaboration, UI/UX sense
    knowledge: 0.25,    // Web standards, practices
    actionVerbs: 0.10   // Least important
  },
  'Backend': {
    hardSkills: 0.45,   // Languages, databases, frameworks
    softSkills: 0.15,   // Less client interaction
    knowledge: 0.30,    // System design, architecture
    actionVerbs: 0.10
  },
  'FullStack': {
    hardSkills: 0.40,
    softSkills: 0.25,   // Need to work across teams
    knowledge: 0.25,
    actionVerbs: 0.10
  },
  'AI/ML': {
    hardSkills: 0.35,   // Frameworks, tools
    softSkills: 0.15,   // Research collaboration
    knowledge: 0.40,    // Algorithms, theory critical
    actionVerbs: 0.10
  },
  'DevOps': {
    hardSkills: 0.40,   // Tools, platforms
    softSkills: 0.20,   // Cross-team collaboration
    knowledge: 0.30,    // Practices, methodologies
    actionVerbs: 0.10
  },
  'Mobile': {
    hardSkills: 0.45,   // Platforms, frameworks
    softSkills: 0.25,   // User experience focus
    knowledge: 0.20,
    actionVerbs: 0.10
  },
  'DataEngineering': {
    hardSkills: 0.40,   // Tools, databases
    softSkills: 0.15,
    knowledge: 0.35,    // Data concepts, architectures
    actionVerbs: 0.10
  },
  'Security': {
    hardSkills: 0.35,   // Tools, technologies
    softSkills: 0.20,   // Communication of risks
    knowledge: 0.35,    // Security concepts, compliance
    actionVerbs: 0.10
  },
  'Management': {
    hardSkills: 0.20,   // Less technical
    softSkills: 0.40,   // Critical for management (highest)
    knowledge: 0.25,    // Business domain
    actionVerbs: 0.15   // Leadership actions
  },
  'General': DEFAULT_WEIGHTS,
  'default': DEFAULT_WEIGHTS
};

/**
 * Calculate weighted ATS score - focuses on technical match and ATS parsability
 * ATS Score prioritizes: Hard Skills > Knowledge > Format/Structure
 */
export function calculateWeightedATSScore(
  matchedKeywordsByCategory?: {
    actionVerbs?: string[];
    hardSkills?: string[];
    softSkills?: string[];
    knowledge?: string[];
  },
  unmatchedKeywordsByCategory?: {
    actionVerbs?: string[];
    hardSkills?: string[];
    softSkills?: string[];
    knowledge?: string[];
  },
  category: string = 'General'
): KeywordCategoryScores {
  // Get weights for the specific category
  const weights = CATEGORY_WEIGHTS[category] || DEFAULT_WEIGHTS;

  // Calculate scores for each category
  const calculateCategoryScore = (
    matched: string[] = [],
    unmatched: string[] = []
  ): { matched: number; total: number; score: number } => {
    const matchedCount = matched.length;
    const total = matchedCount + unmatched.length;
    
    if (total === 0) return { matched: 0, total: 0, score: 0 };
    
    const score = (matchedCount / total) * 100;
    return { matched: matchedCount, total, score };
  };

  const scores: KeywordCategoryScores = {
    hardSkills: calculateCategoryScore(
      matchedKeywordsByCategory?.hardSkills,
      unmatchedKeywordsByCategory?.hardSkills
    ),
    actionVerbs: calculateCategoryScore(
      matchedKeywordsByCategory?.actionVerbs,
      unmatchedKeywordsByCategory?.actionVerbs
    ),
    knowledge: calculateCategoryScore(
      matchedKeywordsByCategory?.knowledge,
      unmatchedKeywordsByCategory?.knowledge
    ),
    softSkills: calculateCategoryScore(
      matchedKeywordsByCategory?.softSkills,
      unmatchedKeywordsByCategory?.softSkills
    ),
    overall: 0
  };

  // Calculate weighted overall score for ATS
  let weightedSum = 0;
  let totalWeight = 0;

  if (scores.hardSkills.total > 0) {
    weightedSum += scores.hardSkills.score * weights.hardSkills;
    totalWeight += weights.hardSkills;
  }
  
  if (scores.actionVerbs.total > 0) {
    weightedSum += scores.actionVerbs.score * weights.actionVerbs;
    totalWeight += weights.actionVerbs;
  }
  
  if (scores.knowledge.total > 0) {
    weightedSum += scores.knowledge.score * weights.knowledge;
    totalWeight += weights.knowledge;
  }
  
  if (scores.softSkills.total > 0) {
    weightedSum += scores.softSkills.score * weights.softSkills;
    totalWeight += weights.softSkills;
  }

  // Normalize the score if not all categories have keywords
  scores.overall = totalWeight > 0 ? weightedSum / totalWeight : 0;

  return scores;
}

/**
 * Calculate keyword match score - simple percentage calculation
 * Keyword Score = (Total Matched Keywords / Total Keywords) × 100
 * No weighting, just a straightforward match percentage
 */
export function calculateKeywordMatchScore(
  matchedKeywordsByCategory?: {
    actionVerbs?: string[];
    hardSkills?: string[];
    softSkills?: string[];
    knowledge?: string[];
  },
  unmatchedKeywordsByCategory?: {
    actionVerbs?: string[];
    hardSkills?: string[];
    softSkills?: string[];
    knowledge?: string[];
  },
  category: string = 'General'
): number {
  let totalMatched = 0;
  let totalKeywords = 0;

  // Simply count all matched and unmatched keywords
  const categories: (keyof typeof matchedKeywordsByCategory)[] = ['hardSkills', 'actionVerbs', 'knowledge', 'softSkills'];
  
  categories.forEach(cat => {
    const matched = matchedKeywordsByCategory?.[cat]?.length || 0;
    const unmatched = unmatchedKeywordsByCategory?.[cat]?.length || 0;
    
    totalMatched += matched;
    totalKeywords += matched + unmatched;
  });

  // If no keywords at all, return 0
  if (totalKeywords === 0) return 0;

  // Simple percentage calculation: matched / total × 100
  return (totalMatched / totalKeywords) * 100;
}

/**
 * Get keyword importance level based on category and weights
 */
export function getKeywordImportance(
  category: 'hardSkills' | 'actionVerbs' | 'knowledge' | 'softSkills',
  jobCategory: string = 'General'
): 'critical' | 'high' | 'medium' | 'low' {
  const weights = CATEGORY_WEIGHTS[jobCategory] || DEFAULT_WEIGHTS;
  const weight = weights[category];

  if (weight >= 0.35) return 'critical';
  if (weight >= 0.25) return 'high';
  if (weight >= 0.15) return 'medium';
  return 'low';
}

/**
 * Get recommended keyword targets for each category
 */
export function getKeywordTargets(jobCategory: string = 'General'): Record<string, number> {
  const weights = CATEGORY_WEIGHTS[jobCategory] || DEFAULT_WEIGHTS;
  
  return {
    hardSkills: Math.round(weights.hardSkills * 20),   // e.g., 40% * 20 = 8 keywords
    actionVerbs: Math.round(weights.actionVerbs * 20),  // e.g., 25% * 20 = 5 keywords
    knowledge: Math.round(weights.knowledge * 20),      // e.g., 20% * 20 = 4 keywords
    softSkills: Math.round(weights.softSkills * 20)     // e.g., 15% * 20 = 3 keywords
  };
}

/**
 * Format score with color coding based on thresholds
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
  if (score >= 40) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}

/**
 * Get score badge variant
 */
export function getScoreBadgeVariant(score: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (score >= 80) return 'default';
  if (score >= 60) return 'secondary';
  if (score >= 40) return 'outline';
  return 'destructive';
}

/**
 * Calculate keyword density score with penalties for over-optimization
 */
export function calculateKeywordDensityScore(
  keywordCount: number,
  totalWords: number,
  optimalDensity: number = 2.5 // 2.5% is generally optimal
): number {
  if (totalWords === 0) return 0;
  
  const density = (keywordCount / totalWords) * 100;
  
  // Perfect density gets 100 score
  if (density === optimalDensity) return 100;
  
  // Under-optimized (penalty is less severe)
  if (density < optimalDensity) {
    return Math.max(0, 100 - (optimalDensity - density) * 20);
  }
  
  // Over-optimized (penalty is more severe to avoid keyword stuffing)
  return Math.max(0, 100 - (density - optimalDensity) * 30);
}

/**
 * Get improvement suggestions based on scores
 */
export function getImprovementSuggestions(scores: KeywordCategoryScores): string[] {
  const suggestions: string[] = [];
  
  if (scores.hardSkills.score < 60) {
    suggestions.push('Add more technical skills and tools mentioned in the job description');
  }
  
  if (scores.actionVerbs.score < 50) {
    suggestions.push('Use stronger action verbs to describe your achievements');
  }
  
  if (scores.knowledge.score < 50) {
    suggestions.push('Include more domain-specific knowledge and expertise areas');
  }
  
  if (scores.softSkills.score < 40) {
    suggestions.push('Highlight relevant soft skills like leadership and communication');
  }
  
  if (scores.overall < 70) {
    suggestions.push('Overall keyword match is low - review job requirements carefully');
  }
  
  return suggestions;
}