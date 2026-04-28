'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/custom/page-header'
import { PrimaryButton } from '@/components/custom/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import ApplicationList from '@/components/application/ApplicationList'
import { Application, ApplicationStatus, APPLICATION_STATUS_LABELS } from '@/types/application'
import { useApplications, useApplicationStats } from '@/hooks/api/use-applications'
import { toast } from 'sonner'
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

export default function ApplicationsPage() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus | 'all'>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [applicationToDelete, setApplicationToDelete] = useState<Application | null>(null)
  
  const { 
    applications, 
    isLoading, 
    error,
    pagination,
    deleteApplication,
    updateApplicationStatus 
  } = useApplications(currentPage, 10, selectedStatus === 'all' ? undefined : selectedStatus)
  
  const { data: stats } = useApplicationStats()

  const filteredApplications = selectedStatus === 'all' 
    ? applications 
    : applications?.filter(app => app.status === selectedStatus)

  const statusCounts = {
    all: applications?.length || 0,
    ...Object.values(ApplicationStatus).reduce((acc, status) => {
      acc[status] = applications?.filter(app => app.status === status).length || 0
      return acc
    }, {} as Record<ApplicationStatus, number>)
  }

  const handleView = (application: Application) => {
    router.push(`/applications/${application._id}`)
  }

  const handleEdit = (application: Application) => {
    router.push(`/applications/${application._id}`)
  }

  const handleDelete = (application: Application) => {
    setApplicationToDelete(application)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!applicationToDelete) return
    
    try {
      await deleteApplication?.mutateAsync(applicationToDelete._id)
      toast.success('Application deleted successfully')
      setDeleteDialogOpen(false)
      setApplicationToDelete(null)
    } catch (error) {
      toast.error('Failed to delete application')
    }
  }

  const handleViewJob = (application: Application) => {
    if (application.job?._id) {
      router.push(`/jobs/${application.job._id}`)
    }
  }

  const handleUpdateStatus = async (applicationId: string, status: ApplicationStatus) => {
    try {
      await updateApplicationStatus.mutateAsync({ 
        id: applicationId, 
        status 
      })
      toast.success('Application status updated successfully')
    } catch (error) {
      toast.error('Failed to update application status')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Job Applications"
          description="Track and manage your job applications"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Applications' }
          ]}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Card>
          <CardContent className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Job Applications"
        description="Track and manage your job applications"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Applications' }
        ]}
      />

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(stats.byStatus[ApplicationStatus.REVIEWING] || 0) + 
                 (stats.byStatus[ApplicationStatus.INTERVIEWING] || 0)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Offers Received</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byStatus[ApplicationStatus.OFFERED] || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Applications List with Filter */}
      <ApplicationList
        applications={filteredApplications || []}
        isLoading={isLoading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onViewJob={handleViewJob}
        onUpdateStatus={handleUpdateStatus}
        selectedStatus={selectedStatus}
        onStatusChange={(newStatus) => {
          setSelectedStatus(newStatus)
          setCurrentPage(1) // Reset to page 1 when changing filter
        }}
        statusCounts={statusCounts}
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
            <AlertDialogTitle>Delete Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this application for "{applicationToDelete?.job?.title || 'this position'}" at {applicationToDelete?.job?.company || 'this company'}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setApplicationToDelete(null)}>
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