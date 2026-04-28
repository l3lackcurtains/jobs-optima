'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { MoreHorizontal, FileText, Download, Eye, Edit, Trash2, Copy, Zap } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { PrimaryButton, OutlineButton, GhostButton, IconButton } from '@/components/custom/Button'
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

interface BaseResumeCardProps {
  resume: Resume
  onView?: (resume: Resume) => void
  onEdit?: (resume: Resume) => void
  onDelete?: (resume: Resume) => void
  onDownload?: (resume: Resume) => void
  onDuplicate?: (resume: Resume) => void
  onOptimize?: (resume: Resume) => void
  className?: string
}

export default function BaseResumeCard({
  resume,
  onView,
  onEdit,
  onDelete,
  onDownload,
  onDuplicate,
  onOptimize,
  className
}: BaseResumeCardProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleAction = async (action: () => void | Promise<void>) => {
    setIsLoading(true)
    try {
      await action()
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string | Date) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy')
    } catch {
      return 'Unknown date'
    }
  }

  const getTotalSkills = (skills: any) => {
    if (!skills) return 0
    return (skills.technicalSkills?.length || 0) + 
           (skills.developmentPracticesMethodologies?.length || 0) + 
           (skills.personalSkills?.length || 0)
  }

  const getSkillsPreview = (skills: any) => {
    if (!skills) return []
    return [
      ...(skills.technicalSkills || []),
      ...(skills.developmentPracticesMethodologies || [])
    ]
  }

  return (
    <Card className={cn('group hover:shadow-lg transition-shadow duration-200', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3 min-w-0 flex-1 pr-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-lg truncate leading-tight" title={resume.title}>
                {resume.title || 'Untitled Resume'}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {resume.contactInfo?.email || 'No email provided'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  Base Resume
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {resume.category}
                </Badge>
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <GhostButton size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <MoreHorizontal className="w-4 h-4" />
              </GhostButton>
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
              <DropdownMenuItem onClick={() => onOptimize?.(resume)}>
                <Zap className="w-4 h-4 mr-2" />
                Optimize for Job
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
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Resume Details */}
        <div className="space-y-3">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Experience: </span>
              <span className="font-medium">{resume.experience?.length || 0}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Skills: </span>
              <span className="font-medium">{getTotalSkills(resume.skills)}</span>
            </div>
          </div>

          {/* Skills Preview */}
          {resume.skills && getTotalSkills(resume.skills) > 0 && (
            <div className="flex flex-wrap gap-1">
              {getSkillsPreview(resume.skills).slice(0, 3).map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {getTotalSkills(resume.skills) > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{getTotalSkills(resume.skills) - 3} more
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
            disabled={isLoading}
          >
            <Eye className="w-4 h-4 mr-2" />
            View
          </OutlineButton>
          <PrimaryButton 
            size="sm" 
            onClick={() => onOptimize?.(resume)}
            disabled={isLoading}
          >
            <Zap className="w-4 h-4 mr-2" />
            Optimize
          </PrimaryButton>
        </div>
      </CardFooter>
    </Card>
  )
}