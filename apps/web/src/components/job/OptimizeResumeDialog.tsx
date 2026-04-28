"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, FileText, Target, TrendingUp } from "lucide-react";
import { CustomDialog } from "@/components/custom/Dialog";
import { SparkButton, OutlineButton } from "@/components/custom/Button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Job } from "@/types/job";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";

interface OptimizeResumeDialogProps {
  job: Job;
  trigger?: React.ReactNode;
  children?: React.ReactNode;
}

export function OptimizeResumeDialog({
  job,
  trigger,
  children,
}: OptimizeResumeDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [resumes, setResumes] = useState<any[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStepText, setCurrentStepText] = useState("");
  const router = useRouter();

  const optimizationSteps = [
    "Analyzing job requirements...",
    "Processing resume content...",
    "Matching keywords and skills...",
    "Optimizing resume format...",
    "Calculating ATS score...",
    "Generating optimized resume...",
  ];

  useEffect(() => {
    if (open) {
      fetchResumes();
    }
  }, [open]);

  const fetchResumes = async () => {
    try {
      // Fetch base resumes only using the isOptimized filter
      const response = await apiClient.get("/resumes", {
        params: {
          page: 1,
          limit: 50,
          isOptimized: false
        }
      });

      // The API now returns paginated data
      const baseResumes = response.data.data || [];

      setResumes(baseResumes);

      if (baseResumes.length > 0) {
        setSelectedResumeId(baseResumes[0]._id);
      }
    } catch (error) {
      toast.error("Failed to fetch resumes");
    }
  };

  const handleOptimizeResume = async () => {
    if (!selectedResumeId) {
      toast.error("Please select a resume to optimize");
      return;
    }

    setIsOptimizing(true);
    setProgress(0);

    // Simulate optimization progress
    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < optimizationSteps.length) {
        setCurrentStepText(optimizationSteps[stepIndex]);
        setProgress((stepIndex + 1) * (100 / optimizationSteps.length));
        stepIndex++;
      } else {
        clearInterval(interval);
      }
    }, 800);

    try {
      const response = await apiClient.post("/jobs/optimize", {
        resumeId: selectedResumeId,
        jobId: job._id,
        provider: "openai",
      });

      clearInterval(interval);
      setProgress(100);

      toast.success("Resume optimized successfully!");

      // Navigate to the optimized resume
      if (response.data?.optimizedResume?._id) {
        router.push(`/resumes/${response.data.optimizedResume._id}`);
      }

      setOpen(false);
    } catch (error: any) {
      clearInterval(interval);
      toast.error(error.response?.data?.message || "Failed to optimize resume");
      setProgress(0);
      setCurrentStepText("");
    } finally {
      setIsOptimizing(false);
    }
  };

  const resetDialog = () => {
    setProgress(0);
    setCurrentStepText("");
    setIsOptimizing(false);
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
      title={`Optimize Resume for ${job.title}`}
      description="Select a resume to optimize for this job position. Our AI will tailor your resume to match the job requirements and improve ATS compatibility."
      icon={<Sparkles className="w-5 h-5 text-orange-600" />}
      size="lg"
    >
      <div className="space-y-6">
          {/* Job Summary */}
          <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">{job.title}</h4>
              <p className="text-sm text-muted-foreground">
                {job.company} • {job.location}
              </p>
              <div className="flex gap-2 mt-3">
                {job.keywords?.hardSkills
                  ?.slice(0, 3)
                  .map((keyword: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                {(job.keywords?.hardSkills?.length || 0) > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{(job.keywords?.hardSkills?.length || 0) - 3} more
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Resume Selection */}
          {!isOptimizing && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">
                Select Resume to Optimize:
              </h4>
              {resumes.length > 0 ? (
                <Select
                  value={selectedResumeId}
                  onValueChange={setSelectedResumeId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a resume" />
                  </SelectTrigger>
                  <SelectContent>
                    {resumes.map((resume) => (
                      <SelectItem key={resume._id} value={resume._id}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{resume.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {resume.category} • {resume.source}
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
                    No resumes available
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload a resume first to enable optimization
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Optimization Progress */}
          {isOptimizing && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Optimizing Resume</span>
                  <span className="text-muted-foreground">
                    {Math.round(progress)}%
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              {currentStepText && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
                  {currentStepText}
                </div>
              )}
            </div>
          )}

          {/* What we'll do */}
          {!isOptimizing && (
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Optimization Features:</h4>
              <div className="grid gap-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded">
                    <FileText className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span>Tailor content to match job requirements</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-1.5 bg-purple-100 dark:bg-purple-900 rounded">
                    <Target className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span>Optimize keywords for ATS systems</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-1.5 bg-green-100 dark:bg-green-900 rounded">
                    <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" />
                  </div>
                  <span>Improve match score and visibility</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            {!isOptimizing ? (
              <>
                <SparkButton
                  onClick={handleOptimizeResume}
                  className="flex-1"
                  disabled={!selectedResumeId || resumes.length === 0}
                  icon={<Sparkles className="w-4 h-4 mr-2" />}
                >
                  {resumes.length === 0
                    ? "No Resumes Available"
                    : "Optimize Resume"}
                </SparkButton>
                <OutlineButton onClick={() => setOpen(false)}>
                  Cancel
                </OutlineButton>
              </>
            ) : (
              <OutlineButton
                onClick={() => {
                  setIsOptimizing(false);
                  setProgress(0);
                  setCurrentStepText("");
                }}
                className="w-full"
                disabled={progress > 80}
              >
                Cancel Optimization
              </OutlineButton>
            )}
          </div>
      </div>
    </CustomDialog>
  );
}
