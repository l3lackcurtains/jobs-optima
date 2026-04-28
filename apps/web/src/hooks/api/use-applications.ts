import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { 
  Application, 
  ApplicationStatus, 
  CreateApplicationData, 
  UpdateApplicationData,
  ApplicationStats 
} from '@/types/application';
import { toast } from 'sonner';
import { PaginatedResponse } from './use-resumes';

export const useApplications = (page: number = 1, limit: number = 10, status?: ApplicationStatus) => {
  const queryClient = useQueryClient();

  // Fetch paginated applications
  const { data, isLoading, error } = useQuery({
    queryKey: ['applications', page, limit, status],
    queryFn: async (): Promise<PaginatedResponse<Application>> => {
      const params: any = { page, limit };
      if (status) params.status = status;
      const response = await apiClient.get(API_ENDPOINTS.APPLICATIONS, { params });
      return response.data;
    },
  });

  const applications = data?.data;

  // Create application
  const createApplication = useMutation({
    mutationFn: async (data: CreateApplicationData): Promise<Application> => {
      const response = await apiClient.post(API_ENDPOINTS.APPLICATIONS, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success('Application created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create application');
    },
  });

  // Update application
  const updateApplication = useMutation({
    mutationFn: async ({ 
      id, 
      data 
    }: { 
      id: string; 
      data: UpdateApplicationData 
    }): Promise<Application> => {
      const response = await apiClient.patch(API_ENDPOINTS.APPLICATION_BY_ID(id), data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['application'] });
      toast.success('Application updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update application');
    },
  });

  // Update application status
  const updateApplicationStatus = useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      notes 
    }: { 
      id: string; 
      status: ApplicationStatus; 
      notes?: string 
    }): Promise<Application> => {
      const response = await apiClient.patch(API_ENDPOINTS.APPLICATION_STATUS(id), { 
        status, 
        notes 
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['application'] });
      toast.success('Status updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  // Delete application
  const deleteApplication = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(API_ENDPOINTS.APPLICATION_BY_ID(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success('Application deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete application');
    },
  });

  return {
    applications,
    isLoading,
    error,
    pagination: data?.pagination,
    createApplication,
    updateApplication,
    updateApplicationStatus,
    deleteApplication,
  };
};

// Hook for single application
export const useApplication = (id: string) => {
  return useQuery({
    queryKey: ['application', id],
    queryFn: async (): Promise<Application> => {
      const response = await apiClient.get(API_ENDPOINTS.APPLICATION_BY_ID(id));
      return response.data;
    },
    enabled: !!id,
  });
};

// Hook for application stats
export const useApplicationStats = () => {
  return useQuery({
    queryKey: ['application-stats'],
    queryFn: async (): Promise<ApplicationStats> => {
      const response = await apiClient.get(API_ENDPOINTS.APPLICATION_STATS);
      return response.data;
    },
  });
};

// Hook for applications by job
export const useApplicationsByJob = (jobId: string) => {
  return useQuery({
    queryKey: ['applications-by-job', jobId],
    queryFn: async (): Promise<Application[]> => {
      const response = await apiClient.get(API_ENDPOINTS.APPLICATIONS_BY_JOB(jobId));
      return response.data;
    },
    enabled: !!jobId,
  });
};

// Hook for applications by resume
export const useApplicationsByResume = (resumeId: string) => {
  return useQuery({
    queryKey: ['applications-by-resume', resumeId],
    queryFn: async (): Promise<Application[]> => {
      const response = await apiClient.get(API_ENDPOINTS.APPLICATIONS_BY_RESUME(resumeId));
      return response.data;
    },
    enabled: !!resumeId,
  });
};

// Hook for job-specific application (1-1 relationship)
export const useJobApplication = (jobId: string) => {
  const queryClient = useQueryClient();

  // Fetch application for specific job
  const { data: application, isLoading, error } = useQuery({
    queryKey: ['job-application', jobId],
    queryFn: async (): Promise<Application | null> => {
      if (!jobId) return null;
      try {
        const response = await apiClient.get(`${API_ENDPOINTS.APPLICATIONS}/for-job/${jobId}`);
        return response.data;
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null; // No application exists for this job
        }
        throw error;
      }
    },
    enabled: !!jobId,
  });

  // Create application for job
  const createJobApplication = useMutation({
    mutationFn: async (data: Omit<CreateApplicationData, 'jobId'>): Promise<Application> => {
      const response = await apiClient.post(API_ENDPOINTS.APPLICATIONS, {
        ...data,
        jobId,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-application', jobId] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success('Application created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create application');
    },
  });

  // Update application
  const updateJobApplication = useMutation({
    mutationFn: async (data: UpdateApplicationData): Promise<Application> => {
      if (!application) throw new Error('No application to update');
      const response = await apiClient.patch(API_ENDPOINTS.APPLICATION_BY_ID(application._id), data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-application', jobId] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success('Application updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update application');
    },
  });

  return {
    application,
    isLoading,
    error,
    hasApplication: !!application,
    createJobApplication,
    updateJobApplication,
  };
};

// Export cover letter as PDF
export const downloadCoverLetterPdf = async (applicationId: string) => {
  try {
    const response = await apiClient.get(
      API_ENDPOINTS.APPLICATION_COVER_LETTER_PDF(applicationId),
      {
        responseType: 'blob',
      }
    );
    
    // Extract filename from Content-Disposition header
    const contentDisposition = response.headers['content-disposition'] || response.headers['Content-Disposition'];
    let filename = `cover-letter-${applicationId}.pdf`; // fallback
    
    if (contentDisposition) {
      // Try multiple patterns to extract filename
      let filenameMatch = contentDisposition.match(/filename="([^"]+)"/i);
      if (!filenameMatch) {
        filenameMatch = contentDisposition.match(/filename=([^;,\s]+)/i);
      }
      
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '').trim();
      }
    }
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    toast.success('Cover letter downloaded successfully');
  } catch (error: any) {
    console.error('Failed to download cover letter:', error);
    toast.error('Failed to download cover letter');
  }
};