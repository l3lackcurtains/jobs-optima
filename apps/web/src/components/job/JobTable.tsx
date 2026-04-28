'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  MapPin, 
  Calendar, 
  ExternalLink,
  Trash2,
  Eye,
  Sparkles,
  MoreHorizontal,
  DollarSign,
  FileText,
  Briefcase,
  Hash,
  CheckCircle,
  Clock
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
import { Job } from '@/types/job'
import { ApplicationStatus, APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS } from '@/types/application'
import { apiClient } from '@/lib/api/client'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { OptimizeResumeDialog } from './OptimizeResumeDialog'
import { truncateMiddle } from '@/lib/utils/truncate'

interface JobTableProps {
  jobs: Job[]
  onRefresh: () => void
}

export default function JobTable({ jobs, onRefresh }: JobTableProps) {
  const router = useRouter()
  const [selectedJobForOptimize, setSelectedJobForOptimize] = useState<Job | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null)
  
  const handleDelete = (job: Job) => {
    setJobToDelete(job)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!jobToDelete) return
    
    try {
      await apiClient.delete(`/jobs/${jobToDelete._id}`)
      toast.success('Job deleted successfully')
      setDeleteDialogOpen(false)
      setJobToDelete(null)
      onRefresh()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete job')
    }
  }


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

  const getWorkModeColor = (workMode: string) => {
    const colors: { [key: string]: string } = {
      'remote': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'hybrid': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'onsite': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
    }
    return colors[workMode] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }

  const formatSalary = (min?: number, max?: number, period?: string) => {
    if (!min && !max) return null
    const periodText = period ? `/${period}` : ''
    if (min && max) {
      return `$${(min/1000).toFixed(0)}K-$${(max/1000).toFixed(0)}K${periodText}`
    }
    if (min) {
      return `$${(min/1000).toFixed(0)}K+${periodText}`
    }
    if (max) {
      return `Up to $${(max/1000).toFixed(0)}K${periodText}`
    }
    return null
  }

  const getKeywordsCount = (job: Job) => {
    if (!job.keywords) return 0
    return (job.keywords.actionVerbs?.length || 0) + 
           (job.keywords.hardSkills?.length || 0) + 
           (job.keywords.softSkills?.length || 0)
  }

  const getApplicationStatusColor = (status: ApplicationStatus) => {
    const colors: { [key: string]: string } = {
      [ApplicationStatus.DRAFT]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      [ApplicationStatus.APPLIED]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      [ApplicationStatus.REVIEWING]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      [ApplicationStatus.INTERVIEWING]: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      [ApplicationStatus.OFFERED]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      [ApplicationStatus.REJECTED]: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      [ApplicationStatus.ACCEPTED]: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
      [ApplicationStatus.WITHDRAWN]: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400',
    }
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden sm:table-cell">Company</TableHead>
              <TableHead className="hidden md:table-cell">Application</TableHead>
              <TableHead className="hidden lg:table-cell">Work Mode</TableHead>
              <TableHead className="hidden lg:table-cell">Category</TableHead>
              <TableHead className="hidden xl:table-cell">Salary</TableHead>
              <TableHead className="hidden xl:table-cell">Keywords</TableHead>
              <TableHead className="hidden xl:table-cell">Resumes</TableHead>
              <TableHead className="hidden xl:table-cell">Added</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                  No jobs found
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => (
                <TableRow key={job._id} className="cursor-pointer" onClick={() => router.push(`/jobs/${job._id}`)}>
                  <TableCell className="font-medium max-w-[200px]">
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium">{truncateMiddle(job.title, 30)}</div>
                              {job.location && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                  <MapPin className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">{job.location}</span>
                                </div>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div>
                              <p className="font-medium">{job.title}</p>
                              {job.location && <p className="text-xs">{job.location}</p>}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {job.url && (
                        <a 
                          href={job.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-muted-foreground hover:text-primary flex-shrink-0"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell max-w-[150px]">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <div className="font-medium">{truncateMiddle(job.company, 25)}</div>
                            {job.jobType && (
                              <div className="text-xs text-muted-foreground mt-1 capitalize">
                                {job.jobType.replace('-', ' ')}
                              </div>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{job.company}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {job.applicationStatus ? (
                      <Badge 
                        variant="secondary" 
                        className={getApplicationStatusColor(job.applicationStatus as ApplicationStatus)}
                      >
                        {APPLICATION_STATUS_LABELS[job.applicationStatus as ApplicationStatus] || job.applicationStatus}
                      </Badge>
                    ) : job.application ? (
                      <Badge 
                        variant="secondary" 
                        className={getApplicationStatusColor(job.application.status)}
                      >
                        {APPLICATION_STATUS_LABELS[job.application.status] || job.application.status}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {job.workMode ? (
                      <Badge variant="secondary" className={getWorkModeColor(job.workMode)}>
                        {job.workMode.charAt(0).toUpperCase() + job.workMode.slice(1)}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Badge variant="secondary" className={getCategoryColor(job.category)}>
                      {job.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    {formatSalary(job.salaryMin, job.salaryMax, job.salaryPeriod) ? (
                      <div className="flex items-center gap-1 text-sm">
                        <DollarSign className="w-3 h-3 text-green-600" />
                        {formatSalary(job.salaryMin, job.salaryMax, job.salaryPeriod)}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <div className="flex items-center gap-1 text-sm">
                      <Hash className="w-3 h-3 text-blue-600" />
                      <span>{getKeywordsCount(job)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <div className="flex items-center gap-1 text-sm">
                      <FileText className="w-3 h-3 text-orange-600" />
                      <span>{job.optimizedResumeIds?.length || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <div className="flex items-center gap-1 text-muted-foreground text-sm">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(job.createdAt), 'MMM d, yyyy')}
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
                          router.push(`/jobs/${job._id}`)
                        }}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          setSelectedJobForOptimize(job)
                        }}>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Optimize Resume
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(job)
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

      {selectedJobForOptimize && (
        <OptimizeResumeDialog job={selectedJobForOptimize} />
      )}
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{jobToDelete?.title}" at {jobToDelete?.company}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setJobToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}