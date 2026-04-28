"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  MapPin,
  Mail,
  Phone,
  Github,
  Linkedin,
  Globe,
  Calendar,
  Building,
  GraduationCap,
  Code,
  User,
  Briefcase,
  Award,
  Download,
  Save,
  X,
  Plus,
  Trash2,
  GripVertical,
  Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PrimaryButton,
  OutlineButton,
  GhostButton,
  IconButton,
  DestructiveButton,
  DestructiveIconButton,
  SparkIconButton,
} from "@/components/custom/Button";
import { SortableSkillBadge } from "@/components/resume/SortableSkillBadge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Resume, Experience, Project, Education } from "@/types/resume";
import { EditableField } from "./EditableField";
import { ContentOptimizationDrawer } from "./ContentOptimizationDrawer";
import { SkillsOptimizationDrawer } from "./SkillsOptimizationDrawer";
import { ContentImprovementDrawer } from "./ContentImprovementDrawer";
import { AddSkillsDialog } from "./AddSkillsDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const RESUME_CATEGORIES = [
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
];
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
  verticalListSortingStrategy,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { HighlightedText } from "@/lib/utils/text-highlighter";
import {
  getKeywordsFromText as getKeywordsFromTextUtil,
  getKeywordBadgeClassName,
  shouldShowKeyword,
} from "@/utils/resume-helpers";

interface UnifiedResumeViewProps {
  resume: Resume;
  onSave: (updatedResume: Partial<Resume>) => Promise<void>;
  onDownload?: () => void;
  highlightedKeywords?: Set<string>;
  allKeywordsForHighlight?: Set<string>;
  mode?: "base" | "optimized";
}

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  handle?: boolean;
  isEditing?: boolean;
}

function SortableItem({
  id,
  children,
  handle = false,
  isEditing = false,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group"
      {...(!handle && isEditing ? { ...attributes, ...listeners } : {})}
    >
      {handle && isEditing && (
        <div
          className="absolute -left-6 top-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move p-1"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>
      )}
      {children}
    </div>
  );
}

