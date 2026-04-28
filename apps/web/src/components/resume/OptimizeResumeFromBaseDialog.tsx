"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Loader2,
  Briefcase,
  Target,
  TrendingUp,
  Search,
} from "lucide-react";
import { CustomDialog } from '@/components/custom/Dialog';
import { OutlineButton, SparkButton, GhostButton } from "@/components/custom/Button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Job } from "@/types/job";
import { Resume } from "@/types/resume";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface OptimizeResumeFromBaseDialogProps {
  resume: Resume;
  trigger?: React.ReactNode;
  children?: React.ReactNode;
}

export function OptimizeResumeFromBaseDialog({
  resume,
  trigger,
  children,
}: OptimizeResumeFromBaseDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
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
      fetchJobs();
    }
  }, [open]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = jobs.filter(
        (job) =>
          job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredJobs(filtered);
    } else {
      setFilteredJobs(jobs);
    }
  }, [searchQuery, jobs]);

  const fetchJobs = async () => {
    try {
      const response = await apiClient.get("/jobs", { params: { limit: 100 } });
      const jobList: Job[] = response.data?.data ?? response.data ?? [];
      setJobs(jobList);
      setFilteredJobs(jobList);

      if (jobList.length > 0) {
        setSelectedJobId(jobList[0]._id);
      }
    } catch (error) {
      toast.error("Failed to fetch jobs");
    }
  };

  const handleOptimizeResume = async () => {
    if (!selectedJobId) {
      toast.error("Please select a job to optimize for");
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
        resumeId: resume._id,
        jobId: selectedJobId,
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
    setSearchQuery("");
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetDialog();
    }
    setOpen(open);
  };

  const selectedJob = jobs.find((j) => j._id === selectedJobId);

  return (
    <CustomDialog
      open={open}
      onOpenChange={handleClose}
      trigger={trigger || children}
      title="Optimize Resume"
      description="Select a job position to optimize your resume for. Our AI will tailor your resume to match the job requirements and improve ATS compatibility."
      icon={<Sparkles className="w-5 h-5 text-orange-600" />}
      size="lg"
    >
      <div className="space-y-6">
          {/* Resume Info */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm">Selected Resume</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {resume.title}
                </p>
                <Badge variant="outline" className="mt-2 text-xs">
                  {resume.category}
                </Badge>
              </div>
            </div>
          </div>

          {/* Job Selection */}
          {!isOptimizing && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                <label className="text-sm font-medium">Select Target Job</label>
              </div>

              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Jobs List */}
              <ScrollArea className="h-[200px] border rounded-lg">
                <div className="p-2 space-y-1">
                  {filteredJobs.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {searchQuery ? "No jobs found" : "No jobs available"}
                    </p>
                  ) : (
                    filteredJobs.map((job) => (
                      <GhostButton
                        key={job._id}
                        onClick={() => setSelectedJobId(job._id)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg hover:bg-accent transition-colors h-auto justify-start",
                          selectedJobId === job._id &&
                            "bg-accent border border-primary"
                        )}
                      >
                        <div className="space-y-1">
                          <p className="font-medium text-sm">{job.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{job.company}</span>
                            {job.location && (
                              <>
                                <span>•</span>
                                <span>{job.location}</span>
                              </>
                            )}
                          </div>
                          {job.category && (
                            <Badge variant="secondary" className="text-xs">
                              {job.category}
                            </Badge>
                          )}
                        </div>
                      </GhostButton>
                    ))
                  )}
                </div>
              </ScrollArea>

              {/* Selected Job Preview */}
              {selectedJob && (
                <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    OPTIMIZING FOR
                  </p>
                  <p className="font-medium text-sm">{selectedJob.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedJob.company}
                  </p>
                  {selectedJob.mustHaveSkills &&
                    selectedJob.mustHaveSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedJob.mustHaveSkills
                          .slice(0, 3)
                          .map((skill, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs"
                            >
                              {skill}
                            </Badge>
                          ))}
                        {selectedJob.mustHaveSkills.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{selectedJob.mustHaveSkills.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                </div>
              )}
            </div>
          )}

          {/* Optimization Progress */}
          {isOptimizing && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Optimization Progress
                  </span>
                  <span className="font-medium">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {currentStepText && (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
                  <p className="text-sm text-muted-foreground">
                    {currentStepText}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          <OutlineButton onClick={() => setOpen(false)} disabled={isOptimizing}>
            Cancel
          </OutlineButton>
          <SparkButton
            onClick={handleOptimizeResume}
            disabled={isOptimizing || !selectedJobId || jobs.length === 0}
            loading={isOptimizing}
            loadingText="Optimizing..."
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Optimize Resume
          </SparkButton>
      </div>
    </CustomDialog>
  );
}
