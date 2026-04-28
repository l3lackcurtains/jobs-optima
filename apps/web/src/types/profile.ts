// Matching resume structure with additional profile fields
export interface ContactInfo {
  name: string;
  location: string;
  email: string;
  phone: string;
  linkedin?: string;
  github?: string;
  personalWebsite?: string;
  // Additional profile fields
  twitter?: string;
  street?: string;
  apartment?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  preferredFirstName?: string;
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
  // Additional profile fields
  url?: string;
  role?: string;
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
  softSkills?: string[];
}

export type ProfileCategory = 
  | 'Frontend'
  | 'Backend'
  | 'FullStack'
  | 'AI/ML'
  | 'Blockchain'
  | 'DevOps'
  | 'Mobile'
  | 'DataEngineering'
  | 'Security'
  | 'General';

export interface Profile {
  _id: string;
  profileName: string;
  isDefault: boolean;
  
  // Core resume-compatible fields
  contactInfo: ContactInfo;
  experience: Experience[];
  projects: Project[];
  education: Education[];
  skills: Skills;
  category: ProfileCategory;
  
  // Additional profile-specific fields
  professionalSummary?: string;
  objective?: string;
  totalYearsExperience?: number;
  currentSalary?: number;
  desiredSalary?: number;
  workAuthorization: string;
  requiresSponsorship?: boolean;
  availableStartDate?: Date | string;
  preferredWorkTypes?: string[];
  preferredJobTypes?: string[];
  achievements?: string[];
  
  // Job application specific fields
  currentCompany?: string;
  currentLocation?: string;
  
  // EEO Information
  authorizedToWorkInUS?: boolean;
  gender?: string;
  race?: string;
  veteranStatus?: string;
  disabilityStatus?: string;
  lgbtq?: boolean;
  sexualOrientation?: string;
  
  // Custom fields
  customFields?: Record<string, any>;
  
  // Metadata
  isActive: boolean;
  usageCount: number;
  lastUsedAt?: Date | string;
  linkedResumeId?: string;
  lastImportedFromResume?: Date | string;
  userId: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// DTOs for API operations
export interface CreateProfileDto extends Omit<Profile, '_id' | 'createdAt' | 'updatedAt' | 'userId' | 'usageCount' | 'lastUsedAt'> {}

export interface UpdateProfileDto extends Partial<CreateProfileDto> {}

export interface FindProfilesDto {
  page?: number;
  limit?: number;
  search?: string;
  category?: ProfileCategory;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface CreateProfileFromResumeDto {
  resumeId: string;
  profileName: string;
}