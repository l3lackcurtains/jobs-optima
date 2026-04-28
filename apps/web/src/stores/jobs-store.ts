import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface JobsFilters {
  searchQuery: string;
  applicationStatus: string;
  workMode: string;
  sortBy: 'createdAt' | 'updatedAt';
  sortOrder: 'desc' | 'asc';
}

interface JobsStore {
  filters: JobsFilters;
  setSearchQuery: (query: string) => void;
  setApplicationStatus: (status: string) => void;
  setWorkMode: (mode: string) => void;
  setSortBy: (sortBy: 'createdAt' | 'updatedAt') => void;
  setSortOrder: (order: 'desc' | 'asc') => void;
  resetFilters: () => void;
}

const defaultFilters: JobsFilters = {
  searchQuery: '',
  applicationStatus: 'all',
  workMode: 'all',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export const useJobsStore = create<JobsStore>()(
  persist(
    (set) => ({
      filters: defaultFilters,
      
      setSearchQuery: (query) =>
        set((state) => ({
          filters: { ...state.filters, searchQuery: query },
        })),
      
      setApplicationStatus: (status) =>
        set((state) => ({
          filters: { ...state.filters, applicationStatus: status },
        })),
      
      setWorkMode: (mode) =>
        set((state) => ({
          filters: { ...state.filters, workMode: mode },
        })),
      
      setSortBy: (sortBy) =>
        set((state) => ({
          filters: { ...state.filters, sortBy: sortBy },
        })),
      
      setSortOrder: (order) =>
        set((state) => ({
          filters: { ...state.filters, sortOrder: order },
        })),
      
      resetFilters: () =>
        set(() => ({
          filters: defaultFilters,
        })),
    }),
    {
      name: 'jobs-filters',
    }
  )
);