import { User } from './user';
import { Resume } from './resume';
import { Job } from './job';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface OptimizeRequest {
  resumeId: string;
  jobId: string;
  provider?: 'openai' | 'anthropic';
}

export interface OptimizeResponse {
  optimizedResume: Resume;
  atsReport: string;
  optimizationStats: {
    initialATSScore: number;
    finalATSScore: number;
    improvement: number;
    matchedKeywords: string[];
    unmatchedKeywords: string[];
    totalKeywords: number;
    matchPercentage: number;
  };
}

export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
}