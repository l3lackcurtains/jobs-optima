'use client'

import {
  Eye,
  Edit,
  Trash2,
  Copy,
  Star,
  StarOff,
  MoreHorizontal,
  Mail,
  Calendar,
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Shield,
  FileText,
  User
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
import { Profile } from '@/types/profile'
import { format } from 'date-fns'

interface ProfileTableProps {
  profiles: Profile[]
  onView: (profile: Profile) => void
  onEdit: (profile: Profile) => void
  onDelete: (profile: Profile) => void
  onSetDefault: (profile: Profile) => void
  onDuplicate?: (profile: Profile) => void
}

export default function ProfileTable({
  profiles,
  onView,
  onEdit,
  onDelete,
  onSetDefault,
  onDuplicate,
}: ProfileTableProps) {
  const WORK_AUTH_LABELS: Record<string, string> = {
    'US_CITIZEN': 'US Citizen',
    'GREEN_CARD': 'Green Card',
    'H1B': 'H1B',
    'OPT': 'OPT',
    'OTHER': 'Other',
  }

  const getWorkAuthorizationBadge = (workAuth: string) => {
    const label = WORK_AUTH_LABELS[workAuth] ?? 'Other'
    return (
      <Badge variant="outline">
        <Shield className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    )
  }

  const formatSalary = (salary?: number) => {
    if (!salary) return null
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(salary)
  }

  return (
    <div className="rounded-lg border border-border/50 bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border/50">
            <TableHead className="font-semibold">Profile Name</TableHead>
            <TableHead className="font-semibold hidden sm:table-cell">Contact</TableHead>
            <TableHead className="font-semibold hidden md:table-cell">Category</TableHead>
            <TableHead className="font-semibold hidden lg:table-cell">Experience</TableHead>
            <TableHead className="font-semibold hidden lg:table-cell">Work Auth</TableHead>
            <TableHead className="font-semibold hidden xl:table-cell">Salary Range</TableHead>
            <TableHead className="font-semibold hidden md:table-cell">Default</TableHead>
            <TableHead className="font-semibold hidden lg:table-cell">Usage</TableHead>
            <TableHead className="font-semibold hidden xl:table-cell">Last Used</TableHead>
            <TableHead className="text-right font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                No profiles found
              </TableCell>
            </TableRow>
          ) : (
            profiles.map((profile) => (
              <TableRow key={profile._id} className="cursor-pointer hover:bg-muted/50 transition-colors border-border/30" onClick={() => onView(profile)}>
                <TableCell className="font-medium max-w-[200px]">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">
                              {profile.profileName}
                            </div>
                            {profile.contactInfo?.name && (
                              <div className="text-xs text-muted-foreground truncate sm:hidden">
                                {profile.contactInfo.name}
                              </div>
                            )}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{profile.profileName}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell className="max-w-[200px] hidden sm:table-cell">
                  <div className="space-y-1">
                    {profile.contactInfo?.email && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Mail className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{profile.contactInfo.email}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{profile.contactInfo.email}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {profile.contactInfo?.location && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{profile.contactInfo.location}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{profile.contactInfo.location}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant="secondary">
                    {profile.category}
                  </Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {profile.totalYearsExperience ? (
                    <div className="flex items-center gap-1 text-sm">
                      <Briefcase className="w-3 h-3 text-muted-foreground" />
                      <span>{profile.totalYearsExperience} years</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {profile.workAuthorization ? (
                    getWorkAuthorizationBadge(profile.workAuthorization)
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  <div className="space-y-1">
                    {profile.currentSalary && (
                      <div className="text-xs text-muted-foreground">
                        Current: {formatSalary(profile.currentSalary)}
                      </div>
                    )}
                    {profile.desiredSalary && (
                      <div className="text-sm font-medium">
                        Desired: {formatSalary(profile.desiredSalary)}
                      </div>
                    )}
                    {!profile.currentSalary && !profile.desiredSalary && (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {profile.isDefault ? (
                    <Badge variant="secondary">
                      <Star className="w-3 h-3 mr-1 fill-current" />
                      Default
                    </Badge>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onSetDefault(profile)
                      }}
                      className="text-muted-foreground hover:text-primary transition-colors p-1 rounded hover:bg-primary/10"
                    >
                      <StarOff className="w-4 h-4" />
                    </button>
                  )}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="flex items-center gap-1 text-sm">
                    <FileText className="w-3 h-3 text-muted-foreground" />
                    <span>{profile.usageCount || 0}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  {profile.lastUsedAt ? (
                    <div className="flex items-center gap-1 text-muted-foreground text-sm">
                      <Clock className="w-3 h-3" />
                      {format(new Date(profile.lastUsedAt), 'MMM d, yyyy')}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">Never</span>
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
                        onView(profile)
                      }}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        onEdit(profile)
                      }}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      {onDuplicate && (
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          onDuplicate(profile)
                        }}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                      )}
                      {!profile.isDefault && (
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          onSetDefault(profile)
                        }}>
                          <Star className="mr-2 h-4 w-4" />
                          Set as Default
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(profile)
                        }}
                        className="text-destructive"
                        disabled={profile.isDefault}
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