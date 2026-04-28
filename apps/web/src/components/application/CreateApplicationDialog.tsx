'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  FileText, 
  Briefcase, 
  Save,
  Loader2,
  ClipboardList
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { PrimaryButton, OutlineButton } from '@/components/custom/Button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Resume } from '@/types/resume'
import { Job } from '@/types/job'
import { ApplicationStatus, CreateApplicationData } from '@/types/application'
import { useApplications } from '@/hooks/api/use-applications'
import { toast } from 'sonner'

interface CreateApplicationDialogProps {
  resume: Resume
  job?: Job
  trigger?: React.ReactNode
  children?: React.ReactNode
}

export function CreateApplicationDialog({ 
  resume, 
  job, 
  trigger, 
  children 
}: CreateApplicationDialogProps) {
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { createApplication } = useApplications()

  const handleSubmit = async () => {
    if (!job) {
      toast.error('Please select a job for this application')
      return
    }

    setIsSubmitting(true)
    
    try {
      const applicationData: CreateApplicationData = {
        jobId: job._id,
        optimizedResumeId: resume._id,
        baseResumeId: resume.parentResumeId || resume._id,
        status: ApplicationStatus.DRAFT,
        applicationDate: new Date(), // Default to today's date
        notes,
      }

      const result = await createApplication.mutateAsync(applicationData)
      
      setOpen(false)
      
      // Navigate to the application detail page
      if (result._id) {
        router.push(`/applications/${result._id}`)
      }
    } catch (error) {
      console.error('Failed to create application:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-orange-600" />
            Create Job Application
          </DialogTitle>
          <DialogDescription>
            Start tracking your application for {job?.title || 'this position'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Resume and Job Info */}
          <div className="space-y-3">
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Resume</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{resume.title}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {resume.category}
                    </Badge>
                    {resume.isOptimized && (
                      <Badge className="text-xs bg-orange-100 text-orange-800">
                        Optimized
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {job && (
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Job Position</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{job.title}</p>
                    <p className="text-xs text-muted-foreground">{job.company}</p>
                    {job.location && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        📍 {job.location}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any initial notes or reminders..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              You can add more details like cover letter and tracking information later
            </p>
          </div>
        </div>

        <DialogFooter>
          <OutlineButton
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </OutlineButton>
          <PrimaryButton
            onClick={handleSubmit}
            disabled={isSubmitting}
            loading={isSubmitting}
            loadingText="Creating..."
          >
            <Save className="w-4 h-4 mr-2" />
            Start Application
          </PrimaryButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}