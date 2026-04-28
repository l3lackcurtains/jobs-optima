'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, ClipboardList } from 'lucide-react'
import { PrimaryButton, OutlineButton } from '@/components/custom/Button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import ApplicationTable from './ApplicationTable'
import { cn } from '@/lib/utils'
import { Application, ApplicationStatus, APPLICATION_STATUS_LABELS } from '@/types/application'

interface ApplicationListProps {
  applications: Application[]
  isLoading: boolean
  onView: (application: Application) => void
  onEdit: (application: Application) => void
  onDelete?: (application: Application) => void
  onViewJob?: (application: Application) => void
  onUpdateStatus?: (applicationId: string, status: ApplicationStatus) => void
  selectedStatus?: ApplicationStatus | 'all'
  onStatusChange?: (status: ApplicationStatus | 'all') => void
  statusCounts?: { all: number } & Record<ApplicationStatus, number>
  className?: string
}

export default function ApplicationList({
  applications = [],
  isLoading,
  onView,
  onEdit,
  onDelete,
  onViewJob,
  onUpdateStatus,
  selectedStatus = 'all',
  onStatusChange,
  statusCounts,
  className
}: ApplicationListProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredApplications = applications.filter((application) => {
    const matchesSearch = searchQuery === '' || 
      (application.job?.title?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (application.job?.company?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (application.job?.location?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (application.notes?.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesSearch
  })

  if (isLoading) {
    return (
      <div className={cn('space-y-6', className)}>
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        {/* Filters Skeleton */}
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>

        {/* Table Skeleton */}
        <div className="rounded-md border">
          <div className="p-4 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div>
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Action Button */}
      <div className="flex justify-end">
        <PrimaryButton onClick={() => router.push('/resumes')}>
          <Plus className="w-4 h-4 mr-2" />
          New Application
        </PrimaryButton>
      </div>

      {/* Filter and Search Row */}
      <div className="flex items-center gap-4">
        {/* Search */}
        {applications.length > 0 && (
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search applications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        )}
        
        {/* Status Filter */}
        {onStatusChange && statusCounts && (
          <Select value={selectedStatus} onValueChange={(value: any) => onStatusChange(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({statusCounts.all})</SelectItem>
              {Object.values(ApplicationStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {APPLICATION_STATUS_LABELS[status]} ({statusCounts[status]})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Application Table */}
      {filteredApplications.length === 0 && !isLoading ? (
        <div className="text-center py-12">
          <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {searchQuery ? 'No applications found' : 'No applications yet'}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            {searchQuery 
              ? 'Try adjusting your search criteria'
              : 'Start tracking your job applications'
            }
          </p>
          {!searchQuery && (
            <OutlineButton 
              onClick={() => window.location.href = '/resumes'}
            >
              Create Your First Application
            </OutlineButton>
          )}
        </div>
      ) : (
        <ApplicationTable
          applications={filteredApplications}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewJob={onViewJob}
          onUpdateStatus={onUpdateStatus}
        />
      )}
    </div>
  )
}