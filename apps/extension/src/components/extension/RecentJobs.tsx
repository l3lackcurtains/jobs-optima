import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Briefcase, RefreshCw, Trash2, MapPin, DollarSign } from 'lucide-react';
import { SimplePagination } from './SimplePagination';
import { STORAGE_KEYS, getWebUrl } from '@/lib/constants';
import { makeAuthenticatedRequest } from '@/lib/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface RecentJobsProps {
  refreshTrigger?: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function RecentJobs({ refreshTrigger }: RecentJobsProps) {
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [isRefreshingJobs, setIsRefreshingJobs] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const itemsPerPage = 3; // Show 3 jobs per page in extension

  useEffect(() => {
    loadSavedJobs(currentPage);
  }, [refreshTrigger, currentPage]);

  const loadSavedJobs = async (page?: number) => {
    try {
      // Use provided page or current page
      const pageToLoad = page || currentPage;
      
      // Use pagination params
      const params = new URLSearchParams({
        page: pageToLoad.toString(),
        limit: itemsPerPage.toString()
      });

      const response = await makeAuthenticatedRequest(`/jobs?${params}`);

      if (response.ok) {
        const result = await response.json();
        // Handle paginated response
        setSavedJobs(result.data || []);
        setPagination(result.pagination || null);
      }
    } catch (err) {
      console.error('Error loading saved jobs:', err);
    }
  };

  const handleRefreshJobs = async () => {
    setIsRefreshingJobs(true);
    // Reset to first page and load immediately with page 1
    setCurrentPage(1);
    await loadSavedJobs(1);
    setIsRefreshingJobs(false);
  };

  const openJobInWebApp = async (jobId: string) => {
    const webUrl = await getWebUrl();
    chrome.tabs.create({ url: `${webUrl}/jobs/${jobId}` });
  };

  const handleDeleteClick = (job: any) => {
    setJobToDelete(job);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!jobToDelete) return;

    setIsDeleting(true);
    try {
      const response = await makeAuthenticatedRequest(`/jobs/${jobToDelete._id || jobToDelete.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Remove the deleted job from the list
        setSavedJobs(prev => prev.filter(job => (job._id || job.id) !== (jobToDelete._id || jobToDelete.id)));
        // If we deleted the last item on a page and it's not the first page, go back one page
        if (savedJobs.length === 1 && currentPage > 1) {
          const newPage = currentPage - 1;
          setCurrentPage(newPage);
          await loadSavedJobs(newPage);
        } else {
          // Otherwise reload the current page
          await loadSavedJobs(currentPage);
        }
      } else {
        throw new Error('Failed to delete job');
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      // Could add toast notification here if available
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setJobToDelete(null);
    }
  };

  const formatSalary = (job: any) => {
    if (job.salaryMin || job.salaryMax) {
      const formatAmount = (amount: number) => {
        if (amount >= 1000) {
          return `$${(amount / 1000).toFixed(0)}K`;
        }
        return `$${amount.toLocaleString()}`;
      };
      
      const min = job.salaryMin ? formatAmount(job.salaryMin) : '';
      const max = job.salaryMax ? formatAmount(job.salaryMax) : '';
      const period = job.salaryPeriod ? `/${job.salaryPeriod}` : '';
      
      if (min && max) {
        return `${min}-${max}${period}`;
      } else if (min || max) {
        return `${min || max}${period}`;
      }
    }
    return null;
  };

  if (savedJobs.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Recent Jobs</CardTitle>
            <CardDescription>Your recently saved job postings</CardDescription>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleRefreshJobs}
            disabled={isRefreshingJobs}
            className="h-8 w-8"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshingJobs ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {savedJobs.map((job) => {
            const salary = formatSalary(job);
            
            return (
              <div
                key={job._id || job.id}
                className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="space-y-2">
                  {/* Header with title and delete button */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {job.title || 'Untitled Job'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {job.company || 'Unknown Company'}
                      </p>
                      {job.location && (
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{job.location}</span>
                        </div>
                      )}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(job);
                      }}
                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  
                  {/* Skills */}
                  {(job.mustHaveSkills?.length > 0 || job.niceToHaveSkills?.length > 0) && (
                    <div className="space-y-1">
                      {job.mustHaveSkills?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs font-medium text-red-600 dark:text-red-400">Must have:</span>
                          {job.mustHaveSkills.slice(0, 3).map((skill: string, idx: number) => (
                            <span key={idx} className="text-xs px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                              {skill}
                            </span>
                          ))}
                          {job.mustHaveSkills.length > 3 && (
                            <span className="text-xs text-muted-foreground">+{job.mustHaveSkills.length - 3}</span>
                          )}
                        </div>
                      )}
                      {job.niceToHaveSkills?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Nice to have:</span>
                          {job.niceToHaveSkills.slice(0, 3).map((skill: string, idx: number) => (
                            <span key={idx} className="text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                              {skill}
                            </span>
                          ))}
                          {job.niceToHaveSkills.length > 3 && (
                            <span className="text-xs text-muted-foreground">+{job.niceToHaveSkills.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Metadata */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    {job.workMode && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        {job.workMode}
                      </span>
                    )}
                    
                    {job.category && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary">
                        <Briefcase className="w-3 h-3" />
                        {job.category}
                      </span>
                    )}
                    
                    {salary && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                        <DollarSign className="w-3 h-3" />
                        {salary}
                      </span>
                    )}
                    
                    {job.applicationStatus && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs">
                        {job.applicationStatus}
                      </span>
                    )}
                  </div>
                  
                  {/* External Link */}
                  {job.url && (
                    <div className="flex items-center gap-2">
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View original posting
                      </a>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openJobInWebApp(job._id || job.id)}
                        className="ml-auto h-7 px-2 text-xs"
                      >
                        Open in app
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-4 pt-4 border-t">
            <SimplePagination
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              onPageChange={setCurrentPage}
              isLoading={isRefreshingJobs}
            />
          </div>
        )}
      </CardContent>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{jobToDelete?.title}" at {jobToDelete?.company}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setJobToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}