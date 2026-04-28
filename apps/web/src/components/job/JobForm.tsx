"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Briefcase,
  Building,
  MapPin,
  Link,
  Loader2,
  Target,
  DollarSign,
  Tag,
  Globe,
  X,
  Plus,
} from "lucide-react";
import {
  LoadingButton,
  OutlineButton,
  IconButton,
} from "@/components/custom/Button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
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

const jobFormSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  company: z.string().min(2, "Company name must be at least 2 characters"),
  location: z.string().min(2, "Location must be at least 2 characters"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  salaryMin: z.number().positive("Minimum salary must be positive").optional(),
  salaryMax: z.number().positive("Maximum salary must be positive").optional(),
  salaryPeriod: z.enum(["hourly", "yearly", "monthly"]).optional(),
  isRemote: z.boolean().optional(),
  category: z
    .enum([
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
    ])
    .optional(),
  keywords: z
    .object({
      actionVerbs: z.array(z.string()).optional(),
      hardSkills: z.array(z.string()).optional(),
      softSkills: z.array(z.string()).optional(),
    })
    .optional(),
});

type JobFormValues = z.infer<typeof jobFormSchema>;

interface JobFormProps {
  job?: any;
  onSubmit?: (data: any) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  mode?: "create" | "edit";
  submitButtonText?: string;
  showKeywords?: boolean;
}

