"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Save, Globe, Settings } from "lucide-react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useJobScanSettings,
  useUpdateJobScanSettings,
} from "@/hooks/api/use-job-scanner";
import { toast } from "sonner";
import { X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  ALL_CURATED_COMPANIES,
  COMPANY_CATEGORIES,
} from "./curated-companies";

interface SettingsFormData {
  searches: {
    title: string;
    workMode?: "remote" | "hybrid" | "onsite" | "flexible" | "any";
    location?: string;
  }[];
  sites: string[];
  apiCompanies: string[];
  enableRemotive: boolean;
  enableRemoteOk: boolean;
  timeFilter:
    | "past_hour"
    | "past_day"
    | "past_week"
    | "past_month"
    | "past_year"
    | "anytime";
  maxResultsPerSearch: number;
  enableAutoScan: boolean;
  scanIntervalHours: number;
  scanIntervalMinutes?: number;
}


const POPULAR_JOB_SITES = [
  { name: "greenhouse.io", category: "Supported Sites", recommended: true },
  { name: "lever.co", category: "Supported Sites", recommended: true },
  { name: "ashbyhq.com", category: "Supported Sites", recommended: true },
  {
    name: "apply.workable.com",
    category: "Supported Sites",
    recommended: true,
  },
  { name: "builtin.com", category: "Supported Sites", recommended: true },
  { name: "wellfound.com", category: "Supported Sites", recommended: true },
  {
    name: "smartrecruiters.com",
    category: "Supported Sites",
    recommended: true,
  },
  {
    name: "wellfound.com",
    category: "Supported Sites",
    recommended: true,
  },
  { name: "jazzhr.com", category: "ATS", recommended: true },
  { name: "myworkdayjobs.com", category: "ATS", recommended: true },
  { name: "weworkremotely.com", category: "Remote Jobs", recommended: true },
  { name: "remoteok.com", category: "Remote Jobs", recommended: true },
  { name: "flexjobs.com", category: "Remote Jobs", recommended: true },
  { name: "ziprecruiter.com", category: "Job Boards", recommended: true },
  { name: "monster.com", category: "Job Boards", recommended: true },
  { name: "careerbuilder.com", category: "Job Boards", recommended: true },
  { name: "simplyhired.com", category: "Job Boards", recommended: true },
  { name: "indeed.com", category: "Job Boards", recommended: true },
  { name: "linkedin.com/jobs", category: "Job Boards", recommended: true },
  { name: "glassdoor.com", category: "Job Boards", recommended: true },
  { name: "jobgether.com", category: "Job Boards", recommended: true },
];

