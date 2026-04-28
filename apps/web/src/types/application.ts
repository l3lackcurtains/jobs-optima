import { Job } from './job';
import { Resume } from './resume';

export enum ApplicationStatus {
  DRAFT = 'draft',
  APPLIED = 'applied',
  REVIEWING = 'reviewing',
  INTERVIEWING = 'interviewing',
  OFFERED = 'offered',
  REJECTED = 'rejected',
  ACCEPTED = 'accepted',
  WITHDRAWN = 'withdrawn',
}

export interface InterviewDetail {
  date: Date | string;
  type: 'phone' | 'video' | 'onsite' | 'technical' | 'behavioral' | string;
  interviewer?: string;
  notes?: string;
  result?: string;
}

export interface OfferDetail {
  salary?: number;
  salaryPeriod?: 'hourly' | 'yearly' | 'monthly';
  benefits?: string;
  startDate?: Date | string;
  deadline?: Date | string;
  notes?: string;
}

export interface TimelineEvent {
  timestamp: Date | string;
  event: string;
  description?: string;
  status?: ApplicationStatus;
}

export interface QuestionAnswer {
  question: string;
  answer: string;
  createdAt?: Date | string;
}

export interface Application {
  _id: string;
  userId: string;
  jobId: string;
  optimizedResumeId: string;
  baseResumeId: string;
  coverLetter?: string;
  status: ApplicationStatus;
  applicationDate?: Date | string;
  followUpDates: (Date | string)[];
  notes?: string;
  companyResponse?: string;
  interviewDetails: InterviewDetail[];
  offerDetails?: OfferDetail;
  documents: string[];
  timeline: TimelineEvent[];
  customFields?: Record<string, any>;
  applicationUrl?: string;
  jobPostingUrl?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  questionsAnswers?: QuestionAnswer[];
  createdAt: string;
  updatedAt: string;
  
  // Populated fields
  job?: Job;
  optimizedResume?: Resume;
  baseResume?: Resume;
}

export interface CreateApplicationData {
  jobId: string;
  optimizedResumeId: string;
  baseResumeId: string;
  coverLetter?: string;
  status?: ApplicationStatus;
  applicationDate?: Date | string;
  notes?: string;
  customFields?: Record<string, any>;
}

export interface UpdateApplicationData extends Partial<CreateApplicationData> {
  followUpDates?: (Date | string)[];
  companyResponse?: string;
  interviewDetails?: InterviewDetail[];
  offerDetails?: OfferDetail;
  documents?: string[];
  questionsAnswers?: QuestionAnswer[];
}

export interface ApplicationStats {
  total: number;
  byStatus: Record<ApplicationStatus, number>;
  recentActivity: Array<{
    applicationId: string;
    jobId: string;
    timestamp: Date | string;
    event: string;
    description?: string;
    status?: ApplicationStatus;
  }>;
  successRate: number;
}

export const APPLICATION_STATUS_COLORS: Record<ApplicationStatus, string> = {
  [ApplicationStatus.DRAFT]: 'gray',
  [ApplicationStatus.APPLIED]: 'blue',
  [ApplicationStatus.REVIEWING]: 'yellow',
  [ApplicationStatus.INTERVIEWING]: 'purple',
  [ApplicationStatus.OFFERED]: 'green',
  [ApplicationStatus.REJECTED]: 'red',
  [ApplicationStatus.ACCEPTED]: 'emerald',
  [ApplicationStatus.WITHDRAWN]: 'slate',
};

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  [ApplicationStatus.DRAFT]: 'Application Started',
  [ApplicationStatus.APPLIED]: 'Applied',
  [ApplicationStatus.REVIEWING]: 'Under Review',
  [ApplicationStatus.INTERVIEWING]: 'Interviewing',
  [ApplicationStatus.OFFERED]: 'Offer Received',
  [ApplicationStatus.REJECTED]: 'Rejected',
  [ApplicationStatus.ACCEPTED]: 'Accepted',
  [ApplicationStatus.WITHDRAWN]: 'Withdrawn',
};