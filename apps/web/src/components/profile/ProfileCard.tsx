"use client";

import { Profile } from "@/types/profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User,
  Mail,
  Phone,
  MapPin,
  MoreVertical,
  Eye,
  Edit,
  Star,
  Copy,
  Trash2,
  Briefcase,
  Clock,
  Shield,

} from "lucide-react";

interface ProfileCardProps {
  profile: Profile;
  onView: (profile: Profile) => void;
  onEdit: (profile: Profile) => void;
  onDelete: (profile: Profile) => void;
  onSetDefault: (profile: Profile) => void;
  onDuplicate?: (profile: Profile) => void;
}

export function ProfileCard({
  profile,
  onView,
  onEdit,
  onDelete,
  onSetDefault,
  onDuplicate,
}: ProfileCardProps) {
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
      <Badge variant="outline" className="text-xs">
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
    <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-0 shadow-sm hover:scale-[1.02]" onClick={() => onView(profile)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg truncate">{profile.profileName}</CardTitle>
              {profile.contactInfo?.name && (
                <p className="text-sm text-muted-foreground truncate">{profile.contactInfo.name}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {profile.isDefault && (
              <Badge variant="secondary" className="text-xs">
                <Star className="w-3 h-3 mr-1 fill-current" />
                Default
              </Badge>
            )}
            <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onView(profile);
              }}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onEdit(profile);
              }}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {!profile.isDefault && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onSetDefault(profile);
                }}>
                  <Star className="mr-2 h-4 w-4" />
                  Set as Default
                </DropdownMenuItem>
              )}
              {onDuplicate && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(profile);
                }}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(profile);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category and Status */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary">
            {profile.category}
          </Badge>
          {profile.workAuthorization && getWorkAuthorizationBadge(profile.workAuthorization)}
        </div>

        {/* Contact Information */}
        {(profile.contactInfo?.email || profile.contactInfo?.location) && (
          <div className="space-y-2">
            {profile.contactInfo?.email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{profile.contactInfo.email}</span>
              </div>
            )}
            {profile.contactInfo?.location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{profile.contactInfo.location}</span>
              </div>
            )}
          </div>
        )}

        {/* Professional Info */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Experience</div>
            <div className="text-sm font-medium">
              {profile.totalYearsExperience ? `${profile.totalYearsExperience} years` : '-'}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Usage</div>
            <div className="text-sm font-medium">{profile.usageCount || 0} times</div>
          </div>
        </div>

        {/* Salary Information */}
        {(profile.currentSalary || profile.desiredSalary) && (
          <div className="space-y-2">
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
          </div>
        )}

        {/* Last Used */}
        {profile.lastUsedAt && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/50">
            <Clock className="w-3 h-3" />
            <span>Last used {new Date(profile.lastUsedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}