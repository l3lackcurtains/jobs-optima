import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface JobScannerFilters {
  itemsPerPage: number;
  searchQuery: string;
  workMode: string;
  favorite: string;
  sortBy: 'datePosted' | 'createdAt';
  sortOrder: 'desc' | 'asc';
}

interface JobScannerStore {
  filters: JobScannerFilters;
  setItemsPerPage: (count: number) => void;
  setSearchQuery: (query: string) => void;
  setWorkMode: (mode: string) => void;
  setFavorite: (favorite: string) => void;
  setSortBy: (sortBy: 'datePosted' | 'createdAt') => void;
  setSortOrder: (order: 'desc' | 'asc') => void;
  resetFilters: () => void;
}

const defaultFilters: JobScannerFilters = {
  itemsPerPage: 15,
  searchQuery: '',
  workMode: 'all',
  favorite: 'all',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export const useJobScannerStore = create<JobScannerStore>()(
  persist(
    (set) => ({
      filters: defaultFilters,
      
      setItemsPerPage: (count) =>
        set((state) => ({
          filters: { ...state.filters, itemsPerPage: count },
        })),
      
      setSearchQuery: (query) =>
        set((state) => ({
          filters: { ...state.filters, searchQuery: query },
        })),
      
      setWorkMode: (mode) =>
        set((state) => ({
          filters: { ...state.filters, workMode: mode },
        })),
      
      setFavorite: (favorite) =>
        set((state) => ({
          filters: { ...state.filters, favorite: favorite },
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
      name: 'job-scanner-filters',
    }
  )
);