export default function UnifiedResumeView({
  resume: initialResume,
  onSave,
  onDownload,
  highlightedKeywords = new Set(),
  allKeywordsForHighlight = new Set(),
  mode = initialResume.isOptimized ? "optimized" : "base",
}: UnifiedResumeViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [resume, setResume] = useState<Resume>(initialResume);
  const [isSaving, setIsSaving] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const scrollPositionRef = useRef<number>(0);

  // Update local resume state when initialResume changes
  useEffect(() => {
    setResume(initialResume);
  }, [initialResume]);

  // Memoized keywords by category that updates with resume changes
  const keywordsByCategory = useMemo(() => {
    const categories = {
      actionVerbs: [] as string[],
      hardSkills: [] as string[],
      softSkills: [] as string[],
      knowledge: [] as string[]
    };

    // Add matched keywords by category
    if (resume.matchedKeywordsByCategory) {
      categories.actionVerbs.push(...(resume.matchedKeywordsByCategory.actionVerbs || []));
      categories.hardSkills.push(...(resume.matchedKeywordsByCategory.hardSkills || []));
      categories.softSkills.push(...(resume.matchedKeywordsByCategory.softSkills || []));
      categories.knowledge.push(...(resume.matchedKeywordsByCategory.knowledge || []));
    }

    // Add unmatched keywords by category
    if (resume.unmatchedKeywordsByCategory) {
      categories.actionVerbs.push(...(resume.unmatchedKeywordsByCategory.actionVerbs || []));
      categories.hardSkills.push(...(resume.unmatchedKeywordsByCategory.hardSkills || []));
      categories.softSkills.push(...(resume.unmatchedKeywordsByCategory.softSkills || []));
      categories.knowledge.push(...(resume.unmatchedKeywordsByCategory.knowledge || []));
    }

    // Remove duplicates
    return {
      actionVerbs: [...new Set(categories.actionVerbs)],
      hardSkills: [...new Set(categories.hardSkills)],
      softSkills: [...new Set(categories.softSkills)],
      knowledge: [...new Set(categories.knowledge)]
    };
  }, [resume.matchedKeywordsByCategory, resume.unmatchedKeywordsByCategory]);

  // Optimization drawer state
  const [optimizationDrawer, setOptimizationDrawer] = useState<{
    open: boolean;
    content: string;
    contentType: "responsibility" | "project_description" | "achievement";
    updateCallback: (value: string) => void;
  }>({
    open: false,
    content: "",
    contentType: "responsibility",
    updateCallback: () => {},
  });

  // Skills optimization drawer state
  const [skillsOptimizationDrawer, setSkillsOptimizationDrawer] = useState<{
    open: boolean;
    currentSkills: string[];
    skillType: "technical" | "soft" | "development";
    updateCallback: (skills: string[]) => void;
  }>({
    open: false,
    currentSkills: [],
    skillType: "technical",
    updateCallback: () => {},
  });

  // Content improvement drawer state for base resume
  const [contentImprovementDrawer, setContentImprovementDrawer] = useState<{
    open: boolean;
    content: string;
    contentType: "responsibility" | "project_description" | "achievement";
    updateCallback: (value: string) => void;
  }>({
    open: false,
    content: "",
    contentType: "responsibility",
    updateCallback: () => {},
  });

  // Skill add popover states
  const [addTechnicalSkillOpen, setAddTechnicalSkillOpen] = useState(false);
  const [addDevelopmentSkillOpen, setAddDevelopmentSkillOpen] = useState(false);
  const [addPersonalSkillOpen, setAddPersonalSkillOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const theme = useMemo(
    () => ({
      iconColor: mode === "optimized" ? "text-orange-600" : "text-blue-600",
      badgeVariant: mode === "optimized" ? "outline" : ("default" as const),
      showATSFeatures: mode === "optimized",
    }),
    [mode]
  );

  // Helper function wrappers with component-specific context
  const getKeywordsFromText = useCallback(
    (text: string | string[] | undefined) =>
      getKeywordsFromTextUtil(text, resume, theme.showATSFeatures),
    [resume, theme.showATSFeatures]
  );

  const getKeywordBadgeClassNameWrapped = useCallback(
    (keyword: string) =>
      getKeywordBadgeClassName(
        keyword,
        highlightedKeywords,
        allKeywordsForHighlight
      ),
    [highlightedKeywords, allKeywordsForHighlight]
  );

  const shouldShowKeywordWrapped = useCallback(
    (keyword: string) =>
      shouldShowKeyword(keyword, highlightedKeywords, allKeywordsForHighlight),
    [highlightedKeywords, allKeywordsForHighlight]
  );

  const handleFieldChange = useCallback((updater: (prev: Resume) => Resume) => {
    setResume(updater);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(resume);
      // Don't change mode after saving
      toast.success("Resume saved successfully");
    } catch (error) {
      console.error("Save failed:", error);
      toast.error("Failed to save resume");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset resume to initial state without changing mode
    setResume(initialResume);
  };

  // Fix scrolling issue when toggling edit mode
  const handleEditToggle = (checked: boolean) => {
    scrollPositionRef.current = window.scrollY;
    setIsEditing(checked);
    setTimeout(() => {
      window.scrollTo(0, scrollPositionRef.current);
    }, 0);
  };

  // Drag handlers for different sections
  const handleExperienceDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      handleFieldChange((prev) => {
        const oldIndex =
          prev.experience?.findIndex(
            (exp) => `exp-${exp.title}-${exp.company}` === active.id
          ) ?? -1;
        const newIndex =
          prev.experience?.findIndex(
            (exp) => `exp-${exp.title}-${exp.company}` === over?.id
          ) ?? -1;
        if (oldIndex !== -1 && newIndex !== -1 && prev.experience) {
          return {
            ...prev,
            experience: arrayMove(prev.experience, oldIndex, newIndex),
          };
        }
        return prev;
      });
    }
  };

  const handleEducationDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      handleFieldChange((prev) => {
        const oldIndex =
          prev.education?.findIndex(
            (edu) => `edu-${edu.institution}-${edu.degree}` === active.id
          ) ?? -1;
        const newIndex =
          prev.education?.findIndex(
            (edu) => `edu-${edu.institution}-${edu.degree}` === over?.id
          ) ?? -1;
        if (oldIndex !== -1 && newIndex !== -1 && prev.education) {
          return {
            ...prev,
            education: arrayMove(prev.education, oldIndex, newIndex),
          };
        }
        return prev;
      });
    }
  };

  const handleProjectsDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      handleFieldChange((prev) => {
        const oldIndex =
          prev.projects?.findIndex(
            (proj) => `proj-${proj.name}` === active.id
          ) ?? -1;
        const newIndex =
          prev.projects?.findIndex(
            (proj) => `proj-${proj.name}` === over?.id
          ) ?? -1;
        if (oldIndex !== -1 && newIndex !== -1 && prev.projects) {
          return {
            ...prev,
            projects: arrayMove(prev.projects, oldIndex, newIndex),
          };
        }
        return prev;
      });
    }
  };

  const handleResponsibilityDragEnd = (
    expIndex: number,
    event: DragEndEvent
  ) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      handleFieldChange((prev) => {
        const exp = prev.experience?.[expIndex];
        if (exp) {
          const oldIndex = parseInt(
            active.id.toString().split("-").pop() || "0"
          );
          const newIndex = parseInt(
            over?.id.toString().split("-").pop() || "0"
          );
          const newResponsibilities = arrayMove(
            exp.responsibilities,
            oldIndex,
            newIndex
          );

          return {
            ...prev,
            experience: prev.experience?.map((e, i) =>
              i === expIndex
                ? { ...e, responsibilities: newResponsibilities }
                : e
            ),
          };
        }
        return prev;
      });
    }
  };

  // Unified drag end handler for cross-section drag and drop
  const handleSkillsDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const parseId = (id: string) => {
      const idx = id.indexOf(":");
      if (idx === -1) return { section: null as any, value: id };
      return {
        section: id.slice(0, idx) as
          | "technicalSkills"
          | "developmentPracticesMethodologies"
          | "personalSkills",
        value: id.slice(idx + 1),
      };
    };

    const { section: activeSection, value: activeValue } = parseId(
      active.id.toString()
    );
    const { section: overSection, value: overValue } = parseId(
      over.id.toString()
    );

    if (!activeSection || !overSection) return;

    handleFieldChange((prev) => {
      const skills = prev.skills || {};

      if (activeSection === overSection) {
        const sectionSkills = (skills as any)[activeSection] || [];
        const oldIndex = sectionSkills.findIndex(
          (s: string) => s === activeValue
        );
        const newIndex = sectionSkills.findIndex(
          (s: string) => s === overValue
        );
        if (oldIndex === -1 || newIndex === -1) return prev;
        const newSkills = arrayMove(sectionSkills, oldIndex, newIndex);
        return { ...prev, skills: { ...skills, [activeSection]: newSkills } };
      } else {
        const sourceSkills = (skills as any)[activeSection] || [];
        const targetSkills = (skills as any)[overSection] || [];
        const newSourceSkills = sourceSkills.filter(
          (s: string) => s !== activeValue
        );
        const overIndex = targetSkills.findIndex(
          (s: string) => s === overValue
        );
        const newTargetSkills = [...targetSkills];
        const insertIndex = overIndex === -1 ? targetSkills.length : overIndex;
        newTargetSkills.splice(insertIndex, 0, activeValue);
        return {
          ...prev,
          skills: {
            ...skills,
            [activeSection]: newSourceSkills,
            [overSection]: newTargetSkills,
          },
        };
      }
    });
  };

  const openOptimizationDrawer = (
    content: string,
    contentType: "responsibility" | "project_description" | "achievement",
    updateCallback: (value: string) => void
  ) => {
    setOptimizationDrawer({
      open: true,
      content,
      contentType,
      updateCallback,
    });
  };

  const openSkillsOptimizationDrawer = (
    currentSkills: string[],
    skillType: "technical" | "soft" | "development",
    updateCallback: (skills: string[]) => void
  ) => {
    setSkillsOptimizationDrawer({
      open: true,
      currentSkills,
      skillType,
      updateCallback,
    });
  };

  const openContentImprovementDrawer = (
    content: string,
    contentType: "responsibility" | "project_description" | "achievement",
    updateCallback: (value: string) => void
  ) => {
    setContentImprovementDrawer({
      open: true,
      content,
      contentType,
      updateCallback,
    });
  };


  // Add/Remove functions
  const addExperience = () => {
    const newExp: Experience = {
      title: "",
      company: "",
      location: "",
      dates: "",
      responsibilities: [""],
    };
    handleFieldChange((prev) => ({
      ...prev,
      experience: [...(prev.experience || []), newExp],
    }));
  };

  const removeExperience = (index: number) => {
    handleFieldChange((prev) => ({
      ...prev,
      experience: prev.experience?.filter((_, i) => i !== index) || [],
    }));
  };

  const addResponsibility = (expIndex: number) => {
    handleFieldChange((prev) => ({
      ...prev,
      experience:
        prev.experience?.map((exp, i) =>
          i === expIndex
            ? { ...exp, responsibilities: [...exp.responsibilities, ""] }
            : exp
        ) || [],
    }));
  };

  const removeResponsibility = (expIndex: number, respIndex: number) => {
    handleFieldChange((prev) => ({
      ...prev,
      experience:
        prev.experience?.map((exp, i) =>
          i === expIndex
            ? {
                ...exp,
                responsibilities: exp.responsibilities.filter(
                  (_, j) => j !== respIndex
                ),
              }
            : exp
        ) || [],
    }));
  };

  const addProject = () => {
    const newProject: Project = {
      name: "",
      technologies: "",
      description: "",
    };
    handleFieldChange((prev) => ({
      ...prev,
      projects: [...(prev.projects || []), newProject],
    }));
  };

  const removeProject = (index: number) => {
    handleFieldChange((prev) => ({
      ...prev,
      projects: prev.projects?.filter((_, i) => i !== index) || [],
    }));
  };

  const addEducation = () => {
    const newEducation: Education = {
      institution: "",
      location: "",
      dates: "",
      degree: "",
      achievements: [],
    };
    handleFieldChange((prev) => ({
      ...prev,
      education: [...(prev.education || []), newEducation],
    }));
  };

  const removeEducation = (index: number) => {
    handleFieldChange((prev) => ({
      ...prev,
      education: prev.education?.filter((_, i) => i !== index) || [],
    }));
  };

  const addAchievement = (eduIndex: number) => {
    handleFieldChange((prev) => ({
      ...prev,
      education:
        prev.education?.map((edu, i) =>
          i === eduIndex
            ? { ...edu, achievements: [...(edu.achievements || []), ""] }
            : edu
        ) || [],
    }));
  };

  const removeAchievement = (eduIndex: number, achIndex: number) => {
    handleFieldChange((prev) => ({
      ...prev,
      education:
        prev.education?.map((edu, i) =>
          i === eduIndex
            ? {
                ...edu,
                achievements: (edu.achievements || []).filter(
                  (_, j) => j !== achIndex
                ),
              }
            : edu
        ) || [],
    }));
  };

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="sticky top-4 z-10 flex justify-between items-center bg-white dark:bg-gray-950 p-4 rounded-lg border border-gray-300 dark:border-gray-700 h-16 shadow-md hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-2">
          <Switch
            id="edit-mode"
            checked={isEditing}
            onCheckedChange={handleEditToggle}
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
          <OutlineButton onClick={onDownload} size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </OutlineButton>
          {isEditing && (
            <>
              <PrimaryButton onClick={handleSave} disabled={isSaving} size="sm">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </PrimaryButton>
              <GhostButton onClick={handleCancel} disabled={isSaving} size="sm">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </GhostButton>
            </>
          )}
        </div>
      </div>

      {/* Contact Information Header */}
      <Card
        className={cn(
          "transition-all duration-200",
          mode === "optimized"
            ? "bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20"
            : "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20"
        )}
      >
        <CardContent className="p-6">
          <div className="text-center space-y-3">
            <div
              className={cn(
                "w-20 h-20 mx-auto rounded-full flex items-center justify-center",
                mode === "optimized"
                  ? "bg-orange-100 dark:bg-orange-900/30"
                  : "bg-blue-100 dark:bg-blue-900/30"
              )}
            >
              <User className={cn("w-10 h-10", theme.iconColor)} />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {isEditing ? (
                  <EditableField
                    value={resume.contactInfo?.name || ""}
                    onChange={(value) =>
                      handleFieldChange((prev) => ({
                        ...prev,
                        contactInfo: { ...prev.contactInfo, name: value },
                      }))
                    }
                    isEditing={isEditing}
                    placeholder="Your Name"
                    className="text-center text-2xl font-bold"
                  />
                ) : (
                  resume.contactInfo?.name || "Name not provided"
                )}
              </h1>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <Badge
                  className={cn(
                    "text-xs",
                    mode === "optimized"
                      ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                  )}
                >
                  {mode === "optimized" ? "Optimized Resume" : "Base Resume"}
                </Badge>
                {isEditing ? (
                  <>
                    <Input
                      value={resume.title || ""}
                      onChange={(e) =>
                        handleFieldChange((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="e.g., Software Engineer - Full Stack Developer"
                      className="h-8 px-3 text-sm w-80"
                    />
                    <Popover
                      open={categoryDropdownOpen}
                      onOpenChange={setCategoryDropdownOpen}
                    >
                      <PopoverTrigger asChild>
                        <OutlineButton
                          role="combobox"
                          aria-expanded={categoryDropdownOpen}
                          className="h-8 px-3 text-sm justify-between"
                        >
                          {resume.category || "Select category"}
                        </OutlineButton>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0">
                        <Command>
                          <CommandInput placeholder="Search category..." />
                          <CommandList>
                            <CommandEmpty>No category found.</CommandEmpty>
                            <CommandGroup>
                              {RESUME_CATEGORIES.map((category) => (
                                <CommandItem
                                  key={category}
                                  value={category}
                                  onSelect={() => {
                                    handleFieldChange((prev) => ({
                                      ...prev,
                                      category: category,
                                    }));
                                    setCategoryDropdownOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      resume.category === category
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {category}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </>
                ) : (
                  <Badge variant="outline" className="text-sm">
                    {resume.category}
                  </Badge>
                )}
              </div>
            </div>

            {/* Contact Details Grid */}
            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-w-6xl mx-auto mt-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500 shrink-0" />
                  <EditableField
                    value={resume.contactInfo?.location || ""}
                    onChange={(value) =>
                      handleFieldChange((prev) => ({
                        ...prev,
                        contactInfo: { ...prev.contactInfo, location: value },
                      }))
                    }
                    isEditing={isEditing}
                    placeholder="City, State"
                    className="text-sm flex-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500 shrink-0" />
                  <EditableField
                    value={resume.contactInfo?.email || ""}
                    onChange={(value) =>
                      handleFieldChange((prev) => ({
                        ...prev,
                        contactInfo: { ...prev.contactInfo, email: value },
                      }))
                    }
                    isEditing={isEditing}
                    placeholder="your@email.com"
                    className="text-sm flex-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500 shrink-0" />
                  <EditableField
                    value={resume.contactInfo?.phone || ""}
                    onChange={(value) =>
                      handleFieldChange((prev) => ({
                        ...prev,
                        contactInfo: { ...prev.contactInfo, phone: value },
                      }))
                    }
                    isEditing={isEditing}
                    placeholder="(555) 123-4567"
                    className="text-sm flex-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Linkedin className="w-4 h-4 text-gray-500 shrink-0" />
                  <EditableField
                    value={resume.contactInfo?.linkedin || ""}
                    onChange={(value) =>
                      handleFieldChange((prev) => ({
                        ...prev,
                        contactInfo: { ...prev.contactInfo, linkedin: value },
                      }))
                    }
                    isEditing={isEditing}
                    placeholder="linkedin.com/in/yourprofile"
                    className="text-sm flex-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Github className="w-4 h-4 text-gray-500 shrink-0" />
                  <EditableField
                    value={resume.contactInfo?.github || ""}
                    onChange={(value) =>
                      handleFieldChange((prev) => ({
                        ...prev,
                        contactInfo: { ...prev.contactInfo, github: value },
                      }))
                    }
                    isEditing={isEditing}
                    placeholder="github.com/yourusername"
                    className="text-sm flex-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-500 shrink-0" />
                  <EditableField
                    value={resume.contactInfo?.personalWebsite || ""}
                    onChange={(value) =>
                      handleFieldChange((prev) => ({
                        ...prev,
                        contactInfo: {
                          ...prev.contactInfo,
                          personalWebsite: value,
                        },
                      }))
                    }
                    isEditing={isEditing}
                    placeholder="yourwebsite.com"
                    className="text-sm flex-1"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-3 text-sm">
                {resume.contactInfo?.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-600" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {resume.contactInfo.location}
                    </span>
                  </div>
                )}
                {resume.contactInfo?.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-gray-600" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {resume.contactInfo.email}
                    </span>
                  </div>
                )}
                {resume.contactInfo?.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-gray-600" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {resume.contactInfo.phone}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Social Links */}
            {!isEditing &&
              (resume.contactInfo?.linkedin ||
                resume.contactInfo?.github ||
                resume.contactInfo?.personalWebsite) && (
                <div className="flex justify-center gap-2 mt-3">
                  {resume.contactInfo.linkedin && (
                    <OutlineButton size="sm" asChild>
                      <a
                        href={resume.contactInfo.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Linkedin className="w-3 h-3 mr-1" />
                        LinkedIn
                      </a>
                    </OutlineButton>
                  )}
                  {resume.contactInfo.github && (
                    <OutlineButton size="sm" asChild>
                      <a
                        href={resume.contactInfo.github}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Github className="w-3 h-3 mr-1" />
                        GitHub
                      </a>
                    </OutlineButton>
                  )}
                  {resume.contactInfo.personalWebsite && (
                    <OutlineButton size="sm" asChild>
                      <a
                        href={resume.contactInfo.personalWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Globe className="w-3 h-3 mr-1" />
                        Website
                      </a>
                    </OutlineButton>
                  )}
                </div>
              )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {/* Experience */}
        {(resume.experience && resume.experience.length > 0) || isEditing ? (
          <Card>
            <CardHeader className="pb-1 pt-2">
              <CardTitle className="text-base">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className={cn("w-4 h-4", theme.iconColor)} />
                    <span className="text-gray-900 dark:text-gray-100">
                      Work Experience
                    </span>
                  </div>
                  {isEditing && (
                    <OutlineButton
                      onClick={addExperience}
                      size="sm"
                      className="h-7 px-3 text-sm"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Experience
                    </OutlineButton>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleExperienceDragEnd}
              >
                <SortableContext
                  items={
                    resume.experience?.map(
                      (exp) => `exp-${exp.title}-${exp.company}`
                    ) || []
                  }
                  strategy={verticalListSortingStrategy}
                >
                  {resume.experience?.map((exp, expIndex) => (
                    <SortableItem
                      key={`exp-${exp.title}-${exp.company}`}
                      id={`exp-${exp.title}-${exp.company}`}
                      handle={true}
                      isEditing={isEditing}
                    >
                      <div
                        className={cn(
                          "relative",
                          isEditing &&
                            "border border-gray-300/50 dark:border-gray-700/50 rounded-lg p-4"
                        )}
                      >
                        {!isEditing && expIndex > 0 && (
                          <Separator className="mb-3" />
                        )}

                        {/* Experience Header */}
                        <div className="space-y-2">
                          {isEditing ? (
                            <div className="space-y-2">
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label>Job Title</Label>
                                    <EditableField
                                      value={exp.title}
                                      onChange={(value) =>
                                        handleFieldChange((prev) => ({
                                          ...prev,
                                          experience: prev.experience?.map(
                                            (e, i) =>
                                              i === expIndex
                                                ? { ...e, title: value }
                                                : e
                                          ),
                                        }))
                                      }
                                      isEditing={isEditing}
                                      placeholder={
                                        theme.showATSFeatures
                                          ? "Include keywords from job description"
                                          : "Software Engineer"
                                      }
                                      className="text-sm"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Company</Label>
                                    <EditableField
                                      value={exp.company}
                                      onChange={(value) =>
                                        handleFieldChange((prev) => ({
                                          ...prev,
                                          experience: prev.experience?.map(
                                            (e, i) =>
                                              i === expIndex
                                                ? { ...e, company: value }
                                                : e
                                          ),
                                        }))
                                      }
                                      isEditing={isEditing}
                                      placeholder="Company Name"
                                      className="text-sm"
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label>Location</Label>
                                    <EditableField
                                      value={exp.location}
                                      onChange={(value) =>
                                        handleFieldChange((prev) => ({
                                          ...prev,
                                          experience: prev.experience?.map(
                                            (e, i) =>
                                              i === expIndex
                                                ? { ...e, location: value }
                                                : e
                                          ),
                                        }))
                                      }
                                      isEditing={isEditing}
                                      placeholder="City, State"
                                      className="text-sm"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Duration</Label>
                                    <EditableField
                                      value={exp.dates}
                                      onChange={(value) =>
                                        handleFieldChange((prev) => ({
                                          ...prev,
                                          experience: prev.experience?.map(
                                            (e, i) =>
                                              i === expIndex
                                                ? { ...e, dates: value }
                                                : e
                                          ),
                                        }))
                                      }
                                      isEditing={isEditing}
                                      placeholder="MM/YYYY - MM/YYYY"
                                      className="text-sm"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Responsibilities Section */}
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <Label>Responsibilities</Label>
                                  <GhostButton
                                    onClick={() => addResponsibility(expIndex)}
                                    size="sm"
                                    className="h-6 px-2"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </GhostButton>
                                </div>

                                <DndContext
                                  sensors={sensors}
                                  collisionDetection={closestCenter}
                                  onDragEnd={(event) =>
                                    handleResponsibilityDragEnd(expIndex, event)
                                  }
                                >
                                  <SortableContext
                                    items={exp.responsibilities.map(
                                      (_, i) => `resp-${expIndex}-${i}`
                                    )}
                                    strategy={verticalListSortingStrategy}
                                  >
                                    <div className="space-y-2">
                                      {exp.responsibilities.map(
                                        (resp, respIndex) => (
                                          <SortableItem
                                            key={`resp-${expIndex}-${respIndex}`}
                                            id={`resp-${expIndex}-${respIndex}`}
                                            handle={true}
                                            isEditing={isEditing}
                                          >
                                            <div className="flex gap-2 items-start">
                                              <EditableField
                                                value={resp}
                                                onChange={(value) =>
                                                  handleFieldChange((prev) => ({
                                                    ...prev,
                                                    experience:
                                                      prev.experience?.map(
                                                        (e, i) =>
                                                          i === expIndex
                                                            ? {
                                                                ...e,
                                                                responsibilities:
                                                                  e.responsibilities.map(
                                                                    (r, j) =>
                                                                      j ===
                                                                      respIndex
                                                                        ? value
                                                                        : r
                                                                  ),
                                                              }
                                                            : e
                                                      ),
                                                  }))
                                                }
                                                isEditing={isEditing}
                                                placeholder={
                                                  theme.showATSFeatures
                                                    ? "Describe your responsibility with ATS keywords..."
                                                    : "Describe your responsibility..."
                                                }
                                                multiline={true}
                                                className="flex-1 text-sm"
                                              />
                                              <div className="flex items-start gap-1 shrink-0">
                                                {(mode === "optimized"
                                                  ? theme.showATSFeatures
                                                  : isEditing) && (
                                                  <SparkIconButton
                                                    onClick={() => {
                                                      if (
                                                        mode === "optimized"
                                                      ) {
                                                        openOptimizationDrawer(
                                                          resp,
                                                          "responsibility",
                                                          (value) =>
                                                            handleFieldChange(
                                                              (prev) => ({
                                                                ...prev,
                                                                experience:
                                                                  prev.experience?.map(
                                                                    (e, i) =>
                                                                      i ===
                                                                      expIndex
                                                                        ? {
                                                                            ...e,
                                                                            responsibilities:
                                                                              e.responsibilities.map(
                                                                                (
                                                                                  r,
                                                                                  j
                                                                                ) =>
                                                                                  j ===
                                                                                  respIndex
                                                                                    ? value
                                                                                    : r
                                                                              ),
                                                                          }
                                                                        : e
                                                                  ),
                                                              })
                                                            )
                                                        );
                                                      } else {
                                                        openContentImprovementDrawer(
                                                          resp,
                                                          "responsibility",
                                                          (value) =>
                                                            handleFieldChange(
                                                              (prev) => ({
                                                                ...prev,
                                                                experience:
                                                                  prev.experience?.map(
                                                                    (e, i) =>
                                                                      i ===
                                                                      expIndex
                                                                        ? {
                                                                            ...e,
                                                                            responsibilities:
                                                                              e.responsibilities.map(
                                                                                (
                                                                                  r,
                                                                                  j
                                                                                ) =>
                                                                                  j ===
                                                                                  respIndex
                                                                                    ? value
                                                                                    : r
                                                                              ),
                                                                          }
                                                                        : e
                                                                  ),
                                                              })
                                                            )
                                                        );
                                                      }
                                                    }}
                                                    size="sm"
                                                  />
                                                )}
                                                <DestructiveIconButton
                                                  onClick={() =>
                                                    removeResponsibility(
                                                      expIndex,
                                                      respIndex
                                                    )
                                                  }
                                                  size="sm"
                                                >
                                                  <Trash2 className="w-3.5 h-3.5" />
                                                </DestructiveIconButton>
                                              </div>
                                            </div>
                                            {theme.showATSFeatures &&
                                              getKeywordsFromText(resp).filter(
                                                shouldShowKeywordWrapped
                                              ).length > 0 && (
                                                <div className="mt-1 flex flex-wrap gap-1">
                                                  {getKeywordsFromText(resp)
                                                    .filter(
                                                      shouldShowKeywordWrapped
                                                    )
                                                    .map((keyword, idx) => (
                                                      <Badge
                                                        key={idx}
                                                        className={cn(
                                                          "text-xs px-1.5 py-0",
                                                          getKeywordBadgeClassNameWrapped(
                                                            keyword
                                                          )
                                                        )}
                                                      >
                                                        {keyword}
                                                      </Badge>
                                                    ))}
                                                </div>
                                              )}
                                          </SortableItem>
                                        )
                                      )}
                                    </div>
                                  </SortableContext>
                                </DndContext>
                              </div>

                              {/* Remove Experience Button at bottom right */}
                              <div className="flex justify-end mt-2">
                                <DestructiveButton
                                  onClick={() => removeExperience(expIndex)}
                                  size="sm"
                                >
                                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                                  Remove Experience
                                </DestructiveButton>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                  <HighlightedText
                                    text={exp.title}
                                    keywords={highlightedKeywords}
                                    mode="text"
                                    alwaysHighlight={allKeywordsForHighlight}
                                  />
                                </h3>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Calendar className="w-3 h-3" />
                                  {exp.dates}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Building className="w-3 h-3" />
                                <span className="font-medium">
                                  <HighlightedText
                                    text={exp.company}
                                    keywords={highlightedKeywords}
                                    mode="text"
                                    alwaysHighlight={allKeywordsForHighlight}
                                  />
                                </span>
                                {exp.location && (
                                  <>
                                    <span>•</span>
                                    <span>{exp.location}</span>
                                  </>
                                )}
                              </div>
                              <ul className="mt-2 space-y-1">
                                {exp.responsibilities.map((resp, respIndex) => (
                                  <li
                                    key={respIndex}
                                    className="text-sm text-gray-700 dark:text-gray-300 pl-4 relative"
                                  >
                                    <span className="absolute left-0 top-1 text-gray-400">
                                      •
                                    </span>
                                    <HighlightedText
                                      text={resp}
                                      keywords={highlightedKeywords}
                                      mode="text"
                                      alwaysHighlight={allKeywordsForHighlight}
                                    />
                                  </li>
                                ))}
                              </ul>
                            </>
                          )}
                        </div>
                      </div>
                    </SortableItem>
                  ))}
                </SortableContext>
              </DndContext>
            </CardContent>
          </Card>
        ) : null}

        {/* Projects */}
        {(resume.projects && resume.projects.length > 0) || isEditing ? (
          <Card>
            <CardHeader className="pb-1 pt-2">
              <CardTitle className="text-base">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code className={cn("w-4 h-4", theme.iconColor)} />
                    <span className="text-gray-900 dark:text-gray-100">
                      Projects
                    </span>
                  </div>
                  {isEditing && (
                    <OutlineButton
                      onClick={addProject}
                      size="sm"
                      className="h-7 px-3 text-sm"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Project
                    </OutlineButton>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleProjectsDragEnd}
              >
                <SortableContext
                  items={
                    resume.projects?.map((proj) => `proj-${proj.name}`) || []
                  }
                  strategy={verticalListSortingStrategy}
                >
                  {resume.projects?.map((project, index) => (
                    <SortableItem
                      key={`proj-${project.name}`}
                      id={`proj-${project.name}`}
                      handle={true}
                      isEditing={isEditing}
                    >
                      <div
                        className={cn(
                          "space-y-2",
                          isEditing &&
                            "border border-gray-300/50 dark:border-gray-700/50 rounded-lg p-4"
                        )}
                      >
                        {!isEditing && index > 0 && (
                          <Separator className="mb-3" />
                        )}

                        {isEditing ? (
                          <div className="space-y-4">
                            <div className="space-y-3">
                              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Project Name
                              </Label>
                              <EditableField
                                value={project.name}
                                onChange={(value) =>
                                  handleFieldChange((prev) => ({
                                    ...prev,
                                    projects: prev.projects?.map((p, i) =>
                                      i === index ? { ...p, name: value } : p
                                    ),
                                  }))
                                }
                                isEditing={isEditing}
                                placeholder="Project Name"
                                className="text-sm"
                              />
                            </div>

                            <div className="space-y-3">
                              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Technologies
                              </Label>
                              <EditableField
                                value={project.technologies}
                                onChange={(value) =>
                                  handleFieldChange((prev) => ({
                                    ...prev,
                                    projects: prev.projects?.map((p, i) =>
                                      i === index
                                        ? { ...p, technologies: value }
                                        : p
                                    ),
                                  }))
                                }
                                isEditing={isEditing}
                                placeholder={
                                  theme.showATSFeatures
                                    ? "Technologies (include relevant keywords)"
                                    : "Technologies Used"
                                }
                                className="text-sm"
                              />
                              {theme.showATSFeatures &&
                                getKeywordsFromText(
                                  project.technologies
                                ).filter(shouldShowKeywordWrapped).length >
                                  0 && (
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {getKeywordsFromText(project.technologies)
                                      .filter(shouldShowKeywordWrapped)
                                      .map((keyword, idx) => (
                                        <Badge
                                          key={idx}
                                          className={cn(
                                            "text-xs px-1.5 py-0",
                                            getKeywordBadgeClassNameWrapped(
                                              keyword
                                            )
                                          )}
                                        >
                                          {keyword}
                                        </Badge>
                                      ))}
                                  </div>
                                )}
                            </div>

                            <div className="space-y-3">
                              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Description
                              </Label>
                              <div className="flex gap-2">
                                <EditableField
                                  value={project.description}
                                  onChange={(value) =>
                                    handleFieldChange((prev) => ({
                                      ...prev,
                                      projects: prev.projects?.map((p, i) =>
                                        i === index
                                          ? { ...p, description: value }
                                          : p
                                      ),
                                    }))
                                  }
                                  isEditing={isEditing}
                                  placeholder="Project Description"
                                  multiline={true}
                                  className="flex-1 text-sm"
                                />
                                {(mode === "optimized"
                                  ? theme.showATSFeatures
                                  : isEditing) && (
                                  <SparkIconButton
                                    onClick={() => {
                                      if (mode === "optimized") {
                                        openOptimizationDrawer(
                                          project.description,
                                          "project_description",
                                          (value) =>
                                            handleFieldChange((prev) => ({
                                              ...prev,
                                              projects: prev.projects?.map(
                                                (p, i) =>
                                                  i === index
                                                    ? {
                                                        ...p,
                                                        description: value,
                                                      }
                                                    : p
                                              ),
                                            }))
                                        );
                                      } else {
                                        openContentImprovementDrawer(
                                          project.description,
                                          "project_description",
                                          (value) =>
                                            handleFieldChange((prev) => ({
                                              ...prev,
                                              projects: prev.projects?.map(
                                                (p, i) =>
                                                  i === index
                                                    ? {
                                                        ...p,
                                                        description: value,
                                                      }
                                                    : p
                                              ),
                                            }))
                                        );
                                      }
                                    }}
                                    size="sm"
                                  />
                                )}
                              </div>
                              {theme.showATSFeatures &&
                                getKeywordsFromText(project.description).filter(
                                  shouldShowKeywordWrapped
                                ).length > 0 && (
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {getKeywordsFromText(project.description)
                                      .filter(shouldShowKeywordWrapped)
                                      .map((keyword, idx) => (
                                        <Badge
                                          key={idx}
                                          className={cn(
                                            "text-xs px-1.5 py-0",
                                            getKeywordBadgeClassNameWrapped(
                                              keyword
                                            )
                                          )}
                                        >
                                          {keyword}
                                        </Badge>
                                      ))}
                                  </div>
                                )}
                            </div>

                            {/* Remove Project Button at bottom right */}
                            <div className="flex justify-end mt-2">
                              <DestructiveButton
                                onClick={() => removeProject(index)}
                                size="sm"
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-1" />
                                Remove Project
                              </DestructiveButton>
                            </div>
                          </div>
                        ) : (
                          <>
                            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                              <HighlightedText
                                text={project.name}
                                keywords={highlightedKeywords}
                                mode="text"
                                alwaysHighlight={allKeywordsForHighlight}
                              />
                            </h3>
                            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                              <HighlightedText
                                text={project.technologies}
                                keywords={highlightedKeywords}
                                mode="text"
                                alwaysHighlight={allKeywordsForHighlight}
                              />
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              <HighlightedText
                                text={project.description}
                                keywords={highlightedKeywords}
                                mode="text"
                                alwaysHighlight={allKeywordsForHighlight}
                              />
                            </p>
                          </>
                        )}
                      </div>
                    </SortableItem>
                  ))}
                </SortableContext>
              </DndContext>
            </CardContent>
          </Card>
        ) : null}

        {/* Education */}
        {(resume.education && resume.education.length > 0) || isEditing ? (
          <Card>
            <CardHeader className="pb-1 pt-2">
              <CardTitle className="text-base">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className={cn("w-4 h-4", theme.iconColor)} />
                    <span className="text-gray-900 dark:text-gray-100">
                      Education
                    </span>
                  </div>
                  {isEditing && (
                    <OutlineButton
                      onClick={addEducation}
                      size="sm"
                      className="h-7 px-3 text-sm"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Education
                    </OutlineButton>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleEducationDragEnd}
              >
                <SortableContext
                  items={
                    resume.education?.map(
                      (edu) => `edu-${edu.institution}-${edu.degree}`
                    ) || []
                  }
                  strategy={verticalListSortingStrategy}
                >
                  {resume.education?.map((edu, index) => (
                    <SortableItem
                      key={`edu-${edu.institution}-${edu.degree}`}
                      id={`edu-${edu.institution}-${edu.degree}`}
                      handle={true}
                      isEditing={isEditing}
                    >
                      <div
                        className={cn(
                          "relative",
                          isEditing &&
                            "border border-gray-300/50 dark:border-gray-700/50 rounded-lg p-4"
                        )}
                      >
                        {!isEditing && index > 0 && (
                          <Separator className="mb-3" />
                        )}

                        <div className="space-y-2">
                          {isEditing ? (
                            <div className="space-y-2">
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label>Degree / Certificate</Label>
                                    <EditableField
                                      value={edu.degree}
                                      onChange={(value) =>
                                        handleFieldChange((prev) => ({
                                          ...prev,
                                          education: prev.education?.map(
                                            (e, i) =>
                                              i === index
                                                ? { ...e, degree: value }
                                                : e
                                          ),
                                        }))
                                      }
                                      isEditing={isEditing}
                                      placeholder="Degree / Certificate"
                                      className="text-sm"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Institution Name</Label>
                                    <EditableField
                                      value={edu.institution}
                                      onChange={(value) =>
                                        handleFieldChange((prev) => ({
                                          ...prev,
                                          education: prev.education?.map(
                                            (e, i) =>
                                              i === index
                                                ? { ...e, institution: value }
                                                : e
                                          ),
                                        }))
                                      }
                                      isEditing={isEditing}
                                      placeholder="Institution Name"
                                      className="text-sm"
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label>Location</Label>
                                    <EditableField
                                      value={edu.location}
                                      onChange={(value) =>
                                        handleFieldChange((prev) => ({
                                          ...prev,
                                          education: prev.education?.map(
                                            (e, i) =>
                                              i === index
                                                ? { ...e, location: value }
                                                : e
                                          ),
                                        }))
                                      }
                                      isEditing={isEditing}
                                      placeholder="Location"
                                      className="text-sm"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Duration</Label>
                                    <EditableField
                                      value={edu.dates}
                                      onChange={(value) =>
                                        handleFieldChange((prev) => ({
                                          ...prev,
                                          education: prev.education?.map(
                                            (e, i) =>
                                              i === index
                                                ? { ...e, dates: value }
                                                : e
                                          ),
                                        }))
                                      }
                                      isEditing={isEditing}
                                      placeholder="MM/YYYY - MM/YYYY"
                                      className="text-sm"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Achievements */}
                              {edu.achievements &&
                                edu.achievements.length > 0 && (
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <Label>Achievements</Label>
                                      <IconButton
                                        onClick={() => addAchievement(index)}
                                        size="sm"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                      </IconButton>
                                    </div>

                                    <div className="space-y-2">
                                      {edu.achievements?.map(
                                        (achievement, achIndex) => (
                                          <div key={achIndex} className="space-y-1">
                                            <div className="flex gap-2 items-start">
                                              <EditableField
                                              value={achievement}
                                              onChange={(value) =>
                                                handleFieldChange((prev) => ({
                                                  ...prev,
                                                  education:
                                                    prev.education?.map(
                                                      (e, i) =>
                                                        i === index
                                                          ? {
                                                              ...e,
                                                              achievements: (
                                                                e.achievements ||
                                                                []
                                                              ).map((a, j) =>
                                                                j === achIndex
                                                                  ? value
                                                                  : a
                                                              ),
                                                            }
                                                          : e
                                                    ),
                                                }))
                                              }
                                              isEditing={isEditing}
                                              placeholder={
                                                theme.showATSFeatures
                                                  ? "Describe your achievement with ATS keywords..."
                                                  : "Describe your achievement..."
                                              }
                                              multiline={true}
                                              rows={2}
                                              className="flex-1 text-sm"
                                            />
                                            <div className="flex items-start gap-1 shrink-0">
                                              {(mode === "optimized"
                                                ? theme.showATSFeatures
                                                : isEditing) && (
                                                <SparkIconButton
                                                  onClick={() => {
                                                    if (mode === "optimized") {
                                                      openOptimizationDrawer(
                                                        achievement,
                                                        "achievement",
                                                        (value) =>
                                                          handleFieldChange(
                                                            (prev) => ({
                                                              ...prev,
                                                              education:
                                                                prev.education?.map(
                                                                  (e, i) =>
                                                                    i === index
                                                                      ? {
                                                                          ...e,
                                                                          achievements:
                                                                            (
                                                                              e.achievements ||
                                                                              []
                                                                            ).map(
                                                                              (
                                                                                a,
                                                                                j
                                                                              ) =>
                                                                                j ===
                                                                                achIndex
                                                                                  ? value
                                                                                  : a
                                                                            ),
                                                                        }
                                                                      : e
                                                                ),
                                                            })
                                                          )
                                                      );
                                                    } else {
                                                      openContentImprovementDrawer(
                                                        achievement,
                                                        "achievement",
                                                        (value) =>
                                                          handleFieldChange(
                                                            (prev) => ({
                                                              ...prev,
                                                              education:
                                                                prev.education?.map(
                                                                  (e, i) =>
                                                                    i === index
                                                                      ? {
                                                                          ...e,
                                                                          achievements:
                                                                            (
                                                                              e.achievements ||
                                                                              []
                                                                            ).map(
                                                                              (
                                                                                a,
                                                                                j
                                                                              ) =>
                                                                                j ===
                                                                                achIndex
                                                                                  ? value
                                                                                  : a
                                                                            ),
                                                                        }
                                                                      : e
                                                                ),
                                                            })
                                                          )
                                                      );
                                                    }
                                                  }}
                                                  size="sm"
                                                />
                                              )}
                                              <DestructiveIconButton
                                                onClick={() =>
                                                  removeAchievement(
                                                    index,
                                                    achIndex
                                                  )
                                                }
                                                size="sm"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </DestructiveIconButton>
                                            </div>
                                          </div>
                                          {theme.showATSFeatures &&
                                            getKeywordsFromText(achievement).filter(
                                              shouldShowKeywordWrapped
                                            ).length > 0 && (
                                              <div className="flex flex-wrap gap-1 ml-0">
                                                {getKeywordsFromText(achievement)
                                                  .filter(shouldShowKeywordWrapped)
                                                  .map((keyword, idx) => (
                                                    <Badge
                                                      key={idx}
                                                      className={cn(
                                                        "text-xs px-1.5 py-0",
                                                        getKeywordBadgeClassNameWrapped(
                                                          keyword
                                                        )
                                                      )}
                                                    >
                                                      {keyword}
                                                    </Badge>
                                                  ))}
                                              </div>
                                            )}
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}

                              {!edu.achievements?.length && (
                                <IconButton
                                  onClick={() => addAchievement(index)}
                                  size="sm"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </IconButton>
                              )}

                              {/* Remove Education Button at bottom right */}
                              <div className="flex justify-end mt-2">
                                <DestructiveButton
                                  onClick={() => removeEducation(index)}
                                  size="sm"
                                >
                                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                                  Remove Education
                                </DestructiveButton>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                  <HighlightedText
                                    text={edu.degree}
                                    keywords={highlightedKeywords}
                                    mode="text"
                                    alwaysHighlight={allKeywordsForHighlight}
                                  />
                                </h3>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Calendar className="w-3 h-3" />
                                  {edu.dates}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <GraduationCap className="w-3 h-3" />
                                <span className="font-medium">
                                  <HighlightedText
                                    text={edu.institution}
                                    keywords={highlightedKeywords}
                                    mode="text"
                                    alwaysHighlight={allKeywordsForHighlight}
                                  />
                                </span>
                                {edu.location && (
                                  <>
                                    <span>•</span>
                                    <span>{edu.location}</span>
                                  </>
                                )}
                              </div>
                              {edu.achievements &&
                                edu.achievements.length > 0 && (
                                  <ul className="mt-2 space-y-1">
                                    {edu.achievements.map(
                                      (achievement, achIndex) => (
                                        <li
                                          key={achIndex}
                                          className="text-sm text-gray-700 dark:text-gray-300 pl-4 relative"
                                        >
                                          <span className="absolute left-0 top-1 text-gray-400">
                                            •
                                          </span>
                                          <HighlightedText
                                            text={achievement}
                                            keywords={highlightedKeywords}
                                            mode="text"
                                            alwaysHighlight={
                                              allKeywordsForHighlight
                                            }
                                          />
                                        </li>
                                      )
                                    )}
                                  </ul>
                                )}
                            </>
                          )}
                        </div>
                      </div>
                    </SortableItem>
                  ))}
                </SortableContext>
              </DndContext>
            </CardContent>
          </Card>
        ) : null}

        {/* Skills */}
        {resume.skills && (
          <Card>
            <CardHeader className="pb-1 pt-2">
              <CardTitle className="text-base">
                <div className="flex items-center gap-2">
                  <Award className={cn("w-4 h-4", theme.iconColor)} />
                  <span className="text-gray-900 dark:text-gray-100">
                    Skills
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0 pb-3">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleSkillsDragEnd}
              >
                {/* Technical Skills */}
                {(resume.skills.technicalSkills &&
                  resume.skills.technicalSkills.length > 0) ||
                isEditing ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Technical Skills
                      </h4>
                      {isEditing && (
                        <div className="flex items-center gap-1">
                          <OutlineButton
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => setAddTechnicalSkillOpen(true)}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add Skills
                          </OutlineButton>

                          {theme.showATSFeatures && (
                            <SparkIconButton
                              onClick={() =>
                                openSkillsOptimizationDrawer(
                                  resume.skills.technicalSkills || [],
                                  "technical",
                                  (skills) =>
                                    handleFieldChange((prev) => ({
                                      ...prev,
                                      skills: {
                                        ...prev.skills,
                                        technicalSkills: skills,
                                      },
                                    }))
                                )
                              }
                              size="sm"
                              title="AI Optimize"
                            />
                          )}
                        </div>
                      )}
                    </div>
                    {isEditing ? (
                      <SortableContext
                        items={(resume.skills.technicalSkills || []).map(
                          (s) => `technicalSkills:${s}`
                        )}
                        strategy={rectSortingStrategy}
                      >
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {resume.skills.technicalSkills?.map(
                            (skill, index) => {
                              const hasToggledKeyword = Array.from(
                                highlightedKeywords
                              ).some((k) =>
                                skill.toLowerCase() === k.toLowerCase()
                              );
                              const hasJobKeyword = Array.from(
                                allKeywordsForHighlight
                              ).some((k) =>
                                skill.toLowerCase() === k.toLowerCase()
                              );
                              return (
                                <SortableSkillBadge
                                  key={`technicalSkills:${skill}`}
                                  id={`technicalSkills:${skill}`}
                                  skill={skill}
                                  isEditing={true}
                                  variant="secondary"
                                  className={`${
                                    hasToggledKeyword
                                      ? "bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:text-white"
                                      : hasJobKeyword
                                        ? "bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300"
                                        : ""
                                  }`}
                                  onRemove={() =>
                                    handleFieldChange((prev) => ({
                                      ...prev,
                                      skills: {
                                        ...prev.skills,
                                        technicalSkills:
                                          prev.skills.technicalSkills?.filter(
                                            (_, i) => i !== index
                                          ) || [],
                                      },
                                    }))
                                  }
                                  onUpdate={(newSkill) =>
                                    handleFieldChange((prev) => ({
                                      ...prev,
                                      skills: {
                                        ...prev.skills,
                                        technicalSkills: prev.skills.technicalSkills?.map(
                                          (s, i) => (i === index ? newSkill : s)
                                        ) || [],
                                      },
                                    }))
                                  }
                                />
                              );
                            }
                          )}
                        </div>
                      </SortableContext>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {resume.skills.technicalSkills?.map((skill) => {
                          const hasToggledKeyword = Array.from(
                            highlightedKeywords
                          ).some((k) =>
                            skill.toLowerCase() === k.toLowerCase()
                          );
                          const hasJobKeyword = Array.from(
                            allKeywordsForHighlight
                          ).some((k) =>
                            skill.toLowerCase() === k.toLowerCase()
                          );
                          return (
                            <SortableSkillBadge
                              key={skill}
                              id={skill}
                              skill={skill}
                              isEditing={false}
                              variant="secondary"
                              className={`${
                                hasToggledKeyword
                                  ? "bg-blue-500 text-white dark:bg-blue-600 dark:text-white"
                                  : hasJobKeyword
                                    ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                                    : ""
                              }`}
                              onRemove={() => {}}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Development Practices & Methodologies */}
                {(resume.skills.developmentPracticesMethodologies &&
                  resume.skills.developmentPracticesMethodologies.length > 0) ||
                isEditing ? (
                  <div className={cn("space-y-3", isEditing && "mt-6")}>
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Development Practices & Methodologies
                      </h4>
                      {isEditing && (
                        <div className="flex items-center gap-1">
                          <OutlineButton
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => setAddDevelopmentSkillOpen(true)}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add Practices
                          </OutlineButton>

                          {theme.showATSFeatures && (
                            <SparkIconButton
                              onClick={() =>
                                openSkillsOptimizationDrawer(
                                  resume.skills.developmentPracticesMethodologies || [],
                                  "development",
                                  (skills) =>
                                    handleFieldChange((prev) => ({
                                      ...prev,
                                      skills: {
                                        ...prev.skills,
                                        developmentPracticesMethodologies: skills,
                                      },
                                    }))
                                )
                              }
                              size="sm"
                              title="AI Optimize"
                            />
                          )}
                        </div>
                      )}
                    </div>
                    {isEditing ? (
                      <SortableContext
                        items={(resume.skills.developmentPracticesMethodologies || []).map(
                          (s) => `developmentPracticesMethodologies:${s}`
                        )}
                        strategy={rectSortingStrategy}
                      >
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {resume.skills.developmentPracticesMethodologies?.map(
                            (skill, index) => {
                              const hasToggledKeyword = Array.from(
                                highlightedKeywords
                              ).some((k) =>
                                skill.toLowerCase() === k.toLowerCase()
                              );
                              const hasJobKeyword = Array.from(
                                allKeywordsForHighlight
                              ).some((k) =>
                                skill.toLowerCase() === k.toLowerCase()
                              );
                              return (
                                <SortableSkillBadge
                                  key={`developmentPracticesMethodologies:${skill}`}
                                  id={`developmentPracticesMethodologies:${skill}`}
                                  skill={skill}
                                  isEditing={true}
                                  variant="secondary"
                                  className={`${
                                    hasToggledKeyword
                                      ? "bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:text-white"
                                      : hasJobKeyword
                                        ? "bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300"
                                        : ""
                                  }`}
                                  onRemove={() =>
                                    handleFieldChange((prev) => ({
                                      ...prev,
                                      skills: {
                                        ...prev.skills,
                                        developmentPracticesMethodologies:
                                          prev.skills.developmentPracticesMethodologies?.filter(
                                            (_, i) => i !== index
                                          ) || [],
                                      },
                                    }))
                                  }
                                  onUpdate={(newSkill) =>
                                    handleFieldChange((prev) => ({
                                      ...prev,
                                      skills: {
                                        ...prev.skills,
                                        developmentPracticesMethodologies: prev.skills.developmentPracticesMethodologies?.map(
                                          (s, i) => (i === index ? newSkill : s)
                                        ) || [],
                                      },
                                    }))
                                  }
                                />
                              );
                            }
                          )}
                        </div>
                      </SortableContext>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {resume.skills.developmentPracticesMethodologies?.map((skill) => {
                          const hasToggledKeyword = Array.from(
                            highlightedKeywords
                          ).some((k) =>
                            skill.toLowerCase() === k.toLowerCase()
                          );
                          const hasJobKeyword = Array.from(
                            allKeywordsForHighlight
                          ).some((k) =>
                            skill.toLowerCase() === k.toLowerCase()
                          );
                          return (
                            <SortableSkillBadge
                              key={skill}
                              id={skill}
                              skill={skill}
                              isEditing={false}
                              variant="secondary"
                              className={`${
                                hasToggledKeyword
                                  ? "bg-blue-500 text-white dark:bg-blue-600 dark:text-white"
                                  : hasJobKeyword
                                    ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                                    : ""
                              }`}
                              onRemove={() => {}}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Personal Skills */}
                {(resume.skills.personalSkills &&
                  resume.skills.personalSkills.length > 0) ||
                isEditing ? (
                  <div className={cn("space-y-3", isEditing && "mt-6")}>
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Personal Skills
                      </h4>
                      {isEditing && (
                        <div className="flex items-center gap-1">
                          <OutlineButton
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => setAddPersonalSkillOpen(true)}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add Skills
                          </OutlineButton>

                          {theme.showATSFeatures && (
                            <SparkIconButton
                              onClick={() =>
                                openSkillsOptimizationDrawer(
                                  resume.skills.personalSkills || [],
                                  "soft",
                                  (skills) =>
                                    handleFieldChange((prev) => ({
                                      ...prev,
                                      skills: {
                                        ...prev.skills,
                                        personalSkills: skills,
                                      },
                                    }))
                                )
                              }
                              size="sm"
                              title="AI Optimize"
                            />
                          )}
                        </div>
                      )}
                    </div>
                    {isEditing ? (
                      <SortableContext
                        items={(resume.skills.personalSkills || []).map(
                          (s) => `personalSkills:${s}`
                        )}
                        strategy={rectSortingStrategy}
                      >
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {resume.skills.personalSkills?.map((skill, index) => {
                            const hasToggledKeyword = Array.from(
                              highlightedKeywords
                            ).some((k) =>
                              skill.toLowerCase() === k.toLowerCase()
                            );
                            const hasJobKeyword = Array.from(
                              allKeywordsForHighlight
                            ).some((k) =>
                              skill.toLowerCase() === k.toLowerCase()
                            );
                            return (
                              <SortableSkillBadge
                                key={`personalSkills:${skill}`}
                                id={`personalSkills:${skill}`}
                                skill={skill}
                                isEditing={true}
                                variant="secondary"
                                className={`${
                                  hasToggledKeyword
                                    ? "bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:text-white"
                                    : hasJobKeyword
                                      ? "bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300"
                                      : ""
                                }`}
                                onRemove={() =>
                                  handleFieldChange((prev) => ({
                                    ...prev,
                                    skills: {
                                      ...prev.skills,
                                      personalSkills:
                                        prev.skills.personalSkills?.filter(
                                          (_, i) => i !== index
                                        ) || [],
                                    },
                                  }))
                                }
                                onUpdate={(newSkill) =>
                                  handleFieldChange((prev) => ({
                                    ...prev,
                                    skills: {
                                      ...prev.skills,
                                      personalSkills: prev.skills.personalSkills?.map(
                                        (s, i) => (i === index ? newSkill : s)
                                      ) || [],
                                    },
                                  }))
                                }
                              />
                            );
                          })}
                        </div>
                      </SortableContext>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {resume.skills.personalSkills?.map((skill) => {
                          const hasToggledKeyword = Array.from(
                            highlightedKeywords
                          ).some((k) =>
                            skill.toLowerCase() === k.toLowerCase()
                          );
                          const hasJobKeyword = Array.from(
                            allKeywordsForHighlight
                          ).some((k) =>
                            skill.toLowerCase() === k.toLowerCase()
                          );
                          return (
                            <SortableSkillBadge
                              key={skill}
                              id={skill}
                              skill={skill}
                              isEditing={false}
                              variant="secondary"
                              className={`${
                                hasToggledKeyword
                                  ? "bg-blue-500 text-white dark:bg-blue-600 dark:text-white"
                                  : hasJobKeyword
                                    ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                                    : ""
                              }`}
                              onRemove={() => {}}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : null}
              </DndContext>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Content Optimization Drawer */}
      <ContentOptimizationDrawer
        open={optimizationDrawer.open}
        onOpenChange={(open) =>
          setOptimizationDrawer((prev) => ({ ...prev, open }))
        }
        content={optimizationDrawer.content}
        contentType={optimizationDrawer.contentType}
        allKeywords={[
          ...(resume.keywords || []),
          ...(resume.matchedKeywords || []),
          ...(resume.unmatchedKeywords || []),
        ].filter((k, i, arr) => arr.indexOf(k) === i)}
        matchedKeywords={resume.matchedKeywords || []}
        keywordsByCategory={keywordsByCategory}
        onSelect={(optimizedContent) => {
          optimizationDrawer.updateCallback(optimizedContent);
          setOptimizationDrawer((prev) => ({ ...prev, open: false }));
        }}
      />

      {/* Skills Optimization Drawer */}
      <SkillsOptimizationDrawer
        open={skillsOptimizationDrawer.open}
        onOpenChange={(open) =>
          setSkillsOptimizationDrawer((prev) => ({ ...prev, open }))
        }
        currentSkills={skillsOptimizationDrawer.currentSkills}
        skillType={skillsOptimizationDrawer.skillType}
        allKeywords={[
          ...(resume.keywords || []),
          ...(resume.matchedKeywords || []),
          ...(resume.unmatchedKeywords || []),
        ].filter((k, i, arr) => arr.indexOf(k) === i)}
        matchedKeywords={resume.matchedKeywords || []}
        keywordsByCategory={keywordsByCategory}
        onSelect={(optimizedSkills) => {
          skillsOptimizationDrawer.updateCallback(optimizedSkills);
          setSkillsOptimizationDrawer((prev) => ({ ...prev, open: false }));
        }}
      />

      {/* Content Improvement Drawer for Base Resume */}
      <ContentImprovementDrawer
        open={contentImprovementDrawer.open}
        onOpenChange={(open) =>
          setContentImprovementDrawer((prev) => ({ ...prev, open }))
        }
        content={contentImprovementDrawer.content}
        contentType={contentImprovementDrawer.contentType}
        onSelect={(improvedContent) => {
          contentImprovementDrawer.updateCallback(improvedContent);
          setContentImprovementDrawer((prev) => ({ ...prev, open: false }));
        }}
      />

      {/* Add Skills Dialogs */}
      <AddSkillsDialog
        open={addTechnicalSkillOpen}
        onOpenChange={setAddTechnicalSkillOpen}
        skillType="technical"
        currentSkills={resume.skills?.technicalSkills || []}
        allKeywords={[
          ...(resume.keywords || []),
          ...(resume.matchedKeywords || []),
          ...(resume.unmatchedKeywords || []),
        ].filter((k, i, arr) => arr.indexOf(k) === i)}
        keywordsByCategory={keywordsByCategory}
        onAdd={(skills) => {
          handleFieldChange((prev) => ({
            ...prev,
            skills: {
              ...prev.skills,
              technicalSkills: [
                ...(prev.skills?.technicalSkills || []),
                ...skills
              ],
            },
          }));
          setAddTechnicalSkillOpen(false);
        }}
      />

      <AddSkillsDialog
        open={addDevelopmentSkillOpen}
        onOpenChange={setAddDevelopmentSkillOpen}
        skillType="development"
        currentSkills={resume.skills?.developmentPracticesMethodologies || []}
        allKeywords={[
          ...(resume.keywords || []),
          ...(resume.matchedKeywords || []),
          ...(resume.unmatchedKeywords || []),
        ].filter((k, i, arr) => arr.indexOf(k) === i)}
        keywordsByCategory={keywordsByCategory}
        onAdd={(skills) => {
          handleFieldChange((prev) => ({
            ...prev,
            skills: {
              ...prev.skills,
              developmentPracticesMethodologies: [
                ...(prev.skills?.developmentPracticesMethodologies || []),
                ...skills
              ],
            },
          }));
          setAddDevelopmentSkillOpen(false);
        }}
      />

      <AddSkillsDialog
        open={addPersonalSkillOpen}
        onOpenChange={setAddPersonalSkillOpen}
        skillType="personal"
        currentSkills={resume.skills?.personalSkills || []}
        allKeywords={[
          ...(resume.keywords || []),
          ...(resume.matchedKeywords || []),
          ...(resume.unmatchedKeywords || []),
        ].filter((k, i, arr) => arr.indexOf(k) === i)}
        keywordsByCategory={keywordsByCategory}
        onAdd={(skills) => {
          handleFieldChange((prev) => ({
            ...prev,
            skills: {
              ...prev.skills,
              personalSkills: [
                ...(prev.skills?.personalSkills || []),
                ...skills
              ],
            },
          }));
          setAddPersonalSkillOpen(false);
        }}
      />
    </div>
  );
}
