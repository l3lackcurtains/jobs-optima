import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { KEYWORD_EXTRACTION_APIS } from './keywords.constants';

export interface Keywords {
  actionVerbs: string[];
  hardSkills: string[];
  softSkills: string[];
  knowledge?: string[];
}

@Injectable()
export class KeywordsExtractorService {
  private readonly logger = new Logger(KeywordsExtractorService.name);
  private readonly resumeUpApiUrl: string = KEYWORD_EXTRACTION_APIS.RESUMEUP;
  private readonly huntrApiUrl: string = KEYWORD_EXTRACTION_APIS.HUNTR;

  constructor() {}

  async extractKeywords(description: string): Promise<Keywords> {
    try {
      // Run both API calls twice with 3-second delay to get more comprehensive results
      this.logger.log('Starting keyword extraction - Run 1');
      const [resumeUpRun1, huntrRun1] = await Promise.all([
        this.extractFromResumeUp(description),
        this.extractFromHuntr(description),
      ]);

      // Wait 3 seconds before second run
      await new Promise((resolve) => setTimeout(resolve, 3000));

      this.logger.log('Starting keyword extraction - Run 2');
      const [resumeUpRun2, huntrRun2] = await Promise.all([
        this.extractFromResumeUp(description),
        this.extractFromHuntr(description),
      ]);

      // Aggregate and deduplicate results
      const result = {
        actionVerbs: this.filterByOccurrenceAndLimit(
          [...resumeUpRun1.actionVerbs, ...resumeUpRun2.actionVerbs],
          8,
        ),
        hardSkills: this.deduplicateArray([
          ...huntrRun1.hardSkills,
          ...huntrRun2.hardSkills,
        ]),
        softSkills: this.deduplicateArray([
          ...huntrRun1.softSkills,
          ...huntrRun2.softSkills,
        ]),
        knowledge: this.deduplicateArray([
          ...(huntrRun1.knowledge || []),
          ...(huntrRun2.knowledge || []),
        ]),
      };

      this.logger.log(
        `Extracted keywords - ActionVerbs: ${result.actionVerbs.length} (top 8 most frequent), HardSkills: ${result.hardSkills.length}, SoftSkills: ${result.softSkills.length}, Knowledge: ${result.knowledge.length}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to extract keywords: ${(error as Error).message}`,
      );

      // Return empty keywords on error
      return {
        actionVerbs: [],
        hardSkills: [],
        softSkills: [],
        knowledge: [],
      };
    }
  }

  /**
   * Helper function to deduplicate array of strings (case-insensitive)
   */
  private deduplicateArray(arr: string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];

    for (const item of arr) {
      const normalizedItem = item.toLowerCase().trim();
      if (!seen.has(normalizedItem) && item.trim()) {
        seen.add(normalizedItem);
        result.push(item.trim());
      }
    }

