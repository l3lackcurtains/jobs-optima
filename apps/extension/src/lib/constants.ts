export const DEFAULT_API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8888/api';
export const DEFAULT_WEB_URL = (import.meta.env.VITE_WEB_URL as string) || 'http://localhost:4000';
export const DEVELOPMENT_API_URL = 'http://localhost:8888/api';

// Function to get the current API URL: storage → env var → localhost fallback
export const getApiUrl = async (): Promise<string> => {
  try {
    const result = await chrome.storage.local.get([STORAGE_KEYS.DEVELOPER_MODE, STORAGE_KEYS.API_URL]);
    if (result.developerMode) return DEVELOPMENT_API_URL;
    return result[STORAGE_KEYS.API_URL] || DEFAULT_API_URL;
  } catch {
    return DEFAULT_API_URL;
  }
};

export const getWebUrl = async (): Promise<string> => {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.WEB_URL);
    return result[STORAGE_KEYS.WEB_URL] || DEFAULT_WEB_URL;
  } catch {
    return DEFAULT_WEB_URL;
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
  API_URL: 'apiUrl',
  WEB_URL: 'webUrl',
} as const;

export const DEFAULT_THEME = 'dark' as const;