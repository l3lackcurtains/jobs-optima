import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { 
  Profile, 
  UpdateProfileDto, 
  FindProfilesDto,
  CreateProfileFromResumeDto 
} from '@/types/profile';
import { toast } from 'sonner';

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const useProfiles = (page: number = 1, limit: number = 10, params?: Partial<FindProfilesDto>) => {
  const queryClient = useQueryClient();

  // Fetch paginated profiles
  const { data, isLoading, error } = useQuery({
    queryKey: ['profiles', page, limit, params],
    queryFn: async (): Promise<PaginatedResponse<Profile>> => {
      const queryParams: any = { page, limit, ...params };
      const response = await apiClient.get(API_ENDPOINTS.PROFILES, { params: queryParams });
      return response.data;
    },
  });

  const profiles = data?.data;

  // Create profile from resume
  const createProfileFromResume = useMutation({
    mutationFn: async (data: CreateProfileFromResumeDto): Promise<Profile> => {
      const response = await apiClient.post(API_ENDPOINTS.PROFILES, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success('Profile created from resume successfully!');
    },
    onError: (error: unknown) => {
      const message = error && typeof error === 'object' && 'response' in error 
        ? (error.response as { data?: { message?: string } })?.data?.message 
        : 'Create failed';
      toast.error(message || 'Create failed');
    },
  });

  // Update profile
  const updateProfile = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProfileDto }) => {
      const response = await apiClient.patch(API_ENDPOINTS.PROFILE_BY_ID(id), data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['profile', variables.id] });
      toast.success('Profile updated successfully!');
    },
    onError: (error: unknown) => {
      const message = error && typeof error === 'object' && 'response' in error 
        ? (error.response as { data?: { message?: string } })?.data?.message 
        : 'Update failed';
      toast.error(message || 'Update failed');
    },
  });

  // Delete profile
  const deleteProfile = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(API_ENDPOINTS.PROFILE_BY_ID(id));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success('Profile deleted');
    },
    onError: (error: unknown) => {
      const message = error && typeof error === 'object' && 'response' in error 
        ? (error.response as { data?: { message?: string } })?.data?.message 
        : 'Delete failed';
      toast.error(message || 'Delete failed');
    },
  });

  // Set as default
  const setAsDefault = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.patch(API_ENDPOINTS.PROFILE_SET_DEFAULT(id));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['profile-default'] });
      toast.success('Profile set as default');
    },
    onError: (error: unknown) => {
      const message = error && typeof error === 'object' && 'response' in error 
        ? (error.response as { data?: { message?: string } })?.data?.message 
        : 'Update failed';
      toast.error(message || 'Update failed');
    },
  });

  // Increment usage count
  const incrementUsageCount = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.patch(API_ENDPOINTS.PROFILE_INCREMENT_USAGE(id));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
  });

  // Create profile (manual)
  const createProfile = useMutation({
    mutationFn: async (data: any): Promise<Profile> => {
      const response = await apiClient.post(API_ENDPOINTS.PROFILES, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success('Profile created successfully!');
    },
    onError: (error: unknown) => {
      const message = error && typeof error === 'object' && 'response' in error 
        ? (error.response as { data?: { message?: string } })?.data?.message 
        : 'Create failed';
      toast.error(message || 'Create failed');
    },
  });

  return {
    profiles,
    isLoading,
    error,
    pagination: data?.pagination,
    createProfile,
    createProfileFromResume,
    updateProfile,
    deleteProfile,
    setAsDefault,
    incrementUsageCount,
    useProfile: (id: string) => useProfile(id),
  };
};

// Hook for fetching single profile
export const useProfile = (id: string) => {
  return useQuery({
    queryKey: ['profile', id],
    queryFn: async (): Promise<Profile> => {
      const response = await apiClient.get(API_ENDPOINTS.PROFILE_BY_ID(id));
      return response.data;
    },
    enabled: !!id,
  });
};

// Hook for fetching default profile
export const useDefaultProfile = () => {
  return useQuery({
    queryKey: ['profile-default'],
    queryFn: async (): Promise<Profile | null> => {
      const response = await apiClient.get(API_ENDPOINTS.PROFILE_DEFAULT);
      return response.data;
    },
  });
};