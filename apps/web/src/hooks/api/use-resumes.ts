import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { Resume } from '@/types/resume';
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

export const useResumes = (page: number = 1, limit: number = 10, isOptimized?: boolean) => {
  const queryClient = useQueryClient();

  // Fetch paginated resumes
  const { data, isLoading, error } = useQuery({
    queryKey: ['resumes', page, limit, isOptimized],
    queryFn: async (): Promise<PaginatedResponse<Resume>> => {
      const params: any = { page, limit };
      if (isOptimized !== undefined) {
        params.isOptimized = isOptimized;
      }
      const response = await apiClient.get(API_ENDPOINTS.RESUMES, { params });
      return response.data;
    },
  });

  const resumes = data?.data;

  // Upload resume
  const uploadResume = useMutation({
    mutationFn: async (formData: FormData): Promise<{ resume: Resume }> => {
      const response = await apiClient.post(API_ENDPOINTS.UPLOAD_RESUME, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      toast.success('Resume uploaded successfully!');
    },
    onError: (error: unknown) => {
      const message = error && typeof error === 'object' && 'response' in error 
        ? (error.response as { data?: { message?: string } })?.data?.message 
        : 'Upload failed';
      toast.error(message || 'Upload failed');
    },
  });

  // Delete resume
  const deleteResume = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(API_ENDPOINTS.RESUME_BY_ID(id));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      toast.success('Resume deleted');
    },
    onError: (error: unknown) => {
      const message = error && typeof error === 'object' && 'response' in error 
        ? (error.response as { data?: { message?: string } })?.data?.message 
        : 'Delete failed';
      toast.error(message || 'Delete failed');
    },
  });

  // Update resume
  const updateResume = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Resume> }) => {
      const response = await apiClient.patch(API_ENDPOINTS.RESUME_BY_ID(id), data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      queryClient.invalidateQueries({ queryKey: ['resume', variables.id] });
      toast.success('Resume updated successfully!');
    },
    onError: (error: unknown) => {
      const message = error && typeof error === 'object' && 'response' in error 
        ? (error.response as { data?: { message?: string } })?.data?.message 
        : 'Update failed';
      toast.error(message || 'Update failed');
    },
  });

  // Create new resume
  const createResume = useMutation({
    mutationFn: async (data: Partial<Resume>) => {
      const response = await apiClient.post(API_ENDPOINTS.RESUMES, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      toast.success('Resume created successfully!');
    },
    onError: (error: unknown) => {
      const message = error && typeof error === 'object' && 'response' in error 
        ? (error.response as { data?: { message?: string } })?.data?.message 
        : 'Create failed';
      toast.error(message || 'Create failed');
    },
  });

  // Export resume as PDF
  const exportPDF = async (id: string) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.RESUME_PDF(id), {
        responseType: 'blob',
      });
      
      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers['content-disposition'] || response.headers['Content-Disposition'];
      let filename = `resume_${id}.pdf`; // fallback
      
      if (contentDisposition) {
        // Try multiple patterns to extract filename
        let filenameMatch = contentDisposition.match(/filename="([^"]+)"/i);
        if (!filenameMatch) {
          filenameMatch = contentDisposition.match(/filename=([^;,\s]+)/i);
        }
        
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '').trim();
        } else {
          // Try a more generic approach
          const parts = contentDisposition.split('filename=');
          if (parts.length > 1) {
            filename = parts[1].replace(/['"]/g, '').replace(/;.*/, '').trim();
          }
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
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      toast.error('Failed to export PDF');
    }
  };

  return {
    resumes,
    isLoading,
    error,
    pagination: data?.pagination,
    uploadResume,
    createResume,
    updateResume,
    deleteResume,
    exportPDF,
    useResume: (id: string) => useResume(id),
  };
};

// Hook for fetching single resume
export const useResume = (id: string) => {
  return useQuery({
    queryKey: ['resume', id],
    queryFn: async (): Promise<Resume> => {
      const response = await apiClient.get(API_ENDPOINTS.RESUME_BY_ID(id));
      return response.data;
    },
    enabled: !!id,
  });
};