"use client";

import {
  useState,
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import { useRouter } from "next/navigation";
import {
  Building,
  MapPin,
  Globe,
  DollarSign,
  Tag,
  Briefcase,
  Edit,
  Save,
  X,
  Download,
  ExternalLink,
  Target,
  Calendar,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PrimaryButton, OutlineButton } from "@/components/custom/Button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Job } from "@/types/job";
import { EditableField } from "../resume/EditableField";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
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
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface UnifiedJobViewProps {
  job: Job;
  onSave: (updatedJob: Partial<Job>) => Promise<void>;
  onDownload?: () => void;
  isEditing?: boolean;
  showEditControls?: boolean;
}

export interface UnifiedJobViewRef {
  save: () => Promise<void>;
  reset: () => void;
  getEditedData: () => Job;
}

const JOB_CATEGORIES = [
  "Frontend",
  "Backend",
  "FullStack",
  "AI/ML",
  "Blockchain",
  "DevOps",
  "Mobile",
  "DataEngineering",
  "Security",
  "General",
] as const;

const SALARY_PERIODS = [
  { value: "hourly", label: "Hourly" },
  { value: "yearly", label: "Yearly" },
  { value: "monthly", label: "Monthly" },
] as const;

const UnifiedJobView = forwardRef<UnifiedJobViewRef, UnifiedJobViewProps>(
  function UnifiedJobView(
    {
      job: initialJob,
      onSave,
      onDownload,
      isEditing = false,
      showEditControls = true,
    },
    ref
  ) {
    const [job, setJob] = useState<Job>(initialJob);
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();
    const scrollPositionRef = useRef<number>(0);

    const handleFieldChange = (updater: (prev: Job) => Job) => {
      setJob(updater);
    };

    const handleSave = async () => {
      setIsSaving(true);
      try {
        await onSave(job);
        toast.success("Job saved successfully");
      } catch (error) {
        console.error("Save failed:", error);
        toast.error("Failed to save job");
      } finally {
        setIsSaving(false);
      }
    };

    const handleCancel = () => {
      setJob(initialJob);
    };

    // Update job state when initialJob changes
    useEffect(() => {
      setJob(initialJob);
    }, [initialJob]);

    // Expose save, reset and getEditedData functions to parent component
    useImperativeHandle(ref, () => ({
      save: handleSave,
      reset: handleCancel,
      getEditedData: () => job,
    }));

    // dnd-kit sensors and sortable chip wrapper for keywords
    const sensors = useSensors(
      useSensor(PointerSensor),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      })
    );

    const handleKeywordsDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const parseId = (id: string) => {
        const [section, idxStr] = id.toString().split(":");
        return {
          section: section as "actionVerbs" | "hardSkills" | "softSkills",
          index: parseInt(idxStr || "0", 10),
        };
      };

      const { section: fromSection, index: fromIndex } = parseId(
        active.id.toString()
      );
      const { section: toSection, index: toIndex } = parseId(
        over.id.toString()
      );
      if (!fromSection || !toSection) return;

      handleFieldChange((prev) => {
        const kw = prev.keywords || {
          actionVerbs: [],
          hardSkills: [],
          softSkills: [],
          knowledge: [],
        };
        if (fromSection === toSection) {
          const list = [...(kw[fromSection] as string[])];
          const [moved] = list.splice(fromIndex, 1);
          list.splice(toIndex, 0, moved);
          return { ...prev, keywords: { ...kw, [fromSection]: list } };
        } else {
          const source = [...(kw[fromSection] as string[])];
          const target = [...(kw[toSection] as string[])];
          const [moved] = source.splice(fromIndex, 1);
          target.splice(toIndex, 0, moved);
          return {
            ...prev,
            keywords: { ...kw, [fromSection]: source, [toSection]: target },
          };
        }
      });
    };

    function SortableBadgeItem({
      id,
      children,
    }: {
      id: string;
      children: React.ReactNode;
    }) {
      const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
      } = useSortable({ id });
      const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
        cursor: "grab",
        display: "inline-block",
      };
      return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
          {children}
        </div>
      );
    }

    // Helper functions
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

    const handleKeywordsChange = (
      category: "actionVerbs" | "hardSkills" | "softSkills",
      value: string
    ) => {
      const keywords = value
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k);
      handleFieldChange((prev) => ({
        ...prev,
        keywords: {
          actionVerbs: prev.keywords?.actionVerbs || [],
          hardSkills: prev.keywords?.hardSkills || [],
          softSkills: prev.keywords?.softSkills || [],
          [category]: keywords,
        },
      }));
    };

    return (
      <div className="space-y-4">
        {/* Header Actions - Only show if showEditControls is true */}
        {showEditControls && (
          <div className="flex justify-between items-center bg-white dark:bg-gray-950 p-3 rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <Switch
                id="edit-mode-unified"
                checked={isEditing}
                onCheckedChange={() => {}}
                className="data-[state=checked]:bg-orange-600"
                disabled
              />
              <Label
                htmlFor="edit-mode-unified"
                className="cursor-pointer font-medium text-sm"
              >
                {isEditing ? "Edit Mode" : "View Mode"}
              </Label>
            </div>

            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <PrimaryButton
                    onClick={handleSave}
                    disabled={isSaving}
                    size="sm"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </PrimaryButton>
                  <OutlineButton
                    onClick={handleCancel}
                    disabled={isSaving}
                    size="sm"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </OutlineButton>
                </>
              ) : (
                <>
                  {onDownload && (
                    <OutlineButton onClick={onDownload} size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </OutlineButton>
                  )}
                  <OutlineButton onClick={() => {}} size="sm" disabled>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Job
                  </OutlineButton>
                </>
              )}
            </div>
          </div>
        )}

        {/* Job Header - Only show in edit mode */}
        {isEditing && (
          <Card className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Job Title - Full Width */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-orange-600" />
                    Job Title
                  </label>
                  <EditableField
                    value={job.title || ""}
                    onChange={(value) =>
                      handleFieldChange((prev) => ({
                        ...prev,
                        title: value,
                      }))
                    }
                    isEditing={isEditing}
                    placeholder="Enter job title"
                    className="text-xl font-semibold"
                  />
                </div>

                {/* Company and Location - 2 Columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Building className="w-4 h-4 text-orange-600" />
                      Company
                    </label>
                    <EditableField
                      value={job.company || ""}
                      onChange={(value) =>
                        handleFieldChange((prev) => ({
                          ...prev,
                          company: value,
                        }))
                      }
                      isEditing={isEditing}
                      placeholder="Company name"
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-orange-600" />
                      Location
                    </label>
                    <EditableField
                      value={job.location || ""}
                      onChange={(value) =>
                        handleFieldChange((prev) => ({
                          ...prev,
                          location: value,
                        }))
                      }
                      isEditing={isEditing}
                      placeholder="City, State or Remote"
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* Category, Work Mode, and Job Type - 3 Columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-orange-600" />
                      Category
                    </label>
                    <select
                      value={job.category || "General"}
                      onChange={(e) =>
                        handleFieldChange((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }))
                      }
                      className="w-full text-sm border border-gray-300/70 dark:border-gray-600/50 rounded-md px-3 py-2 bg-white dark:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      {JOB_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-orange-600" />
                      Work Mode
                    </label>
                    <select
                      value={job.workMode || "onsite"}
                      onChange={(e) =>
                        handleFieldChange((prev) => ({
                          ...prev,
                          workMode: e.target.value as
                            | "remote"
                            | "hybrid"
                            | "onsite",
                        }))
                      }
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="onsite">Onsite</option>
                      <option value="remote">Remote</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-orange-600" />
                      Job Type
                    </label>
                    <select
                      value={job.jobType || "full-time"}
                      onChange={(e) =>
                        handleFieldChange((prev) => ({
                          ...prev,
                          jobType: e.target.value as
                            | "full-time"
                            | "part-time"
                            | "contract"
                            | "internship"
                            | "freelance"
                            | "temporary",
                        }))
                      }
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="full-time">Full Time</option>
                      <option value="part-time">Part Time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                      <option value="freelance">Freelance</option>
                      <option value="temporary">Temporary</option>
                    </select>
                  </div>
                </div>

                {/* Salary Range - 3 Columns */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-orange-600" />
                    Salary Range (Optional)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500 dark:text-gray-400">
                        Minimum
                      </label>
                      <EditableField
                        value={job.salaryMin?.toString() || ""}
                        onChange={(value) =>
                          handleFieldChange((prev) => ({
                            ...prev,
                            salaryMin: value ? parseFloat(value) : undefined,
                          }))
                        }
                        isEditing={isEditing}
                        placeholder="50000"
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500 dark:text-gray-400">
                        Maximum
                      </label>
                      <EditableField
                        value={job.salaryMax?.toString() || ""}
                        onChange={(value) =>
                          handleFieldChange((prev) => ({
                            ...prev,
                            salaryMax: value ? parseFloat(value) : undefined,
                          }))
                        }
                        isEditing={isEditing}
                        placeholder="80000"
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500 dark:text-gray-400">
                        Period
                      </label>
                      <select
                        value={job.salaryPeriod || "yearly"}
                        onChange={(e) =>
                          handleFieldChange((prev) => ({
                            ...prev,
                            salaryPeriod: e.target.value,
                          }))
                        }
                        className="w-full text-sm border border-gray-300/70 dark:border-gray-600/50 rounded-md px-3 py-2 bg-white dark:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        {SALARY_PERIODS.map((period) => (
                          <option key={period.value} value={period.value}>
                            {period.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Job URL - Full Width */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-orange-600" />
                    Job URL (Optional)
                  </label>
                  <EditableField
                    value={job.url || ""}
                    onChange={(value) =>
                      handleFieldChange((prev) => ({
                        ...prev,
                        url: value,
                      }))
                    }
                    isEditing={isEditing}
                    placeholder="https://company.com/jobs/position"
                    className="text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Additional Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              Additional Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div>
              <Label className="text-sm font-medium mb-1">Summary</Label>
              <EditableField
                value={job.summary || ""}
                onChange={(value) =>
                  handleFieldChange((prev) => ({
                    ...prev,
                    summary: value,
                  }))
                }
                isEditing={isEditing}
                placeholder="Brief job overview..."
                multiline={true}
                rows={2}
                className="text-sm"
              />
            </div>

            {/* Industry */}
            <div>
              <Label className="text-sm font-medium mb-1">Industry</Label>
              <EditableField
                value={job.industry || ""}
                onChange={(value) =>
                  handleFieldChange((prev) => ({
                    ...prev,
                    industry: value,
                  }))
                }
                isEditing={isEditing}
                placeholder="e.g., FinTech - Digital Payments"
                className="text-sm"
              />
            </div>

            {/* Must Have Skills */}
            <div>
              <Label className="text-sm font-medium mb-1">
                Must Have Skills
              </Label>
              <EditableField
                value={job.mustHaveSkills?.join(", ") || ""}
                onChange={(value) =>
                  handleFieldChange((prev) => ({
                    ...prev,
                    mustHaveSkills: value
                      .split(",")
                      .map((s) => s.trim())
                      .filter((s) => s),
                  }))
                }
                isEditing={isEditing}
                placeholder="Comma-separated critical skills"
                className="text-sm"
              />
            </div>

            {/* Nice to Have Skills */}
            <div>
              <Label className="text-sm font-medium mb-1">
                Nice to Have Skills
              </Label>
              <EditableField
                value={job.niceToHaveSkills?.join(", ") || ""}
                onChange={(value) =>
                  handleFieldChange((prev) => ({
                    ...prev,
                    niceToHaveSkills: value
                      .split(",")
                      .map((s) => s.trim())
                      .filter((s) => s),
                  }))
                }
                isEditing={isEditing}
                placeholder="Comma-separated preferred skills"
                className="text-sm"
              />
            </div>

            {/* Keywords - mirrors resume skills layout; only in edit mode */}
            {isEditing && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-amber-600" />
                    Keywords
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleKeywordsDragEnd}
                  >
                    {/* Action Verbs */}
                    <div>
                      <Label className="text-sm font-medium mb-1">
                        Action Verbs
                      </Label>
                      {job.keywords?.actionVerbs &&
                        job.keywords.actionVerbs.length > 0 && (
                          <SortableContext
                            items={(job.keywords.actionVerbs || []).map(
                              (_, i) => `actionVerbs:${i}`
                            )}
                            strategy={rectSortingStrategy}
                          >
                            <div className="flex flex-wrap gap-1.5 items-center">
                              {job.keywords.actionVerbs.map((kw, i) => (
                                <SortableBadgeItem
                                  key={`actionVerbs:${i}`}
                                  id={`actionVerbs:${i}`}
                                >
                                  <Badge
                                    variant="secondary"
                                    className="pl-2 pr-1 py-1 flex items-center gap-1"
                                  >
                                    <span className="text-xs">{kw}</span>
                                  </Badge>
                                </SortableBadgeItem>
                              ))}
                            </div>
                          </SortableContext>
                        )}
                    </div>

                    {/* Hard Skills */}
                    <div>
                      <Label className="text-sm font-medium mb-1">
                        Technical Skills
                      </Label>
                      {job.keywords?.hardSkills &&
                        job.keywords.hardSkills.length > 0 && (
                          <SortableContext
                            items={(job.keywords.hardSkills || []).map(
                              (_, i) => `hardSkills:${i}`
                            )}
                            strategy={rectSortingStrategy}
                          >
                            <div className="flex flex-wrap gap-1.5 items-center">
                              {job.keywords.hardSkills.map((kw, i) => (
                                <SortableBadgeItem
                                  key={`hardSkills:${i}`}
                                  id={`hardSkills:${i}`}
                                >
                                  <Badge
                                    variant="secondary"
                                    className="pl-2 pr-1 py-1 flex items-center gap-1"
                                  >
                                    <span className="text-xs">{kw}</span>
                                  </Badge>
                                </SortableBadgeItem>
                              ))}
                            </div>
                          </SortableContext>
                        )}
                    </div>

                    {/* Soft Skills */}
                    <div>
                      <Label className="text-sm font-medium mb-1">
                        Soft Skills
                      </Label>
                      {job.keywords?.softSkills &&
                        job.keywords.softSkills.length > 0 && (
                          <SortableContext
                            items={(job.keywords.softSkills || []).map(
                              (_, i) => `softSkills:${i}`
                            )}
                            strategy={rectSortingStrategy}
                          >
                            <div className="flex flex-wrap gap-1.5 items-center">
                              {job.keywords.softSkills.map((kw, i) => (
                                <SortableBadgeItem
                                  key={`softSkills:${i}`}
                                  id={`softSkills:${i}`}
                                >
                                  <Badge
                                    variant="secondary"
                                    className="pl-2 pr-1 py-1 flex items-center gap-1"
                                  >
                                    <span className="text-xs">{kw}</span>
                                  </Badge>
                                </SortableBadgeItem>
                              ))}
                            </div>
                          </SortableContext>
                        )}
                    </div>
                  </DndContext>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Job Description */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-600" />
              Job Description
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <EditableField
                value={job.description || ""}
                onChange={(value) =>
                  handleFieldChange((prev) => ({
                    ...prev,
                    description: value,
                  }))
                }
                isEditing={isEditing}
                placeholder="Job description..."
                multiline={true}
                rows={8}
                className="text-sm"
              />
            ) : (
              <div className="prose max-w-none text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {job.description}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
);

export default UnifiedJobView;
