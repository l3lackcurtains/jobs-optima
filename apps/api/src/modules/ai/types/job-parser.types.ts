import { z } from 'zod';

export const JobParserSchema = z.object({
  title: z.string().min(1).describe('Job title extracted from the posting'),
  company: z.string().min(1).describe('Company name or "N/A" if not found'),
  description: z.string().min(1).describe('Cleaned, formatted job description'),
  location: z
    .string()
    .nullable()
    .describe(
      'Clean location under 20 chars, "N/A" if complex, or null if not found',
    ),
  salaryMin: z
    .number()
    .nullable()
    .describe('Minimum salary as integer or null'),
  salaryMax: z
    .number()
    .nullable()
    .describe('Maximum salary as integer or null'),
  salaryPeriod: z
    .enum(['yearly', 'hourly', 'monthly'])
    .nullable()
    .describe('Salary period or null'),
  workMode: z
    .enum(['remote', 'hybrid', 'onsite'])
    .nullable()
    .describe('Work arrangement or null'),
  jobType: z
    .enum([
      'full-time',
      'part-time',
      'contract',
      'internship',
      'freelance',
      'temporary',
    ])
    .nullable()
    .describe('Employment type or null'),
  category: z
    .enum([
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
    ])
    .describe('Technical category based on skills analysis'),
  industry: z
    .string()
    .nullable()
    .describe('Business domain like "FinTech", "HealthTech", "SaaS" or null'),
  summary: z
    .string()
    .nullable()
    .describe(
      'Exactly 4 complete sentences (90-140 words) covering responsibilities, requirements, preferred skills, and culture/benefits',
    ),
  mustHaveSkills: z
    .array(z.string())
    .describe(
      'Array of max 5 required technical skills from requirements sections',
    ),
  niceToHaveSkills: z
    .array(z.string())
    .describe(
      'Array of max 5 preferred technical skills from preferred sections',
    ),
});

export type JobParserResult = z.infer<typeof JobParserSchema>;
