import { z } from 'zod'

export const contactInfoSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedin: z.string().url('Invalid URL').optional().or(z.literal('')),
  github: z.string().url('Invalid URL').optional().or(z.literal('')),
  personalWebsite: z.string().url('Invalid URL').optional().or(z.literal(''))
})

export const experienceSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  company: z.string().min(1, 'Company is required'),
  location: z.string().optional(),
  dates: z.string().min(1, 'Dates are required'),
  responsibilities: z.array(z.string()).min(1, 'At least one responsibility is required')
})

export const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  technologies: z.string().min(1, 'Technologies are required'),
  description: z.string().min(1, 'Description is required')
})

export const educationSchema = z.object({
  institution: z.string().min(1, 'Institution is required'),
  location: z.string().optional(),
  dates: z.string().min(1, 'Dates are required'),
  degree: z.string().min(1, 'Degree is required'),
  achievements: z.array(z.string()).optional()
})

export const skillsSchema = z.object({
  technicalSkills: z.array(z.string()).min(1, 'At least one technical skill is required'),
  developmentPracticesMethodologies: z.array(z.string()).optional(),
  personalSkills: z.array(z.string()).optional()
})

export const resumeSchema = z.object({
  _id: z.string().optional(),
  title: z.string().min(1, 'Resume title is required').max(200, 'Title is too long'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  contactInfo: contactInfoSchema,
  experience: z.array(experienceSchema).min(1, 'At least one experience is required'),
  projects: z.array(projectSchema).optional(),
  education: z.array(educationSchema).min(1, 'At least one education entry is required'),
  skills: skillsSchema,
  isOptimized: z.boolean().optional(),
  source: z.enum(['upload', 'manual', 'optimization']).optional(),
  parentResumeId: z.string().optional(),
  jobId: z.string().optional(),
  initialATSScore: z.number().optional(),
  finalATSScore: z.number().optional(),
  initialKeywordScore: z.number().optional(),
  finalKeywordScore: z.number().optional(),
  keywords: z.array(z.string()).optional(),
  matchedKeywords: z.array(z.string()).optional(),
  unmatchedKeywords: z.array(z.string()).optional(),
  optimizationProvider: z.enum(['openai', 'anthropic']).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
})

export type ResumeSchemaType = z.infer<typeof resumeSchema>

// Validation helper function
export const validateResume = (data: any): { success: boolean; errors?: Record<string, string>; data?: ResumeSchemaType } => {
  try {
    const validatedData = resumeSchema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.issues.reduce((acc, err) => {
        const path = err.path.join('.')
        acc[path] = err.message
        return acc
      }, {} as Record<string, string>)
      return { success: false, errors: formattedErrors }
    }
    return { success: false, errors: { general: 'Validation failed' } }
  }
}

// Data migration utility
export const migrateResumeData = (data: any): ResumeSchemaType => {
  // Handle different data formats from API
  if (!data.contactInfo && data.personalInfo) {
    data.contactInfo = data.personalInfo
    delete data.personalInfo
  }
  
  // Ensure arrays exist
  data.experience = data.experience || []
  data.education = data.education || []
  data.projects = data.projects || []
  
  // Ensure skills object structure
  if (!data.skills || typeof data.skills !== 'object') {
    data.skills = {
      technicalSkills: [],
      developmentPracticesMethodologies: [],
      personalSkills: []
    }
  } else {
    data.skills.technicalSkills = data.skills.technicalSkills || []
    data.skills.developmentPracticesMethodologies = data.skills.developmentPracticesMethodologies || []
    data.skills.personalSkills = data.skills.personalSkills || []
  }
  
  // Set default values for optional fields
  data.isOptimized = data.isOptimized ?? false
  data.source = data.source || 'manual'
  
  return data as ResumeSchemaType
}