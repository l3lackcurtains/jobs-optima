'use client'

import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { PrimaryButton, OutlineButton, GhostButton, IconButton } from '@/components/custom/Button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import ResumeTable from './ResumeTable'
import { UploadResumeDialog } from './UploadResumeDialog'
import { Resume } from '@/types/resume'
import { cn } from '@/lib/utils'

interface ResumeListProps {
  resumes: Resume[]
  isLoading: boolean
  onView: (resume: Resume) => void
  onEdit: (resume: Resume) => void
  onDelete: (resume: Resume) => void
  onDownload: (resume: Resume) => void
  onDuplicate?: (resume: Resume) => void
  onOptimize?: (resume: Resume) => void
  onViewReport?: (resume: Resume) => void
  className?: string
}

export default function ResumeList({
  resumes = [],
  isLoading,
  onView,
  onEdit,
  onDelete,
  onDownload,
  onDuplicate,
  onOptimize,
  onViewReport,
  className
}: ResumeListProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredResumes = resumes.filter((resume) => {
    const matchesSearch = searchQuery === '' || 
      (resume.title?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (resume.contactInfo?.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (resume.contactInfo?.email?.toLowerCase().includes(searchQuery.toLowerCase()))

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

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-4 p-6 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div>
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-4 w-full" />
                <div className="flex space-x-1">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Action Button */}
      <div className="flex justify-end">
        <UploadResumeDialog
          trigger={
            <PrimaryButton>
              <Plus className="w-4 h-4 mr-2" />
              Upload Resume
            </PrimaryButton>
          }
        />
      </div>

      {/* Search */}
      {resumes.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search resumes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      )}


      {/* Resume Table */}
      {filteredResumes.length === 0 && !isLoading ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Plus className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">
            {searchQuery ? 'No resumes found' : 'No resumes yet'}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            {searchQuery 
              ? 'Try adjusting your search criteria'
              : 'Upload your first resume to get started with AI-powered optimization'
            }
          </p>
          {!searchQuery && (
            <UploadResumeDialog
              trigger={
                <PrimaryButton>
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Your First Resume
                </PrimaryButton>
              }
            />
          )}
        </div>
      ) : (
        <ResumeTable
          resumes={filteredResumes}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onDownload={onDownload}
          onDuplicate={onDuplicate}
          onOptimize={onOptimize}
          onViewReport={onViewReport}
        />
      )}
    </div>
  )
}