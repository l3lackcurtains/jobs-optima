import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export interface AiSettings {
  aiProvider: string | null;
  aiApiKey: string | null;
  aiModel: string | null;
}

export async function getAiSettings(): Promise<AiSettings> {
  const response = await apiClient.get(API_ENDPOINTS.AI_SETTINGS);
  return response.data;
}

export async function updateAiSettings(
  data: Partial<Pick<AiSettings, 'aiProvider' | 'aiApiKey' | 'aiModel'>>,
): Promise<AiSettings> {
  const response = await apiClient.patch(API_ENDPOINTS.AI_SETTINGS, data);
  return response.data;
}
