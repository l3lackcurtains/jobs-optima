'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText, Briefcase, User, ClipboardList, Search,
  Upload, Plus, TrendingUp, Zap, ArrowRight, CheckCircle2,
  Clock, XCircle, Star, BarChart3, KeyRound,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { OutlineButton, PrimaryButton } from '@/components/custom/Button';
import { UploadResumeDialog } from '@/components/resume/UploadResumeDialog';
import { NewJobDialog } from '@/components/job/NewJobDialog';
import { CreateProfileDialog } from '@/components/profile/CreateProfileDialog';
import { useResumes } from '@/hooks/api/use-resumes';
import type { Resume } from '@/types/resume';
import { useJobs } from '@/hooks/api/use-jobs';
import { useProfiles } from '@/hooks/api/use-profiles';
import { useApplicationStats, useApplications } from '@/hooks/api/use-applications';
import { useScannedJobs } from '@/hooks/api/use-job-scanner';
import { ApplicationStatus, APPLICATION_STATUS_LABELS } from '@/types/application';
import { getAiSettings } from '@/lib/api/settings';
import { getBillingStatus } from '@/lib/api/billing';
import { formatDistanceToNow } from 'date-fns';

const STATUS_CONFIG: Record<ApplicationStatus, { color: string; icon: React.ReactNode }> = {
  [ApplicationStatus.DRAFT]:        { color: 'bg-slate-200 text-slate-700',   icon: <Clock className="h-3 w-3" /> },
  [ApplicationStatus.APPLIED]:      { color: 'bg-blue-100 text-blue-700',     icon: <ArrowRight className="h-3 w-3" /> },
  [ApplicationStatus.REVIEWING]:    { color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="h-3 w-3" /> },
  [ApplicationStatus.INTERVIEWING]: { color: 'bg-purple-100 text-purple-700', icon: <Star className="h-3 w-3" /> },
  [ApplicationStatus.OFFERED]:      { color: 'bg-green-100 text-green-700',   icon: <CheckCircle2 className="h-3 w-3" /> },
  [ApplicationStatus.REJECTED]:     { color: 'bg-red-100 text-red-700',       icon: <XCircle className="h-3 w-3" /> },
  [ApplicationStatus.ACCEPTED]:     { color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 className="h-3 w-3" /> },
  [ApplicationStatus.WITHDRAWN]:    { color: 'bg-slate-100 text-slate-600',   icon: <XCircle className="h-3 w-3" /> },
};

