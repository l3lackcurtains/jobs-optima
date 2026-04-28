"use client";

import { useState, useEffect, useMemo, use } from "react";
import { useRouter } from "next/navigation";

import {
  BarChart3,
  Target,
  Briefcase,
  FileText,
  TrendingUp,
  MapPin,
  DollarSign,
  ExternalLink,
  Plus,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/custom/page-header";
import {
  PrimaryButton,
  OutlineButton,
  SparkButton,
  PreviewButton,
} from "@/components/custom/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

import { ErrorState } from "@/components/ui/error-state";
import UnifiedResumeView from "@/components/resume/UnifiedResumeView";
import { OptimizationATSWidget } from "@/components/resume/OptimizationATSWidget";
import { UploadResumeDialog } from "@/components/resume/UploadResumeDialog";
import { OptimizeResumeFromBaseDialog } from "@/components/resume/OptimizeResumeFromBaseDialog";
import { CreateApplicationDialog } from "@/components/application/CreateApplicationDialog";
import { ClipboardList } from "lucide-react";
import { Resume } from "@/types/resume";
import { toast } from "sonner";
import { useResume, useResumes } from "@/hooks/api/use-resumes";
import { useJob } from "@/hooks/api/use-jobs";
import { useApplicationsByResume } from "@/hooks/api/use-applications";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { format } from "date-fns";
import {
  extractResumeContent,
  getSortedKeywordsWithCounts,
  getAllKeywordsForHighlighting,
} from "@/lib/utils/resume-keywords";
import { calculateWeightedATSScore } from "@/lib/utils/keyword-scoring";
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

interface ResumePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ResumePage(props: ResumePageProps) {
  const params = use(props.params);
  const [id, setId] = useState<string>(params.id);
  const [isInitializing, setIsInitializing] = useState(false);
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(
    new Set()
  );
  const [showOrangeHighlight, setShowOrangeHighlight] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const router = useRouter();

  const { data: resume, isLoading, error, refetch } = useResume(id);
  const { deleteResume, updateResume, exportPDF } = useResumes();
  const { data: baseResume } = useResume(resume?.parentResumeId || "");
  const { data: job } = useJob(resume?.jobId || "");
  const { data: applications } = useApplicationsByResume(id);

  // Fetch optimized resumes if this is a base resume
  const { data: optimizedResumes, isLoading: isLoadingOptimized } = useQuery({
    queryKey: ["optimized-resumes", id],
    queryFn: async () => {
      if (!resume || resume.isOptimized) return [];
      try {
        const response = await apiClient.get(`/resumes/${id}/optimized`);
        console.log("Optimized resumes response:", response.data);
        return response.data as Resume[];
      } catch (error) {
        console.error("Error fetching optimized resumes:", error);
        return [];
      }
    },
    enabled: !!resume && !resume.isOptimized && !!id,
  });

  // Extract all text content from resume using common helper
  const resumeContent = useMemo(() => extractResumeContent(resume), [resume]);

  // Calculate keyword counts and sort by count using common helper
  const sortedMatchedKeywords = useMemo(
    () =>
      getSortedKeywordsWithCounts(
        resume?.matchedKeywordsByCategory
          ? [
              ...(resume.matchedKeywordsByCategory.actionVerbs || []),
              ...(resume.matchedKeywordsByCategory.hardSkills || []),
              ...(resume.matchedKeywordsByCategory.softSkills || []),
              ...(resume.matchedKeywordsByCategory.knowledge || []),
            ]
          : resume?.matchedKeywords,
        resumeContent
      ),
    [resume?.matchedKeywords, resume?.matchedKeywordsByCategory, resumeContent]
  );

  // Calculate weighted ATS score for optimized resumes
  const weightedScore = useMemo(() => {
    if (!resume?.isOptimized) return null;
    return calculateWeightedATSScore(
      resume.matchedKeywordsByCategory,
      resume.unmatchedKeywordsByCategory,
      resume.category || "General"
    );
  }, [
    resume?.isOptimized,
    resume?.matchedKeywordsByCategory,
    resume?.unmatchedKeywordsByCategory,
    resume?.category,
  ]);

  // Get all keywords for orange highlighting
  const allKeywordsForHighlight = useMemo(
    () =>
      showOrangeHighlight
        ? getAllKeywordsForHighlighting(resume)
        : new Set<string>(),
    [resume, showOrangeHighlight]
  );

  const handleKeywordClick = (keyword: string) => {
    setSelectedKeywords((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(keyword)) {
        newSet.delete(keyword);
      } else {
        newSet.add(keyword);
      }
      return newSet;
    });
  };


  const handleBack = () => {
    router.push("/resumes");
  };

  const handleViewComparison = () => {
    if (resume?.parentResumeId) {
      router.push(`/resumes/${id}/compare`);
    } else {
      toast.error("No base resume available for comparison");
    }
  };

  const handleDownload = async () => {
    try {
      await exportPDF(id);
      toast.success("Resume downloaded successfully!");
    } catch (_error) {
      console.error("Failed to download resume:", _error);
      toast.error("Failed to download resume");
    }
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!resume) return;

    try {
      await deleteResume.mutateAsync(resume._id);
      toast.success("Resume deleted successfully");
      setDeleteDialogOpen(false);
      router.push("/resumes");
    } catch (error) {
      toast.error("Failed to delete resume");
    }
  };

  // Show loading skeleton while initializing or loading
  if (isInitializing || (isLoading && !resume)) {
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

  // Show error state only after initialization and if there's an actual error
  if (!isInitializing && (error || !resume)) {
    const isNotFound =
      error?.message?.includes("404") || error?.message?.includes("not found");
    const isPermissionDenied =
      error?.message?.includes("403") || error?.message?.includes("permission");

    return (
      <div className="container max-w-8xl mx-auto py-8">
        <ErrorState
          variant={isPermissionDenied ? "permission" : "not-found"}
          title={isPermissionDenied ? "Access Denied" : "Resume Not Found"}
          message={
            isPermissionDenied
              ? "You don't have permission to view this resume."
              : "The resume you're looking for doesn't exist or has been deleted."
          }
          showBackButton={true}
          backButtonText="Back to Resumes"
          onBack={handleBack}
          showRetryButton={!isNotFound && !isPermissionDenied}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const resumeTitle = resume?.title || resume?.contactInfo?.name || "Resume";

  return (
    <div className="container max-w-8xl mx-auto py-8">
      <PageHeader
        title={resumeTitle}
        description={
          resume?.isOptimized
            ? "Optimized resume version"
            : resume?.category
              ? `${resume?.category} resume`
              : "Base resume"
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Resumes", href: "/resumes" },
          { label: resumeTitle },
        ]}
      />

      {/* Main Layout with Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
        {/* Main Content - 4 columns */}
        <div className="lg:col-span-4">
          {resume && (
            <UnifiedResumeView
              resume={resume}
              onSave={async (updatedResume) => {
                // Filter out database fields that shouldn't be sent in PATCH request
                const allowedFields = {
                  title: updatedResume.title,
                  category: updatedResume.category,
                  contactInfo: updatedResume.contactInfo
                    ? {
                        name: updatedResume.contactInfo.name,
                        location: updatedResume.contactInfo.location,
                        email: updatedResume.contactInfo.email,
                        phone: updatedResume.contactInfo.phone,
                        linkedin: updatedResume.contactInfo.linkedin,
                        github: updatedResume.contactInfo.github,
                        personalWebsite:
                          updatedResume.contactInfo.personalWebsite,
                      }
                    : undefined,
                  experience: updatedResume.experience?.map((exp) => ({
                    title: exp.title,
                    company: exp.company,
                    location: exp.location,
                    dates: exp.dates,
                    responsibilities: exp.responsibilities,
                  })),
                  projects: updatedResume.projects?.map((project) => ({
                    name: project.name,
                    technologies: project.technologies,
                    description: project.description,
                  })),
                  education: updatedResume.education?.map((edu) => ({
                    institution: edu.institution,
                    location: edu.location,
                    dates: edu.dates,
                    degree: edu.degree,
                    achievements: edu.achievements,
                  })),
                  skills: updatedResume.skills
                    ? {
                        technicalSkills:
                          updatedResume.skills.technicalSkills || [],
                        developmentPracticesMethodologies:
                          updatedResume.skills
                            .developmentPracticesMethodologies || [],
                        personalSkills:
                          updatedResume.skills.personalSkills || [],
                      }
                    : undefined,
                };

                await updateResume.mutateAsync({
                  id: id,
                  data: allowedFields,
                });
                await refetch();
              }}
              onDownload={handleDownload}
              highlightedKeywords={selectedKeywords}
              allKeywordsForHighlight={allKeywordsForHighlight}
              mode={resume.isOptimized ? "optimized" : "base"}
            />
          )}
        </div>

        {/* Sidebar - 2 columns */}
        <div className="lg:col-span-2">
          <div className="sticky top-6 space-y-6">
            {/* Quick Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {resume && !resume.isOptimized && (
                  <>
                    <UploadResumeDialog>
                      <OutlineButton className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Resume
                      </OutlineButton>
                    </UploadResumeDialog>

                    <OptimizeResumeFromBaseDialog resume={resume}>
                      <SparkButton className="w-full">
                        Optimize Resume
                      </SparkButton>
                    </OptimizeResumeFromBaseDialog>
                  </>
                )}

                {resume?.isOptimized && (
                  <>
                    {job && (
                      <>
                        {applications && applications.length > 0 ? (
                          <OutlineButton
                            className="w-full"
                            onClick={() =>
                              router.push(
                                `/applications/${applications[0]._id}`
                              )
                            }
                          >
                            <ClipboardList className="w-4 h-4 mr-2" />
                            Edit Application
                          </OutlineButton>
                        ) : (
                          <CreateApplicationDialog resume={resume} job={job}>
                            <PrimaryButton className="w-full">
                              <ClipboardList className="w-4 h-4 mr-2" />
                              Create Application
                            </PrimaryButton>
                          </CreateApplicationDialog>
                        )}
                      </>
                    )}
                    {baseResume && (
                      <>
                        <PreviewButton
                          className="w-full"
                          onClick={handleViewComparison}
                        >
                          <BarChart3 className="w-4 h-4 mr-2" />
                          View Comparison
                        </PreviewButton>
                        <PreviewButton
                          className="w-full"
                          onClick={() =>
                            router.push(`/resumes/${resume?.parentResumeId}`)
                          }
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          View Original
                        </PreviewButton>
                      </>
                    )}
                  </>
                )}

                {/* Delete button - available for all resumes */}
                <div className="pt-3 mt-3 border-t">
                  <OutlineButton
                    className="w-full text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={handleDelete}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Resume
                  </OutlineButton>
                </div>
              </CardContent>
            </Card>

            {/* Optimized Versions Card - Only for base resumes */}
            {!resume?.isOptimized && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Target className="w-5 h-5 text-orange-600" />
                    Optimized Versions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingOptimized ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Loading optimized versions...
                    </p>
                  ) : optimizedResumes && optimizedResumes.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground mb-2">
                        {optimizedResumes.length} optimized{" "}
                        {optimizedResumes.length === 1 ? "version" : "versions"}{" "}
                        created
                      </p>
                      {optimizedResumes.slice(0, 5).map((optimized) => (
                        <OutlineButton
                          key={optimized._id}
                          className="w-full justify-start text-left h-auto py-2 px-2 hover:bg-accent"
                          onClick={() =>
                            router.push(`/resumes/${optimized._id}`)
                          }
                        >
                          <div className="flex flex-col items-start gap-1 w-full">
                            <div className="flex items-center gap-2 w-full">
                              <Target className="w-3 h-3 text-orange-600 shrink-0" />
                              <span className="text-sm font-medium truncate flex-1">
                                {optimized.title || "Optimized Resume"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge
                                variant="secondary"
                                className="text-xs px-1 py-0"
                              >
                                ATS: {optimized.finalATSScore?.toFixed(0)}%
                              </Badge>
                              <span className="truncate">
                                {format(new Date(optimized.createdAt), "MMM d")}
                              </span>
                            </div>
                          </div>
                        </OutlineButton>
                      ))}
                      {optimizedResumes.length > 5 && (
                        <p className="text-xs text-muted-foreground text-center pt-1">
                          +{optimizedResumes.length - 5} more
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No optimized versions created yet
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Optimization & ATS Analysis - Only for optimized resumes */}
            {resume?.isOptimized && (
              <OptimizationATSWidget
                resume={resume}
                showOrangeHighlight={showOrangeHighlight}
                onToggleHighlight={() =>
                  setShowOrangeHighlight(!showOrangeHighlight)
                }
                selectedKeywords={selectedKeywords}
                onKeywordClick={handleKeywordClick}
                sortedMatchedKeywords={sortedMatchedKeywords}
                sortedUnmatchedKeywords={
                  resume?.unmatchedKeywordsByCategory
                    ? [
                        ...(resume.unmatchedKeywordsByCategory.actionVerbs ||
                          []),
                        ...(resume.unmatchedKeywordsByCategory.hardSkills ||
                          []),
                        ...(resume.unmatchedKeywordsByCategory.softSkills ||
                          []),
                        ...(resume.unmatchedKeywordsByCategory.knowledge || []),
                      ]
                    : resume?.unmatchedKeywords || []
                }
              />
            )}

            {/* Job Details Card - Only for optimized resumes */}
            {resume?.isOptimized && job && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Briefcase className="w-5 h-5 text-orange-600" />
                    Target Job
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {job.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {job.company}
                      </p>
                    </div>

                    {/* Job Summary */}
                    {job.summary && (
                      <div className="pt-2">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {job.summary}
                        </p>
                      </div>
                    )}

                    {/* Industry & Work Mode */}
                    <div className="flex flex-wrap gap-2">
                      {job.industry && (
                        <Badge variant="outline" className="text-xs">
                          {job.industry}
                        </Badge>
                      )}
                      {job.workMode && (
                        <Badge variant="outline" className="text-xs capitalize">
                          {job.workMode}
                        </Badge>
                      )}
                      {job.category && job.category !== "General" && (
                        <Badge variant="outline" className="text-xs">
                          {job.category}
                        </Badge>
                      )}
                    </div>

                    {job.location && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>{job.location}</span>
                      </div>
                    )}
                    {job.salaryMin && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <DollarSign className="w-3 h-3" />
                        <span>
                          ${job.salaryMin.toLocaleString()}
                          {job.salaryMax &&
                            ` - $${job.salaryMax.toLocaleString()}`}
                          {job.salaryPeriod && ` ${job.salaryPeriod}`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Must Have Skills */}
                  {job.mustHaveSkills && job.mustHaveSkills.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Must Have Skills
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {job.mustHaveSkills.slice(0, 5).map((skill, index) => (
                          <Badge
                            key={index}
                            className="text-xs bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Nice to Have Skills */}
                  {job.niceToHaveSkills && job.niceToHaveSkills.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Nice to Have
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {job.niceToHaveSkills
                          .slice(0, 5)
                          .map((skill, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {skill}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* View Full Job Button */}
                  {job._id && (
                    <OutlineButton
                      size="sm"
                      className="w-full mt-3"
                      onClick={() => router.push(`/jobs/${job._id}`)}
                    >
                      <ExternalLink className="w-3 h-3 mr-2" />
                      View Full Job Details
                    </OutlineButton>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resume</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "
              {resume?.title || resume?.contactInfo?.name || "this resume"}"?
              {resume?.isOptimized ? " This is an optimized resume." : ""}
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
