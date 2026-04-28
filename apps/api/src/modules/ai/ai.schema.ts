import { z } from 'zod';

/**
 * Schema for contact information
 */
const ContactInfoSchema = z.object({
  name: z.string(),
  location: z.string(),
  email: z.string(),
  phone: z.string(),
  linkedin: z.string().nullable().optional(),
  github: z.string().nullable().optional(),
  personalWebsite: z.string().nullable().optional(),
});

/**
 * Schema for experience entry
 */
const ExperienceSchema = z.object({
  title: z.string(),
  company: z.string(),
  location: z.string(),
  dates: z.string(),
  responsibilities: z.array(z.string()),
});

/**
 * Schema for project entry
 */
const ProjectSchema = z.object({
  name: z.string(),
  technologies: z.string(),
  description: z.string(),
});

/**
 * Schema for education entry
 */
const EducationSchema = z.object({
  institution: z.string(),
  location: z.string(),
  dates: z.string(),
  degree: z.string(),
  achievements: z.array(z.string()).optional(),
});

/**
 * Schema for skills section
 */
const SkillsSchema = z.object({
  technicalSkills: z.array(z.string()),
  developmentPracticesMethodologies: z.array(z.string()),
  personalSkills: z.array(z.string()),
});

/**
 * Schema for complete resume data
 */
const ResumeSchema = z.object({
  contactInfo: ContactInfoSchema,
  experience: z.array(ExperienceSchema),
  projects: z.array(ProjectSchema),
  education: z.array(EducationSchema),
  skills: SkillsSchema,
});

/**
 * Schema for resume optimization result
 */
export const OptimizationResultSchema = z.object({
  resume: ResumeSchema,
});

/**
 * Schema for skill suggestions (single array)
 */
export const SkillSuggestionsSchema = z.object({
  suggestions: z.array(z.string()).describe('Optimized skill set'),
});

/**
 * Schema for content optimization suggestions (5 variations)
 */
export const ContentSuggestionsSchema = z.object({
  suggestions: z
    .array(z.string())
    .length(5)
    .describe('Five optimized versions of the content'),
});

/**
 * Schema for base skill optimization suggestions (5 variations)
 */
export const BaseSkillSuggestionsSchema = z.object({
  suggestions: z
    .array(z.string())
    .length(5)
    .describe('Five optimized skill sets'),
});

/**
 * Schema for cover letter variations
 */
export const CoverLetterSchema = z.object({
  suggestions: z
    .array(z.string())
    .length(5)
    .describe('Five different cover letter variations'),
});

/**
 * Schema for Q&A answer variations
 */
export const QnASchema = z.object({
  suggestions: z
    .array(z.string())
    .length(5)
    .describe('Five different answer variations'),
});