export function JobScannerSettingsDialog() {
  const { data: settings, isLoading, refetch } = useJobScanSettings();
  const updateSettings = useUpdateJobScanSettings();
  const [open, setOpen] = useState(false);
  const [newSite, setNewSite] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { control, register, handleSubmit, reset, watch, setValue } =
    useForm<SettingsFormData>({
      defaultValues: {
        searches: [],
        sites: [],
        apiCompanies: [],
        enableRemotive: false,
        enableRemoteOk: false,
        timeFilter: "past_week",
        maxResultsPerSearch: 10,
        enableAutoScan: false,
        scanIntervalHours: 6,
        scanIntervalMinutes: 0,
      },
    });

  const {
    fields: searchFields,
    append: appendSearch,
    remove: removeSearch,
  } = useFieldArray({
    control,
    name: "searches",
  });

  const watchSites = watch("sites");
  const watchApiCompanies = watch("apiCompanies");
  const watchEnableAutoScan = watch("enableAutoScan");

  // Load settings data into form when available
  useEffect(() => {
    if (settings) {
      const cleanSettings = {
        searches: settings.searches || [],
        sites: settings.sites || [],
        apiCompanies: settings.apiCompanies || [],
        enableRemotive: settings.enableRemotive ?? false,
        enableRemoteOk: settings.enableRemoteOk ?? false,
        timeFilter: settings.timeFilter || "past_week",
        maxResultsPerSearch: settings.maxResultsPerSearch || 10,
        enableAutoScan: settings.enableAutoScan || false,
        scanIntervalHours: settings.scanIntervalHours ?? 6,
        scanIntervalMinutes: settings.scanIntervalMinutes ?? 0,
      };
      reset(cleanSettings);
    }
  }, [settings, reset]);

  const onSubmit = async (data: SettingsFormData) => {
    try {
      // Convert hours and minutes to total minutes for simplicity
      const totalMinutes =
        data.scanIntervalHours * 60 + (data.scanIntervalMinutes || 0);

      // Send the separated values
      const submitData = {
        ...data,
        scanIntervalMinutes: totalMinutes % 60,
        scanIntervalHours: Math.floor(totalMinutes / 60),
      };

      console.log("Submitting settings - Total minutes:", totalMinutes);
      console.log("Submitting data:", submitData);

      await updateSettings.mutateAsync(submitData);
      // Force refetch to get updated nextScheduledScan
      await refetch();
      setOpen(false);
    } catch (error) {
      toast.error("Failed to save settings");
    }
  };

  const handleAddSite = (site?: string) => {
    const siteToAdd = site || newSite;
    if (!siteToAdd) return;

    // Split by comma and process multiple sites
    const sitesToAdd = siteToAdd
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s);
    const newSites = [...watchSites];

    sitesToAdd.forEach((s) => {
      if (s && !newSites.includes(s)) {
        newSites.push(s);
      }
    });

    if (newSites.length > watchSites.length) {
      setValue("sites", newSites, { shouldDirty: true });
      setNewSite("");
    }
  };

  const handleRemoveSite = (site: string) => {
    setValue(
      "sites",
      watchSites.filter((s) => s !== site),
      { shouldDirty: true },
    );
  };

  const toggleCompany = (url: string) => {
    const next = watchApiCompanies.includes(url)
      ? watchApiCompanies.filter((u) => u !== url)
      : [...watchApiCompanies, url];
    setValue("apiCompanies", next, { shouldDirty: true });
  };

  const toggleCategory = (categoryId: string, allOn: boolean) => {
    const category = COMPANY_CATEGORIES.find((c) => c.id === categoryId);
    if (!category) return;
    const categoryUrls = category.companies.map((c) => c.url);
    const next = allOn
      ? Array.from(new Set([...watchApiCompanies, ...categoryUrls]))
      : watchApiCompanies.filter((u) => !categoryUrls.includes(u));
    setValue("apiCompanies", next, { shouldDirty: true });
  };

  const enabledCount = watchApiCompanies.filter((u) =>
    ALL_CURATED_COMPANIES.some((c) => c.url === u),
  ).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="w-full" title="Scanner Settings">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="!max-w-none sm:!max-w-[800px] max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Job Scanner Settings</DialogTitle>
          <DialogDescription>
            Configure your job scanning preferences and search criteria
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <ScrollArea className="h-[60vh]">
            <div className="space-y-6 pr-4">
              {/* Search Configurations */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-3">
                    Search Configurations
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Define what job titles and preferences to search for
                  </p>
                </div>

                {searchFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label className="text-xs">Job Title</Label>
                      <Input
                        {...register(`searches.${index}.title`, {
                          required: true,
                        })}
                        placeholder="e.g., Senior Software Engineer"
                        className="h-9"
                      />
                    </div>
                    <div className="w-32">
                      <Label className="text-xs">Work Mode</Label>
                      <Controller
                        name={`searches.${index}.workMode`}
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={field.value || "any"}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="any">Any</SelectItem>
                              <SelectItem value="remote">Remote</SelectItem>
                              <SelectItem value="hybrid">Hybrid</SelectItem>
                              <SelectItem value="onsite">Onsite</SelectItem>
                              <SelectItem value="flexible">Flexible</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">Location</Label>
                      <Input
                        {...register(`searches.${index}.location`)}
                        placeholder="e.g., San Francisco"
                        className="h-9"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSearch(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  onClick={() => appendSearch({ title: "", workMode: "any" })}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Search Configuration
                </Button>
              </div>

              <Separator />

              {/* Job Sites */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-3">Job Sites</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Specify which job boards to search. You can add multiple
                    sites at once by separating them with commas.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {watchSites.map((site) => (
                    <Badge key={site} variant="secondary" className="px-3 py-1">
                      {site}
                      <button
                        type="button"
                        onClick={() => handleRemoveSite(site)}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., greenhouse.io or multiple: indeed.com, linkedin.com"
                      value={newSite}
                      onChange={(e) => setNewSite(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSite();
                        }
                      }}
                      className="h-9"
                    />
                    <Button
                      type="button"
                      onClick={() => handleAddSite()}
                      variant="outline"
                      size="sm"
                    >
                      Add Site(s)
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setShowSuggestions(!showSuggestions)}
                      variant="ghost"
                      size="sm"
                    >
                      <Globe className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Popular Sites Suggestions */}
                  {showSuggestions && (
                    <div className="border rounded-lg p-3 space-y-2">
                      <p className="text-xs font-medium">
                        Supported Job Sites:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {POPULAR_JOB_SITES.map((site) => (
                          <Button
                            key={site.name}
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs px-2 text-green-600 hover:text-green-700"
                            onClick={() => handleAddSite(site.name)}
                            disabled={watchSites.includes(site.name)}
                          >
                            {site.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Direct API Sources */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-3">
                    Direct API Sources
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Free public job APIs — fast, accurate, no captchas. Toggle
                    aggregators or pick specific companies to track.
                  </p>
                </div>

                {/* Aggregators */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Remotive</Label>
                      <p className="text-xs text-muted-foreground">
                        Curated remote tech jobs
                      </p>
                    </div>
                    <Controller
                      name="enableRemotive"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">RemoteOK</Label>
                      <p className="text-xs text-muted-foreground">
                        Remote-only job aggregator
                      </p>
                    </div>
                    <Controller
                      name="enableRemoteOk"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Curated company picker */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Companies to Track</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Click to include companies. Their open jobs are fetched
                        directly via public APIs — no scraping, no captchas.
                      </p>
                    </div>
                    {enabledCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {enabledCount} selected
                      </Badge>
                    )}
                  </div>

                  {COMPANY_CATEGORIES.map((category) => {
                    const categoryUrls = category.companies.map((c) => c.url);
                    const allEnabled = categoryUrls.every((u) =>
                      watchApiCompanies.includes(u),
                    );
                    const someEnabled = categoryUrls.some((u) =>
                      watchApiCompanies.includes(u),
                    );

                    return (
                      <div
                        key={category.id}
                        className="border rounded-lg p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold">
                              {category.label}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {category.description}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() =>
                              toggleCategory(category.id, !allEnabled)
                            }
                          >
                            {allEnabled
                              ? "Deselect all"
                              : someEnabled
                                ? "Select all"
                                : "Select all"}
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {category.companies.map((company) => {
                            const enabled = watchApiCompanies.includes(
                              company.url,
                            );
                            return (
                              <button
                                key={company.url}
                                type="button"
                                onClick={() => toggleCompany(company.url)}
                                className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                                  enabled
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-background hover:bg-muted border-border"
                                }`}
                              >
                                {company.name}
                                <span
                                  className={`ml-1.5 text-[9px] uppercase tracking-wide ${
                                    enabled ? "opacity-70" : "opacity-50"
                                  }`}
                                >
                                  {company.ats}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* Scan Settings */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-3">Scan Settings</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure how and when jobs are scanned
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Time Filter */}
                  <div className="space-y-2">
                    <Label className="text-xs">Time Filter</Label>
                    <Controller
                      name="timeFilter"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="past_hour">Past Hour</SelectItem>
                            <SelectItem value="past_day">Past Day</SelectItem>
                            <SelectItem value="past_week">Past Week</SelectItem>
                            <SelectItem value="past_month">
                              Past Month
                            </SelectItem>
                            <SelectItem value="past_year">Past Year</SelectItem>
                            <SelectItem value="anytime">Anytime</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <p className="text-xs text-muted-foreground">
                      How far back to search for jobs
                    </p>
                  </div>

                  {/* Max Results */}
                  <div className="space-y-2">
                    <Label className="text-xs">Max Results per Search</Label>
                    <Input
                      type="number"
                      min="1"
                      max="50"
                      {...register("maxResultsPerSearch", {
                        valueAsNumber: true,
                      })}
                      className="h-9"
                    />
                    <p className="text-xs text-muted-foreground">
                      Limit results to avoid too many jobs
                    </p>
                  </div>
                </div>

                {/* Auto Scan Toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Enable Auto Scan</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically scan for new jobs periodically
                    </p>
                  </div>
                  <Controller
                    name="enableAutoScan"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                </div>

                {/* Scan Interval - Only show when auto scan is enabled */}
                {watchEnableAutoScan && (
                  <div className="space-y-3">
                    <Label className="text-sm">Scan Interval</Label>

                    {/* Hours and Minutes Inputs */}
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground">
                          Hours
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          max="24"
                          {...register("scanIntervalHours", {
                            valueAsNumber: true,
                          })}
                          className="h-9"
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground">
                          Minutes
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          max="59"
                          {...register("scanIntervalMinutes", {
                            valueAsNumber: true,
                          })}
                          className="h-9"
                        />
                      </div>
                    </div>

                    {/* Quick Select Buttons */}
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Quick select:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            setValue("scanIntervalHours", 0, {
                              shouldDirty: true,
                            });
                            setValue("scanIntervalMinutes", 5, {
                              shouldDirty: true,
                            });
                          }}
                        >
                          5 min
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            setValue("scanIntervalHours", 0, {
                              shouldDirty: true,
                            });
                            setValue("scanIntervalMinutes", 15, {
                              shouldDirty: true,
                            });
                          }}
                        >
                          15 min
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            setValue("scanIntervalHours", 0, {
                              shouldDirty: true,
                            });
                            setValue("scanIntervalMinutes", 30, {
                              shouldDirty: true,
                            });
                          }}
                        >
                          30 min
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            setValue("scanIntervalHours", 1, {
                              shouldDirty: true,
                            });
                            setValue("scanIntervalMinutes", 0, {
                              shouldDirty: true,
                            });
                          }}
                        >
                          1 hour
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            setValue("scanIntervalHours", 2, {
                              shouldDirty: true,
                            });
                            setValue("scanIntervalMinutes", 0, {
                              shouldDirty: true,
                            });
                          }}
                        >
                          2 hours
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            setValue("scanIntervalHours", 6, {
                              shouldDirty: true,
                            });
                            setValue("scanIntervalMinutes", 0, {
                              shouldDirty: true,
                            });
                          }}
                        >
                          6 hours
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            setValue("scanIntervalHours", 12, {
                              shouldDirty: true,
                            });
                            setValue("scanIntervalMinutes", 0, {
                              shouldDirty: true,
                            });
                          }}
                        >
                          12 hours
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            setValue("scanIntervalHours", 24, {
                              shouldDirty: true,
                            });
                            setValue("scanIntervalMinutes", 0, {
                              shouldDirty: true,
                            });
                          }}
                        >
                          Daily
                        </Button>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      How often to automatically scan for new jobs
                    </p>
                  </div>
                )}
              </div>

              {/* Status */}
              {settings && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold mb-3">Scan Status</h3>
                    {settings.lastScanAt && (
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">
                          Last Auto Scan:
                        </span>
                        <span
                          className="text-xs"
                          title={new Date(settings.lastScanAt).toLocaleString()}
                        >
                          {formatDistanceToNow(new Date(settings.lastScanAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    )}
                    {settings.nextScheduledScan && (
                      <div className="flex justify-between">
                        <span className="text-xs text-muted-foreground">
                          Next Auto Scan:
                        </span>
                        <span
                          className="text-xs"
                          title={new Date(
                            settings.nextScheduledScan,
                          ).toLocaleString()}
                        >
                          {formatDistanceToNow(
                            new Date(settings.nextScheduledScan),
                            { addSuffix: true },
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </ScrollArea>

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <Button type="submit" disabled={updateSettings.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {updateSettings.isPending ? "Saving..." : "Save Settings"}
            </Button>
            <Button
              type="button"
              onClick={() => setOpen(false)}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
