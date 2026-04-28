import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { toast } from 'sonner';

// Content Optimization with Keywords
export const useOptimizeContent = () => {
  return useMutation({
    mutationFn: async (data: {
      content: string;
      prompt?: string;
      keywords: string[];
      excludeKeywords: string[];
      contentType: 'responsibility' | 'project_description' | 'achievement';
    }) => {
      const response = await apiClient.post(API_ENDPOINTS.AI_OPTIMIZE_CONTENT, data);
      return response.data;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to optimize content');
    },
  });
};

// Skills Optimization with Keywords
export const useOptimizeSkills = () => {
  return useMutation({
    mutationFn: async (data: {
      currentSkills: string[];
      prompt?: string;
      keywords: string[];
      excludeKeywords: string[];
      skillType: 'technical' | 'soft' | 'development';
    }) => {
      const response = await apiClient.post(API_ENDPOINTS.AI_OPTIMIZE_SKILLS, data);
      return response.data;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to optimize skills');
    },
  });
};

// Content Improvement (ATS)
export const useImproveContent = () => {
  return useMutation({
    mutationFn: async (data: {
      content: string;
      prompt?: string;
      contentType: 'responsibility' | 'project_description' | 'achievement';
    }) => {
      const response = await apiClient.post(API_ENDPOINTS.AI_IMPROVE_CONTENT, data);
      return response.data;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to improve content');
    },
  });
};

// Skills Improvement (ATS)
export const useImproveSkills = () => {
  return useMutation({
    mutationFn: async (data: {
      currentSkills: string[];
      prompt?: string;
      skillType: 'technical' | 'soft' | 'development';
    }) => {
      const response = await apiClient.post(API_ENDPOINTS.AI_IMPROVE_SKILLS, data);
      return response.data;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to improve skills');
    },
  });
};

// Generate Cover Letter
export const useGenerateCoverLetter = () => {
  return useMutation({
    mutationFn: async (data: {
      optimizedResumeId: string;
      jobId: string;
      customInstructions?: string;
    }): Promise<{ suggestions: string[] }> => {
      const response = await apiClient.post(API_ENDPOINTS.AI_GENERATE_COVER_LETTER, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Cover letter variations generated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to generate cover letter');
    },
  });
};

// Optimize Existing Cover Letter
export const useOptimizeCoverLetter = () => {
  return useMutation({
    mutationFn: async (data: {
      coverLetter: string;
      optimizedResumeId: string;
      jobId: string;
      customInstructions?: string;
    }): Promise<{ suggestions: string[] }> => {
      const response = await apiClient.post(API_ENDPOINTS.AI_OPTIMIZE_COVER_LETTER, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Cover letter optimized successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to optimize cover letter');
    },
  });
};

// Generate Q&A Answers
export const useGenerateQnA = () => {
  return useMutation({
    mutationFn: async (data: {
      question: string;
      optimizedResumeId: string;
      jobId: string;
      customInstructions?: string;
    }): Promise<{ suggestions: string[] }> => {
      const response = await apiClient.post(API_ENDPOINTS.AI_GENERATE_QNA, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Answer variations generated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to generate answers');
    },
  });
};

// Optimize Q&A Answer
export const useOptimizeQnA = () => {
  return useMutation({
    mutationFn: async (data: {
      question: string;
      currentAnswer: string;
      optimizedResumeId: string;
      jobId: string;
      customInstructions?: string;
    }): Promise<{ suggestions: string[] }> => {
      const response = await apiClient.post(API_ENDPOINTS.AI_OPTIMIZE_QNA, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Answer optimized successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to optimize answer');
    },
  });
};

// Generate Multiple Q&A Answers
export const useGenerateMultipleQnA = () => {
  return useMutation({
    mutationFn: async (data: {
      questions: Array<{
        question: string;
      }>;
      optimizedResumeId: string;
      jobId: string;
      customInstructions?: string;
    }): Promise<{ 
      results: Array<{ 
        question: string;
        suggestions: string[] 
      }> 
    }> => {
      const response = await apiClient.post(API_ENDPOINTS.AI_GENERATE_MULTIPLE_QNA, data);
      return response.data;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to generate answers');
    },
  });
};