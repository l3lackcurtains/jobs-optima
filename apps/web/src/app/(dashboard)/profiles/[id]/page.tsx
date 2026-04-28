"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Star,
  Download,
  Plus,
  Trash2,
  Settings,
  FileText,
  Briefcase,
} from "lucide-react";
import { PageHeader } from "@/components/custom/page-header";
import {
  PrimaryButton,
  OutlineButton,
  SparkButton,
} from "@/components/custom/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/error-state";
import UnifiedProfileView from "@/components/profile/UnifiedProfileView";
import { Profile } from "@/types/profile";
import { toast } from "sonner";
import { useProfile, useProfiles } from "@/hooks/api/use-profiles";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProfilePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ProfilePage(props: ProfilePageProps) {
  const params = use(props.params);
  const [id, setId] = useState<string>(params.id);
  const [isInitializing, setIsInitializing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const router = useRouter();

  const { data: profile, isLoading, error, refetch } = useProfile(id);
  const { updateProfile, deleteProfile, setAsDefault } = useProfiles();


  const handleBack = () => {
    router.push("/profiles");
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!profile) return;

    try {
      await deleteProfile.mutateAsync(profile._id);
      toast.success("Profile deleted successfully");
      setDeleteDialogOpen(false);
      router.push("/profiles");
    } catch (error) {
      toast.error("Failed to delete profile");
    }
  };

  const handleSetDefault = async () => {
    if (!profile) return;

    try {
      await setAsDefault.mutateAsync(profile._id);
      await refetch();
      toast.success("Profile set as default");
    } catch (error) {
      toast.error("Failed to set as default profile");
    }
  };

  const handleSave = async (updatedProfile: Partial<Profile>) => {
    try {
      await updateProfile.mutateAsync({
        id: id,
        data: updatedProfile,
      });
      await refetch();
    } catch (error) {
      console.error("Failed to save profile:", error);
      throw error;
    }
  };

  // Show loading skeleton while initializing or loading
  if (isInitializing || (isLoading && !profile)) {
    return (
      <div className="container max-w-8xl mx-auto py-8 space-y-8">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-9 w-20" />
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="flex space-x-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>

        {/* Content Skeleton */}
        <Card className="p-8 space-y-6">
          <div className="text-center space-y-4">
            <Skeleton className="h-8 w-64 mx-auto" />
            <div className="flex justify-center space-x-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // Show error state
  if (!isInitializing && (error || !profile)) {
    const isNotFound =
      error?.message?.includes("404") || error?.message?.includes("not found");
    const isPermissionDenied =
      error?.message?.includes("403") || error?.message?.includes("permission");

    return (
      <div className="container max-w-8xl mx-auto py-8">
        <ErrorState
          variant={isPermissionDenied ? "permission" : "not-found"}
          title={isPermissionDenied ? "Access Denied" : "Profile Not Found"}
          message={
            isPermissionDenied
              ? "You don't have permission to view this profile."
              : "The profile you're looking for doesn't exist or has been deleted."
          }
          showBackButton={true}
          backButtonText="Back to Profiles"
          onBack={handleBack}
          showRetryButton={!isNotFound && !isPermissionDenied}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const profileTitle = profile?.profileName || profile?.contactInfo?.name || "Profile";

  return (
    <div className="container max-w-8xl mx-auto py-8">
      <PageHeader
        title={profileTitle}
        description={
          profile?.isDefault
            ? "Default profile"
            : profile?.category
              ? `${profile?.category} profile`
              : "Professional profile"
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Profiles", href: "/profiles" },
          { label: profileTitle },
        ]}
      />

      {/* Main Layout with Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
        {/* Main Content - 4 columns */}
        <div className="lg:col-span-4">
          {profile && (
            <UnifiedProfileView
              profile={profile}
              onSave={handleSave}
            />
          )}
        </div>

        {/* Sidebar - 2 columns */}
        <div className="lg:col-span-2">
          <div className="sticky top-6 space-y-6">
            {/* Quick Actions Card */}
            <Card className="shadow-sm border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-950/30">
                    <Settings className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!profile?.isDefault && (
                  <OutlineButton 
                    className="w-full hover:bg-yellow-50 dark:hover:bg-yellow-950/30 hover:text-yellow-700 dark:hover:text-yellow-300 hover:border-yellow-200 dark:hover:border-yellow-700 transition-all" 
                    onClick={handleSetDefault}
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Set as Default
                  </OutlineButton>
                )}

                <SparkButton className="w-full" disabled>
                  <FileText className="w-4 h-4 mr-2" />
                  Import from Resume
                </SparkButton>

                <OutlineButton className="w-full" disabled>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Resume
                </OutlineButton>

                {/* Delete button */}
                <div className="pt-3 mt-3 border-t border-border/50">
                  <OutlineButton
                    className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 hover:border-destructive/40 transition-all"
                    onClick={handleDelete}
                    disabled={profile?.isDefault}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {profile?.isDefault ? 'Cannot Delete Default' : 'Delete Profile'}
                  </OutlineButton>
                </div>
              </CardContent>
            </Card>

            {/* Profile Stats Card */}
            <Card className="shadow-sm border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                    <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  Profile Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Category</div>
                    <Badge variant="secondary" className="text-xs">
                      {profile?.category || "General"}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Status</div>
                    <Badge variant={profile?.isActive ? "default" : "secondary"} className="text-xs">
                      {profile?.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Usage</div>
                    <div className="text-lg font-semibold">{profile?.usageCount || 0}</div>
                  </div>
                  {profile?.totalYearsExperience && (
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">Experience</div>
                      <div className="text-lg font-semibold">{profile.totalYearsExperience} yrs</div>
                    </div>
                  )}
                </div>

                {/* Additional Info */}
                {(profile?.lastUsedAt || profile?.workAuthorization) && (
                  <div className="pt-3 border-t border-border/50 space-y-3">
                    {profile?.lastUsedAt && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Last Used</span>
                        <span className="font-medium">
                          {new Date(profile.lastUsedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    )}
                    {profile?.workAuthorization && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Work Auth</span>
                        <Badge variant="outline" className="text-xs">
                          {profile.workAuthorization.replace('_', ' ')}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Profile</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{profile?.profileName || "this profile"}"?
              {profile?.isDefault ? " This is your default profile." : ""}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}