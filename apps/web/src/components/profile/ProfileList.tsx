'use client'

import { useState } from 'react'
import { Plus, Search, Grid3X3, List, User } from 'lucide-react'
import { PrimaryButton } from '@/components/custom/Button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import ProfileTable from './ProfileTable'
import { ProfileCard } from './ProfileCard'
import { CreateProfileDialog } from './CreateProfileDialog'
import { Profile } from '@/types/profile'
import { cn } from '@/lib/utils'

interface ProfileListProps {
  profiles: Profile[]
  isLoading: boolean
  onView: (profile: Profile) => void
  onEdit: (profile: Profile) => void
  onDelete: (profile: Profile) => void
  onSetDefault: (profile: Profile) => void
  onDuplicate?: (profile: Profile) => void
  className?: string
}

export function ProfileList({
  profiles = [],
  isLoading,
  onView,
  onEdit,
  onDelete,
  onSetDefault,
  onDuplicate,
  className
}: ProfileListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table')

  const filteredProfiles = profiles.filter((profile) => {
    const matchesSearch = searchQuery === '' || 
      (profile.profileName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (profile.contactInfo?.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (profile.contactInfo?.email?.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesSearch
  })

  if (isLoading) {
    return (
      <div className={cn('space-y-6', className)}>
        {/* Action Buttons Skeleton */}
        <div className="flex gap-2 justify-end">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-32" />
        </div>
        
        {/* Search and View Toggle Skeleton */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative max-w-sm flex-1">
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-20" />
        </div>

        {/* Profile Cards/Table Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="w-8 h-8" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Action Buttons */}
      <div className="flex gap-2 justify-end">
        <CreateProfileDialog>
          <PrimaryButton>
            <Plus className="w-4 h-4 mr-2" />
            Create Profile
          </PrimaryButton>
        </CreateProfileDialog>
      </div>

      {/* Search and View Toggle */}
      {profiles.length > 0 && (
        <div className="flex items-center justify-between gap-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search profiles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="h-8 px-3"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8 px-3"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Profile Table */}
      {filteredProfiles.length === 0 && !isLoading ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-3">
            {searchQuery ? 'No profiles found' : 'No profiles yet'}
          </h3>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
            {searchQuery 
              ? 'Try adjusting your search criteria to find the profiles you\'re looking for.'
              : 'Create your first profile to streamline job applications with pre-filled information. Profiles help you manage different professional personas for various job opportunities.'
            }
          </p>
          {!searchQuery && (
            <div className="space-y-3">
              <CreateProfileDialog>
                <PrimaryButton>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Profile
                </PrimaryButton>
              </CreateProfileDialog>
              <p className="text-xs text-muted-foreground">
                Get started in less than 2 minutes
              </p>
            </div>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProfiles.map((profile) => (
            <ProfileCard
              key={profile._id}
              profile={profile}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onSetDefault={onSetDefault}
              onDuplicate={onDuplicate}
            />
          ))}
        </div>
      ) : (
        <ProfileTable
          profiles={filteredProfiles}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onSetDefault={onSetDefault}
          onDuplicate={onDuplicate}
        />
      )}
    </div>
  )
}