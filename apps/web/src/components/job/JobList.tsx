'use client'

import { useState, useEffect } from 'react'
import { Plus, Briefcase, Search, Filter } from 'lucide-react'
import { PrimaryButton } from '@/components/custom/Button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import JobTable from './JobTable'
import { NewJobDialog } from './NewJobDialog'
import { Job } from '@/types/job'
import { Skeleton } from '@/components/ui/skeleton'
import { useJobs } from '@/hooks/api/use-jobs'
import { PaginationControls } from '@/components/custom/PaginationControls'
import { useJobsStore } from '@/stores/jobs-store'

export default function JobList() {
  const [currentPage, setCurrentPage] = useState(1)
  
  // Use persisted filters from store
  const { 
    filters,
    setSearchQuery,
    setApplicationStatus,
    setWorkMode,
    setSortBy,
    resetFilters
  } = useJobsStore()
  
  // Build API filters object
  const apiFilters = {
    search: filters.searchQuery || undefined,
    applicationStatus: filters.applicationStatus === 'all' ? undefined : 
                      filters.applicationStatus === 'applied' ? 'applied' as const : 
                      filters.applicationStatus === 'not-applied' ? 'not-applied' as const : undefined,
    workMode: filters.workMode === 'all' ? undefined : filters.workMode as any,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder as const
  }
  
  const { jobs, isLoading, pagination } = useJobs(currentPage, 10, apiFilters)
  
  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filters.searchQuery, filters.applicationStatus, filters.workMode, filters.sortBy])


  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <NewJobDialog
          trigger={
            <PrimaryButton>
              <Plus className="mr-2 h-4 w-4" />
              Add Job
            </PrimaryButton>
          }
        />
      </div>

      {/* Filters - Always show filters */}
      <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs..."
              value={filters.searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          
          {/* Application Status Filter */}
          <Select value={filters.applicationStatus} onValueChange={setApplicationStatus}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jobs</SelectItem>
              <SelectItem value="applied">Applied</SelectItem>
              <SelectItem value="not-applied">Not Applied</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Work Mode Filter */}
          <Select value={filters.workMode} onValueChange={setWorkMode}>
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue placeholder="Mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modes</SelectItem>
              <SelectItem value="remote">Remote</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
              <SelectItem value="onsite">On-site</SelectItem>
              <SelectItem value="flexible">Flexible</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Sort By */}
          <Select value={filters.sortBy} onValueChange={(value) => setSortBy(value as 'createdAt' | 'updatedAt')}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Newest First</SelectItem>
              <SelectItem value="updatedAt">Recently Updated</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Clear Filters Button */}
          {(filters.searchQuery || filters.applicationStatus !== 'all' || filters.workMode !== 'all' || filters.sortBy !== 'createdAt') && (
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={resetFilters}
              title="Clear Filters"
            >
              <Filter className="h-4 w-4" />
            </Button>
          )}
        </div>

      {!jobs || jobs.length === 0 ? (
        <div className="text-center py-12">
          <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {filters.searchQuery ? 'No jobs found' : 'No job postings yet'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {filters.searchQuery 
              ? 'Try adjusting your search criteria' 
              : 'Add a job posting to start optimizing your resume'}
          </p>
          {!filters.searchQuery && (
            <NewJobDialog
              trigger={
                <PrimaryButton>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Job
                </PrimaryButton>
              }
            />
          )}
        </div>
      ) : (
        <>
          <JobTable jobs={jobs || []} onRefresh={() => window.location.reload()} />
          
          {/* Pagination Controls */}
          {pagination && (
            <PaginationControls
              page={currentPage}
              totalPages={pagination.totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}
    </div>
  )
}