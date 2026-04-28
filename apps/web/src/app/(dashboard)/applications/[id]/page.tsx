"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Building,
  FileText,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Save,
  X,
  Briefcase,
  ClipboardList,
  MapPin,
  DollarSign,
  Users,
  TrendingUp,
  Mail,
  Phone,
  Globe,
  Github,
  Linkedin,
  Trash2,
  ExternalLink,
  Sparkles,
  Copy,
  MessageSquare,
  HelpCircle,
  Eye,
  Download,
} from "lucide-react";
import { PageHeader } from "@/components/custom/page-header";
import {
  PrimaryButton,
  OutlineButton,
  IconButton,
  GhostButton,
  SparkButton,
  DestructiveButton,
  PreviewButton,
} from "@/components/custom/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CustomTab, TabItem } from "@/components/custom/Tab";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ApplicationStatus,
  APPLICATION_STATUS_COLORS,
  APPLICATION_STATUS_LABELS,
} from "@/types/application";
import { useApplication, useApplications, downloadCoverLetterPdf } from "@/hooks/api/use-applications";
import { useResumes } from "@/hooks/api/use-resumes";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { AICoverLetterDrawer } from "@/components/application/AICoverLetterDrawer";
import { AIQnADrawer } from "@/components/application/AIQnADrawer";
import { AIMultiQnADrawer } from "@/components/application/AIMultiQnADrawer";
import { AIOptimizeQnADrawer } from "@/components/application/AIOptimizeQnADrawer";
import { CleanMarkdownEditor } from "@/components/ui/clean-markdown-editor";
import { MarkdownViewer } from "@/components/ui/markdown-viewer";
import { Input } from "@/components/ui/input";

interface ApplicationPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ApplicationPage(props: ApplicationPageProps) {
  const params = use(props.params);
  const [id, setId] = useState<string>(params.id);
  const [isEditingCover, setIsEditingCover] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState("");
  const [editedCoverLetter, setEditedCoverLetter] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus>();
  const [editingQAIndex, setEditingQAIndex] = useState<number | null>(null);
  const [editedQAQuestion, setEditedQAQuestion] = useState("");
  const [editedQAAnswer, setEditedQAAnswer] = useState("");
  const router = useRouter();

  const { data: application, isLoading, refetch } = useApplication(id);
  const { updateApplication, updateApplicationStatus, deleteApplication } =
    useApplications();
  const { exportPDF } = useResumes();



  useEffect(() => {
    if (application) {
      setEditedNotes(application.notes || "");
      setEditedCoverLetter(application.coverLetter || "");
      setSelectedStatus(application.status);
    }
  }, [application]);

  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    if (!application) return;

