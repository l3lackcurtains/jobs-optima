import { Application } from './application';

// Job interface - matches the actual Job schema from backend
export interface Job {
  _id: string;
  userId: string;
  title: string;
  company: string;
  location?: string;
  description: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryPeriod?: string;
  url?: string;
  source?: string;
  category: string;
  keywords?: {
    actionVerbs: string[];
    hardSkills: string[];
    softSkills: string[];
    knowledge?: string[];
  };
  optimizedResumeIds?: string[];
  applicationId?: string | null;  // Reference to the application for this job
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
  
  // New fields for enhanced sidebar display
  summary?: string;
  industry?: string;
  mustHaveSkills?: string[];
  niceToHaveSkills?: string[];
  workMode?: 'remote' | 'hybrid' | 'onsite';
  jobType?: 'full-time' | 'part-time' | 'contract' | 'internship' | 'freelance' | 'temporary';
  
  // Populated field for UI
  application?: Application | null;
  
  // Fields added by backend API response
  isApplied?: boolean;
  applicationStatus?: string;
}

export type JobFormData = Omit<Job, '_id' | 'userId' | 'category' | 'keywords' | 'createdAt' | 'updatedAt'>;