"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Loader2,
  FileText,
  Briefcase,
  Building,
  MapPin,
} from "lucide-react";
import { CustomDialog } from '@/components/custom/Dialog';
import { SparkButton, OutlineButton } from "@/components/custom/Button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Job } from "@/types/job";
import { Resume } from "@/types/resume";
import { ApplicationStatus } from "@/types/application";
import { useJobApplication } from "@/hooks/api/use-applications";
import { toast } from "sonner";
import { format } from "date-fns";

interface CreateApplicationDialogProps {
  job: Job;
  optimizedResumes: Resume[];
  trigger?: React.ReactNode;
  children?: React.ReactNode;
  onApplicationCreated?: () => void;
}

export function CreateApplicationDialog({
  job,
  optimizedResumes,
  trigger,
  children,
  onApplicationCreated,
}: CreateApplicationDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const { createJobApplication } = useJobApplication(job._id);

  useEffect(() => {
    if (open && optimizedResumes.length > 0) {
      setSelectedResumeId(optimizedResumes[0]._id);
    }
  }, [open, optimizedResumes]);

  const handleCreateApplication = async () => {
    if (!selectedResumeId) {
      toast.error("Please select a resume");
      return;
    }

    const selectedResume = optimizedResumes.find(
      (r) => r._id === selectedResumeId
    );
    if (!selectedResume?.parentResumeId) {
      toast.error("Could not find base resume");
      return;
    }

    setIsCreating(true);

    try {
      await createJobApplication.mutateAsync({
        optimizedResumeId: selectedResumeId,
        baseResumeId: selectedResume.parentResumeId,
        status: ApplicationStatus.DRAFT,
        notes: notes.trim() || undefined,
      });

      toast.success("Application created successfully!");
      setOpen(false);
      resetDialog();
      onApplicationCreated?.();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to create application"
      );
    } finally {
      setIsCreating(false);
    }
  };

  const resetDialog = () => {
    setSelectedResumeId("");
    setNotes("");
    setIsCreating(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetDialog();
    }
    setOpen(open);
  };

  return (
    <CustomDialog
      open={open}
      onOpenChange={handleClose}
      trigger={trigger || children}
      title={`Create Application for ${job.title}`}
      description="Create a new job application using an optimized resume and add any notes or references."
      icon={<Plus className="w-5 h-5 text-blue-600" />}
      size="lg"
    >
      <div className="space-y-6">
          {/* Job Summary */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-600" />
                <h4 className="font-medium text-sm">{job.title}</h4>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {job.company} • {job.location}
                </p>
              </div>
              {job.keywords?.hardSkills &&
                job.keywords.hardSkills.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {job.keywords.hardSkills
                      .slice(0, 3)
                      .map((keyword: string, index: number) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs"
                        >
                          {keyword}
                        </Badge>
                      ))}
                    {job.keywords.hardSkills.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{job.keywords.hardSkills.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
            </div>
          </div>

          {/* Resume Selection */}
          {!isCreating && (
            <div className="space-y-3">
              <Label>Select Optimized Resume:</Label>
              {optimizedResumes.length > 0 ? (
                <Select
                  value={selectedResumeId}
                  onValueChange={setSelectedResumeId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a resume" />
                  </SelectTrigger>
                  <SelectContent>
                    {optimizedResumes.map((resume) => (
                      <SelectItem key={resume._id} value={resume._id}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">
                            {resume.title ||
                              `${resume.contactInfo?.name || "Untitled Resume"}`}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Created{" "}
                            {format(new Date(resume.createdAt), "MMM dd, yyyy")}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-center p-4 border border-dashed rounded-lg">
                  <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No optimized resumes available
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Optimize a resume first to create an application
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Notes Section */}
          {!isCreating && (
            <div className="space-y-3">
              <Label htmlFor="notes">Notes (Optional):</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this application, references, or application links..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                You can add application URLs, recruiter contacts, or any other
                relevant information.
              </p>
            </div>
          )}

          {/* Creating Progress */}
          {isCreating && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                Creating application...
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            {!isCreating ? (
              <>
                <SparkButton
                  onClick={handleCreateApplication}
                  className="flex-1"
                  disabled={!selectedResumeId || optimizedResumes.length === 0}
                  icon={<Plus className="w-4 h-4 mr-2" />}
                >
                  {optimizedResumes.length === 0
                    ? "No Resumes Available"
                    : "Create Application"}
                </SparkButton>
                <OutlineButton onClick={() => setOpen(false)}>
                  Cancel
                </OutlineButton>
              </>
            ) : (
              <OutlineButton
                onClick={() => {
                  setIsCreating(false);
                }}
                className="w-full"
                disabled={true}
              >
                Creating...
              </OutlineButton>
            )}
          </div>
      </div>
    </CustomDialog>
  );
}
