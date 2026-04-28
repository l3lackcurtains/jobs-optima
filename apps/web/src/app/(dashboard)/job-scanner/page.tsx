"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  RefreshCw,
  ExternalLink,
  Star,
  MapPin,
  Building2,
  Calendar,
  DollarSign,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  RotateCw,
  Briefcase,
  Clock,
  Activity,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/custom/page-header";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  useScannedJobs,
  useUpdateJobStatus,
  useDeleteScannedJob,
  useTriggerJobScan,
  useBulkJobAction,
  useJobScanSettings,
  useSaveScannedJob,
} from "@/hooks/api/use-job-scanner";
import { ScannedJob } from "@/lib/api/job-scanner";
import { formatDistanceToNow } from "date-fns";
import { JobScannerSettingsDialog } from "@/components/job-scanner/settings-dialog";
import { ScanTerminalDialog } from "@/components/job-scanner/scan-terminal-dialog";
import { ScanStatusDialog } from "@/components/job-scanner/scan-status-dialog";
import { useJobScannerStore } from "@/stores/job-scanner-store";

function JobScannerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    filters,
    setSearchQuery,
    setWorkMode,
    setFavorite,
    setItemsPerPage,
    setSortBy,
    setSortOrder,
  } = useJobScannerStore();
  const [localSearchQuery, setLocalSearchQuery] = useState(filters.searchQuery);
  const [selectedJob, setSelectedJob] = useState<ScannedJob | null>(null);
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(() => {
    // Initialize from URL query parameter
    const pageParam = searchParams.get("page");
    return pageParam ? parseInt(pageParam, 10) : 1;
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [scanTerminalOpen, setScanTerminalOpen] = useState(false);
  const [scanStatusOpen, setScanStatusOpen] = useState(false);
  const [currentScanId, setCurrentScanId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [pendingBulkAction, setPendingBulkAction] = useState<
    "delete" | "markFavorited" | "markUnfavorited" | null
  >(null);
  const [showSingleDeleteDialog, setShowSingleDeleteDialog] = useState(false);
  const [pendingDeleteJobId, setPendingDeleteJobId] = useState<string | null>(
    null,
  );

  const triggerScan = useTriggerJobScan();
  const updateJobStatus = useUpdateJobStatus();
  const deleteJob = useDeleteScannedJob();
  const saveJob = useSaveScannedJob();
  const bulkAction = useBulkJobAction();
  const { data: scanSettings } = useJobScanSettings();

  // Sync page from URL on mount and when URL changes
  useEffect(() => {
    const pageParam = searchParams.get("page");
    const pageNumber = pageParam ? parseInt(pageParam, 10) : 1;
    if (pageNumber !== currentPage && pageNumber > 0) {
      setCurrentPage(pageNumber);
    }
  }, [searchParams]);

  // Sync local search with store on mount
  useEffect(() => {
    setLocalSearchQuery(filters.searchQuery);
  }, [filters.searchQuery]);

  // Helper function to update page and URL
  const updatePage = (newPage: number) => {
    setCurrentPage(newPage);
    const params = new URLSearchParams(searchParams.toString());
    if (newPage === 1) {
      params.delete("page");
    } else {
      params.set("page", newPage.toString());
    }
    const newUrl = params.toString() ? `?${params.toString()}` : "";
    router.push(`/job-scanner${newUrl}`, { scroll: false });
  };

  // Fetch jobs based on filters and pagination
  const {
    data: jobsData,
    isLoading,
    refetch,
    isFetching,
  } = useScannedJobs({
    ...(filters.favorite === "favorited" && { isFavorited: true }),
    ...(filters.favorite === "not-favorited" && { isFavorited: false }),
    ...(filters.searchQuery && { searchTitle: filters.searchQuery }),
    ...(filters.workMode !== "all" && { workMode: filters.workMode as any }),
    limit: filters.itemsPerPage,
    offset: (currentPage - 1) * filters.itemsPerPage,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  });

  // Fetch stats for favorites only when needed
  const { data: favoritesData } = useScannedJobs(
    {
      isFavorited: true,
      limit: 1,
      offset: 0,
    },
    {
      // Only fetch favorites count when showing all jobs or favorited jobs
      enabled: filters.favorite === "all" || filters.favorite === "favorited",
    },
  );

  const jobs = jobsData?.jobs || [];
  const totalJobs = jobsData?.total || 0;
  const totalPages = Math.ceil(totalJobs / filters.itemsPerPage);
  const totalFavorites = favoritesData?.total || 0;

  const handleJobClick = (job: ScannedJob) => {
    setSelectedJob(job);
  };

  const handleToggleFavorite = (job: ScannedJob, e: React.MouseEvent) => {
    e.stopPropagation();
    updateJobStatus.mutate({
      jobId: job._id,
      status: { isFavorited: !job.isFavorited },
    });
  };

  const handleOpenExternal = (job: ScannedJob, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(job.url, "_blank");
  };

  const handleDeleteJob = (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPendingDeleteJobId(jobId);
    setShowSingleDeleteDialog(true);
  };

  const handleSaveToJobs = (job: ScannedJob, e: React.MouseEvent) => {
    e.stopPropagation();
    // If already saved, the bookmark-check icon navigates to the job.
    if (job.savedJobId) {
      router.push(`/jobs/${job.savedJobId}`);
      return;
    }
    // First save: stay on this page; the bookmark icon flips to BookmarkCheck
    // and the user can click it again to open the saved job.
    saveJob.mutate(job._id, {
      onSuccess: (data) => {
        toast.success("Job saved", {
          action: {
            label: "View",
            onClick: () => router.push(`/jobs/${data.job._id}`),
          },
        });
      },
    });
  };

  const confirmSingleDelete = () => {
    if (pendingDeleteJobId) {
      deleteJob.mutate(pendingDeleteJobId);
    }
    setShowSingleDeleteDialog(false);
    setPendingDeleteJobId(null);
  };

  const handleManualScan = () => {
    // Open terminal dialog in confirmation mode
    setScanTerminalOpen(true);
    setCurrentScanId(null); // No scan ID yet
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    updatePage(1);
    setSelectedJobIds(new Set());
    await refetch();
    setIsRefreshing(false);
  };

  const handleSelectJob = (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedJobIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedJobIds.size === jobs.length) {
      setSelectedJobIds(new Set());
    } else {
      setSelectedJobIds(new Set(jobs.map((j) => j._id)));
    }
  };

  const handleBulkAction = async (
    action: "delete" | "markFavorited" | "markUnfavorited",
  ) => {
    if (selectedJobIds.size === 0) return;

    if (action === "delete") {
      setPendingBulkAction(action);
      setShowDeleteDialog(true);
      return;
    }

    await bulkAction.mutateAsync({
      jobIds: Array.from(selectedJobIds),
      action,
    });

    setSelectedJobIds(new Set());
  };

  const confirmBulkDelete = async () => {
    if (pendingBulkAction === "delete" && selectedJobIds.size > 0) {
      await bulkAction.mutateAsync({
        jobIds: Array.from(selectedJobIds),
        action: "delete",
      });
      setSelectedJobIds(new Set());
    }
    setShowDeleteDialog(false);
    setPendingBulkAction(null);
  };

  const getWorkModeBadgeVariant = (workMode?: string) => {
    switch (workMode) {
      case "remote":
        return "default";
      case "hybrid":
        return "secondary";
      case "onsite":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Job Scanner"
        description="Discover and track job opportunities from multiple job boards"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Job Scanner" },
        ]}
      />

      {/* Mobile-only action bar */}
      <div className="flex gap-2 md:hidden">
        <Button
          onClick={handleManualScan}
          disabled={triggerScan.isPending}
          className="flex-1"
          size="sm"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${triggerScan.isPending ? "animate-spin" : ""}`} />
          {triggerScan.isPending ? "Starting..." : "Scan Jobs"}
        </Button>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="icon"
          disabled={isRefreshing || isFetching}
          title="Refresh"
        >
          <RotateCw className={`h-4 w-4 ${isRefreshing || isFetching ? "animate-spin" : ""}`} />
        </Button>
        <JobScannerSettingsDialog />
        <Button
          onClick={() => setScanStatusOpen(true)}
          variant="outline"
          size="icon"
          title="Scan Logs"
        >
          <Activity className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => setMobileFiltersOpen((v) => !v)}
          variant={mobileFiltersOpen ? "default" : "outline"}
          size="icon"
          title="Filters"
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Filters and Actions */}
        <div className={cn("md:col-span-1 space-y-4", !mobileFiltersOpen && "hidden md:block")}>
          {/* Action Buttons — hidden on mobile (shown in top bar above) */}
          <Card className="hidden md:block">
            <CardContent className="p-4 space-y-3">
              <Button
                onClick={handleManualScan}
                disabled={triggerScan.isPending}
                className="w-full"
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${triggerScan.isPending ? "animate-spin" : ""}`}
                />
                {triggerScan.isPending
                  ? "Starting..."
                  : scanSettings?.isScanning
                    ? "Scan in Progress"
                    : "Scan for Jobs"}
              </Button>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  size="icon"
                  className="w-full"
                  disabled={isRefreshing || isFetching}
                  title="Refresh"
                >
                  <RotateCw
                    className={`h-4 w-4 ${isRefreshing || isFetching ? "animate-spin" : ""}`}
                  />
                </Button>
                <JobScannerSettingsDialog />
                <Button
                  onClick={() => setScanStatusOpen(true)}
                  variant="outline"
                  size="icon"
                  className="w-full"
                  title="View Scan Logs"
                >
                  <Activity className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Scan Status */}
          {scanSettings &&
            (scanSettings.lastScanAt ||
              scanSettings.nextScheduledScan ||
              scanSettings.isScanning) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Scan Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {scanSettings.isScanning && (
                    <div className="flex items-center justify-between pb-2 border-b">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Activity className="h-3 w-3 animate-pulse" />
                        Scanning
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-xs"
                        onClick={() => setScanStatusOpen(true)}
                      >
                        View Logs
                      </Button>
                    </div>
                  )}
                  {scanSettings.lastScanAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Last Auto Scan
                      </span>
                      <span
                        className="text-xs font-medium"
                        title={new Date(
                          scanSettings.lastScanAt,
                        ).toLocaleString()}
                      >
                        {formatDistanceToNow(
                          new Date(scanSettings.lastScanAt),
                          { addSuffix: true },
                        )}
                      </span>
                    </div>
                  )}
                  {scanSettings.nextScheduledScan && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Next Auto Scan
                      </span>
                      <span
                        className="text-xs font-medium"
                        title={new Date(
                          scanSettings.nextScheduledScan,
                        ).toLocaleString()}
                      >
                        {formatDistanceToNow(
                          new Date(scanSettings.nextScheduledScan),
                          { addSuffix: true },
                        )}
                      </span>
                    </div>
                  )}
                  {scanSettings.enableAutoScan && (
                    <div className="pt-2 border-t">
                      <span className="text-xs text-muted-foreground">
                        Auto-scan every{" "}
                        {scanSettings.scanIntervalHours > 0 &&
                        (scanSettings.scanIntervalMinutes || 0) > 0
                          ? `${scanSettings.scanIntervalHours}h ${scanSettings.scanIntervalMinutes}m`
                          : scanSettings.scanIntervalHours > 0
                            ? `${scanSettings.scanIntervalHours} hour${scanSettings.scanIntervalHours !== 1 ? "s" : ""}`
                            : `${scanSettings.scanIntervalMinutes || 0} minute${(scanSettings.scanIntervalMinutes || 0) !== 1 ? "s" : ""}`}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

          {/* Search and Filters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search jobs..."
                    value={localSearchQuery}
                    onChange={(e) => {
                      setLocalSearchQuery(e.target.value);
                    }}
                    onBlur={() => {
                      setSearchQuery(localSearchQuery);
                      updatePage(1);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setSearchQuery(localSearchQuery);
                        updatePage(1);
                      }
                    }}
                    className="pl-8 h-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Work Mode</Label>
                <Select
                  value={filters.workMode}
                  onValueChange={(value) => {
                    setWorkMode(value);
                    updatePage(1);
                  }}
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Modes</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="onsite">Onsite</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Favorites</Label>
                <Select
                  value={filters.favorite}
                  onValueChange={(value) => {
                    setFavorite(value);
                    updatePage(1);
                  }}
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Jobs</SelectItem>
                    <SelectItem value="favorited">Favorited Only</SelectItem>
                    <SelectItem value="not-favorited">Not Favorited</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Items per page</Label>
                <Select
                  value={filters.itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(parseInt(value));
                    updatePage(1);
                  }}
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 items</SelectItem>
                    <SelectItem value="15">15 items</SelectItem>
                    <SelectItem value="25">25 items</SelectItem>
                    <SelectItem value="50">50 items</SelectItem>
                    <SelectItem value="100">100 items</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-xs">Sort By</Label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value: "datePosted" | "createdAt") => {
                    setSortBy(value);
                    updatePage(1);
                  }}
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Date Scraped</SelectItem>
                    <SelectItem value="datePosted">Date Posted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Sort Order</Label>
                <Select
                  value={filters.sortOrder}
                  onValueChange={(value: "desc" | "asc") => {
                    setSortOrder(value);
                    updatePage(1);
                  }}
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Newest First</SelectItem>
                    <SelectItem value="asc">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Job List */}
        <div className="md:col-span-2 lg:col-span-3">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Job Listings</CardTitle>
                  <CardDescription className="mt-1">
                    {totalJobs > 0
                      ? `${totalJobs} jobs found`
                      : "No jobs found"}
                    {filters.favorite === "favorited" &&
                      totalFavorites > 0 &&
                      ` (${totalFavorites} favorites)`}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {/* Bulk Actions Bar */}
              {selectedJobIds.size > 0 && (
                <div className="px-6 py-3 bg-muted/50 border-b flex items-center gap-2">
                  <Checkbox
                    checked={
                      selectedJobIds.size === jobs.length && jobs.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm font-medium">
                    {selectedJobIds.size} selected
                  </span>
                  <Separator orientation="vertical" className="h-4 mx-2" />
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleBulkAction("markFavorited")}
                    >
                      Favorite
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleBulkAction("markUnfavorited")}
                    >
                      Unfavorite
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleBulkAction("delete")}
                    >
                      Delete
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedJobIds(new Set())}
                    className="ml-auto"
                  >
                    Clear
                  </Button>
                </div>
              )}

              {/* Job List */}
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">
                  Loading jobs...
                </div>
              ) : jobs.length === 0 ? (
                <div className="p-8 text-center">
                  <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground mb-4">No jobs found</p>
                  <Button onClick={handleManualScan} variant="outline">
                    Scan for Jobs
                  </Button>
                </div>
              ) : (
                <>
                  {/* Select All for current page */}
                  {selectedJobIds.size === 0 && jobs.length > 1 && (
                    <div className="px-6 py-2 border-b">
                      <button
                        onClick={handleSelectAll}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Select all {jobs.length} items
                      </button>
                    </div>
                  )}

                  <div className="divide-y">
                    {jobs.map((job) => (
                      <div
                        key={job._id}
                        className={`px-6 py-4 cursor-pointer transition-colors hover:bg-accent/50 ${
                          job.isFavorited
                            ? "bg-blue-50/30 dark:bg-blue-950/10"
                            : ""
                        }`}
                        onClick={() => handleJobClick(job)}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedJobIds.has(job._id)}
                            onClick={(e) => handleSelectJob(job._id, e)}
                            className="mt-0.5 shrink-0"
                          />

                          {/* Job Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-sm truncate">
                                  {job.title || job.searchTitle}
                                </h3>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                                  {job.company && (
                                    <span className="flex items-center gap-1">
                                      <Building2 className="h-3 w-3 shrink-0" />
                                      <span className="truncate max-w-[140px]">{job.company}</span>
                                    </span>
                                  )}
                                  {job.location && (
                                    <span className="hidden sm:flex items-center gap-1">
                                      <MapPin className="h-3 w-3 shrink-0" />
                                      <span className="truncate max-w-[120px]">{job.location}</span>
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3 shrink-0" />
                                    {job.datePosted
                                      ? formatDistanceToNow(new Date(job.datePosted), { addSuffix: true })
                                      : formatDistanceToNow(new Date(job.scrapedAt), { addSuffix: true })}
                                  </span>
                                </div>

                                {/* Tags */}
                                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                  {job.workMode && (
                                    <Badge variant={getWorkModeBadgeVariant(job.workMode)} className="text-xs">
                                      {job.workMode}
                                    </Badge>
                                  )}
                                  {job.jobType && (
                                    <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                                      {job.jobType}
                                    </Badge>
                                  )}
                                  {job.experienceLevel && (
                                    <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                                      {job.experienceLevel}
                                    </Badge>
                                  )}
                                  {job.salaryRange && (
                                    <Badge variant="secondary" className="text-xs">
                                      <DollarSign className="h-3 w-3 mr-1" />
                                      {job.salaryRange}
                                    </Badge>
                                  )}
                                </div>

                                {/* Required Skills — hidden on mobile */}
                                {job.skills && job.skills.length > 0 && (
                                  <div className="hidden sm:flex flex-wrap items-center gap-1.5 mt-2">
                                    <span className="text-xs text-muted-foreground">Skills:</span>
                                    {job.skills.slice(0, 5).map((skill, index) => (
                                      <Badge key={index} variant="outline" className="text-xs py-0 h-5">
                                        {skill}
                                      </Badge>
                                    ))}
                                    {job.skills.length > 5 && (
                                      <span className="text-xs text-muted-foreground">
                                        +{job.skills.length - 5} more
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-0.5 shrink-0">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 sm:h-8 sm:w-8"
                                  title={job.savedJobId ? "View saved job" : "Save to Jobs"}
                                  disabled={saveJob.isPending}
                                  onClick={(e) => handleSaveToJobs(job, e)}
                                >
                                  {job.savedJobId ? (
                                    <BookmarkCheck className="h-3.5 w-3.5 text-green-500" />
                                  ) : (
                                    <Bookmark className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 sm:h-8 sm:w-8"
                                  onClick={(e) => handleToggleFavorite(job, e)}
                                >
                                  <Star className={`h-3.5 w-3.5 ${job.isFavorited ? "fill-current text-amber-500" : ""}`} />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="hidden sm:flex h-8 w-8"
                                  onClick={(e) => handleOpenExternal(job, e)}
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="hidden sm:flex h-8 w-8"
                                  onClick={(e) => handleDeleteJob(job._id, e)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="px-4 sm:px-6 py-4 border-t">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                          Showing {(currentPage - 1) * filters.itemsPerPage + 1} to{" "}
                          {Math.min(currentPage * filters.itemsPerPage, totalJobs)} of {totalJobs} jobs
                        </p>
                        <p className="text-xs text-muted-foreground sm:hidden">
                          {currentPage} / {totalPages}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updatePage(Math.max(1, currentPage - 1))
                            }
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                          </Button>

                          {/* Page Numbers — hidden on mobile */}
                          <div className="hidden sm:flex items-center gap-1">
                            {(() => {
                              const pageNumbers = [];
                              const maxVisible = 5;
                              let startPage = Math.max(
                                1,
                                currentPage - Math.floor(maxVisible / 2),
                              );
                              let endPage = Math.min(
                                totalPages,
                                startPage + maxVisible - 1,
                              );

                              // Adjust start if we're near the end
                              if (endPage - startPage < maxVisible - 1) {
                                startPage = Math.max(
                                  1,
                                  endPage - maxVisible + 1,
                                );
                              }

                              // First page + ellipsis
                              if (startPage > 1) {
                                pageNumbers.push(
                                  <Button
                                    key={1}
                                    variant={
                                      currentPage === 1 ? "default" : "outline"
                                    }
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => updatePage(1)}
                                  >
                                    1
                                  </Button>,
                                );
                                if (startPage > 2) {
                                  pageNumbers.push(
                                    <span
                                      key="ellipsis-start"
                                      className="px-1 text-muted-foreground"
                                    >
                                      ...
                                    </span>,
                                  );
                                }
                              }

                              // Visible page numbers
                              for (let i = startPage; i <= endPage; i++) {
                                pageNumbers.push(
                                  <Button
                                    key={i}
                                    variant={
                                      currentPage === i ? "default" : "outline"
                                    }
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => updatePage(i)}
                                  >
                                    {i}
                                  </Button>,
                                );
                              }

                              // Ellipsis + last page
                              if (endPage < totalPages) {
                                if (endPage < totalPages - 1) {
                                  pageNumbers.push(
                                    <span
                                      key="ellipsis-end"
                                      className="px-1 text-muted-foreground"
                                    >
                                      ...
                                    </span>,
                                  );
                                }
                                pageNumbers.push(
                                  <Button
                                    key={totalPages}
                                    variant={
                                      currentPage === totalPages
                                        ? "default"
                                        : "outline"
                                    }
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => updatePage(totalPages)}
                                  >
                                    {totalPages}
                                  </Button>,
                                );
                              }

                              return pageNumbers;
                            })()}
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updatePage(Math.min(totalPages, currentPage + 1))
                            }
                            disabled={currentPage === totalPages}
                          >
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Job Details Dialog */}
      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="!max-w-none sm:!max-w-[700px] max-h-[85vh] overflow-y-auto">
          {selectedJob && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {selectedJob.title || selectedJob.searchTitle}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {selectedJob.company && (
                  <div>
                    <Label className="text-sm font-medium">Company</Label>
                    <p className="mt-1">{selectedJob.company}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {selectedJob.location && (
                    <div>
                      <Label className="text-sm font-medium">Location</Label>
                      <p className="mt-1">{selectedJob.location}</p>
                    </div>
                  )}
                  {selectedJob.workMode && (
                    <div>
                      <Label className="text-sm font-medium">Work Mode</Label>
                      <p className="mt-1 capitalize">{selectedJob.workMode}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {selectedJob.salaryRange && (
                    <div>
                      <Label className="text-sm font-medium">
                        Salary Range
                      </Label>
                      <p className="mt-1">{selectedJob.salaryRange}</p>
                    </div>
                  )}
                  {selectedJob.experienceLevel && (
                    <div>
                      <Label className="text-sm font-medium">
                        Experience Level
                      </Label>
                      <p className="mt-1">{selectedJob.experienceLevel}</p>
                    </div>
                  )}
                </div>

                {selectedJob.jobType && (
                  <div>
                    <Label className="text-sm font-medium">Job Type</Label>
                    <p className="mt-1">{selectedJob.jobType}</p>
                  </div>
                )}

                {selectedJob.descriptionSummary && (
                  <div>
                    <Label className="text-sm font-medium">Description</Label>
                    <p className="mt-1 text-sm leading-relaxed">
                      {selectedJob.descriptionSummary}
                    </p>
                  </div>
                )}

                {selectedJob.skills && selectedJob.skills.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">
                      Required Skills
                    </Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedJob.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                <div className="flex gap-2">
                  <Button
                    onClick={(e) => handleSaveToJobs(selectedJob, e)}
                    disabled={saveJob.isPending}
                    variant={selectedJob.savedJobId ? "secondary" : "default"}
                    className="flex-1"
                  >
                    {selectedJob.savedJobId ? (
                      <>
                        <BookmarkCheck className="mr-2 h-4 w-4 text-green-500" />
                        View Saved Job
                      </>
                    ) : (
                      <>
                        <Bookmark className="mr-2 h-4 w-4" />
                        Save to Jobs
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={(e) => handleOpenExternal(selectedJob, e)}
                    variant="outline"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Posting
                  </Button>
                  <Button
                    variant={selectedJob.isFavorited ? "default" : "outline"}
                    onClick={(e) => handleToggleFavorite(selectedJob, e)}
                  >
                    <Star
                      className={`mr-2 h-4 w-4 ${selectedJob.isFavorited ? "fill-current" : ""}`}
                    />
                    {selectedJob.isFavorited ? "Favorited" : "Favorite"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to delete {selectedJobIds.size} job
              {selectedJobIds.size > 1 ? "s" : ""}. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowDeleteDialog(false);
                setPendingBulkAction(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete {selectedJobIds.size} Job
              {selectedJobIds.size > 1 ? "s" : ""}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Single Job Delete Confirmation Dialog */}
      <AlertDialog
        open={showSingleDeleteDialog}
        onOpenChange={setShowSingleDeleteDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this job? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowSingleDeleteDialog(false);
                setPendingDeleteJobId(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSingleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Scan Terminal Dialog */}
      <ScanTerminalDialog
        open={scanTerminalOpen}
        onOpenChange={setScanTerminalOpen}
        scanId={currentScanId}
        onComplete={() => {
          refetch(); // Just refresh the job list, don't close dialog
        }}
        onStartScan={(force: boolean) => {
          // Trigger the scan with force flag if needed
          triggerScan.mutate(force, {
            onSuccess: (data) => {
              console.log("Scan response:", data);
              if (data.scanId) {
                setCurrentScanId(data.scanId);
                toast.success("Scan started - monitoring progress...");
              } else {
                toast.error("Failed to get scan ID");
              }
            },
            onError: (error: any) => {
              console.error("Scan error:", error);
              toast.error(
                error?.response?.data?.message || "Failed to start scan",
              );
            },
          });
        }}
        isScanning={scanSettings?.isScanning || false}
        scanSettings={scanSettings}
      />

      {/* Scan Status Dialog */}
      <ScanStatusDialog
        open={scanStatusOpen}
        onOpenChange={setScanStatusOpen}
      />
    </div>
  );
}

export default function JobScannerPageWrapper() {
  return (
    <Suspense>
      <JobScannerPage />
    </Suspense>
  );
}
