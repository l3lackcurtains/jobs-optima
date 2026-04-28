'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X, AlertCircle } from 'lucide-react'
import { PrimaryButton, OutlineButton, GhostButton, IconButton } from '@/components/custom/Button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useResumes } from '@/hooks/api/use-resumes'
import ParsingFeedback from './ParsingFeedback'
import { Resume } from '@/types/resume'

interface ResumeUploaderProps {
  onUploadSuccess?: (resumeId: string) => void
  onUploadError?: (error: string) => void
  showParsingFeedback?: boolean
  className?: string
}

export default function ResumeUploader({ 
  onUploadSuccess, 
  onUploadError, 
  showParsingFeedback = true,
  className 
}: ResumeUploaderProps) {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadedResume, setUploadedResume] = useState<Resume | null>(null)
  const [showParsing, setShowParsing] = useState(false)
  const [resumeTitle, setResumeTitle] = useState('')
  const [category, setCategory] = useState('General')

  const categories = [
    'Frontend',
    'Backend',
    'FullStack',
    'AI/ML',
    'Blockchain',
    'DevOps',
    'Mobile',
    'DataEngineering',
    'Security',
    'General',
  ]

  const { uploadResume } = useResumes()

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setUploadError(null)
    
    if (rejectedFiles.length > 0) {
      const error = rejectedFiles[0].errors[0]
      setUploadError(error.message)
      return
    }

    const file = acceptedFiles[0]
    if (file) {
      setSelectedFile(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false
  })

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadProgress(0)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      if (resumeTitle.trim()) {
        formData.append('title', resumeTitle.trim())
      }
      formData.append('category', category)

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      const result = await uploadResume.mutateAsync(formData)
      
      clearInterval(progressInterval)
      setUploadProgress(100)

      if (showParsingFeedback) {
        setTimeout(() => {
          setIsUploading(false)
          setUploadProgress(0)
          setUploadedResume(result.resume)
          setShowParsing(true)
        }, 500)
      } else {
        setTimeout(() => {
          setIsUploading(false)
          setUploadProgress(0)
          setSelectedFile(null)
          onUploadSuccess?.(result.resume._id)
        }, 500)
      }

    } catch (error: any) {
      setIsUploading(false)
      setUploadProgress(0)
      const errorMessage = error.response?.data?.message || 'Upload failed. Please try again.'
      setUploadError(errorMessage)
      onUploadError?.(errorMessage)
    }
  }

  const handleCancel = () => {
    setSelectedFile(null)
    setUploadError(null)
    setUploadProgress(0)
    setUploadedResume(null)
    setShowParsing(false)
  }

  const handleParsingContinue = () => {
    if (uploadedResume) {
      onUploadSuccess?.(uploadedResume._id)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Show parsing feedback if upload is complete and parsing is enabled
  if (showParsing && uploadedResume) {
    return (
      <div className={cn('w-full', className)}>
        <ParsingFeedback
          resume={uploadedResume}
          isParsingComplete={true}
          onContinue={handleParsingContinue}
        />
      </div>
    )
  }

  return (
    <div className={cn('w-full max-w-2xl mx-auto', className)}>
      {!selectedFile ? (
        <Card
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed p-8 text-center cursor-pointer transition-colors hover:bg-muted/50',
            isDragActive && !isDragReject && 'border-primary bg-primary/5',
            isDragReject && 'border-destructive bg-destructive/5'
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center space-y-4">
            <div className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center',
              isDragActive && !isDragReject ? 'bg-primary/10' : 'bg-muted'
            )}>
              <Upload className={cn(
                'w-8 h-8',
                isDragActive && !isDragReject ? 'text-primary' : 'text-muted-foreground'
              )} />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium">
                {isDragActive ? 'Drop your resume here' : 'Upload your resume'}
              </h3>
              <p className="text-sm text-muted-foreground">
                Drag and drop your file here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Supports PDF, DOCX, DOC, TXT (max 5MB)
              </p>
            </div>

            {isDragReject && (
              <Alert className="max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please upload a valid resume file (PDF, DOCX, DOC, or TXT)
                </AlertDescription>
              </Alert>
            )}
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="space-y-4">
            {/* File Info */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              {!isUploading && (
                <GhostButton
                 
                  size="sm"
                  onClick={handleCancel}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </GhostButton>
              )}
            </div>

            {/* Title Input */}
            {!isUploading && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="title">Resume Title (Optional)</Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="e.g., Senior Software Engineer Resume"
                    value={resumeTitle}
                    onChange={(e) => setResumeTitle(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave blank to use the filename as title
                  </p>
                </div>

                {/* Category Select */}
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Select the category that best matches your expertise
                  </p>
                </div>
              </>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            {/* Error Message */}
            {uploadError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            {!isUploading && (
              <div className="flex justify-end space-x-2">
                <OutlineButton onClick={handleCancel}>
                  Cancel
                </OutlineButton>
                <PrimaryButton onClick={handleUpload} disabled={uploadResume.isPending}>
                  {uploadResume.isPending ? 'Uploading...' : 'Upload Resume'}
                </PrimaryButton>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}