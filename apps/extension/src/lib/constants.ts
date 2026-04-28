export const PRODUCTION_API_URL = import.meta.env.VITE_API_URL as string;
export const DEVELOPMENT_API_URL = 'http://localhost:8888/api';
export const WEB_URL = import.meta.env.VITE_WEB_URL as string;

// Function to get the current API URL based on developer mode
export const getApiUrl = async (): Promise<string> => {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.DEVELOPER_MODE);
    return result.developerMode ? DEVELOPMENT_API_URL : PRODUCTION_API_URL;
  } catch {
    return PRODUCTION_API_URL;
  }
};

// Helper function to create endpoints dynamically
export const createAuthEndpoints = (apiUrl: string) => ({
  LOGIN: `${apiUrl}/auth/login`,
  SIGNUP: `${apiUrl}/auth/signup`,
  PROFILE: `${apiUrl}/auth/profile`,
});

export const createApiEndpoints = (apiUrl: string) => ({
  RESUMES: `${apiUrl}/resumes`,
  JOBS: `${apiUrl}/jobs`,
  APPLICATIONS: `${apiUrl}/applications`,
});

export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  DEVELOPER_MODE: 'developerMode',
} as const;

export const DEFAULT_THEME = 'dark' as const;