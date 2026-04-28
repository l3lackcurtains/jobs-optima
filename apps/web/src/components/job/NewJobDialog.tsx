'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Briefcase } from 'lucide-react'
import { CustomDialog } from '@/components/custom/Dialog'
import { LoadingButton, OutlineButton } from '@/components/custom/Button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api/client'

interface NewJobDialogProps {
  trigger?: React.ReactNode
  children?: React.ReactNode
}


export function NewJobDialog({ trigger, children }: NewJobDialogProps) {
  const [open, setOpen] = useState(false)
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()

  const handleCreate = async () => {
    if (!description) {
      toast.error('Please provide a job description')
      return
    }

    setIsCreating(true)
    
    try {
      const jobData = {
        description: description.trim(),
        url: url.trim() || undefined,
      }

      const response = await apiClient.post('/jobs', jobData)

      toast.success('Job created successfully!')
      
      // Navigate directly to job view page  
      router.push(`/jobs/${response.data.job._id}`)
      setOpen(false)
      
      // Reset form
      resetForm()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create job')
    } finally {
      setIsCreating(false)
    }
  }

  const resetForm = () => {
    setDescription('')
    setUrl('')
  }

  const resetDialog = () => {
    resetForm()
    setIsCreating(false)
  }

  const handleClose = (open: boolean) => {
    if (!open) {
      resetDialog()
    }
    setOpen(open)
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={handleClose}
      trigger={trigger || children}
      title="Add New Job"
      description="Paste the job description and our AI will automatically extract title, company, location, and other details."
      icon={<Briefcase className="w-5 h-5 text-orange-600" />}
      size="lg"
    >
      <div className="space-y-4">
          {/* Description Textarea */}
          <div className="space-y-2">
            <Label htmlFor="description">Job Description *</Label>
            <Textarea
              id="description"
              placeholder="Paste the complete job description here... Our AI will automatically extract title, company, location, salary, and other details for you to review."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isCreating}
              rows={10}
              className="resize-none"
            />
            <div className="text-xs text-muted-foreground">
              {description.length} characters
            </div>
          </div>

          {/* Job URL */}
          <div className="space-y-2">
            <Label htmlFor="url">Job URL (Optional)</Label>
            <Input
              id="url"
              placeholder="https://company.com/jobs/123"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isCreating}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <LoadingButton 
              onClick={handleCreate}
              disabled={!description}
              loading={isCreating}
              loadingText="Processing Job..."
              className="flex-1"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Job
            </LoadingButton>
            <OutlineButton 
              onClick={() => setOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </OutlineButton>
          </div>
      </div>
    </CustomDialog>
  )
}