"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Building,
  MapPin,
  Calendar,
  ExternalLink,
  Trash2,
  Sparkles,
  MoreVertical,
  Tag,
  Clock,
  Target,
  FileText,
  TrendingUp,
  Eye,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  IconButton,
  SparkButton,
  PreviewButton,
  OutlineButton,
} from "@/components/custom/Button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Job } from "@/types/job";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
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
import { cn } from "@/lib/utils";
import { OptimizeResumeDialog } from "./OptimizeResumeDialog";

interface JobCardProps {
  job: Job;
  onDelete?: () => void;
}

export default function JobCard({ job, onDelete }: JobCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await apiClient.delete(`/jobs/${job._id}`);

      toast.success("Job deleted successfully");

      onDelete?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete job");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const truncateDescription = (text: string, maxLength: number = 120) => {
    if (!text || text.length <= maxLength) return text || "";
    return text.substring(0, maxLength).trim() + "...";
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  };

  const getKeywordsCount = () => {
    if (!job.keywords) return 0;
    return (
      (job.keywords.actionVerbs?.length || 0) +
      (job.keywords.hardSkills?.length || 0) +
      (job.keywords.softSkills?.length || 0)
    );
  };

  const getTopSkills = () => {
    return job.keywords?.hardSkills?.slice(0, 6) || [];
  };

  return (
    <>
      <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-orange-500 hover:border-l-orange-600">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <CardTitle className="text-lg font-semibold text-foreground group-hover:text-orange-600 transition-colors line-clamp-2">
                {job.title || "Untitled Job"}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <Building className="w-4 h-4 text-orange-600" />
                  {job.company || "Unknown Company"}
                </span>
                {job.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    {job.location}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  {job.createdAt
                    ? formatDistanceToNow(new Date(job.createdAt), {
                        addSuffix: true,
                      })
                    : "Recently"}
                </span>
              </div>

              {/* Job Description Preview */}
              {job.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {truncateDescription(job.description)}
                </p>
              )}

              {/* Status and Category */}
              <div className="flex items-center gap-2">
                <Badge
                  className={cn(
                    "text-xs font-medium",
                    getStatusColor(job.isActive ?? true)
                  )}
                >
                  <Target className="w-3 h-3 mr-1" />
                  {job.isActive ? "Active" : "Inactive"}
                </Badge>
                {job.category && (
                  <Badge variant="outline" className="text-xs">
                    <Tag className="w-3 h-3 mr-1" />
                    {job.category}
                  </Badge>
                )}
                {job.optimizedResumeIds &&
                  job.optimizedResumeIds.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {job.optimizedResumeIds.length} Optimized
                    </Badge>
                  )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <IconButton className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-4 h-4" />
                </IconButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => router.push(`/jobs/${job._id}`)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                {job.url && (
                  <DropdownMenuItem
                    onClick={() => window.open(job.url, "_blank")}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Original
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 dark:text-red-400"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          {/* Job Statistics */}
          <div className="grid grid-cols-3 gap-3 py-2 px-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">
                {getKeywordsCount()}
              </div>
              <div className="text-xs text-muted-foreground">Keywords</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {job.keywords?.hardSkills?.length || 0}
              </div>
              <div className="text-xs text-muted-foreground">Skills</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {job.optimizedResumeIds?.length || 0}
              </div>
              <div className="text-xs text-muted-foreground">Optimized</div>
            </div>
          </div>

          {/* Required Skills */}
          {getTopSkills().length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-orange-600" />
                  <span className="text-xs font-semibold text-foreground">
                    Required Skills
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {job.keywords?.hardSkills?.length || 0} total
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {getTopSkills().map((skill, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-xs bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
                  >
                    {skill}
                  </Badge>
                ))}
                {(job.keywords?.hardSkills?.length || 0) > 6 && (
                  <Badge variant="secondary" className="text-xs">
                    +{(job.keywords?.hardSkills?.length || 0) - 6} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <OptimizeResumeDialog
              job={job}
              trigger={
                <SparkButton className="flex-1" size="sm">
                  Optimize Resume
                </SparkButton>
              }
            />
            <PreviewButton
              onClick={() => router.push(`/jobs/${job._id}`)}
              size="sm"
            >
              <Eye className="w-4 h-4 mr-2" />
              Details
            </PreviewButton>
            {job.url && (
              <OutlineButton
                onClick={() => window.open(job.url, "_blank")}
                size="sm"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Original
              </OutlineButton>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job Posting</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{job.title}" at {job.company}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
