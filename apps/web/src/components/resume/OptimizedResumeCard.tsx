'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { MoreHorizontal, Zap, Download, Eye, Edit, Trash2, Copy, FileText, Target } from 'lucide-react'
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

interface OptimizedResumeCardProps {
  resume: Resume
  onView?: (resume: Resume) => void
  onEdit?: (resume: Resume) => void
  onDelete?: (resume: Resume) => void
  onDownload?: (resume: Resume) => void
  onDuplicate?: (resume: Resume) => void
  onViewReport?: (resume: Resume) => void
  className?: string
}

export default function OptimizedResumeCard({
  resume,
  onView,
  onEdit,
  onDelete,
  onDownload,
  onDuplicate,
  onViewReport,
  className
}: OptimizedResumeCardProps) {
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/20'
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/20'
    return 'bg-red-100 dark:bg-red-900/20'
  }

  const getTotalSkills = (skills: any) => {
    if (!skills) return 0
    return (skills.technicalSkills?.length || 0) + 
           (skills.developmentPracticesMethodologies?.length || 0) + 
           (skills.personalSkills?.length || 0)
  }

  return (
    <Card className={cn('group hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-orange-500', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3 min-w-0 flex-1 pr-2">
            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-lg truncate leading-tight" title={resume.title}>
                {resume.title || 'Optimized Resume'}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {resume.contactInfo?.email || 'No email provided'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="default" className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300">
                  Optimized
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {resume.category}
                </Badge>
                {resume.optimizationProvider && (
                  <Badge variant="secondary" className="text-xs">
                    {resume.optimizationProvider.toUpperCase()}
                  </Badge>
                )}
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
              <DropdownMenuItem onClick={() => onViewReport?.(resume)}>
                <Target className="w-4 h-4 mr-2" />
                View ATS Report
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
          {/* ATS Score */}
          {(resume.finalATSScore || resume.initialATSScore) && (
            <div className={cn('p-3 rounded-lg', getScoreBg(resume.finalATSScore || 0))}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-muted-foreground">ATS Score:</span>
                  <div className="flex items-center gap-2">
                    {resume.initialATSScore && (
                      <>
                        <span className="text-sm line-through text-muted-foreground">
                          {resume.initialATSScore}%
                        </span>
                        <span className="text-xs">→</span>
                      </>
                    )}
                    <span className={cn('text-xl font-bold', getScoreColor(resume.finalATSScore || 0))}>
                      {resume.finalATSScore || 0}%
                    </span>
                  </div>
                </div>
                {resume.matchedKeywords && resume.matchedKeywords.length > 0 && (
                  <div className="text-right text-sm">
                    <div className="text-muted-foreground">Keywords Matched</div>
                    <div className="font-medium">{resume.matchedKeywords.length}</div>
                  </div>
                )}
              </div>
            </div>
          )}

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

          {/* Matched Keywords Preview */}
          {resume.matchedKeywords && resume.matchedKeywords.length > 0 && (
            <div>
              <div className="text-sm text-muted-foreground mb-2">Matched Keywords:</div>
              <div className="flex flex-wrap gap-1">
                {resume.matchedKeywords.slice(0, 4).map((keyword, index) => (
                  <Badge key={index} variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                    {keyword}
                  </Badge>
                ))}
                {resume.matchedKeywords.length > 4 && (
                  <Badge variant="secondary" className="text-xs">
                    +{resume.matchedKeywords.length - 4} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="px-6 py-4 bg-muted/20 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Optimized {formatDate(resume.createdAt)}
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
            onClick={() => onViewReport?.(resume)}
            disabled={isLoading}
          >
            <Target className="w-4 h-4 mr-2" />
            Report
          </PrimaryButton>
        </div>
      </CardFooter>
    </Card>
  )
}