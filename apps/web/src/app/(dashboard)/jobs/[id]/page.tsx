"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import {
  MapPin,
  ExternalLink,
  Sparkles,
  Target,
  FileText,
  TrendingUp,
  BarChart3,
  Users,
  Globe,
  Calendar,
  Loader2,
  Save,
  X,
  Trash2,
  Download,
  Hash,
  Briefcase,
  DollarSign,
  Eye,
  BookOpen,
  Plus,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PrimaryButton,
  OutlineButton,
  SparkButton,
  PreviewButton,
  DestructiveButton,
  GhostButton,
} from "@/components/custom/Button";
import { Badge } from "@/components/ui/badge";
import { SortableKeywordBadge } from "@/components/job/SortableKeywordBadge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { CustomTab } from "@/components/custom/Tab";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Job } from "@/types/job";
import { format } from "date-fns";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
import { OptimizeResumeDialog } from "@/components/job/OptimizeResumeDialog";
import { CreateApplicationDialog } from "@/components/job/CreateApplicationDialog";
import UnifiedJobView, {
  UnifiedJobViewRef,
} from "@/components/job/UnifiedJobView";
import { JobApplicationSection } from "@/components/job/JobApplicationSection";
import { useResumes } from "@/hooks/api/use-resumes";
import { useJob, useJobs } from "@/hooks/api/use-jobs";
import { useJobApplication } from "@/hooks/api/use-applications";
import { ApplicationStatus } from "@/types/application";
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


