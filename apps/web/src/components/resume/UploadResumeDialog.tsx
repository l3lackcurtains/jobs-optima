'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileText, Loader2 } from 'lucide-react'
import { CustomDialog } from '@/components/custom/Dialog'
import { LoadingButton, OutlineButton } from '@/components/custom/Button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api/client'

interface UploadResumeDialogProps {
  trigger?: React.ReactNode
  children?: React.ReactNode
}

const RESUME_CATEGORIES = [
  'Frontend',
  'Backend', 
  'FullStack',
  'AI/ML',
  'Blockchain',
  'DevOps',
  'Mobile',
  'DataEngineering',
  'Security',
  'General'
]

export function UploadResumeDialog({ trigger, children }: UploadResumeDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        toast.error('Please select a PDF file')
        return
      }
      setFile(selectedFile)
      // Auto-generate title from filename if not set
      if (!title) {
        const fileName = selectedFile.name.replace('.pdf', '')
        setTitle(fileName.replace(/[-_]/g, ' '))
      }
    }
  }

  const handleUpload = async () => {
    if (!file || !title || !category) {
      toast.error('Please fill in all fields')
      return
    }

    setIsUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', title)
      formData.append('category', category)

      const response = await apiClient.post('/upload/resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      toast.success('Resume uploaded successfully!')
      
      // Navigate directly to resume view page
      const resumeId = response.data.resume?._id || response.data._id
      if (resumeId) {
        router.push(`/resumes/${resumeId}`)
        setOpen(false)
      } else {
        toast.error('Failed to get resume ID')
      }
      
      // Reset form
      setTitle('')
      setCategory('')
      setFile(null)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload resume')
    } finally {
      setIsUploading(false)
    }
  }

  const resetDialog = () => {
    setTitle('')
    setCategory('')
    setFile(null)
    setIsUploading(false)
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
      title="Upload Resume"
      description="Upload your resume PDF file and provide basic details to get started."
      icon={<Upload className="w-5 h-5 text-blue-600" />}
      size="md"
    >
      <div className="space-y-6">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">Resume File (PDF)</Label>
            <div className="flex items-center gap-3">
              <Input
                id="file"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                disabled={isUploading}
                className="flex-1"
              />
              {file && (
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <FileText className="w-4 h-4" />
                  {file.name}
                </div>
              )}
            </div>
          </div>

          {/* Title Input */}
          <div className="space-y-2">
            <Label htmlFor="title">Resume Title</Label>
            <Input
              id="title"
              placeholder="e.g., Senior Frontend Developer Resume"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isUploading}
            />
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory} disabled={isUploading}>
              <SelectTrigger>
                <SelectValue placeholder="Select resume category" />
              </SelectTrigger>
              <SelectContent>
                {RESUME_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <LoadingButton 
              onClick={handleUpload}
              disabled={!file || !title || !category}
              loading={isUploading}
              loadingText="Uploading..."
              loadingIcon={<Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              className="flex-1"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Resume
            </LoadingButton>
            <OutlineButton 
              onClick={() => setOpen(false)}
              disabled={isUploading}
            >
              Cancel
            </OutlineButton>
          </div>
      </div>
    </CustomDialog>
  )
}