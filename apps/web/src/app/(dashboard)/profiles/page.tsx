"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProfiles } from "@/hooks/api/use-profiles";
import { Profile } from "@/types/profile";
import { toast } from "sonner";
import { PageHeader } from "@/components/custom/page-header";
import { PaginationControls } from "@/components/custom/PaginationControls";
import { ProfileList } from "@/components/profile/ProfileList";
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

export default function ProfilesPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const { profiles, isLoading, pagination, deleteProfile, setAsDefault } =
    useProfiles(currentPage, 10, { isActive: true });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<Profile | null>(null);

  const handleView = (profile: Profile) => {
    router.push(`/profiles/${profile._id}`);
  };

  const handleEdit = (profile: Profile) => {
    router.push(`/profiles/${profile._id}?mode=edit`);
  };

  const handleDelete = (profile: Profile) => {
    setProfileToDelete(profile);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!profileToDelete) return;

    try {
      await deleteProfile.mutateAsync(profileToDelete._id);
      toast.success("Profile deleted successfully");
      setDeleteDialogOpen(false);
      setProfileToDelete(null);
    } catch (error) {
      toast.error("Failed to delete profile");
    }
  };

  const handleSetDefault = async (profile: Profile) => {
    try {
      await setAsDefault.mutateAsync(profile._id);
    } catch (error) {
      toast.error("Failed to set profile as default");
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Profiles"
        description="Manage your candidate profiles for different job applications"
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Profiles" }]}
      />

      {/* Profile List */}
      <ProfileList
        profiles={profiles || []}
        isLoading={isLoading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSetDefault={handleSetDefault}
      />

      {/* Pagination Controls */}
      {pagination && (
        <PaginationControls
          page={currentPage}
          totalPages={pagination.totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Profile</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{profileToDelete?.profileName}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProfileToDelete(null)}>
              Cancel
            </AlertDialogCancel>
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