export default function JobPage() {
  const resolvedParams = useParams();
  const router = useRouter();
  const [optimizedResumes, setOptimizedResumes] = useState<any[]>([]);
  const [isLoadingResumes, setIsLoadingResumes] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedJob, setEditedJob] = useState<Job | null>(null);
  const [activeTab, setActiveTab] = useState("details");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const unifiedJobViewRef = useRef<UnifiedJobViewRef>(null);
  const { exportPDF } = useResumes();
  const { updateJob, deleteJob } = useJobs();
  const { data: job, isLoading, error } = useJob(resolvedParams.id as string);
  const {
    hasApplication,
    application,
    createJobApplication,
    updateJobApplication,
  } = useJobApplication(resolvedParams.id as string);
  // Keyword add popover states for edit mode
  const [addActionVerbOpen, setAddActionVerbOpen] = useState(false);
  const [addHardSkillOpen, setAddHardSkillOpen] = useState(false);
  const [addSoftSkillOpen, setAddSoftSkillOpen] = useState(false);
  const [addKnowledgeOpen, setAddKnowledgeOpen] = useState(false);
  const [actionVerbInput, setActionVerbInput] = useState("");
  const [hardSkillInput, setHardSkillInput] = useState("");
  const [softSkillInput, setSoftSkillInput] = useState("");
  const [knowledgeInput, setKnowledgeInput] = useState("");

  // Drag and drop sensors for keywords
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    // Fetch optimized resumes when job data is available
    if (job?.optimizedResumeIds && job.optimizedResumeIds.length > 0) {
      fetchOptimizedResumes(job.optimizedResumeIds);
    }
  }, [job?.optimizedResumeIds]);

  useEffect(() => {
    // Initialize edited job state when job data loads or when entering edit mode
    if (job && isEditing) {
      setEditedJob({ ...job });
    }
  }, [job, isEditing]);

  const fetchOptimizedResumes = async (resumeIds: string[]) => {
    try {
      setIsLoadingResumes(true);
      const promises = resumeIds.map((id) => apiClient.get(`/resumes/${id}`));
      const responses = await Promise.allSettled(promises);
      const resumes = responses
        .filter(
          (result): result is PromiseFulfilledResult<any> =>
            result.status === "fulfilled"
        )
        .map((result) => result.value.data);
      setOptimizedResumes(resumes);
    } catch (error: any) {
      console.error("Failed to fetch optimized resumes:", error);
    } finally {
      setIsLoadingResumes(false);
    }
  };

  // Unified drag end handler for cross-section drag and drop
  const handleKeywordsDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeKeyword = active.id.toString();
    const overKeyword = over.id.toString();

    // Find which section the active and over items belong to
    const findKeywordSection = (keyword: string) => {
      const keywords = editedJob?.keywords || job?.keywords;
      if (!keywords) return null;
      
      if (keywords.actionVerbs?.includes(keyword)) return 'actionVerbs';
      if (keywords.hardSkills?.includes(keyword)) return 'hardSkills';
      if (keywords.softSkills?.includes(keyword)) return 'softSkills';
      if (keywords.knowledge?.includes(keyword)) return 'knowledge';
      return null;
    };

    const activeSection = findKeywordSection(activeKeyword);
    const overSection = findKeywordSection(overKeyword);

    if (!activeSection || !overSection) return;

    setEditedJob((prev) => {
      if (!prev) return null;
      
      if (activeSection === overSection) {
        // Same section reordering
        const sectionArray = prev.keywords?.[activeSection] || job?.keywords?.[activeSection] || [];
        const oldIndex = sectionArray.findIndex(item => item === activeKeyword);
        const newIndex = sectionArray.findIndex(item => item === overKeyword);
        if (oldIndex === -1 || newIndex === -1) return prev;
        const newArray = arrayMove(sectionArray, oldIndex, newIndex);
        
        return {
          ...prev,
          keywords: {
            actionVerbs: prev.keywords?.actionVerbs || job?.keywords?.actionVerbs || [],
            hardSkills: prev.keywords?.hardSkills || job?.keywords?.hardSkills || [],
            softSkills: prev.keywords?.softSkills || job?.keywords?.softSkills || [],
            knowledge: prev.keywords?.knowledge || job?.keywords?.knowledge || [],
            ...prev.keywords,
            [activeSection]: newArray,
          },
        };
      } else {
        // Cross-section move
        const sourceArray = prev.keywords?.[activeSection] || job?.keywords?.[activeSection] || [];
        const targetArray = prev.keywords?.[overSection] || job?.keywords?.[overSection] || [];
        
        // Remove from source
        const newSourceArray = sourceArray.filter(item => item !== activeKeyword);
        
        // Add to target at the position of the over item
        const overIndex = targetArray.findIndex(item => item === overKeyword);
        const newTargetArray = [...targetArray];
        newTargetArray.splice(overIndex, 0, activeKeyword);
        
        return {
          ...prev,
          keywords: {
            actionVerbs: prev.keywords?.actionVerbs || job?.keywords?.actionVerbs || [],
            hardSkills: prev.keywords?.hardSkills || job?.keywords?.hardSkills || [],
            softSkills: prev.keywords?.softSkills || job?.keywords?.softSkills || [],
            knowledge: prev.keywords?.knowledge || job?.keywords?.knowledge || [],
            ...prev.keywords,
            [activeSection]: newSourceArray,
            [overSection]: newTargetArray,
          },
        };
      }
    });
  };

  const handleSave = async (updatedJob?: Partial<Job>) => {
    try {
      let jobToSave: Partial<Job> | null = null;

      // Get the data to save based on active tab
      if (activeTab === "details" && unifiedJobViewRef.current) {
        // Get data from UnifiedJobView
        const unifiedData = await unifiedJobViewRef.current.getEditedData();
        jobToSave = unifiedData;
      } else if (activeTab === "keywords") {
        // Use editedJob for keywords tab
        jobToSave = editedJob;
      } else {
        // For direct calls with updatedJob parameter
        jobToSave = updatedJob || editedJob;
      }

      if (!jobToSave) return;

      // Remove database-specific and Mongoose internal fields
      const {
        _id,
        userId,
        createdAt,
        updatedAt,
        optimizedResumeIds,
        applicationId,
        application,
        __v,
        ...updateData
      } = jobToSave as Job & { __v?: any };

      console.log("Saving job with data:", updateData);

      await updateJob.mutateAsync({
        id: resolvedParams.id as string,
        data: updateData,
      });
      // Don't change mode after saving
      setEditedJob(null);
    } catch (error: any) {
      // Error handling is done in the hook, but we still need to handle the editing state
      console.error("Failed to update job:", error);
      throw error;
    }
  };

  const handleCancel = () => {
    // Reset edited job to original without changing mode
    setEditedJob(null);
    // Reset the UnifiedJobView component to discard its changes
    if (unifiedJobViewRef.current) {
      unifiedJobViewRef.current.reset();
    }
  };

  const handleDeleteResume = async (resumeId: string) => {
    if (
      !confirm(
        "Are you sure you want to remove this optimized resume? This will unlink it from this job but the resume will still be available in your resumes list."
      )
    ) {
      return;
    }

    try {
      // Remove resume from job's optimizedResumeIds
      const updatedJob = {
        ...job,
        optimizedResumeIds:
          job?.optimizedResumeIds?.filter((id) => id !== resumeId) || [],
      };

      await handleSave(updatedJob);

      // Update local state
      setOptimizedResumes((prev) =>
        prev.filter((resume) => resume._id !== resumeId)
      );

      toast.success("Resume removed from job successfully");
    } catch (error) {
      console.error("Failed to remove resume:", error);
      toast.error("Failed to remove resume from job");
    }
  };

  const handleDownloadResume = async (resumeId: string) => {
    try {
      await exportPDF(resumeId);
      toast.success("Resume downloaded successfully");
    } catch (error) {
      console.error("Failed to download resume:", error);
      toast.error("Failed to download resume PDF");
    }
  };

  const handleDownload = () => {
    // Implement export functionality if needed
    toast.info("Export functionality coming soon");
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!job) return;
    
    try {
      await deleteJob.mutateAsync(job._id);
      toast.success('Job deleted successfully');
      setDeleteDialogOpen(false);
      router.push('/jobs');
    } catch (error) {
      toast.error('Failed to delete job');
    }
  };

  const handleGoToApplication = () => {
    if (hasApplication && application) {
      // Navigate to application page for editing
      router.push(`/applications/${application._id}`);
    } else {
      // Switch to application tab for creating
      setActiveTab("application");
    }
  };

  const handleUseInApplication = async (resumeId: string) => {
    try {
      if (hasApplication && application) {
        // Update existing application with new resume
        await updateJobApplication.mutateAsync({
          optimizedResumeId: resumeId,
        });
        toast.success("Application updated with selected resume");
      } else {
        // Create new application with selected resume
        const baseResume = optimizedResumes.find((r) => r.parentResumeId);
        if (!baseResume) {
          toast.error("Could not find base resume");
          return;
        }

        await createJobApplication.mutateAsync({
          optimizedResumeId: resumeId,
          baseResumeId: baseResume.parentResumeId,
          status: ApplicationStatus.DRAFT,
        });
        toast.success("Application created with selected resume");
      }

      // Switch to application tab
      setActiveTab("application");
    } catch (error) {
      // Error handled by hooks
    }
  };

  const formatSalary = (min?: number, max?: number, period?: string) => {
    if (!min && !max) return null;
    const periodText = period ? `/${period}` : "";
    if (min && max) {
      return `$${min.toLocaleString()} - $${max.toLocaleString()}${periodText}`;
    }
    if (min) {
      return `$${min.toLocaleString()}+${periodText}`;
    }
    if (max) {
      return `Up to $${max.toLocaleString()}${periodText}`;
    }
    return null;
  };

  const getJobStats = () => {
    const keywordsCount = job?.keywords
      ? (job.keywords.actionVerbs?.length || 0) +
        (job.keywords.hardSkills?.length || 0) +
        (job.keywords.softSkills?.length || 0) +
        (job.keywords.knowledge?.length || 0)
      : 0;

    return {
      keywordsCount,
      actionVerbsCount: job?.keywords?.actionVerbs?.length || 0,
      techSkillsCount: job?.keywords?.hardSkills?.length || 0,
      softSkillsCount: job?.keywords?.softSkills?.length || 0,
      knowledgeCount: job?.keywords?.knowledge?.length || 0,
      descriptionLength: job?.description?.length || 0,
      daysOld: job?.createdAt
        ? Math.floor(
            (Date.now() - new Date(job.createdAt).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 0,
      optimizedCount: job?.optimizedResumeIds?.length || 0,
      totalSkills: keywordsCount,
      isActive: job?.isActive !== false,
    };
  };

  if (isLoading) {
    return (
      <div className="max-w-8xl mx-auto space-y-6 p-6">
        <Skeleton className="h-10 w-32" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-8xl mx-auto space-y-6 p-6">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Job Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The job you're looking for doesn't exist or you don't have
            permission to view it.
          </p>
          <OutlineButton onClick={() => router.push("/jobs")}>
            Back to Jobs
          </OutlineButton>
        </Card>
      </div>
    );
  }

  const stats = getJobStats();

  return (
    <div className="max-w-8xl mx-auto space-y-6 p-6">
      {/* Custom Header */}
      <div className="space-y-6 mb-8">
        {/* Breadcrumbs */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground">
            Dashboard
          </Link>
          <span>/</span>
          <Link href="/jobs" className="hover:text-foreground">
            Jobs
          </Link>
          <span>/</span>
          <span className="text-foreground">{job.title}</span>
        </div>

        {/* Job Title */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {job.title}
        </h1>

        {/* Company, Location, Work Mode, and Category */}
        <div className="flex flex-wrap items-center gap-2 text-lg text-gray-700 dark:text-gray-300">
          <span className="font-semibold">{job.company}</span>
          {job.location && (
            <>
              <span className="text-gray-400">•</span>
              <span>{job.location}</span>
            </>
          )}
          {job.workMode ? (
            <>
              <span className="text-gray-400">•</span>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 font-medium capitalize"
              >
                {job.workMode}
              </Badge>
            </>
          ) : null}
          {job.category && job.category !== "General" && (
            <>
              <span className="text-gray-400">•</span>
              <Badge
                variant="outline"
                className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-800 font-medium"
              >
                {job.category}
              </Badge>
            </>
          )}
        </div>

        {/* Additional Info - Salary and Posted Date */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          {formatSalary(job.salaryMin, job.salaryMax, job.salaryPeriod) && (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-900/20 rounded-md">
              <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="font-medium text-green-700 dark:text-green-400">
                {formatSalary(job.salaryMin, job.salaryMax, job.salaryPeriod)}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>
              Posted {format(new Date(job.createdAt), "MMMM do, yyyy")}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Edit Mode Toggle */}
          <div className="sticky top-4 z-10 flex justify-between items-center bg-white dark:bg-gray-950 p-4 rounded-lg border border-gray-300 dark:border-gray-700 h-16 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2">
              <Switch
                id="edit-mode"
                checked={isEditing}
                onCheckedChange={setIsEditing}
                className="data-[state=checked]:bg-orange-600"
              />
              <Label
                htmlFor="edit-mode"
                className="cursor-pointer font-medium text-sm"
              >
                {isEditing ? "Edit Mode" : "View Mode"}
              </Label>
            </div>

            <div className="flex gap-2">
              {isEditing && (
                <>
                  <PrimaryButton
                    onClick={() => handleSave()}
                    size="sm"
                    disabled={updateJob.isPending}
                  >
                    {updateJob.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {updateJob.isPending ? "Saving..." : "Save Changes"}
                  </PrimaryButton>
                  <OutlineButton
                    onClick={handleCancel}
                    size="sm"
                    disabled={updateJob.isPending}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </OutlineButton>
                </>
              )}
            </div>
          </div>

          {/* Tabbed Content */}
          <CustomTab
            tabs={[
              {
                value: "details",
                label: "Job Details",
                content: (
                  <UnifiedJobView
                    ref={unifiedJobViewRef}
                    job={job}
                    onSave={handleSave}
                    onDownload={handleDownload}
                    isEditing={isEditing}
                    showEditControls={false}
                  />
                ),
              },
              {
                value: "keywords",
                label: "Keywords",
                content: (
                  <div className="space-y-6 mt-6">
                    {isEditing ? (
                      // Edit Mode - Keyword Editing
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleKeywordsDragEnd}
                      >
                        <SortableContext
                          items={[
                            ...(editedJob?.keywords?.actionVerbs || job?.keywords?.actionVerbs || []),
                            ...(editedJob?.keywords?.hardSkills || job?.keywords?.hardSkills || []),
                            ...(editedJob?.keywords?.softSkills || job?.keywords?.softSkills || []),
                            ...(editedJob?.keywords?.knowledge || job?.keywords?.knowledge || []),
                          ]}
                          strategy={rectSortingStrategy}
                        >
                          {/* Action Verbs Section */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-blue-600" />
                                Action Verbs
                              </CardTitle>
                              <CardDescription>
                                Key action verbs found in the job description
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-1.5 items-center">
                                  {(
                                    editedJob?.keywords?.actionVerbs ||
                                    job?.keywords?.actionVerbs ||
                                    []
                                  ).map((verb, index) => (
                                    <SortableKeywordBadge
                                      key={verb}
                                      id={verb}
                                      keyword={verb}
                                      isEditing={true}
                                      variant="secondary"
                                      className="bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300"
                                      onRemove={() =>
                                        setEditedJob((prev) => {
                                          if (!prev) return null;
                                          return {
                                            ...prev,
                                            keywords: {
                                              actionVerbs: (
                                                prev.keywords?.actionVerbs ||
                                                job?.keywords?.actionVerbs ||
                                                []
                                              ).filter((_, i) => i !== index),
                                              hardSkills: prev.keywords?.hardSkills || job?.keywords?.hardSkills || [],
                                              softSkills: prev.keywords?.softSkills || job?.keywords?.softSkills || [],
                                            },
                                          };
                                        })
                                      }
                                    />
                                  ))}
                              <Popover
                                open={addActionVerbOpen}
                                onOpenChange={setAddActionVerbOpen}
                              >
                                <PopoverTrigger asChild>
                                  <OutlineButton
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                  >
                                    <Plus className="w-3 h-3 mr-1" /> Add Verb
                                  </OutlineButton>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-80 p-0"
                                  align="start"
                                >
                                  <Command>
                                    <CommandInput
                                      placeholder="Type and press Enter to add"
                                      value={actionVerbInput}
                                      onValueChange={setActionVerbInput}
                                      onKeyDown={(e) => {
                                        if (
                                          e.key === "Enter" &&
                                          actionVerbInput.trim()
                                        ) {
                                          setEditedJob((prev) => {
                                            if (!prev) return null;
                                            return {
                                              ...prev,
                                              keywords: {
                                                actionVerbs: [
                                                  ...(prev.keywords
                                                    ?.actionVerbs ||
                                                    job?.keywords
                                                      ?.actionVerbs ||
                                                    []),
                                                  actionVerbInput.trim(),
                                                ],
                                                hardSkills: prev.keywords?.hardSkills || job?.keywords?.hardSkills || [],
                                                softSkills: prev.keywords?.softSkills || job?.keywords?.softSkills || [],
                                              },
                                            };
                                          });
                                          setActionVerbInput("");
                                          setAddActionVerbOpen(false);
                                        }
                                      }}
                                    />
                                    <CommandList>
                                      <CommandEmpty>
                                        {actionVerbInput.trim() ? (
                                          <div className="p-2">
                                            <GhostButton
                                              onClick={() => {
                                                setEditedJob((prev) => {
                                                  if (!prev) return null;
                                                  return {
                                                    ...prev,
                                                    keywords: {
                                                      actionVerbs: [
                                                        ...(prev.keywords
                                                          ?.actionVerbs ||
                                                          job?.keywords
                                                            ?.actionVerbs ||
                                                          []),
                                                        actionVerbInput.trim(),
                                                      ],
                                                      hardSkills: prev.keywords?.hardSkills || job?.keywords?.hardSkills || [],
                                                      softSkills: prev.keywords?.softSkills || job?.keywords?.softSkills || [],
                                                    },
                                                  };
                                                });
                                                setActionVerbInput("");
                                                setAddActionVerbOpen(false);
                                              }}
                                              className="w-full justify-start text-sm"
                                            >
                                              <Plus className="w-3 h-3 mr-2" />{" "}
                                              Add "{actionVerbInput}"
                                            </GhostButton>
                                          </div>
                                        ) : (
                                          "Type to add custom verb"
                                        )}
                                      </CommandEmpty>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                                </div>
                            </CardContent>
                          </Card>

                          {/* Technical Skills Section */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Target className="w-5 h-5 text-orange-600" />
                                Technical Skills
                              </CardTitle>
                              <CardDescription>
                                Required technical skills and technologies
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-1.5 items-center">
                                  {(
                                    editedJob?.keywords?.hardSkills ||
                                    job?.keywords?.hardSkills ||
                                    []
                                  ).map((skill, index) => (
                                    <SortableKeywordBadge
                                      key={skill}
                                      id={skill}
                                      keyword={skill}
                                      isEditing={true}
                                      variant="secondary"
                                      className="bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300"
                                      onRemove={() =>
                                        setEditedJob((prev) => {
                                          if (!prev) return null;
                                          return {
                                            ...prev,
                                            keywords: {
                                              actionVerbs: prev.keywords?.actionVerbs || job?.keywords?.actionVerbs || [],
                                              hardSkills: (
                                                prev.keywords?.hardSkills ||
                                                job?.keywords?.hardSkills ||
                                                []
                                              ).filter((_, i) => i !== index),
                                              softSkills: prev.keywords?.softSkills || job?.keywords?.softSkills || [],
                                            },
                                          };
                                        })
                                      }
                                    />
                                  ))}
                              <Popover
                                open={addHardSkillOpen}
                                onOpenChange={setAddHardSkillOpen}
                              >
                                <PopoverTrigger asChild>
                                  <OutlineButton
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                  >
                                    <Plus className="w-3 h-3 mr-1" /> Add
                                    Technical Skill
                                  </OutlineButton>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-80 p-0"
                                  align="start"
                                >
                                  <Command>
                                    <CommandInput
                                      placeholder="Type and press Enter to add"
                                      value={hardSkillInput}
                                      onValueChange={setHardSkillInput}
                                      onKeyDown={(e) => {
                                        if (
                                          e.key === "Enter" &&
                                          hardSkillInput.trim()
                                        ) {
                                          setEditedJob((prev) => {
                                            if (!prev) return null;
                                            return {
                                              ...prev,
                                              keywords: {
                                                actionVerbs: prev.keywords?.actionVerbs || job?.keywords?.actionVerbs || [],
                                                hardSkills: [
                                                  ...(prev.keywords
                                                    ?.hardSkills ||
                                                    job?.keywords?.hardSkills ||
                                                    []),
                                                  hardSkillInput.trim(),
                                                ],
                                                softSkills: prev.keywords?.softSkills || job?.keywords?.softSkills || [],
                                              },
                                            };
                                          });
                                          setHardSkillInput("");
                                          setAddHardSkillOpen(false);
                                        }
                                      }}
                                    />
                                    <CommandList>
                                      <CommandEmpty>
                                        {hardSkillInput.trim() ? (
                                          <div className="p-2">
                                            <GhostButton
                                              onClick={() => {
                                                setEditedJob((prev) => {
                                                  if (!prev) return null;
                                                  return {
                                                    ...prev,
                                                    keywords: {
                                                      actionVerbs: prev.keywords?.actionVerbs || job?.keywords?.actionVerbs || [],
                                                      hardSkills: [
                                                        ...(prev.keywords
                                                          ?.hardSkills ||
                                                          job?.keywords
                                                            ?.hardSkills ||
                                                          []),
                                                        hardSkillInput.trim(),
                                                      ],
                                                      softSkills: prev.keywords?.softSkills || job?.keywords?.softSkills || [],
                                                    },
                                                  };
                                                });
                                                setHardSkillInput("");
                                                setAddHardSkillOpen(false);
                                              }}
                                              className="w-full justify-start text-sm"
                                            >
                                              <Plus className="w-3 h-3 mr-2" />{" "}
                                              Add "{hardSkillInput}"
                                            </GhostButton>
                                          </div>
                                        ) : (
                                          "Type to add custom skill"
                                        )}
                                      </CommandEmpty>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                                </div>
                            </CardContent>
                          </Card>

                          {/* Soft Skills Section */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-green-600" />
                                Soft Skills
                              </CardTitle>
                              <CardDescription>
                                Interpersonal and professional skills required
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-1.5 items-center">
                                  {(
                                    editedJob?.keywords?.softSkills ||
                                    job?.keywords?.softSkills ||
                                    []
                                  ).map((skill, index) => (
                                    <SortableKeywordBadge
                                      key={skill}
                                      id={skill}
                                      keyword={skill}
                                      isEditing={true}
                                      variant="secondary"
                                      className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300"
                                      onRemove={() =>
                                        setEditedJob((prev) => {
                                          if (!prev) return null;
                                          return {
                                            ...prev,
                                            keywords: {
                                              actionVerbs: prev.keywords?.actionVerbs || job?.keywords?.actionVerbs || [],
                                              hardSkills: prev.keywords?.hardSkills || job?.keywords?.hardSkills || [],
                                              softSkills: (
                                                prev.keywords?.softSkills ||
                                                job?.keywords?.softSkills ||
                                                []
                                              ).filter((_, i) => i !== index),
                                            },
                                          };
                                        })
                                      }
                                    />
                                  ))}
                              <Popover
                                open={addSoftSkillOpen}
                                onOpenChange={setAddSoftSkillOpen}
                              >
                                <PopoverTrigger asChild>
                                  <OutlineButton
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                  >
                                    <Plus className="w-3 h-3 mr-1" /> Add Soft
                                    Skill
                                  </OutlineButton>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-80 p-0"
                                  align="start"
                                >
                                  <Command>
                                    <CommandInput
                                      placeholder="Type and press Enter to add"
                                      value={softSkillInput}
                                      onValueChange={setSoftSkillInput}
                                      onKeyDown={(e) => {
                                        if (
                                          e.key === "Enter" &&
                                          softSkillInput.trim()
                                        ) {
                                          setEditedJob((prev) => {
                                            if (!prev) return null;
                                            return {
                                              ...prev,
                                              keywords: {
                                                actionVerbs: prev.keywords?.actionVerbs || job?.keywords?.actionVerbs || [],
                                                hardSkills: prev.keywords?.hardSkills || job?.keywords?.hardSkills || [],
                                                softSkills: [
                                                  ...(prev.keywords
                                                    ?.softSkills ||
                                                    job?.keywords?.softSkills ||
                                                    []),
                                                  softSkillInput.trim(),
                                                ],
                                              },
                                            };
                                          });
                                          setSoftSkillInput("");
                                          setAddSoftSkillOpen(false);
                                        }
                                      }}
                                    />
                                    <CommandList>
                                      <CommandEmpty>
                                        {softSkillInput.trim() ? (
                                          <div className="p-2">
                                            <GhostButton
                                              onClick={() => {
                                                setEditedJob((prev) => {
                                                  if (!prev) return null;
                                                  return {
                                                    ...prev,
                                                    keywords: {
                                                      actionVerbs: prev.keywords?.actionVerbs || job?.keywords?.actionVerbs || [],
                                                      hardSkills: prev.keywords?.hardSkills || job?.keywords?.hardSkills || [],
                                                      softSkills: [
                                                        ...(prev.keywords
                                                          ?.softSkills ||
                                                          job?.keywords
                                                            ?.softSkills ||
                                                          []),
                                                        softSkillInput.trim(),
                                                      ],
                                                    },
                                                  };
                                                });
                                                setSoftSkillInput("");
                                                setAddSoftSkillOpen(false);
                                              }}
                                              className="w-full justify-start text-sm"
                                            >
                                              <Plus className="w-3 h-3 mr-2" />{" "}
                                              Add "{softSkillInput}"
                                            </GhostButton>
                                          </div>
                                        ) : (
                                          "Type to add custom skill"
                                        )}
                                      </CommandEmpty>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                                </div>
                            </CardContent>
                          </Card>

                          {/* Knowledge Areas Edit Card */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <BookOpen size={18} />
                                Knowledge Areas
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-1.5 items-center">
                                  {(
                                    editedJob?.keywords?.knowledge ||
                                    job?.keywords?.knowledge ||
                                    []
                                  ).map((item, index) => (
                                    <SortableKeywordBadge
                                      key={item}
                                      id={item}
                                      keyword={item}
                                      isEditing={true}
                                      variant="secondary"
                                      className="bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300"
                                      onRemove={() =>
                                        setEditedJob((prev) => {
                                          if (!prev) return null;
                                          return {
                                            ...prev,
                                            keywords: {
                                              actionVerbs: prev.keywords?.actionVerbs || job?.keywords?.actionVerbs || [],
                                              hardSkills: prev.keywords?.hardSkills || job?.keywords?.hardSkills || [],
                                              softSkills: prev.keywords?.softSkills || job?.keywords?.softSkills || [],
                                              knowledge: (
                                                prev.keywords?.knowledge ||
                                                job?.keywords?.knowledge ||
                                                []
                                              ).filter((_, i) => i !== index),
                                            },
                                          };
                                        })
                                      }
                                    />
                                  ))}
                              <Popover
                                open={addKnowledgeOpen}
                                onOpenChange={setAddKnowledgeOpen}
                              >
                                <PopoverTrigger asChild>
                                  <OutlineButton
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                  >
                                    <Plus className="w-3 h-3 mr-1" /> Add
                                    Knowledge Area
                                  </OutlineButton>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-80 p-0"
                                  align="start"
                                >
                                  <Command>
                                    <CommandInput
                                      placeholder="Type and press Enter to add"
                                      value={knowledgeInput}
                                      onValueChange={setKnowledgeInput}
                                      onKeyDown={(e) => {
                                        if (
                                          e.key === "Enter" &&
                                          knowledgeInput.trim()
                                        ) {
                                          setEditedJob((prev) => {
                                            if (!prev) return null;
                                            return {
                                              ...prev,
                                              keywords: {
                                                actionVerbs: prev.keywords?.actionVerbs || job?.keywords?.actionVerbs || [],
                                                hardSkills: prev.keywords?.hardSkills || job?.keywords?.hardSkills || [],
                                                softSkills: prev.keywords?.softSkills || job?.keywords?.softSkills || [],
                                                knowledge: [
                                                  ...(prev.keywords
                                                    ?.knowledge ||
                                                    job?.keywords?.knowledge ||
                                                    []),
                                                  knowledgeInput.trim(),
                                                ],
                                              },
                                            };
                                          });
                                          setKnowledgeInput("");
                                          setAddKnowledgeOpen(false);
                                        }
                                      }}
                                    />
                                    <CommandList>
                                      <CommandEmpty>
                                        {knowledgeInput.trim() ? (
                                          <div className="p-2">
                                            <GhostButton
                                              onClick={() => {
                                                setEditedJob((prev) => {
                                                  if (!prev) return null;
                                                  return {
                                                    ...prev,
                                                    keywords: {
                                                      actionVerbs: prev.keywords?.actionVerbs || job?.keywords?.actionVerbs || [],
                                                      hardSkills: prev.keywords?.hardSkills || job?.keywords?.hardSkills || [],
                                                      softSkills: prev.keywords?.softSkills || job?.keywords?.softSkills || [],
                                                      knowledge: [
                                                        ...(prev.keywords
                                                          ?.knowledge ||
                                                          job?.keywords
                                                            ?.knowledge ||
                                                          []),
                                                        knowledgeInput.trim(),
                                                      ],
                                                    },
                                                  };
                                                });
                                                setKnowledgeInput("");
                                                setAddKnowledgeOpen(false);
                                              }}
                                              className="w-full justify-start text-sm"
                                            >
                                              <Plus className="w-3 h-3 mr-2" />{" "}
                                              Add "{knowledgeInput}"
                                            </GhostButton>
                                          </div>
                                        ) : (
                                          "Type to add"
                                        )}
                                      </CommandEmpty>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                                </div>
                          </CardContent>
                        </Card>
                        </SortableContext>
                      </DndContext>
                    ) : (
                      // View Mode - Display Keywords
                      <>
                        {/* Action Verbs Section */}
                        {job.keywords?.actionVerbs &&
                          job.keywords.actionVerbs.length > 0 && (
                            <Card>
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                  <Sparkles className="w-5 h-5 text-blue-600" />
                                  Action Verbs
                                  <Badge variant="secondary" className="ml-2">
                                    {job.keywords.actionVerbs.length}
                                  </Badge>
                                </CardTitle>
                                <CardDescription>
                                  Key action verbs found in the job description
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="flex flex-wrap gap-2">
                                  {job.keywords.actionVerbs.map(
                                    (verb, index) => (
                                      <Badge
                                        key={index}
                                        variant="outline"
                                        className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
                                      >
                                        {verb}
                                      </Badge>
                                    )
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          )}

                        {/* Technical Skills Section */}
                        {job.keywords?.hardSkills &&
                          job.keywords.hardSkills.length > 0 && (
                            <Card>
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                  <Target className="w-5 h-5 text-orange-600" />
                                  Technical Skills
                                  <Badge variant="secondary" className="ml-2">
                                    {job.keywords.hardSkills.length}
                                  </Badge>
                                </CardTitle>
                                <CardDescription>
                                  Required technical skills and technologies
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="flex flex-wrap gap-2">
                                  {job.keywords.hardSkills.map(
                                    (skill, index) => (
                                      <Badge
                                        key={index}
                                        variant="outline"
                                        className="bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800"
                                      >
                                        {skill}
                                      </Badge>
                                    )
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          )}

                        {/* Soft Skills Section */}
                        {job.keywords?.softSkills &&
                          job.keywords.softSkills.length > 0 && (
                            <Card>
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                  <Users className="w-5 h-5 text-green-600" />
                                  Soft Skills
                                  <Badge variant="secondary" className="ml-2">
                                    {job.keywords.softSkills.length}
                                  </Badge>
                                </CardTitle>
                                <CardDescription>
                                  Interpersonal and professional skills required
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="flex flex-wrap gap-2">
                                  {job.keywords.softSkills.map(
                                    (skill, index) => (
                                      <Badge
                                        key={index}
                                        className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200"
                                      >
                                        {skill}
                                      </Badge>
                                    )
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          )}

                        {/* Knowledge Areas Section */}
                        {job.keywords?.knowledge &&
                          job.keywords.knowledge.length > 0 && (
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                  <BookOpen size={18} />
                                  Knowledge Areas
                                  <Badge variant="secondary" className="ml-2">
                                    {job.keywords.knowledge.length}
                                  </Badge>
                                </CardTitle>
                                <CardDescription className="text-xs">
                                  Domain expertise and knowledge areas
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="flex flex-wrap gap-2">
                                  {job.keywords.knowledge.map((area, index) => (
                                    <Badge
                                      key={index}
                                      className="bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-200"
                                    >
                                      {area}
                                    </Badge>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          )}
                      </>
                    )}
                  </div>
                ),
              },
              {
                value: "optimized",
                label: "Optimized Resumes",
                badge: optimizedResumes.length,
                content: (
                  <div className="space-y-6 mt-6">
                    {/* Optimized Resumes List */}
                    {isLoadingResumes ? (
                      <Card>
                        <CardContent className="flex items-center justify-center py-8">
                          <div className="text-center space-y-2">
                            <Loader2 className="w-8 h-8 text-orange-600 animate-spin mx-auto" />
                            <p className="text-sm text-muted-foreground">
                              Loading optimized resumes...
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ) : optimizedResumes.length === 0 ? (
                      <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                          <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                          <h3 className="text-lg font-semibold text-foreground mb-2">
                            No Optimized Resumes
                          </h3>
                          <p className="text-sm text-muted-foreground text-center mb-6">
                            No resumes have been optimized for this job yet.
                            Click "Optimize Resume" to get started.
                          </p>
                          <OptimizeResumeDialog
                            job={job!}
                            trigger={<SparkButton>Optimize Resume</SparkButton>}
                          />
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-4">
                        {optimizedResumes.map((resume) => (
                          <Card
                            key={resume._id}
                            className="hover:shadow-md transition-all duration-200"
                          >
                            <CardContent className="p-5">
                              <div className="space-y-4">
                                {/* Header Row with inline actions */}
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                                        {resume.title}
                                      </h3>
                                      <Badge variant="secondary">
                                        {resume.category || "General"}
                                      </Badge>
                                    </div>

                                    {/* Stats - Inline and compact */}
                                    <div className="flex flex-wrap items-center gap-4 text-sm">
                                      {resume.finalATSScore !== undefined && (
                                        <div className="flex items-center gap-2">
                                          <TrendingUp className="w-4 h-4 text-muted-foreground" />
                                          <span className="font-medium">
                                            ATS Score: {resume.finalATSScore}%
                                          </span>
                                          {resume.initialATSScore !==
                                            undefined && (
                                            <span className="text-green-600 dark:text-green-400 text-xs">
                                              (+
                                              {resume.finalATSScore -
                                                resume.initialATSScore}
                                              )
                                            </span>
                                          )}
                                        </div>
                                      )}

                                      {resume.finalKeywordScore !==
                                        undefined && (
                                        <div className="flex items-center gap-2">
                                          <Hash className="w-4 h-4 text-muted-foreground" />
                                          <span className="font-medium">
                                            Keywords: {resume.finalKeywordScore}
                                            %
                                          </span>
                                          {resume.initialKeywordScore !==
                                            undefined && (
                                            <span className="text-green-600 dark:text-green-400 text-xs">
                                              (+
                                              {resume.finalKeywordScore -
                                                resume.initialKeywordScore}
                                              )
                                            </span>
                                          )}
                                        </div>
                                      )}

                                      <div className="flex items-center gap-2">
                                        <Target className="w-4 h-4 text-muted-foreground" />
                                        <span className="font-medium">
                                          Matched:{" "}
                                          {resume.matchedKeywords?.length || 0}/
                                          {(resume.matchedKeywords?.length ||
                                            0) +
                                            (resume.unmatchedKeywords?.length ||
                                              0)}
                                        </span>
                                        <span className="text-muted-foreground text-xs">
                                          (
                                          {Math.round(
                                            ((resume.matchedKeywords?.length ||
                                              0) /
                                              Math.max(
                                                (resume.matchedKeywords
                                                  ?.length || 0) +
                                                  (resume.unmatchedKeywords
                                                    ?.length || 0),
                                                1
                                              )) *
                                              100
                                          )}
                                          %)
                                        </span>
                                      </div>
                                    </div>

                                    {/* Date and status */}
                                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        Optimized on{" "}
                                        {format(
                                          new Date(resume.createdAt),
                                          "MMM d, yyyy"
                                        )}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        Optimized
                                      </span>
                                    </div>
                                  </div>

                                  {/* Action buttons - inline on the right */}
                                  <div className="flex flex-col gap-2">
                                    <div className="flex gap-2">
                                      <PreviewButton
                                        onClick={() =>
                                          router.push(`/resumes/${resume._id}`)
                                        }
                                        size="sm"
                                      >
                                        <Eye className="w-4 h-4 mr-2" />
                                        View
                                      </PreviewButton>

                                      <OutlineButton
                                        onClick={() =>
                                          handleDownloadResume(resume._id)
                                        }
                                        size="sm"
                                      >
                                        <Download className="w-4 h-4 mr-2" />
                                        PDF
                                      </OutlineButton>

                                      <DestructiveButton
                                        onClick={() =>
                                          handleDeleteResume(resume._id)
                                        }
                                        size="sm"
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Remove
                                      </DestructiveButton>
                                    </div>

                                    <PrimaryButton
                                      onClick={() =>
                                        handleUseInApplication(resume._id)
                                      }
                                      size="sm"
                                      disabled={
                                        createJobApplication.isPending ||
                                        updateJobApplication.isPending
                                      }
                                    >
                                      <Briefcase className="w-4 h-4 mr-2" />
                                      {hasApplication &&
                                      application?.optimizedResumeId ===
                                        resume._id
                                        ? "Currently Used"
                                        : hasApplication
                                          ? "Switch Resume"
                                          : "Use in Application"}
                                    </PrimaryButton>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                ),
              },
              {
                value: "application",
                label: "Application",
                content: (
                  <JobApplicationSection
                    job={job}
                    optimizedResumes={optimizedResumes}
                  />
                ),
              },
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            variant="grid"
          />
        </div>

        {/* Sidebar */}
        <div>
          <div className="sticky top-6 space-y-6">
            {/* Quick Actions - Moved to Top */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <OptimizeResumeDialog
                  job={job}
                  trigger={
                    <SparkButton className="w-full">
                      Optimize Resume
                    </SparkButton>
                  }
                />

                {hasApplication ? (
                  <OutlineButton
                    className="w-full"
                    onClick={handleGoToApplication}
                  >
                    <Briefcase className="w-4 h-4 mr-2" />
                    Edit Application
                  </OutlineButton>
                ) : (
                  <CreateApplicationDialog
                    job={job}
                    optimizedResumes={optimizedResumes}
                    onApplicationCreated={() => setActiveTab("application")}
                    trigger={
                      <PrimaryButton className="w-full">
                        <Briefcase className="w-4 h-4 mr-2" />
                        Create Application
                      </PrimaryButton>
                    }
                  />
                )}
                {job.url && (
                  <OutlineButton
                    className="w-full"
                    onClick={() => window.open(job.url, "_blank")}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Job
                  </OutlineButton>
                )}

                {/* Delete button - available for all jobs */}
                <div className="pt-3 mt-3 border-t">
                  <OutlineButton
                    className="w-full text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={handleDelete}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Job
                  </OutlineButton>
                </div>
              </CardContent>
            </Card>

            {/* Job Summary Card */}
            {(job.summary ||
              (job.mustHaveSkills && job.mustHaveSkills.length > 0) ||
              (job.niceToHaveSkills && job.niceToHaveSkills.length > 0)) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="w-5 h-5 text-orange-600" />
                    Quick Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {job.summary && (
                    <div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {job.summary}
                      </p>
                    </div>
                  )}

                  {job.industry && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800"
                      >
                        {job.industry}
                      </Badge>
                    </div>
                  )}

                  {job.workMode && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <Badge variant="outline" className="capitalize">
                        {job.workMode}
                      </Badge>
                    </div>
                  )}

                  {job.mustHaveSkills && job.mustHaveSkills.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Must Have
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
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="w-5 h-5 text-orange-600" />
                  Job Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Total Keywords
                    </span>
                    <Badge variant="secondary">{stats.keywordsCount}</Badge>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      Action Verbs
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {stats.actionVerbsCount}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <div className="w-2 h-2 bg-orange-500 rounded-full" />
                      Technical Skills
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {stats.techSkillsCount}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      Soft Skills
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {stats.softSkillsCount}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <div className="w-2 h-2 bg-purple-500 rounded-full" />
                      Knowledge Areas
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {stats.knowledgeCount}
                    </Badge>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Optimized Resumes
                    </span>
                    <Badge variant="secondary">
                      {job?.optimizedResumeIds?.length || 0}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{job?.title || 'this job'}" at {job?.company || 'this company'}? 
              This will also remove any associated applications and optimized resumes. 
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