    setSelectedStatus(newStatus);
    try {
      await updateApplicationStatus.mutateAsync({
        id: application._id,
        status: newStatus,
        notes: `Status changed to ${APPLICATION_STATUS_LABELS[newStatus]}`,
      });
      await refetch();
      toast.success("Status updated successfully");
    } catch (error) {
      console.error("Failed to update status:", error);
      setSelectedStatus(application.status);
    }
  };

  const handleSaveCoverLetter = async () => {
    if (!application) return;

    try {
      await updateApplication.mutateAsync({
        id: application._id,
        data: {
          coverLetter: editedCoverLetter,
        },
      });
      await refetch();
      setIsEditingCover(false);
      toast.success("Cover letter updated");
    } catch (error) {
      console.error("Failed to update cover letter:", error);
    }
  };

  const handleClearCoverLetter = async () => {
    if (!application) return;

    try {
      await updateApplication.mutateAsync({
        id: application._id,
        data: {
          coverLetter: "",
        },
      });
      setEditedCoverLetter("");
      await refetch();
      toast.success("Cover letter cleared");
    } catch (error) {
      console.error("Failed to clear cover letter:", error);
      toast.error("Failed to clear cover letter");
    }
  };

  const handleCopyCoverLetter = async () => {
    if (!application?.coverLetter) return;

    // Convert markdown to plain text
    const plainText = application.coverLetter
      // Remove bold markdown
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/__([^_]+)__/g, "$1")
      // Remove italic markdown
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/_([^_]+)_/g, "$1")
      // Remove headers
      .replace(/^#{1,6}\s+(.+)$/gm, "$1")
      // Remove links but keep text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Remove code blocks
      .replace(/```[^`]*```/g, "")
      .replace(/`([^`]+)`/g, "$1")
      // Remove horizontal rules
      .replace(/^---+$/gm, "")
      .replace(/^\*\*\*+$/gm, "")
      // Remove blockquotes
      .replace(/^>\s+/gm, "")
      // Clean up bullet points
      .replace(/^[\*\-\+]\s+/gm, "• ")
      // Clean up numbered lists
      .replace(/^\d+\.\s+/gm, (match, offset, string) => {
        const lines = string.substring(0, offset).split("\n");
        const currentLine = lines.length;
        let listNumber = 1;
        for (let i = currentLine - 2; i >= 0; i--) {
          if (/^\d+\.\s+/.test(lines[i])) {
            listNumber++;
          } else {
            break;
          }
        }
        return `${listNumber}. `;
      })
      // Remove extra blank lines
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    try {
      await navigator.clipboard.writeText(plainText);
      toast.success("Cover letter copied as plain text");
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy cover letter");
    }
  };

  const handleSaveNotes = async () => {
    if (!application) return;

    try {
      await updateApplication.mutateAsync({
        id: application._id,
        data: {
          notes: editedNotes,
        },
      });
      await refetch();
      setIsEditingNotes(false);
      toast.success("Notes updated");
    } catch (error) {
      console.error("Failed to update notes:", error);
    }
  };

  const handleDelete = async () => {
    if (!application) return;

    try {
      await deleteApplication.mutateAsync(application._id);
      toast.success("Application deleted");
      router.push("/applications");
    } catch (error) {
      console.error("Failed to delete application:", error);
    }
  };

  const handleEditQA = (index: number) => {
    if (application?.questionsAnswers?.[index]) {
      setEditingQAIndex(index);
      setEditedQAQuestion(application.questionsAnswers[index].question);
      setEditedQAAnswer(application.questionsAnswers[index].answer);
    }
  };

  const handleSaveQA = async () => {
    if (!application || editingQAIndex === null) return;

    try {
      const updatedQAs =
        application.questionsAnswers?.map((qa, index) =>
          index === editingQAIndex
            ? {
                question: editedQAQuestion,
                answer: editedQAAnswer,
                createdAt: qa.createdAt,
              }
            : {
                question: qa.question,
                answer: qa.answer,
                createdAt: qa.createdAt,
              }
        ) || [];

      await updateApplication.mutateAsync({
        id: application._id,
        data: {
          questionsAnswers: updatedQAs,
        },
      });
      await refetch();
      setEditingQAIndex(null);
      setEditedQAQuestion("");
      setEditedQAAnswer("");
      toast.success("Q&A updated");
    } catch (error) {
      console.error("Failed to update Q&A:", error);
      toast.error("Failed to update Q&A");
    }
  };

  const handleCancelEditQA = () => {
    setEditingQAIndex(null);
    setEditedQAQuestion("");
    setEditedQAAnswer("");
  };

  const handleDownloadResume = async () => {
    if (!resume) {
      toast.error("No resume found for this application");
      return;
    }
    
    try {
      await exportPDF(resume._id);
      toast.success("Resume downloaded successfully");
    } catch (error) {
      console.error("Failed to download resume:", error);
      toast.error("Failed to download resume PDF");
    }
  };

  const getStatusIcon = (status: ApplicationStatus) => {
    switch (status) {
      case ApplicationStatus.DRAFT:
        return <Clock className="w-4 h-4" />;
      case ApplicationStatus.APPLIED:
        return <Target className="w-4 h-4" />;
      case ApplicationStatus.REVIEWING:
      case ApplicationStatus.INTERVIEWING:
        return <AlertCircle className="w-4 h-4" />;
      case ApplicationStatus.OFFERED:
      case ApplicationStatus.ACCEPTED:
        return <CheckCircle className="w-4 h-4" />;
      case ApplicationStatus.REJECTED:
      case ApplicationStatus.WITHDRAWN:
        return <XCircle className="w-4 h-4" />;
      default:
        return <ClipboardList className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: ApplicationStatus) => {
    const colors = {
      [ApplicationStatus.DRAFT]: "text-gray-600 bg-gray-100",
      [ApplicationStatus.APPLIED]: "text-blue-600 bg-blue-100",
      [ApplicationStatus.REVIEWING]: "text-yellow-600 bg-yellow-100",
      [ApplicationStatus.INTERVIEWING]: "text-purple-600 bg-purple-100",
      [ApplicationStatus.OFFERED]: "text-green-600 bg-green-100",
      [ApplicationStatus.ACCEPTED]: "text-emerald-600 bg-emerald-100",
      [ApplicationStatus.REJECTED]: "text-red-600 bg-red-100",
      [ApplicationStatus.WITHDRAWN]: "text-slate-600 bg-slate-100",
    };
    return colors[status] || "text-gray-600 bg-gray-100";
  };

  if (isLoading || !application) {
    return (
      <div className="container mx-auto py-8 space-y-8">
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-96" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  const job = application.job;
  const resume = application.optimizedResume;

  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title={job?.title || "Application"}
        description={job?.company || ""}
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Applications", href: "/applications" },
          { label: job?.title || "Application" },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Main Content with Tabs */}
        <div className="lg:col-span-2">
          <CustomTab
            variant="grid"
            tabs={[
              {
                value: "overview",
                label: "Overview",
                content: (
                  <div className="space-y-6">
                    {/* Application Summary Cards */}
                    <div className="space-y-4">
                      {/* Position Details Card */}
                      <Card className="border-l-4 border-l-orange-500">
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Briefcase className="w-5 h-5 text-orange-600" />
                              Position Details
                            </CardTitle>
                            {job?.url && (
                              <OutlineButton
                                size="sm"
                                onClick={() => window.open(job.url, "_blank")}
                              >
                                <ExternalLink className="w-4 h-4 mr-1" />
                                View Job
                              </OutlineButton>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {/* Company and Position */}
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Briefcase className="w-6 h-6 text-orange-600" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg">{job?.title}</h3>
                                <p className="text-muted-foreground">{job?.company}</p>
                                <div className="flex items-center gap-4 mt-2 text-sm">
                                  {job?.location && (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {job.location}
                                    </div>
                                  )}
                                  {job?.category && (
                                    <Badge variant="outline" className="text-xs">
                                      {job.category}
                                    </Badge>
                                  )}
                                  {job?.workMode && (
                                    <Badge variant="secondary">
                                      {job.workMode}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Key Details Grid */}
                            <div className="grid grid-cols-2 gap-4 pt-2">
                              {job?.salaryMin && (
                                <div className="p-3 bg-muted/50 rounded-lg">
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                    <DollarSign className="w-3 h-3" />
                                    Salary Range
                                  </div>
                                  <p className="font-semibold">
                                    ${job.salaryMin.toLocaleString()}
                                    {job.salaryMax && ` - $${job.salaryMax.toLocaleString()}`}
                                  </p>
                                </div>
                              )}
                              <div className="p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                  <Clock className="w-3 h-3" />
                                  Applied Date
                                </div>
                                <p className="font-semibold">
                                  {application.applicationDate
                                    ? format(new Date(application.applicationDate), "MMM d, yyyy")
                                    : "Not applied yet"}
                                </p>
                              </div>
                            </div>

                            {/* Required Skills */}
                            {job?.mustHaveSkills && job.mustHaveSkills.length > 0 && (
                              <div className="pt-2">
                                <p className="text-sm font-medium mb-2">Required Skills</p>
                                <div className="flex flex-wrap gap-2">
                                  {job.mustHaveSkills.slice(0, 10).map((skill, index) => (
                                    <Badge
                                      key={index}
                                      variant="outline"
                                      className="bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800"
                                    >
                                      {skill}
                                    </Badge>
                                  ))}
                                  {job.mustHaveSkills.length > 10 && (
                                    <Badge variant="secondary">
                                      +{job.mustHaveSkills.length - 10} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Resume Information Card */}
                      {resume && (
                        <Card className="border-l-4 border-l-blue-500">
                          <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-600" />
                                Resume Details
                              </CardTitle>
                              <OutlineButton
                                size="sm"
                                onClick={handleDownloadResume}
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Download PDF
                              </OutlineButton>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {/* Resume Info */}
                              <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <FileText className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-semibold">{resume.title}</h3>
                                  <p className="text-sm text-muted-foreground">{resume.category}</p>
                                  <div className="flex items-center gap-2 mt-2">
                                    {resume.isOptimized && (
                                      <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
                                        <Sparkles className="w-3 h-3 mr-1" />
                                        Optimized
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Resume Stats */}
                              <div className="grid grid-cols-3 gap-3">
                                <div className="text-center p-3 bg-muted/50 rounded-lg">
                                  <p className="text-2xl font-bold text-green-600">
                                    {resume.finalATSScore || resume.initialATSScore || 0}%
                                  </p>
                                  <p className="text-xs text-muted-foreground">ATS Score</p>
                                </div>
                                <div className="text-center p-3 bg-muted/50 rounded-lg">
                                  <p className="text-2xl font-bold text-purple-600">
                                    {resume.finalKeywordScore || resume.initialKeywordScore || 0}%
                                  </p>
                                  <p className="text-xs text-muted-foreground">Keyword Match</p>
                                </div>
                                <div className="text-center p-3 bg-muted/50 rounded-lg">
                                  <p className="text-2xl font-bold text-orange-600">
                                    {resume.matchedKeywords?.length || 0}/{(resume.matchedKeywords?.length || 0) + (resume.unmatchedKeywords?.length || 0)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">Keywords</p>
                                </div>
                              </div>

                              {/* Technical Skills */}
                              {resume.skills?.technicalSkills && resume.skills.technicalSkills.length > 0 && (
                                <div>
                                  <p className="text-sm font-medium mb-2">Key Technical Skills</p>
                                  <div className="flex flex-wrap gap-2">
                                    {resume.skills.technicalSkills.slice(0, 10).map((skill, index) => (
                                      <Badge
                                        key={index}
                                        variant="outline"
                                        className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                                      >
                                        {skill}
                                      </Badge>
                                    ))}
                                    {resume.skills.technicalSkills.length > 10 && (
                                      <Badge variant="secondary">
                                        +{resume.skills.technicalSkills.length - 10} more
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Application Progress Card */}
                      <Card className="border-l-4 border-l-green-500">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                            Application Progress
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-muted/50 rounded-lg">
                              <div className="text-3xl font-bold mb-1">
                                {application.coverLetter ? (
                                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto" />
                                ) : (
                                  <div className="w-8 h-8 border-2 border-dashed border-muted-foreground rounded-full mx-auto" />
                                )}
                              </div>
                              <p className="text-sm font-medium">Cover Letter</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {application.coverLetter ? "Complete" : "Not added"}
                              </p>
                            </div>
                            <div className="text-center p-4 bg-muted/50 rounded-lg">
                              <div className="text-3xl font-bold text-blue-600 mb-1">
                                {application.questionsAnswers?.length || 0}
                              </div>
                              <p className="text-sm font-medium">Q&A Prepared</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {application.questionsAnswers?.length 
                                  ? "Questions ready" 
                                  : "No questions yet"}
                              </p>
                            </div>
                            <div className="text-center p-4 bg-muted/50 rounded-lg">
                              <div className="text-3xl font-bold text-purple-600 mb-1">
                                {application.timeline?.length || 0}
                              </div>
                              <p className="text-sm font-medium">Timeline Events</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {application.timeline?.length
                                  ? "Events tracked"
                                  : "No events yet"}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>Notes</CardTitle>
                          {!isEditingNotes && (
                            <IconButton
                              size="sm"
                              onClick={() => setIsEditingNotes(true)}
                            >
                              <Edit className="w-4 h-4" />
                            </IconButton>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {isEditingNotes ? (
                          <div className="space-y-4">
                            <Textarea
                              value={editedNotes}
                              onChange={(e) => setEditedNotes(e.target.value)}
                              className="min-h-[150px]"
                              placeholder="Add notes about this application..."
                            />
                            <div className="flex gap-2">
                              <PrimaryButton
                                size="sm"
                                onClick={handleSaveNotes}
                              >
                                <Save className="w-4 h-4 mr-2" />
                                Save
                              </PrimaryButton>
                              <OutlineButton
                                size="sm"
                                onClick={() => {
                                  setEditedNotes(application.notes || "");
                                  setIsEditingNotes(false);
                                }}
                              >
                                Cancel
                              </OutlineButton>
                            </div>
                          </div>
                        ) : (
                          <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                            {application.notes ||
                              "No notes yet. Click edit to add notes."}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ),
              },
              {
                value: "cover-letter",
                label: "Cover Letter",
                content: (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>Cover Letter</CardTitle>
                          <div className="flex gap-2">
                            <AICoverLetterDrawer
                              resume={resume}
                              job={job}
                              applicationId={application._id}
                              existingCoverLetter={application.coverLetter}
                              trigger={
                                <SparkButton size="sm">
                                  {application.coverLetter
                                    ? "Optimize with AI"
                                    : "Generate with AI"}
                                </SparkButton>
                              }
                              onApply={(letter) => {
                                setEditedCoverLetter(letter);
                                setIsEditingCover(true);
                                refetch(); // Refresh the application data
                              }}
                            />
                            {!isEditingCover && (
                              <>
                                {application.coverLetter && (
                                  <>
                                    <IconButton
                                      size="sm"
                                      onClick={handleCopyCoverLetter}
                                      title="Copy as plain text"
                                    >
                                      <Copy className="w-4 h-4" />
                                    </IconButton>
                                    <IconButton
                                      size="sm"
                                      onClick={() => downloadCoverLetterPdf(application._id)}
                                      title="Download as PDF"
                                    >
                                      <Download className="w-4 h-4" />
                                    </IconButton>
                                  </>
                                )}
                                <IconButton
                                  size="sm"
                                  onClick={() => setIsEditingCover(true)}
                                >
                                  <Edit className="w-4 h-4" />
                                </IconButton>
                                {application.coverLetter && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DestructiveButton size="sm">
                                        <Trash2 className="w-4 h-4" />
                                      </DestructiveButton>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          Clear Cover Letter
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to clear the
                                          cover letter? This action cannot be
                                          undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={handleClearCoverLetter}
                                        >
                                          Clear
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {isEditingCover ? (
                          <div className="space-y-4">
                            <CleanMarkdownEditor
                              value={editedCoverLetter}
                              onChange={(value) => setEditedCoverLetter(value)}
                              height={500}
                              placeholder="Write your cover letter here..."
                            />
                            <div className="flex gap-2">
                              <PrimaryButton
                                size="sm"
                                onClick={handleSaveCoverLetter}
                              >
                                <Save className="w-4 h-4 mr-2" />
                                Save Cover Letter
                              </PrimaryButton>
                              <OutlineButton
                                size="sm"
                                onClick={() => {
                                  setEditedCoverLetter(
                                    application.coverLetter || ""
                                  );
                                  setIsEditingCover(false);
                                }}
                              >
                                Cancel
                              </OutlineButton>
                            </div>
                          </div>
                        ) : (
                          <div className="p-6 bg-muted/30 rounded-lg">
                            {application.coverLetter ? (
                              <MarkdownViewer
                                content={application.coverLetter}
                                className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-p:mb-4 prose-strong:text-foreground prose-li:my-1"
                              />
                            ) : (
                              <div className="text-center py-12">
                                <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                                <p className="text-muted-foreground mb-4">
                                  No cover letter yet
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Click edit to write one manually or use AI to
                                  generate a professional cover letter
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ),
              },
              {
                value: "qna",
                label: "Questions and Answers",
                content: (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>Interview Q&A</CardTitle>
                            <CardDescription className="mt-1">
                              Prepare answers for interview questions with AI
                              assistance
                            </CardDescription>
                          </div>
                          <AIMultiQnADrawer
                            resume={resume}
                            job={job}
                            applicationId={application._id}
                            existingQAs={application.questionsAnswers}
                            trigger={
                              <SparkButton size="sm">
                                Generate Answers
                              </SparkButton>
                            }
                            onSave={() => refetch()}
                          />
                        </div>
                      </CardHeader>
                      <CardContent>
                        {application.questionsAnswers &&
                        application.questionsAnswers.length > 0 ? (
                          <div className="space-y-4">
                            {application.questionsAnswers.map((qa, index) => (
                              <div
                                key={index}
                                className="border rounded-lg p-4 space-y-3"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-start gap-2 flex-1">
                                    <HelpCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                      {editingQAIndex === index ? (
                                        <Input
                                          value={editedQAQuestion}
                                          onChange={(e) => setEditedQAQuestion(e.target.value)}
                                          placeholder="Enter question..."
                                          className="text-sm font-medium"
                                        />
                                      ) : (
                                        <p className="font-medium text-sm">
                                          {qa.question}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-1">
                                    {editingQAIndex !== index && (
                                      <>
                                        <AIOptimizeQnADrawer
                                          question={qa.question}
                                          currentAnswer={qa.answer}
                                          resume={resume}
                                          job={job}
                                          qaIndex={index}
                                          applicationId={application._id}
                                          trigger={
                                            <IconButton size="sm">
                                              <Sparkles className="w-4 h-4" />
                                            </IconButton>
                                          }
                                          onApply={async (optimizedAnswer) => {
                                            const updatedQAs =
                                              application.questionsAnswers?.map(
                                                (q, i) =>
                                                  i === index
                                                    ? {
                                                        question: q.question,
                                                        answer: optimizedAnswer,
                                                        createdAt: q.createdAt,
                                                      }
                                                    : {
                                                        question: q.question,
                                                        answer: q.answer,
                                                        createdAt: q.createdAt,
                                                      }
                                              ) || [];

                                            await updateApplication.mutateAsync(
                                              {
                                                id: application._id,
                                                data: {
                                                  questionsAnswers: updatedQAs,
                                                },
                                              }
                                            );
                                            await refetch();
                                            toast.success("Answer optimized");
                                          }}
                                        />
                                        <IconButton
                                          size="sm"
                                          onClick={() => handleEditQA(index)}
                                        >
                                          <Edit className="w-4 h-4" />
                                        </IconButton>
                                      </>
                                    )}
                                    <IconButton
                                      size="sm"
                                      onClick={async () => {
                                        try {
                                          const { stripMarkdown } = await import("@/utils/markdown-to-text");
                                          const plainAnswer = stripMarkdown(qa.answer);
                                          await navigator.clipboard.writeText(plainAnswer);
                                          toast.success(
                                            "Answer copied to clipboard"
                                          );
                                        } catch (error) {
                                          toast.error("Failed to copy");
                                        }
                                      }}
                                    >
                                      <Copy className="w-4 h-4" />
                                    </IconButton>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <DestructiveButton size="sm">
                                          <Trash2 className="w-4 h-4" />
                                        </DestructiveButton>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>
                                            Delete Q&A
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to delete this
                                            Q&A? This action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>
                                            Cancel
                                          </AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={async () => {
                                              try {
                                                const updatedQAs =
                                                  application.questionsAnswers
                                                    ?.filter(
                                                      (_, i) => i !== index
                                                    )
                                                    .map((qa) => ({
                                                      question: qa.question,
                                                      answer: qa.answer,
                                                      createdAt: qa.createdAt,
                                                    })) || [];
                                                await updateApplication.mutateAsync(
                                                  {
                                                    id: application._id,
                                                    data: {
                                                      questionsAnswers:
                                                        updatedQAs,
                                                    },
                                                  }
                                                );
                                                await refetch();
                                                toast.success("Q&A deleted");
                                              } catch (error) {
                                                toast.error(
                                                  "Failed to delete Q&A"
                                                );
                                              }
                                            }}
                                          >
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </div>

                                {/* Answer Section - Full Width */}
                                <div className="w-full">
                                  {editingQAIndex === index ? (
                                    <div className="space-y-3">
                                      <CleanMarkdownEditor
                                        value={editedQAAnswer}
                                        onChange={(value) =>
                                          setEditedQAAnswer(value)
                                        }
                                        height={200}
                                        placeholder="Write your answer..."
                                      />
                                      <div className="flex gap-2">
                                        <PrimaryButton
                                          size="sm"
                                          onClick={handleSaveQA}
                                        >
                                          <Save className="w-4 h-4 mr-2" />
                                          Save Answer
                                        </PrimaryButton>
                                        <OutlineButton
                                          size="sm"
                                          onClick={handleCancelEditQA}
                                        >
                                          Cancel
                                        </OutlineButton>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="p-6 bg-muted/30 rounded-lg">
                                      <MarkdownViewer
                                        content={qa.answer}
                                        className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-p:mb-4 prose-strong:text-foreground prose-li:my-1"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                            <p className="text-muted-foreground mb-4">
                              No Q&As prepared yet
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Click "Generate Answer" to prepare answers for
                              common interview questions
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ),
              },
              {
                value: "timeline",
                label: "Timeline",
                content: (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Application Timeline</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {application.timeline &&
                        application.timeline.length > 0 ? (
                          <div className="space-y-4">
                            {application.timeline.map((event, index) => (
                              <div
                                key={index}
                                className="flex gap-4 pb-4 border-b last:border-0"
                              >
                                <div className="w-32 text-sm text-muted-foreground">
                                  {format(
                                    new Date(event.timestamp),
                                    "MMM d, yyyy"
                                  )}
                                  <br />
                                  {format(new Date(event.timestamp), "h:mm a")}
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium">{event.event}</p>
                                  {event.description && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {event.description}
                                    </p>
                                  )}
                                  {event.status && (
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "mt-2",
                                        getStatusColor(event.status)
                                      )}
                                    >
                                      {APPLICATION_STATUS_LABELS[event.status]}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-muted-foreground py-8">
                            No timeline events yet
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ),
              },
            ]}
          />
        </div>

        {/* Sidebar - Status and Actions */}
        <div className="space-y-6 sticky top-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Application Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Update Status</Label>
                <Select
                  value={selectedStatus || application.status}
                  onValueChange={(value: ApplicationStatus) =>
                    handleStatusChange(value)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ApplicationStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(status)}
                          <span>{APPLICATION_STATUS_LABELS[status]}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {application.applicationDate && (
                <div className="text-sm text-muted-foreground">
                  <p>
                    Applied:{" "}
                    {format(
                      new Date(application.applicationDate),
                      "MMM d, yyyy"
                    )}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Job Summary Widget */}
          {job && (
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
                      {job.niceToHaveSkills.slice(0, 5).map((skill, index) => (
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
                  <PreviewButton
                    size="sm"
                    className="w-full mt-3"
                    onClick={() => router.push(`/jobs/${job._id}`)}
                  >
                    <ExternalLink className="w-3 h-3 mr-2" />
                    View Full Job Details
                  </PreviewButton>
                )}
              </CardContent>
            </Card>
          )}

          {/* Resume Summary Widget */}
          {resume && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resume</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h3 className="font-semibold">{resume.title}</h3>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {resume.category}
                    </Badge>
                    {resume.isOptimized && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-orange-50 text-orange-700 border-orange-200"
                      >
                        Optimized
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Scores */}
                <div className="space-y-2">
                  {resume.finalATSScore && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">ATS Score</span>
                      <span className="font-medium">
                        {resume.finalATSScore.toFixed(0)}%
                      </span>
                    </div>
                  )}
                  {resume.finalKeywordScore && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">
                        Keywords Score
                      </span>
                      <span className="font-medium">
                        {resume.finalKeywordScore.toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <PreviewButton
                    size="sm"
                    className="w-full"
                    onClick={() => router.push(`/resumes/${resume._id}`)}
                  >
                    View Details
                  </PreviewButton>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DestructiveButton className="w-full justify-start">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Application
                  </DestructiveButton>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Application?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      your application tracking for this position.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
