'use client'

import {
  Eye,
  Edit,
  Download,
  Trash2,
  Copy,
  Zap,
  FileText,
  MoreHorizontal,
  Mail,
  Calendar,
  Target,
  MapPin,
  CheckCircle,
  XCircle,
  FileCheck
} from 'lucide-react'
import { IconButton } from '@/components/custom/Button'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Resume } from '@/types/resume'
import { format } from 'date-fns'
import { useApplications } from '@/hooks/api/use-applications'
import { useJobs } from '@/hooks/api/use-jobs'
import { useMemo } from 'react'
import { truncateResumeName } from '@/lib/utils/truncate'

interface ResumeTableProps {
  resumes: Resume[]
  onView: (resume: Resume) => void
  onEdit: (resume: Resume) => void
  onDelete: (resume: Resume) => void
  onDownload: (resume: Resume) => void
  onDuplicate?: (resume: Resume) => void
  onOptimize?: (resume: Resume) => void
  onViewReport?: (resume: Resume) => void
}

export default function ResumeTable({
  resumes,
  onView,
  onEdit,
  onDelete,
  onDownload,
  onDuplicate,
  onOptimize,
  onViewReport
}: ResumeTableProps) {
  // Fetch all applications to check which resumes are in use
  const { applications } = useApplications()
  const { jobs } = useJobs()
  
  // Create a map of which resumes are being used in applications
  const resumeApplicationsMap = useMemo(() => {
    const map = new Map<string, boolean>()
    
    if (applications) {
      applications.forEach(app => {
        if (app.optimizedResumeId) {
          map.set(app.optimizedResumeId, true)
        }
        if (app.baseResumeId) {
          map.set(app.baseResumeId, true)
        }
      })
    }
    
    return map
  }, [applications])
  
  // Create a map of job information by jobId
  const jobsMap = useMemo(() => {
    const map = new Map<string, { company: string; title: string }>()
    
    if (jobs) {
      jobs.forEach(job => {
        map.set(job._id, { company: job.company, title: job.title })
      })
    }
    
    return map
  }, [jobs])
  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Frontend': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'Backend': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      'FullStack': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'AI/ML': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      'Blockchain': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
      'DevOps': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      'Mobile': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
      'DataEngineering': 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
      'Security': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      'General': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
    return colors[category] || colors['General']
  }

  const getScoreBadge = (score: number | undefined) => {
    if (!score) return null
    
    const variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'outline'
    let className = ''
    
    if (score >= 80) {
      className = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    } else if (score >= 60) {
      className = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    } else {
      className = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    }
    
    return (
      <Badge variant={variant} className={className}>
        {score}%
      </Badge>
    )
  }


  const getKeywordMatchRate = (resume: Resume) => {
    if (!resume.matchedKeywords?.length && !resume.unmatchedKeywords?.length) return null
    const matched = resume.matchedKeywords?.length || 0
    const total = matched + (resume.unmatchedKeywords?.length || 0)
    if (total === 0) return null
    return Math.round((matched / total) * 100)
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="hidden sm:table-cell">Type</TableHead>
            <TableHead className="hidden md:table-cell">Category</TableHead>
            <TableHead className="hidden md:table-cell">ATS Score</TableHead>
            <TableHead className="hidden lg:table-cell">Match Rate</TableHead>
            <TableHead className="hidden lg:table-cell">In Use</TableHead>
            <TableHead className="hidden xl:table-cell">Contact</TableHead>
            <TableHead className="hidden xl:table-cell">Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {resumes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                No resumes found
              </TableCell>
            </TableRow>
          ) : (
            resumes.map((resume) => (
              <TableRow key={resume._id} className="cursor-pointer" onClick={() => onView(resume)}>
                <TableCell className="font-medium max-w-[250px]">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <div className="font-medium">
                            {(() => {
                              const name = resume.contactInfo?.name || 'Unknown';
                              const title = resume.title;
                              let fullName: string;
                              
                              if (title && title.toLowerCase().includes('resume')) {
                                fullName = title;
                              } else if (title) {
                                fullName = `${name}'s ${title} Resume`;
                              } else {
                                fullName = `${name}'s Resume`;
                              }
                              
                              return truncateResumeName(fullName, 35);
                            })()}
                          </div>
                          {resume.isOptimized && resume.jobId && jobsMap.get(resume.jobId) && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {jobsMap.get(resume.jobId)!.company} - {jobsMap.get(resume.jobId)!.title}
                            </div>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {(() => {
                            const name = resume.contactInfo?.name || 'Unknown';
                            const title = resume.title;
                            
                            if (title && title.toLowerCase().includes('resume')) {
                              return title;
                            } else if (title) {
                              return `${name}'s ${title} Resume`;
                            } else {
                              return `${name}'s Resume`;
                            }
                          })()}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {resume.isOptimized ? (
                    <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                      <Zap className="w-3 h-3 mr-1" />
                      Optimized
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <FileText className="w-3 h-3 mr-1" />
                      Base
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant="secondary" className={getCategoryColor(resume.category)}>
                    {resume.category}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {resume.finalATSScore ? (
                    getScoreBadge(resume.finalATSScore)
                  ) : resume.initialATSScore ? (
                    getScoreBadge(resume.initialATSScore)
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {getKeywordMatchRate(resume) !== null ? (
                    <div className="flex items-center gap-1 text-sm">
                      {getKeywordMatchRate(resume)! >= 70 ? (
                        <CheckCircle className="w-3 h-3 text-green-600" />
                      ) : (
                        <XCircle className="w-3 h-3 text-red-600" />
                      )}
                      <span>{getKeywordMatchRate(resume)}%</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {resumeApplicationsMap.get(resume._id) ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      <FileCheck className="w-3 h-3 mr-1" />
                      In Use
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">No</span>
                  )}
                </TableCell>
                <TableCell className="hidden xl:table-cell max-w-[200px]">
                  <div className="space-y-1">
                    {resume.contactInfo?.email && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Mail className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{resume.contactInfo.email}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{resume.contactInfo.email}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {resume.contactInfo?.location && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{resume.contactInfo.location}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{resume.contactInfo.location}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  <div className="flex items-center gap-1 text-muted-foreground text-sm">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(resume.createdAt), 'MMM d, yyyy')}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <IconButton>
                        <MoreHorizontal className="h-4 w-4" />
                      </IconButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        onView(resume)
                      }}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        onEdit(resume)
                      }}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        onDownload(resume)
                      }}>
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                      </DropdownMenuItem>
                      {onDuplicate && (
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          onDuplicate(resume)
                        }}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                      )}
                      {!resume.isOptimized && onOptimize && (
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          onOptimize(resume)
                        }}>
                          <Zap className="mr-2 h-4 w-4" />
                          Optimize
                        </DropdownMenuItem>
                      )}
                      {resume.isOptimized && onViewReport && (
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          onViewReport(resume)
                        }}>
                          <Target className="mr-2 h-4 w-4" />
                          View ATS Report
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(resume)
                        }}
                        className="text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}