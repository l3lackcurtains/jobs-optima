export interface ResumeContactInfo {
  name: string;
  location: string;
  email: string;
  phone: string;
  linkedin?: string | null;
  github?: string | null;
  personalWebsite?: string | null;
}

export interface ResumeExperience {
  title: string;
  company: string;
  location: string;
  dates: string;
  responsibilities: string[];
}

export interface ResumeProject {
  name: string;
  technologies: string;
  description: string;
}

export interface ResumeEducation {
  institution: string;
  location: string;
  dates: string;
  degree: string;
  achievements?: string[];
}

export interface ResumeSkills {
  technicalSkills: string[];
  developmentPracticesMethodologies: string[];
  personalSkills: string[];
}

export interface ResumeData {
  contactInfo: ResumeContactInfo;
  experience: ResumeExperience[];
  projects: ResumeProject[];
  education: ResumeEducation[];
  skills: ResumeSkills;
  [key: string]: any; // Allow additional properties
}

export interface OptimizationResult {
  resume: ResumeData;
  initialATSScore: number;
  finalATSScore: number;
  initialKeywordScore: number;
  finalKeywordScore: number;
  keywords: string[];
  matchedKeywords: string[];
  unmatchedKeywords: string[];
}
