'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Briefcase,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  FileText,
  MessageSquare,
  Building,
  Target,
  ExternalLink,
  Eye
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PrimaryButton, OutlineButton, PreviewButton } from '@/components/custom/Button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  ApplicationStatus, 
  APPLICATION_STATUS_COLORS, 
  APPLICATION_STATUS_LABELS 
} from '@/types/application'
import { Job } from '@/types/job'
import { Resume } from '@/types/resume'
import { useJobApplication } from '@/hooks/api/use-applications'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { MarkdownViewer } from '@/components/ui/markdown-viewer'
import { CreateApplicationDialog } from './CreateApplicationDialog'

interface JobApplicationSectionProps {
  job: Job
  optimizedResumes: Resume[]
}

export function JobApplicationSection({ job, optimizedResumes }: JobApplicationSectionProps) {
  const { application, hasApplication, createJobApplication, updateJobApplication } = useJobApplication(job._id)
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus>()
  const router = useRouter()


  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    if (!application) return
    
    try {
      await updateJobApplication.mutateAsync({ status: newStatus })
      setSelectedStatus(newStatus)
    } catch (error) {
      // Error handled by hook
    }
  }


  if (!hasApplication) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Job Application
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No application created for this job yet</p>
            <CreateApplicationDialog
              job={job}
              optimizedResumes={optimizedResumes}
              trigger={
                <PrimaryButton>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Application
                </PrimaryButton>
              }
            />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!application) return null

  const statusColor = APPLICATION_STATUS_COLORS[application.status] || 'gray'
  const statusLabel = APPLICATION_STATUS_LABELS[application.status] || application.status

  // Find the currently used optimized resume
  const currentResume = optimizedResumes.find(resume => resume._id === application.optimizedResumeId)

  return (
    <div className="space-y-6">
      {/* Application Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Job Application
            </div>
            <Badge variant="secondary" className={`${statusColor} text-white`}>
              {statusLabel}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Selector */}
          <div className="space-y-2">
            <Label>Application Status</Label>
            <Select 
              value={application.status} 
              onValueChange={(value: ApplicationStatus) => handleStatusChange(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(ApplicationStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {APPLICATION_STATUS_LABELS[status] || status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Application Date */}
          {application.applicationDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              Applied on {format(new Date(application.applicationDate), 'PPP')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resume Being Used */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Resume
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentResume ? (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-medium">
                    {currentResume.title || `${currentResume.contactInfo?.name || 'Untitled Resume'}`}
                  </h4>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Created {format(new Date(currentResume.createdAt), 'MMM dd, yyyy')}</span>
                    {currentResume.isOptimized && (
                      <Badge variant="secondary" className="text-xs">
                        Optimized
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <PreviewButton
                size="sm"
                onClick={() => router.push(`/resumes/${currentResume._id}`)}
              >
                <Eye className="w-4 h-4 mr-2" />
                View Resume
              </PreviewButton>
            </div>
          ) : (
            <div className="text-center p-4 border border-dashed rounded-lg">
              <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Resume not found</p>
              <p className="text-xs text-muted-foreground mt-1">The resume used for this application may have been deleted</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cover Letter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Cover Letter
            </div>
            {/* AI Generate and Edit buttons removed */}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            {application.coverLetter ? (
              <MarkdownViewer content={application.coverLetter} />
            ) : (
              <p className="text-muted-foreground">No cover letter added yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Questions & Answers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Questions and Answers
            </div>
            {/* AI Generate button removed */}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {application.questionsAnswers && application.questionsAnswers.length > 0 ? (
            <div className="space-y-6">
              {application.questionsAnswers.map((qa, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium">{qa.question}</h4>
                    {/* AI Generate and Edit buttons removed */}
                  </div>
                  
                  <MarkdownViewer content={qa.answer} className="text-sm" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No questions and answers added yet</p>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Notes
            </div>
            {/* Edit button removed */}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            {application.notes ? (
              <p className="whitespace-pre-wrap">{application.notes}</p>
            ) : (
              <p className="text-muted-foreground">No notes added yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}