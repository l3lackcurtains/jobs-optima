export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  
  // Resumes
  RESUMES: '/resumes',
  RESUME_BY_ID: (id: string) => `/resumes/${id}`,
  RESUME_PDF: (id: string) => `/resumes/${id}/pdf`,
  FIX_RESUME_SLUGS: '/resumes/fix-slugs',
  UPLOAD_RESUME: '/upload/resume',
  
  // Jobs
  JOBS: '/jobs',
  JOB_BY_ID: (id: string) => `/jobs/${id}`,
  
  // Optimization
  OPTIMIZE: '/jobs/optimize',
  ATS_REPORT: (resumeId: string, jobId: string) => `/jobs/resume/${resumeId}/job/${jobId}/ats-report`,
  
  // AI
  AI_OPTIMIZE_CONTENT: '/ai/optimize-content-with-keywords',
  AI_OPTIMIZE_SKILLS: '/ai/optimize-skills-with-keywords',
  AI_IMPROVE_CONTENT: '/ai/improve-content-ats',
  AI_IMPROVE_SKILLS: '/ai/improve-skills-ats',
  AI_GENERATE_COVER_LETTER: '/ai/generate-cover-letter',
  AI_OPTIMIZE_COVER_LETTER: '/ai/optimize-cover-letter',
  AI_OPTIMIZE_QNA: '/ai/optimize-qna',
  AI_GENERATE_QNA: '/ai/optimize-qna',
  AI_GENERATE_MULTIPLE_QNA: '/ai/generate-multiple-qna',
  
  // Applications
  APPLICATIONS: '/applications',
  APPLICATION_BY_ID: (id: string) => `/applications/${id}`,
  APPLICATION_STATUS: (id: string) => `/applications/${id}/status`,
  APPLICATION_STATS: '/applications/stats',
  APPLICATIONS_BY_JOB: (jobId: string) => `/applications/by-job/${jobId}`,
  APPLICATIONS_BY_RESUME: (resumeId: string) => `/applications/by-resume/${resumeId}`,
  APPLICATION_COVER_LETTER_PDF: (id: string) => `/applications/${id}/cover-letter/pdf`,
  
  // Job Scanner
  JOB_SCANNER_SETTINGS: '/job-scanner/settings',
  JOB_SCANNER_SCAN: '/job-scanner/scan',
  JOB_SCANNER_SCAN_LOGS: (scanId: string) => `/job-scanner/scan-logs/${scanId}`,
  JOB_SCANNER_SCAN_LOGS_LATEST: '/job-scanner/scan-logs',
  JOB_SCANNER_JOBS: '/job-scanner/jobs',
  JOB_SCANNER_JOB_BY_ID: (id: string) => `/job-scanner/jobs/${id}`,
  JOB_SCANNER_SAVE_JOB: (id: string) => `/job-scanner/jobs/${id}/save`,
  JOB_SCANNER_BULK_ACTION: '/job-scanner/jobs/bulk',

  // Settings
  AI_SETTINGS: '/auth/ai-settings',

  // Billing
  BILLING_ME: '/billing/me',
  BILLING_CHECKOUT: '/billing/checkout',
  BILLING_PORTAL: '/billing/portal',

  // Profiles
  PROFILES: '/profiles',
  PROFILE_BY_ID: (id: string) => `/profiles/${id}`,
  PROFILE_DEFAULT: '/profiles/default',
  PROFILE_SET_DEFAULT: (id: string) => `/profiles/${id}/set-default`,
  PROFILE_INCREMENT_USAGE: (id: string) => `/profiles/${id}/increment-usage`,
} as const;