import { getApiUrl, createAuthEndpoints, createApiEndpoints, STORAGE_KEYS } from './constants';

// Helper function to make authenticated API calls
export async function makeAuthenticatedRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const apiUrl = await getApiUrl();
  const result = await chrome.storage.local.get(STORAGE_KEYS.TOKEN);
  const token = result[STORAGE_KEYS.TOKEN];

  if (!token) {
    throw new Error('No authentication token found');
  }

  return fetch(`${apiUrl}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });
}

// Helper function to get dynamic endpoints
export async function getEndpoints() {
  const apiUrl = await getApiUrl();
  return {
    auth: createAuthEndpoints(apiUrl),
    api: createApiEndpoints(apiUrl),
  };
}