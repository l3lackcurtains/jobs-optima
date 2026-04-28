import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { Job, JobFormData } from '@/types/job';
import { toast } from 'sonner';
import { PaginatedResponse } from './use-resumes';

interface JobFilters {
  search?: string;
  applicationStatus?: 'applied' | 'not-applied';
  workMode?: 'remote' | 'hybrid' | 'onsite' | 'flexible';
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export const useJobs = (
  page: number = 1, 
  limit: number = 10,
  filters?: JobFilters
) => {
  const queryClient = useQueryClient();

  // Fetch paginated jobs
  const { data, isLoading, error } = useQuery({
    queryKey: ['jobs', page, limit, filters],
    queryFn: async (): Promise<PaginatedResponse<Job>> => {
      const response = await apiClient.get(API_ENDPOINTS.JOBS, {
        params: { 
          page, 
          limit,
          ...filters 
        },
      });
      return response.data;
    },
  });

  const jobs = data?.data;

  // Create job
  const createJob = useMutation({
    mutationFn: async (data: JobFormData): Promise<{ job: Job }> => {
      const response = await apiClient.post(API_ENDPOINTS.JOBS, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create job');
    },
  });

  // Delete job
  const deleteJob = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(API_ENDPOINTS.JOB_BY_ID(id));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job deleted');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Delete failed');
    },
  });

  // Update job
  const updateJob = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Job> }) => {
      const response = await apiClient.patch(API_ENDPOINTS.JOB_BY_ID(id), data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job', variables.id] });
      toast.success('Job updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Update failed');
    },
  });

  return { 
    jobs, 
    isLoading, 
    error,
    pagination: data?.pagination, 
    createJob, 
    updateJob,
    deleteJob 
  };
};

// Hook for fetching single job
export const useJob = (id: string) => {
  return useQuery({
    queryKey: ['job', id],
    queryFn: async (): Promise<Job> => {
      const response = await apiClient.get(API_ENDPOINTS.JOB_BY_ID(id));
      return response.data;
    },
    enabled: !!id,
  });
};