export default function JobForm({
  job,
  onSubmit: onSubmitProp,
  onCancel,
  isLoading: isLoadingProp = false,
  mode = "create",
  submitButtonText,
  showKeywords = false,
}: JobFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [actionVerbInput, setActionVerbInput] = useState("");
  const [hardSkillInput, setHardSkillInput] = useState("");
  const [softSkillInput, setSoftSkillInput] = useState("");
  const router = useRouter();

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Sortable chip wrapper
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

  function onReorder(
    list: string[] | undefined,
    fromIdx: number,
    toIdx: number
  ) {
    if (!list) return list;
    return arrayMove(list, fromIdx, toIdx);
  }

  const effectiveLoading = isLoadingProp || isLoading;

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: job?.title || "",
      company: job?.company || "",
      location: job?.location || "",
      description: job?.description || "",
      url: job?.url || "",
      salaryMin: job?.salaryMin || undefined,
      salaryMax: job?.salaryMax || undefined,
      salaryPeriod: job?.salaryPeriod || undefined,
      isRemote: job?.isRemote || false,
      category: job?.category || "General",
      keywords: showKeywords
        ? {
            actionVerbs: job?.keywords?.actionVerbs || [],
            hardSkills: job?.keywords?.hardSkills || [],
            softSkills: job?.keywords?.softSkills || [],
          }
        : undefined,
    },
  });

  const onSubmit = async (data: JobFormValues) => {
    // Transform keywords back to the expected format
    const transformedData = {
      ...data,
      url: data.url || undefined,
      keywords: data.keywords || undefined,
    };

    if (onSubmitProp) {
      // Use custom submit handler (for edit mode)
      await onSubmitProp(transformedData);
    } else {
      // Default create mode
      try {
        setIsLoading(true);

        const response = await apiClient.post("/jobs", transformedData);

        toast.success("Job posting created successfully");

        router.push("/jobs");
      } catch (error: any) {
        toast.error(
          error.response?.data?.message || "Failed to create job posting"
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="w-5 h-5" />
          {mode === "edit" ? "Edit Job" : "Create Job Posting"}
        </CardTitle>
        <CardDescription>
          {mode === "edit"
            ? "Update the job details and information"
            : "Add a job description to optimize your resume against"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Job Title - Full Width */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="e.g. Senior Software Engineer"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Company and Location - 2 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="e.g. Google"
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="e.g. San Francisco, CA"
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* URL and Category - 2 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job URL (Optional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Link className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="https://example.com/job"
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Link to the original job posting
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Category
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="General">General</SelectItem>
                        <SelectItem value="Frontend">Frontend</SelectItem>
                        <SelectItem value="Backend">Backend</SelectItem>
                        <SelectItem value="FullStack">Full Stack</SelectItem>
                        <SelectItem value="AI/ML">AI/ML</SelectItem>
                        <SelectItem value="Blockchain">Blockchain</SelectItem>
                        <SelectItem value="DevOps">DevOps</SelectItem>
                        <SelectItem value="Mobile">Mobile</SelectItem>
                        <SelectItem value="DataEngineering">
                          Data Engineering
                        </SelectItem>
                        <SelectItem value="Security">Security</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Remote Work Toggle - Full Width */}
            <FormField
              control={form.control}
              name="isRemote"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Remote Work
                    </FormLabel>
                    <FormDescription>
                      Is this a remote or hybrid position?
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Salary Section */}
            <div className="space-y-4">
              <FormLabel className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Salary Range (Optional)
              </FormLabel>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="salaryMin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Salary</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="50000"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? Number(e.target.value)
                                : undefined
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="salaryMax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Salary</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="80000"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? Number(e.target.value)
                                : undefined
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="salaryPeriod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salary Period</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select period" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Paste the full job description here..."
                      className="min-h-[300px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Include responsibilities, requirements, and qualifications
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showKeywords && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    Keywords
                  </CardTitle>
                  <CardDescription>
                    Manage keywords extracted from the job description
                    (comma-separated)
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Action Verbs */}
                  <FormField
                    control={form.control}
                    name="keywords.actionVerbs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Action Verbs</FormLabel>
                        <div className="space-y-3">
                          {/* Input with Add Button */}
                          <div className="flex gap-2">
                            <Input
                              placeholder="Type an action verb (e.g., develop, implement, design)"
                              value={actionVerbInput}
                              onChange={(e) =>
                                setActionVerbInput(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  const input = actionVerbInput.trim();
                                  if (input) {
                                    // Split by comma or semicolon for bulk add
                                    const keywords = input
                                      .split(/[,;]/)
                                      .map((s) => s.trim())
                                      .filter((s) => s);
                                    const existingKeywords = field.value || [];
                                    const newKeywords = keywords.filter(
                                      (k) => !existingKeywords.includes(k)
                                    );
                                    if (newKeywords.length > 0) {
                                      field.onChange([
                                        ...existingKeywords,
                                        ...newKeywords,
                                      ]);
                                      setActionVerbInput("");
                                    }
                                  }
                                }
                              }}
                            />
                            <IconButton
                              type="button"
                              onClick={() => {
                                const input = actionVerbInput.trim();
                                if (input) {
                                  // Split by comma or semicolon for bulk add
                                  const keywords = input
                                    .split(/[,;]/)
                                    .map((s) => s.trim())
                                    .filter((s) => s);
                                  const existingKeywords = field.value || [];
                                  const newKeywords = keywords.filter(
                                    (k) => !existingKeywords.includes(k)
                                  );
                                  if (newKeywords.length > 0) {
                                    field.onChange([
                                      ...existingKeywords,
                                      ...newKeywords,
                                    ]);
                                    setActionVerbInput("");
                                  }
                                }
                              }}
                              disabled={!actionVerbInput.trim()}
                            >
                              <Plus className="h-4 w-4" />
                            </IconButton>
                          </div>

                          {/* Keywords Display as Badges (draggable) */}
                          {field.value && field.value.length > 0 && (
                            <DndContext
                              sensors={sensors}
                              collisionDetection={closestCenter}
                              onDragEnd={({ active, over }) => {
                                if (!over || active.id === over.id) return;
                                const from = parseInt(
                                  active.id.toString().split("-").pop() || "0",
                                  10
                                );
                                const to = parseInt(
                                  over.id.toString().split("-").pop() || "0",
                                  10
                                );
                                const newList = onReorder(
                                  field.value,
                                  from,
                                  to
                                ) as string[];
                                field.onChange(newList);
                              }}
                            >
                              <SortableContext
                                items={field.value.map((_, i) => `act-${i}`)}
                                strategy={rectSortingStrategy}
                              >
                                <div className="flex flex-wrap gap-1.5">
                                  {field.value.map((keyword, index) => (
                                    <SortableBadgeItem
                                      key={`act-${index}`}
                                      id={`act-${index}`}
                                    >
                                      <Badge
                                        variant="secondary"
                                        className="pl-2 pr-1 py-1 flex items-center gap-1"
                                      >
                                        <span className="text-xs">
                                          {keyword}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            field.onChange(
                                              field.value?.filter(
                                                (_, i) => i !== index
                                              ) || []
                                            );
                                          }}
                                          className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      </Badge>
                                    </SortableBadgeItem>
                                  ))}
                                </div>
                              </SortableContext>
                            </DndContext>
                          )}
                        </div>
                        <FormDescription>
                          Press Enter or click + to add. You can add multiple
                          keywords separated by commas.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Technical Skills */}
                  <FormField
                    control={form.control}
                    name="keywords.hardSkills"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Technical Skills</FormLabel>
                        <div className="space-y-3">
                          {/* Input with Add Button */}
                          <div className="flex gap-2">
                            <Input
                              placeholder="Type a technical skill (e.g., React, Python, AWS)"
                              value={hardSkillInput}
                              onChange={(e) =>
                                setHardSkillInput(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  const input = hardSkillInput.trim();
                                  if (input) {
                                    // Split by comma or semicolon for bulk add
                                    const keywords = input
                                      .split(/[,;]/)
                                      .map((s) => s.trim())
                                      .filter((s) => s);
                                    const existingKeywords = field.value || [];
                                    const newKeywords = keywords.filter(
                                      (k) => !existingKeywords.includes(k)
                                    );
                                    if (newKeywords.length > 0) {
                                      field.onChange([
                                        ...existingKeywords,
                                        ...newKeywords,
                                      ]);
                                      setHardSkillInput("");
                                    }
                                  }
                                }
                              }}
                            />
                            <IconButton
                              type="button"
                              onClick={() => {
                                const input = hardSkillInput.trim();
                                if (input) {
                                  // Split by comma or semicolon for bulk add
                                  const keywords = input
                                    .split(/[,;]/)
                                    .map((s) => s.trim())
                                    .filter((s) => s);
                                  const existingKeywords = field.value || [];
                                  const newKeywords = keywords.filter(
                                    (k) => !existingKeywords.includes(k)
                                  );
                                  if (newKeywords.length > 0) {
                                    field.onChange([
                                      ...existingKeywords,
                                      ...newKeywords,
                                    ]);
                                    setHardSkillInput("");
                                  }
                                }
                              }}
                              disabled={!hardSkillInput.trim()}
                            >
                              <Plus className="h-4 w-4" />
                            </IconButton>
                          </div>

                          {/* Keywords Display as Badges (draggable) */}
                          {field.value && field.value.length > 0 && (
                            <DndContext
                              sensors={sensors}
                              collisionDetection={closestCenter}
                              onDragEnd={({ active, over }) => {
                                if (!over || active.id === over.id) return;
                                const from = parseInt(
                                  active.id.toString().split("-").pop() || "0",
                                  10
                                );
                                const to = parseInt(
                                  over.id.toString().split("-").pop() || "0",
                                  10
                                );
                                field.onChange(
                                  onReorder(field.value, from, to)
                                );
                              }}
                            >
                              <SortableContext
                                items={field.value.map((_, i) => `hard-${i}`)}
                                strategy={rectSortingStrategy}
                              >
                                <div className="flex flex-wrap gap-1.5">
                                  {field.value.map((keyword, index) => (
                                    <SortableBadgeItem
                                      key={`hard-${index}`}
                                      id={`hard-${index}`}
                                    >
                                      <Badge
                                        variant="secondary"
                                        className="pl-2 pr-1 py-1 flex items-center gap-1"
                                      >
                                        <span className="text-xs">
                                          {keyword}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            field.onChange(
                                              field.value?.filter(
                                                (_, i) => i !== index
                                              ) || []
                                            );
                                          }}
                                          className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      </Badge>
                                    </SortableBadgeItem>
                                  ))}
                                </div>
                              </SortableContext>
                            </DndContext>
                          )}
                        </div>
                        <FormDescription>
                          Press Enter or click + to add. You can add multiple
                          keywords separated by commas.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Soft Skills */}
                  <FormField
                    control={form.control}
                    name="keywords.softSkills"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Soft Skills</FormLabel>
                        <div className="space-y-3">
                          {/* Input with Add Button */}
                          <div className="flex gap-2">
                            <Input
                              placeholder="Type a soft skill (e.g., leadership, communication)"
                              value={softSkillInput}
                              onChange={(e) =>
                                setSoftSkillInput(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  const input = softSkillInput.trim();
                                  if (input) {
                                    // Split by comma or semicolon for bulk add
                                    const keywords = input
                                      .split(/[,;]/)
                                      .map((s) => s.trim())
                                      .filter((s) => s);
                                    const existingKeywords = field.value || [];
                                    const newKeywords = keywords.filter(
                                      (k) => !existingKeywords.includes(k)
                                    );
                                    if (newKeywords.length > 0) {
                                      field.onChange([
                                        ...existingKeywords,
                                        ...newKeywords,
                                      ]);
                                      setSoftSkillInput("");
                                    }
                                  }
                                }
                              }}
                            />
                            <IconButton
                              type="button"
                              onClick={() => {
                                const input = softSkillInput.trim();
                                if (input) {
                                  // Split by comma or semicolon for bulk add
                                  const keywords = input
                                    .split(/[,;]/)
                                    .map((s) => s.trim())
                                    .filter((s) => s);
                                  const existingKeywords = field.value || [];
                                  const newKeywords = keywords.filter(
                                    (k) => !existingKeywords.includes(k)
                                  );
                                  if (newKeywords.length > 0) {
                                    field.onChange([
                                      ...existingKeywords,
                                      ...newKeywords,
                                    ]);
                                    setSoftSkillInput("");
                                  }
                                }
                              }}
                              disabled={!softSkillInput.trim()}
                            >
                              <Plus className="h-4 w-4" />
                            </IconButton>
                          </div>

                          {/* Keywords Display as Badges (draggable) */}
                          {field.value && field.value.length > 0 && (
                            <DndContext
                              sensors={sensors}
                              collisionDetection={closestCenter}
                              onDragEnd={({ active, over }) => {
                                if (!over || active.id === over.id) return;
                                const from = parseInt(
                                  active.id.toString().split("-").pop() || "0",
                                  10
                                );
                                const to = parseInt(
                                  over.id.toString().split("-").pop() || "0",
                                  10
                                );
                                field.onChange(
                                  onReorder(field.value, from, to)
                                );
                              }}
                            >
                              <SortableContext
                                items={field.value.map((_, i) => `soft-${i}`)}
                                strategy={rectSortingStrategy}
                              >
                                <div className="flex flex-wrap gap-1.5">
                                  {field.value.map((keyword, index) => (
                                    <SortableBadgeItem
                                      key={`soft-${index}`}
                                      id={`soft-${index}`}
                                    >
                                      <Badge
                                        variant="secondary"
                                        className="pl-2 pr-1 py-1 flex items-center gap-1"
                                      >
                                        <span className="text-xs">
                                          {keyword}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            field.onChange(
                                              field.value?.filter(
                                                (_, i) => i !== index
                                              ) || []
                                            );
                                          }}
                                          className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      </Badge>
                                    </SortableBadgeItem>
                                  ))}
                                </div>
                              </SortableContext>
                            </DndContext>
                          )}
                        </div>
                        <FormDescription>
                          Press Enter or click + to add. You can add multiple
                          keywords separated by commas.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            <div className="flex gap-4">
              <LoadingButton
                type="submit"
                loading={effectiveLoading}
                loadingText="Saving..."
              >
                {submitButtonText ||
                  (mode === "edit" ? "Update Job" : "Create Job Posting")}
              </LoadingButton>
              <OutlineButton
                type="button"
                onClick={onCancel || (() => router.push("/jobs"))}
                disabled={effectiveLoading}
              >
                Cancel
              </OutlineButton>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
