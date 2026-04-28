'use client'

import {
  Eye,
  Edit,
  MoreHorizontal,
  Building,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Target,
  Trash2
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
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu'
import { 
  Application,
  ApplicationStatus, 
  APPLICATION_STATUS_LABELS 
} from '@/types/application'
import { format } from 'date-fns'
import { truncateMiddle } from '@/lib/utils/truncate'

interface ApplicationTableProps {
  applications: Application[]
  onView: (application: Application) => void
  onEdit: (application: Application) => void
  onDelete?: (application: Application) => void
  onViewJob?: (application: Application) => void
  onUpdateStatus?: (applicationId: string, status: ApplicationStatus) => void
}

export default function ApplicationTable({
  applications,
  onView,
  onEdit,
  onDelete,
  onViewJob,
  onUpdateStatus
}: ApplicationTableProps) {
  const getStatusIcon = (status: ApplicationStatus) => {
    switch (status) {
      case ApplicationStatus.DRAFT:
        return <Clock className="w-4 h-4" />
      case ApplicationStatus.APPLIED:
        return <Target className="w-4 h-4" />
      case ApplicationStatus.REVIEWING:
      case ApplicationStatus.INTERVIEWING:
        return <AlertCircle className="w-4 h-4" />
      case ApplicationStatus.OFFERED:
      case ApplicationStatus.ACCEPTED:
        return <CheckCircle className="w-4 h-4" />
      case ApplicationStatus.REJECTED:
      case ApplicationStatus.WITHDRAWN:
        return <XCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getStatusColorClass = (status: ApplicationStatus) => {
    const colorMap: Record<ApplicationStatus, string> = {
      [ApplicationStatus.DRAFT]: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      [ApplicationStatus.APPLIED]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      [ApplicationStatus.REVIEWING]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      [ApplicationStatus.INTERVIEWING]: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      [ApplicationStatus.OFFERED]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      [ApplicationStatus.REJECTED]: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      [ApplicationStatus.ACCEPTED]: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
      [ApplicationStatus.WITHDRAWN]: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
    }
    return colorMap[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
  }

  const getWorkModeColor = (workMode: string) => {
    const colors: { [key: string]: string } = {
      'remote': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'onsite': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'hybrid': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
    }
    return colors[workMode?.toLowerCase()] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
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

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Position</TableHead>
            <TableHead className="hidden sm:table-cell">Company</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Applied</TableHead>
            <TableHead className="hidden lg:table-cell">Category</TableHead>
            <TableHead className="hidden lg:table-cell">Work Mode</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                No applications found
              </TableCell>
            </TableRow>
          ) : (
            applications.map((application) => (
              <TableRow 
                key={application._id} 
                className="cursor-pointer" 
                onClick={() => onView(application)}
              >
                <TableCell className="font-medium max-w-[200px]">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <div className="font-medium">{truncateMiddle(application.job?.title || 'Position', 30)}</div>
                          {application.job?.location && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{application.job.location}</span>
                            </div>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div>
                          <p className="font-medium">{application.job?.title || 'Position'}</p>
                          {application.job?.location && <p className="text-xs">{application.job.location}</p>}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell className="hidden sm:table-cell max-w-[150px]">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <div className="font-medium">{truncateMiddle(application.job?.company || 'Company', 25)}</div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{application.job?.company || 'Company'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  {onUpdateStatus ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Badge 
                          variant="secondary"
                          className={`cursor-pointer hover:opacity-80 transition-opacity ${getStatusColorClass(application.status)}`}
                        >
                          <span className="flex items-center gap-1">
                            {getStatusIcon(application.status)}
                            {APPLICATION_STATUS_LABELS[application.status]}
                          </span>
                        </Badge>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuRadioGroup 
                          value={application.status} 
                          onValueChange={(value) => onUpdateStatus(application._id, value as ApplicationStatus)}
                        >
                          {Object.values(ApplicationStatus).map((status) => (
                            <DropdownMenuRadioItem key={status} value={status}>
                              <span className="flex items-center gap-2">
                                {getStatusIcon(status)}
                                {APPLICATION_STATUS_LABELS[status]}
                              </span>
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Badge 
                      variant="secondary"
                      className={getStatusColorClass(application.status)}
                    >
                      <span className="flex items-center gap-1">
                        {getStatusIcon(application.status)}
                        {APPLICATION_STATUS_LABELS[application.status]}
                      </span>
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    {application.applicationDate
                      ? format(new Date(application.applicationDate), 'MMM d, yyyy')
                      : format(new Date(application.createdAt), 'MMM d, yyyy')}
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {application.job?.category ? (
                    <Badge variant="secondary" className={getCategoryColor(application.job.category)}>
                      {application.job.category}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {application.job?.workMode ? (
                    <Badge variant="secondary" className={getWorkModeColor(application.job.workMode)}>
                      {application.job.workMode}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
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
                        onView(application)
                      }}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        onEdit(application)
                      }}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Application
                      </DropdownMenuItem>
                      {application.job && onViewJob && (
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          onViewJob(application)
                        }}>
                          <Building className="mr-2 h-4 w-4" />
                          View Job
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation()
                              onDelete(application)
                            }}
                            className="text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
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