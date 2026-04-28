import { Injectable } from '@nestjs/common';
import { AiService } from '@modules/ai/ai.service';

export interface ParsedJobData {
  title: string;
  company: string;
  location?: string;
  description: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryPeriod?: string;
  category?: string;
  summary?: string;
  industry?: string;
  mustHaveSkills?: string[];
  niceToHaveSkills?: string[];
  workMode?: 'remote' | 'hybrid' | 'onsite';
  jobType?:
    | 'full-time'
    | 'part-time'
    | 'contract'
    | 'internship'
    | 'freelance'
    | 'temporary';
}

@Injectable()
export class JobParserService {
  constructor(private aiService: AiService) {}

  async parseJobDescription(
    description: string,
    userId: string,
    url?: string,
  ): Promise<ParsedJobData> {
    try {
      const result = await this.aiService.parseJobDescription(
        description,
        userId,
        url,
      );
      return this.validateAndCleanData(result);
    } catch (error) {
      return this.extractBasicInfo(description);
    }
  }

  private extractBasicInfo(description: string): ParsedJobData {
    const lines = description.split('\n').filter((line) => line.trim());
    const descLower = description.toLowerCase();

    const title =
      lines
        .find(
          (line) =>
            line.includes('Engineer') ||
            line.includes('Developer') ||
            line.includes('Manager') ||
            line.includes('Designer'),
        )
        ?.trim() || 'Software Engineer';

    const company =
      lines
        .find(
          (line) =>
            line.toLowerCase().includes('company:') ||
            line.toLowerCase().includes('about'),
        )
        ?.replace(/.*(?:company:|about)\s*/i, '')
        .trim() || 'Unknown Company';

    let location: string | undefined;
    const locationMatch = description.match(/(?:location|remote|hybrid)/i);
    if (locationMatch) {
      if (descLower.includes('remote')) location = 'Remote';
      else if (descLower.includes('hybrid')) location = 'Hybrid';
      else location = 'N/A';
    }

    const category = this.getBasicCategory(descLower);

    return {
      title,
      company,
      location,
      description: description.trim(),
      category,
      mustHaveSkills: [],
      niceToHaveSkills: [],
    };
  }

  private getBasicCategory(descLower: string): string {
    if (descLower.includes('react') || descLower.includes('frontend'))
      return 'Frontend';
    if (descLower.includes('backend') || descLower.includes('api'))
      return 'Backend';
    if (descLower.includes('fullstack') || descLower.includes('full stack'))
      return 'FullStack';
    if (
      descLower.includes('mobile') ||
      descLower.includes('ios') ||
      descLower.includes('android')
    )
      return 'Mobile';
    if (descLower.includes('devops') || descLower.includes('cloud'))
      return 'DevOps';
    if (descLower.includes('ai') || descLower.includes('machine learning'))
      return 'AI/ML';
    return 'General';
  }

  private validateAndCleanData(data: any): ParsedJobData {
    const validCategories = [
      'Frontend',
      'Backend',
      'FullStack',
      'AI/ML',
      'Blockchain',
      'DevOps',
      'Mobile',
      'DataEngineering',
      'Security',
      'General',
    ];
    const validSalaryPeriods = ['hourly', 'yearly', 'monthly'];
    const validWorkModes = ['remote', 'hybrid', 'onsite'];

    return {
      title: data.title?.trim() || 'Software Engineer',
      company: data.company?.trim() || 'Unknown Company',
      description: data.description?.trim() || '',
      summary: data.summary?.trim() || undefined,
      industry: data.industry?.trim() || undefined,
      location: data.location?.trim() || undefined,
      salaryMin:
        data.salaryMin && !isNaN(data.salaryMin)
          ? Number(data.salaryMin)
          : undefined,
      salaryMax:
        data.salaryMax && !isNaN(data.salaryMax)
          ? Number(data.salaryMax)
          : undefined,
      salaryPeriod: validSalaryPeriods.includes(data.salaryPeriod)
        ? data.salaryPeriod
        : undefined,
      workMode: validWorkModes.includes(data.workMode)
        ? data.workMode
        : undefined,
      jobType: data.jobType || undefined,
      category: validCategories.includes(data.category)
        ? data.category
        : 'General',
      mustHaveSkills: Array.isArray(data.mustHaveSkills)
        ? data.mustHaveSkills.slice(0, 5)
        : [],
      niceToHaveSkills: Array.isArray(data.niceToHaveSkills)
        ? data.niceToHaveSkills.slice(0, 5)
        : [],
    };
  }

  async extractFromUrl(url: string): Promise<string | null> {
    return null;
  }
}