function StatCard({
  title, value, sub, icon, href, color, loading,
}: {
  title: string; value: string | number; sub?: string;
  icon: React.ReactNode; href: string;
  color: string; loading?: boolean;
}) {
  return (
    <Link href={href}>
      <Card className="group hover:shadow-md transition-all duration-200 border-0 shadow-sm hover:scale-[1.02] cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <span className={color}>{icon}</span>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-16 mb-1" />
          ) : (
            <div className="text-2xl sm:text-3xl font-bold">{value}</div>
          )}
          {sub && <p className="text-xs text-muted-foreground mt-1 truncate">{sub}</p>}
        </CardContent>
      </Card>
    </Link>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const firstName = session?.user?.firstName || session?.user?.name?.split(' ')[0] || 'there';

  const { resumes: resumeList, isLoading: resumesLoading, pagination: resumePagination } = useResumes(1, 100);
  const { jobs: jobList, isLoading: jobsLoading, pagination: jobPagination } = useJobs(1, 100);
  const { profiles: profileList, isLoading: profilesLoading, pagination: profilePagination } = useProfiles(1, 100);
  const { data: appStats, isLoading: appStatsLoading } = useApplicationStats();
  const { data: scannedData, isLoading: scannedLoading } = useScannedJobs({ limit: 1 });
  const { data: aiSettings } = useQuery({ queryKey: ['ai-settings'], queryFn: getAiSettings });
  const { data: billing } = useQuery({ queryKey: ['billing-status'], queryFn: getBillingStatus });
  const isPro = billing?.plan === 'pro';
  const hasCredits = (billing?.creditsRemaining ?? 0) > 0;
  const hasByoKey = !!aiSettings?.aiApiKey;
  // Show the nudge only when the user truly has no AI access path:
  // not on Pro (or out of credits) AND no BYO key configured.
  const needsAiAccess =
    aiSettings !== undefined &&
    billing !== undefined &&
    !hasByoKey &&
    !(isPro && hasCredits);

  const resumes: Resume[] = resumeList ?? [];
  const totalResumes = resumePagination?.total ?? resumes.length;
  const totalJobs = jobPagination?.total ?? (jobList?.length ?? 0);
  const totalProfiles = profilePagination?.total ?? (profileList?.length ?? 0);
  const totalScanned = scannedData?.total ?? 0;

  const optimizedResumes = resumes.filter(r => r.isOptimized);
  const resumesWithScores = resumes.filter(r => r.finalATSScore && r.initialATSScore);
  const avgImprovement = resumesWithScores.length > 0
    ? Math.round(resumesWithScores.reduce((sum, r) => sum + (r.finalATSScore! - r.initialATSScore!), 0) / resumesWithScores.length)
    : null;
  // Sort by lift descending so the card highlights wins, not whichever resume
  // was scored most recently (which may include misleading regressions).
  const resumesByLift = [...resumesWithScores].sort(
    (a, b) =>
      (b.finalATSScore! - b.initialATSScore!) -
      (a.finalATSScore! - a.initialATSScore!),
  );

  const activeStatuses: ApplicationStatus[] = [
    ApplicationStatus.APPLIED,
    ApplicationStatus.REVIEWING,
    ApplicationStatus.INTERVIEWING,
    ApplicationStatus.OFFERED,
    ApplicationStatus.ACCEPTED,
  ];

  const pipelineStatuses = Object.values(ApplicationStatus).filter(s =>
    appStats?.byStatus?.[s] && appStats.byStatus[s] > 0
  );

  // Funnel visualization renders these stages in order (forward flow only).
  // Rejected/Withdrawn are shown as a separate compact row beneath the funnel.
  const funnelStages: ApplicationStatus[] = [
    ApplicationStatus.DRAFT,
    ApplicationStatus.APPLIED,
    ApplicationStatus.REVIEWING,
    ApplicationStatus.INTERVIEWING,
    ApplicationStatus.OFFERED,
    ApplicationStatus.ACCEPTED,
  ];
  const funnelMax = Math.max(
    1,
    ...funnelStages.map(s => appStats?.byStatus?.[s] ?? 0),
  );
  const rejectedCount = appStats?.byStatus?.[ApplicationStatus.REJECTED] ?? 0;
  const withdrawnCount = appStats?.byStatus?.[ApplicationStatus.WITHDRAWN] ?? 0;

  const recentActivity = appStats?.recentActivity?.slice(0, 5) ?? [];
  const recentResumes = resumes.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {firstName}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's your job search overview.
        </p>
      </div>

      {needsAiAccess && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-amber-100 p-2 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                <KeyRound className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium">
                  {isPro && !hasCredits
                    ? "You're out of credits"
                    : "Enable AI features"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {isPro && !hasCredits
                    ? `Add your own Gemini/OpenAI/Anthropic key to keep going, or wait until ${
                        billing?.creditsResetAt
                          ? new Date(billing.creditsResetAt).toLocaleDateString()
                          : 'your next billing date'
                      }.`
                    : billing?.billingEnabled
                      ? 'Bring your own AI key for free, or upgrade to Pro for managed AI ($5/mo).'
                      : 'Add your own Gemini, OpenAI, or Anthropic API key to enable AI features.'}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0 sm:flex-row">
              <Link href="/settings">
                <PrimaryButton className="w-full gap-2 sm:w-auto">
                  Add API key
                  <ArrowRight className="h-4 w-4" />
                </PrimaryButton>
              </Link>
              {!isPro && billing?.billingEnabled && (
                <Link href="/pricing">
                  <OutlineButton className="w-full gap-2 sm:w-auto">
                    Upgrade to Pro
                  </OutlineButton>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stat Cards — auto-fit packs cards based on available width so 5 items
          never produce uneven trailing rows on tablet/medium screens. */}
      <div className="grid gap-3 sm:gap-4 grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
        <StatCard
          title="Profiles"
          value={totalProfiles}
          sub="Professional profiles"
          icon={<User className="h-4 w-4" />}
          href="/profiles"
          color="text-blue-600 dark:text-blue-400"
          loading={profilesLoading}
        />
        <StatCard
          title="Resumes"
          value={totalResumes}
          sub={optimizedResumes.length > 0 ? `${optimizedResumes.length} optimized` : 'No optimizations yet'}
          icon={<FileText className="h-4 w-4" />}
          href="/resumes"
          color="text-green-600 dark:text-green-400"
          loading={resumesLoading}
        />
        <StatCard
          title="Jobs Tracked"
          value={totalJobs}
          sub="Added to pipeline"
          icon={<Briefcase className="h-4 w-4" />}
          href="/jobs"
          color="text-purple-600 dark:text-purple-400"
          loading={jobsLoading}
        />
        <StatCard
          title="Applications"
          value={appStats?.total ?? 0}
          // Suppress "0% success rate" copy until at least one offer/accept lands.
          // Until then, show "Tracked in pipeline" — neutral, not negative-coded.
          sub={
            appStats && appStats.successRate > 0
              ? `${Math.round(appStats.successRate)}% success rate`
              : "Tracked in pipeline"
          }
          icon={<ClipboardList className="h-4 w-4" />}
          href="/applications"
          color="text-orange-600 dark:text-orange-400"
          loading={appStatsLoading}
        />
        <StatCard
          title="Scanned Jobs"
          value={totalScanned}
          sub="From job scanner"
          icon={<Search className="h-4 w-4" />}
          href="/job-scanner"
          color="text-cyan-600 dark:text-cyan-400"
          loading={scannedLoading}
        />
      </div>

      <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Application Pipeline */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Application Pipeline</CardTitle>
              <Link href="/applications">
                <span className="text-xs text-muted-foreground hover:text-primary transition-colors">
                  View all →
                </span>
              </Link>
            </div>
            <CardDescription>
              {!appStats?.total
                ? "Track your job applications"
                : appStats.successRate > 0
                  ? `${appStats.total} total · ${Math.round(appStats.successRate)}% success rate`
                  : `${appStats.total} in pipeline`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {appStatsLoading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : pipelineStatuses.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                <ClipboardList className="mx-auto h-8 w-8 mb-2 opacity-40" />
                No applications yet.
                <div className="mt-3">
                  <Link href="/jobs">
                    <OutlineButton className="text-xs h-7">Add your first job</OutlineButton>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Funnel: each stage's bar width is proportional to the
                    biggest stage count, so the visual narrows down the
                    pipeline naturally even when stages are zero. */}
                <div className="space-y-1.5">
                  {funnelStages.map(status => {
                    const count = appStats?.byStatus?.[status] ?? 0;
                    const pct = (count / funnelMax) * 100;
                    const cfg = STATUS_CONFIG[status];
                    return (
                      <Link
                        key={status}
                        href={`/applications?status=${status}`}
                        className="block group"
                      >
                        <div className="flex items-center gap-2 sm:gap-3 text-xs">
                          <div className="w-20 sm:w-28 shrink-0 flex items-center gap-1.5 text-muted-foreground group-hover:text-foreground transition-colors">
                            {cfg.icon}
                            <span className="truncate">
                              {APPLICATION_STATUS_LABELS[status]}
                            </span>
                          </div>
                          <div className="flex-1 h-7 bg-muted/40 rounded overflow-hidden relative">
                            <div
                              className={`h-full rounded transition-all duration-500 ${cfg.color}`}
                              style={{
                                width: count > 0 ? `${Math.max(pct, 4)}%` : "0%",
                              }}
                            />
                          </div>
                          <span className="text-sm font-semibold w-8 text-right tabular-nums">
                            {count}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Rejected / withdrawn — out-of-funnel summary */}
                {(rejectedCount > 0 || withdrawnCount > 0) && (
                  <div className="flex flex-wrap gap-3 pt-2 border-t text-xs text-muted-foreground">
                    {rejectedCount > 0 && (
                      <Link
                        href={`/applications?status=${ApplicationStatus.REJECTED}`}
                        className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                      >
                        <XCircle className="h-3 w-3 text-red-500" />
                        Rejected
                        <span className="font-medium">{rejectedCount}</span>
                      </Link>
                    )}
                    {withdrawnCount > 0 && (
                      <Link
                        href={`/applications?status=${ApplicationStatus.WITHDRAWN}`}
                        className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                      >
                        <XCircle className="h-3 w-3 text-slate-500" />
                        Withdrawn
                        <span className="font-medium">{withdrawnCount}</span>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ATS Performance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              ATS Performance
            </CardTitle>
            <CardDescription>Score improvements from AI optimization</CardDescription>
          </CardHeader>
          <CardContent>
            {resumesLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : resumesWithScores.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                <Zap className="mx-auto h-8 w-8 mb-2 opacity-40" />
                No optimized resumes yet.
                <div className="mt-3">
                  <Link href="/resumes">
                    <OutlineButton className="text-xs h-7">Optimize a resume</OutlineButton>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <div
                    className={`text-4xl font-bold ${
                      (avgImprovement ?? 0) >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {(avgImprovement ?? 0) >= 0 ? "+" : ""}
                    {avgImprovement}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">avg ATS score lift</div>
                </div>
                <div className="space-y-2 mt-2">
                  {resumesByLift.slice(0, 3).map(r => {
                    const lift = r.finalATSScore! - r.initialATSScore!;
                    const liftColor =
                      lift > 0
                        ? "text-green-600"
                        : lift < 0
                          ? "text-red-600"
                          : "text-muted-foreground";
                    return (
                      <Link key={r._id} href={`/resumes/${r._id}`}>
                        <div className="flex items-center justify-between text-xs py-1.5 px-2 rounded hover:bg-muted/50 transition-colors cursor-pointer">
                          <span className="truncate text-muted-foreground max-w-[120px]">{r.title}</span>
                          <span className={`font-medium shrink-0 ${liftColor}`}>
                            {r.initialATSScore} → {r.finalATSScore}
                            <span className="ml-1 opacity-70">
                              ({lift >= 0 ? "+" : ""}
                              {lift})
                            </span>
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                  {resumesWithScores.length > 3 && (
                    <p className="text-xs text-center text-muted-foreground pt-1">
                      +{resumesWithScores.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <Link href="/applications">
                <span className="text-xs text-muted-foreground hover:text-primary transition-colors">
                  View all →
                </span>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {appStatsLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                No activity yet. Apply to a job to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 rounded-full bg-primary/60 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight">{item.event}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                      {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions + Recent Resumes */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <CreateProfileDialog>
                <OutlineButton className="w-full justify-start text-xs h-9 gap-2">
                  <User className="h-3.5 w-3.5 shrink-0" /> New Profile
                </OutlineButton>
              </CreateProfileDialog>
              <UploadResumeDialog
                trigger={
                  <OutlineButton className="w-full justify-start text-xs h-9 gap-2">
                    <Upload className="h-3.5 w-3.5 shrink-0" /> Upload Resume
                  </OutlineButton>
                }
              />
              <NewJobDialog
                trigger={
                  <OutlineButton className="w-full justify-start text-xs h-9 gap-2">
                    <Plus className="h-3.5 w-3.5 shrink-0" /> Add Job
                  </OutlineButton>
                }
              />
              <Link href="/job-scanner">
                <OutlineButton className="w-full justify-start text-xs h-9 gap-2">
                  <Search className="h-3.5 w-3.5 shrink-0" /> Job Scanner
                </OutlineButton>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Resumes</CardTitle>
                <Link href="/resumes">
                  <span className="text-xs text-muted-foreground hover:text-primary transition-colors">
                    View all →
                  </span>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {resumesLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
                </div>
              ) : recentResumes.length === 0 ? (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  <UploadResumeDialog
                    trigger={
                      <PrimaryButton className="text-xs h-8 mt-2">
                        <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload your first resume
                      </PrimaryButton>
                    }
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  {recentResumes.map(resume => (
                    <Link key={resume._id} href={`/resumes/${resume._id}`}>
                      <div className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50 transition-colors">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-sm truncate flex-1">{resume.title}</span>
                        {resume.isOptimized && (
                          <TrendingUp className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        )}
                        {resume.finalATSScore && (
                          <span className="text-xs font-medium text-muted-foreground shrink-0">
                            {resume.finalATSScore}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
