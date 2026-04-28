'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useResumes } from '@/hooks/api/use-resumes'
import ResumeList from '@/components/resume/ResumeList'
import { Resume } from '@/types/resume'
import { toast } from 'sonner'
import { PageHeader } from '@/components/custom/page-header'
import { PaginationControls } from '@/components/custom/PaginationControls'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function ResumesPage() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const { resumes, isLoading, pagination, deleteResume, exportPDF } = useResumes(currentPage, 10)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [resumeToDelete, setResumeToDelete] = useState<Resume | null>(null)


  const handleView = (resume: Resume) => {
    router.push(`/resumes/${resume._id}`)
  }

  const handleEdit = (resume: Resume) => {
    router.push(`/resumes/${resume._id}`)
  }

  const handleDelete = (resume: Resume) => {
    setResumeToDelete(resume)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!resumeToDelete) return
    
    try {
      await deleteResume.mutateAsync(resumeToDelete._id)
      toast.success('Resume deleted successfully')
      setDeleteDialogOpen(false)
      setResumeToDelete(null)
    } catch (error) {
      toast.error('Failed to delete resume')
    }
  }

  const handleDownload = async (resume: Resume) => {
    try {
      await exportPDF(resume._id)
    } catch (error) {
      toast.error('Failed to download PDF')
    }
  }

  const handleOptimize = (resume: Resume) => {
    router.push(`/optimize?resumeId=${resume._id}`)
  }

  const handleViewReport = (resume: Resume) => {
    if (resume.jobId) {
      router.push(`/optimize/reports/${resume._id}?jobId=${resume.jobId}`)
    } else {
      toast.error('No ATS report available for this resume')
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Resumes"
        description="Manage your resumes and create optimized versions for different job applications"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Resumes' }
        ]}
      />
      
      {/* Resume List */}
      <ResumeList
        resumes={resumes || []}
        isLoading={isLoading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDownload={handleDownload}
        onOptimize={handleOptimize}
        onViewReport={handleViewReport}
      />

      {/* Pagination Controls */}
      {pagination && (
        <PaginationControls
          page={currentPage}
          totalPages={pagination.totalPages}
          onPageChange={setCurrentPage}
        />
      )}
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resume</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{resumeToDelete?.title || resumeToDelete?.contactInfo?.name || 'this resume'}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setResumeToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}