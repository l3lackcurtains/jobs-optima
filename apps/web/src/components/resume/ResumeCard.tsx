'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { MoreHorizontal, FileText, Download, Eye, Edit, Trash2, Copy } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { IconButton, PrimaryButton, OutlineButton } from '@/components/custom/Button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Resume } from '@/types/resume'

interface ResumeCardProps {
  resume: Resume
  onView?: (resume: Resume) => void
  onEdit?: (resume: Resume) => void
  onDelete?: (resume: Resume) => void
  onDownload?: (resume: Resume) => void
  onDuplicate?: (resume: Resume) => void
  className?: string
}

export default function ResumeCard({
  resume,
  onView,
  onEdit,
  onDelete,
  onDownload,
  onDuplicate,
  className
}: ResumeCardProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleAction = async (action: () => void | Promise<void>) => {
    setIsLoading(true)
    try {
      await action()
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'optimized':
        return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
      case 'processing':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
      case 'error':
        return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
    }
  }

  const formatDate = (dateString: string | Date) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy')
    } catch {
      return 'Unknown date'
    }
  }

  return (
    <Card className={cn('group hover:shadow-lg transition-shadow duration-200', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3 min-w-0 flex-1 pr-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-lg truncate leading-tight" title={resume.title || resume.contactInfo?.name}>
                {resume.title || resume.contactInfo?.name || 'Untitled Resume'}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {resume.contactInfo?.email || 'No email provided'}
              </p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <IconButton size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <MoreHorizontal className="w-4 h-4" />
              </IconButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView?.(resume)}>
                <Eye className="w-4 h-4 mr-2" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit?.(resume)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAction(() => onDownload?.(resume))}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate?.(resume)}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete?.(resume)}
                className="text-red-600 focus:text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Resume Details */}
        <div className="space-y-3">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <Badge 
              variant="outline" 
              className={getStatusColor(resume.isOptimized ? 'optimized' : 'draft')}>
              {resume.isOptimized ? 'Optimized' : 'Draft'}
            </Badge>
            {resume.finalATSScore && (
              <div className="text-sm">
                <span className="text-muted-foreground">ATS Score: </span>
                <span className={cn(
                  'font-medium',
                  resume.finalATSScore>= 80 ? 'text-green-600' :
                  resume.finalATSScore>= 60 ? 'text-yellow-600' : 'text-red-600'
                )}>
                  {resume.finalATSScore}%
                </span>
              </div>
            )}
          </div>

          {/* Experience Summary */}
          {resume.experience && resume.experience.length> 0 && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">{resume.experience.length}</span> work experience(s)
            </div>
          )}

          {/* Skills Preview */}
          {resume.skills && (resume.skills.technicalSkills?.length> 0 || resume.skills.developmentPracticesMethodologies?.length> 0) && (
            <div className="flex flex-wrap gap-1">
              {[
                ...(resume.skills.technicalSkills || []),
                ...(resume.skills.developmentPracticesMethodologies || [])
              ].slice(0, 3).map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {(resume.skills.technicalSkills?.length || 0) + (resume.skills.developmentPracticesMethodologies?.length || 0)> 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{(resume.skills.technicalSkills?.length || 0) + (resume.skills.developmentPracticesMethodologies?.length || 0) - 3} more
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="px-6 py-4 bg-muted/20 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Updated {formatDate(resume.updatedAt)}
        </div>
        <div className="flex space-x-2">
          <OutlineButton 
            size="sm" 
            onClick={() => onView?.(resume)}
            disabled={isLoading}>
            <Eye className="w-4 h-4 mr-2" />
            View
          </OutlineButton>
          <PrimaryButton 
            size="sm" 
            onClick={() => onEdit?.(resume)}
            disabled={isLoading}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </PrimaryButton>
        </div>
      </CardFooter>
    </Card>
  )
}