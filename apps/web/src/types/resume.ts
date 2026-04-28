export interface ContactInfo {
  name: string;
  location: string;
  email: string;
  phone: string;
  linkedin?: string;
  github?: string;
  personalWebsite?: string;
}

export interface Experience {
  title: string;
  company: string;
  location: string;
  dates: string;
  responsibilities: string[];
}

export interface Project {
  name: string;
  technologies: string;
  description: string;
}

export interface Education {
  institution: string;
  location: string;
  dates: string;
  degree: string;
  achievements?: string[];
}

export interface Skills {
  technicalSkills: string[];
  developmentPracticesMethodologies: string[];
  personalSkills: string[];
}

export interface KeywordsByCategory {
  actionVerbs: string[];
  hardSkills: string[];
  softSkills: string[];
  knowledge: string[];
}

export interface Resume {
  _id: string;
  userId?: string;
  title: string;
  slug?: string;
  contactInfo: ContactInfo;
  experience: Experience[];
  projects?: Project[];
  education: Education[];
  skills: Skills;
  category: string;
  source: 'upload' | 'manual' | 'optimization';
  isOptimized: boolean;
  parentResumeId?: string;
  jobId?: string;
  initialATSScore?: number;
  finalATSScore?: number;
  initialKeywordScore?: number;
  finalKeywordScore?: number;
  keywords?: string[];
  matchedKeywords?: string[];
  unmatchedKeywords?: string[];
  matchedKeywordsByCategory?: KeywordsByCategory;
  unmatchedKeywordsByCategory?: KeywordsByCategory;
  optimizationProvider?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export type ResumeFormData = Omit<Resume, '_id' | 'userId' | 'createdAt' | 'updatedAt'>;