    return result;
  }

  /**
   * Helper function to filter keywords by occurrence count and limit
   * @param keywords - Array of keywords (may contain duplicates)
   * @param limit - Maximum number of keywords to return
   * @returns Array of top keywords sorted by frequency
   */
  private filterByOccurrenceAndLimit(
    keywords: string[],
    limit: number,
  ): string[] {
    // Count occurrences (case-insensitive)
    const occurrenceCounts = new Map<string, number>();
    const originalCasing = new Map<string, string>();

    keywords.forEach((keyword) => {
      const normalizedKeyword = keyword.toLowerCase().trim();
      if (normalizedKeyword) {
        // Track occurrence count
        occurrenceCounts.set(
          normalizedKeyword,
          (occurrenceCounts.get(normalizedKeyword) || 0) + 1,
        );
        // Store first occurrence's original casing
        if (!originalCasing.has(normalizedKeyword)) {
          originalCasing.set(normalizedKeyword, keyword.trim());
        }
      }
    });

    // Sort by occurrence count (descending) and take top N
    return Array.from(occurrenceCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([keyword]) => originalCasing.get(keyword) || keyword);
  }

  private async extractFromResumeUp(description: string): Promise<{
    actionVerbs: string[];
    hardSkills: string[];
    softSkills: string[];
  }> {
    try {
      if (!this.resumeUpApiUrl) {
        this.logger.warn('ResumeUp API unreachable, returning empty keywords');
        return {
          actionVerbs: [],
          hardSkills: [],
          softSkills: [],
        };
      }

      const response = await axios.post(
        this.resumeUpApiUrl,
        { description },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 seconds timeout
        },
      );

      interface ApiResponse {
        success?: boolean;
        data?: { data?: string };
      }

      const responseData = response.data as ApiResponse;
      if (!responseData?.success || !responseData?.data?.data) {
        this.logger.error('Invalid response from RESUMEUP API');
        return {
          actionVerbs: [],
          hardSkills: [],
          softSkills: [],
        };
      }

      // Parse the nested JSON string response - data.data is guaranteed to exist here
      const dataString: string = responseData.data.data;

      // Remove any newline characters and parse the JSON
      const cleanedData = dataString.replace(/\\n/g, '').replace(/\n/g, '');

      interface ParsedKeywords {
        action_verbs?: string[];
        hard_tech_skills?: string[];
        soft_skills?: string[];
      }

      const keywords = JSON.parse(cleanedData) as ParsedKeywords;

      // Return only action verbs from RESUMEUP API
      return {
        actionVerbs: keywords.action_verbs || [],
        hardSkills: [], // Not using hard skills from RESUMEUP
        softSkills: [], // Not using soft skills from RESUMEUP
      };
    } catch (error) {
      this.logger.error(
        `Failed to extract from RESUMEUP API: ${(error as Error).message}`,
      );
      return {
        actionVerbs: [],
        hardSkills: [],
        softSkills: [],
      };
    }
  }

  private async extractFromHuntr(
    description: string,
    retryCount = 0,
  ): Promise<{
    hardSkills: string[];
    softSkills: string[];
    knowledge: string[];
  }> {
    try {
      if (!this.huntrApiUrl) {
        this.logger.warn('Huntr API unreachable, returning empty keywords');
        return {
          hardSkills: [],
          softSkills: [],
          knowledge: [],
        };
      }

      const response = await axios.post(
        this.huntrApiUrl,
        { jobDescription: description },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 seconds timeout
        },
      );

      interface HuntrKeyword {
        type:
          | 'TECH_TOOL'
          | 'SOFT_SKILL'
          | 'HARD_SKILL'
          | 'KNOWLEDGE'
          | 'INDUSTRY';
        keyword: string;
      }

      const huntrKeywords = response.data as HuntrKeyword[];

      if (!Array.isArray(huntrKeywords)) {
        this.logger.error('Invalid response from HUNTR API');
        return {
          hardSkills: [],
          softSkills: [],
          knowledge: [],
        };
      }

      // Map HUNTR keywords to our categories
      const hardSkills: string[] = [];
      const softSkills: string[] = [];
      const knowledge: string[] = [];

      huntrKeywords.forEach((item) => {
        switch (item.type) {
          case 'HARD_SKILL':
          case 'TECH_TOOL':
            hardSkills.push(item.keyword);
            break;
          case 'SOFT_SKILL':
            softSkills.push(item.keyword);
            break;
          case 'KNOWLEDGE':
          case 'INDUSTRY':
            knowledge.push(item.keyword);
            break;
        }
      });

      return {
        hardSkills,
        softSkills,
        knowledge,
      };
    } catch (error) {
      // Handle 429 rate limit error with retry
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 429 && retryCount < 1) {
        this.logger.warn(
          'HUNTR API rate limited (429), retrying after 12 seconds...',
        );
        await new Promise((resolve) => setTimeout(resolve, 12000)); // Wait 12 seconds
        return this.extractFromHuntr(description, retryCount + 1);
      }

      this.logger.error(
        `Failed to extract from HUNTR API: ${(error as Error).message}`,
      );
      return {
        hardSkills: [],
        softSkills: [],
        knowledge: [],
      };
    }
  }

  /**
   * Get all keywords as a flat array (for backward compatibility)
   */
  getAllKeywordsFlat(keywords: Keywords): string[] {
    return [
      ...keywords.actionVerbs,
      ...keywords.hardSkills,
      ...keywords.softSkills,
      ...(keywords.knowledge || []),
    ];
  }

  /**
   * Calculate matched keywords between resume text and job keywords
   */
  calculateMatchedKeywords(
    resumeText: string,
    keywords: Keywords,
  ): {
    matched: Keywords;
    unmatched: Keywords;
    matchPercentage: number;
  } {
    const lowerResumeText = resumeText.toLowerCase();

    const matched: Keywords = {
      actionVerbs: [],
      hardSkills: [],
      softSkills: [],
      knowledge: [],
    };

    const unmatched: Keywords = {
      actionVerbs: [],
      hardSkills: [],
      softSkills: [],
      knowledge: [],
    };

    // Check action verbs with exact matching
    keywords.actionVerbs.forEach((verb) => {
      if (this.hasExactMatch(lowerResumeText, verb)) {
        matched.actionVerbs.push(verb);
      } else {
        unmatched.actionVerbs.push(verb);
      }
    });

    // Check hard tech skills with exact matching
    keywords.hardSkills.forEach((skill) => {
      if (this.hasExactMatch(lowerResumeText, skill)) {
        matched.hardSkills.push(skill);
      } else {
        unmatched.hardSkills.push(skill);
      }
    });

    // Check soft skills with exact matching
    keywords.softSkills.forEach((skill) => {
      if (this.hasExactMatch(lowerResumeText, skill)) {
        matched.softSkills.push(skill);
      } else {
        unmatched.softSkills.push(skill);
      }
    });

    // Check knowledge with exact matching
    if (keywords.knowledge) {
      keywords.knowledge.forEach((item) => {
        if (this.hasExactMatch(lowerResumeText, item)) {
          matched.knowledge!.push(item);
        } else {
          unmatched.knowledge!.push(item);
        }
      });
    }

    // Calculate match percentage
    const totalKeywords = this.getAllKeywordsFlat(keywords).length;
    const matchedKeywords = this.getAllKeywordsFlat(matched).length;
    const matchPercentage =
      totalKeywords > 0
        ? Math.round((matchedKeywords / totalKeywords) * 100)
        : 0;

    return {
      matched,
      unmatched,
      matchPercentage,
    };
  }

  /**
   * Calculate ATS score based on keyword presence and distribution
   */
  calculateATSScore(resumeText: string, keywords: Keywords): number {
    const { matchPercentage } = this.calculateMatchedKeywords(
      resumeText,
      keywords,
    );

    // ATS score factors:
    // - Keyword match percentage (70% weight)
    // - Keyword distribution across sections (30% weight)

    const sections = ['experience', 'skills', 'projects', 'education'];
    let sectionMatches = 0;

    sections.forEach((section) => {
      if (resumeText.toLowerCase().includes(section.toLowerCase())) {
        // Check if keywords appear in this section context using exact matching
        const allKeywords = this.getAllKeywordsFlat(keywords);
        const hasKeywordsInSection = allKeywords.some((keyword) =>
          this.hasExactMatch(resumeText, keyword),
        );
        if (hasKeywordsInSection) sectionMatches++;
      }
    });

    const distributionScore = (sectionMatches / sections.length) * 100;
    const atsScore = Math.round(
      matchPercentage * 0.7 + distributionScore * 0.3,
    );

    return Math.min(100, Math.max(0, atsScore));
  }

  /**
   * Calculate keyword score based on matched vs unmatched keywords
   * This is now directly consistent with matched/unmatched keywords
   */
  calculateKeywordScore(resumeText: string, keywords: Keywords): number {
    const { matchPercentage } = this.calculateMatchedKeywords(
      resumeText,
      keywords,
    );

    // Keyword score IS the match percentage
    // This ensures 100% consistency with matched/unmatched keywords
    // If 80% of keywords are matched, keyword score is 80
    return matchPercentage;
  }

  /**
   * Calculate all scores at once to avoid redundant calculations
   * This is the most efficient way to get all scoring metrics
   */
  calculateAllScores(
    resumeText: string,
    keywords: Keywords,
  ): {
    atsScore: number;
    keywordScore: number;
    matchPercentage: number;
    matched: Keywords;
    unmatched: Keywords;
  } {
    // Calculate matched keywords ONCE
    const { matched, unmatched, matchPercentage } =
      this.calculateMatchedKeywords(resumeText, keywords);

    // Calculate ATS score with distribution factor
    const sections = ['experience', 'skills', 'projects', 'education'];
    let sectionMatches = 0;

    sections.forEach((section) => {
      if (resumeText.toLowerCase().includes(section.toLowerCase())) {
        const allKeywords = this.getAllKeywordsFlat(keywords);
        const hasKeywordsInSection = allKeywords.some((keyword) =>
          this.hasExactMatch(resumeText, keyword),
        );
        if (hasKeywordsInSection) sectionMatches++;
      }
    });

    const distributionScore = (sectionMatches / sections.length) * 100;
    const atsScore = Math.round(
      matchPercentage * 0.7 + distributionScore * 0.3,
    );

    // Keyword score is the match percentage
    const keywordScore = matchPercentage;

    return {
      atsScore: Math.min(100, Math.max(0, atsScore)),
      keywordScore,
      matchPercentage,
      matched,
      unmatched,
    };
  }

  /**
   * Helper function to check exact keyword match (case-insensitive)
   * @param text - The text to search in
   * @param keyword - The keyword to search for
   * @returns boolean indicating if the keyword was found
   */
  private hasExactMatch(text: string, keyword: string): boolean {
    const lowerText = text.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();

    // Escape special regex characters in the keyword
    const escapedKeyword = lowerKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // For keywords with special characters (like C++, C#, .NET), we need custom boundary logic
    // Check if keyword starts/ends with word characters
    const startsWithWord = /^\w/.test(keyword);
    const endsWithWord = /\w$/.test(keyword);

    // Build regex pattern with appropriate boundaries
    let pattern = '';
    if (startsWithWord) {
      pattern = `(^|\\W)${escapedKeyword}`;
    } else {
      pattern = escapedKeyword;
    }

    if (endsWithWord) {
      pattern = pattern + '($|\\W)';
    }

    const regex = new RegExp(pattern, 'i');
    return regex.test(lowerText);
  }
}
