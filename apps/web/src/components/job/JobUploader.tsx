"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Link,
  FileText,
  Loader2,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Briefcase,
  DollarSign,
  MapPin,
  Clock,
  Users,
} from "lucide-react";
import {
  PreviewButton,
  OutlineButton,
  LoadingButton,
  SparkButton,
} from "@/components/custom/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { Job } from "@/types/job";

type UploadStep = "input" | "parsing" | "preview" | "complete";

interface ParsedJobData {
  title: string;
  company: string;
  location?: string;
  description: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryPeriod?: string;
  isRemote?: boolean;
  requiredSkills?: string[];
  extractedKeywords?: string[];
}

export default function JobUploader() {
  const router = useRouter();
  const [step, setStep] = useState<UploadStep>("input");
  const [jobDescription, setJobDescription] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedJobData | null>(null);
  const [createdJob, setCreatedJob] = useState<Job | null>(null);
  const [progress, setProgress] = useState(0);
  const [parsingSteps] = useState([
    "Extracting job title and company...",
    "Analyzing location and remote options...",
    "Parsing salary information...",
    "Identifying experience requirements...",
    "Extracting required skills...",
    "Categorizing job type...",
    "Finalizing job details...",
  ]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const handleParseJob = async () => {
    if (!jobDescription.trim()) {
      setError("Please paste a job description");
      return;
    }

    setIsLoading(true);
    setError(null);
    setStep("parsing");

    // Simulate parsing progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
      setCurrentStepIndex((prev) =>
        Math.min(prev + 1, parsingSteps.length - 1)
      );
    }, 300);

    try {
      const response = await apiClient.post("/jobs/parse", {
        description: jobDescription,
        url: jobUrl || undefined,
      });

      clearInterval(progressInterval);
      setProgress(100);
      setParsedData(response.data);
      setStep("preview");
    } catch (error: any) {
      clearInterval(progressInterval);
      setError(
        error.response?.data?.message || "Failed to parse job description"
      );
      setStep("input");
    } finally {
      setIsLoading(false);
      setProgress(0);
      setCurrentStepIndex(0);
    }
  };

  const handleCreateJob = async () => {
    if (!parsedData) return;

    setIsLoading(true);
    setError(null);

    try {
      // Filter out any old fields that might still be present
      const { requiredSkills, extractedKeywords, ...cleanedData } =
        parsedData as any;

      const response = await apiClient.post("/jobs", {
        ...cleanedData,
        url: jobUrl || undefined,
        source: "parsed",
      });

      setCreatedJob(response.data);
      setStep("complete");
      toast.success("Job created successfully!");
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to create job");
      toast.error("Failed to create job");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditAndCreate = () => {
    // Create with current data - user can edit after
    if (createdJob) {
      router.push(`/jobs/${createdJob._id}`);
    }
  };

  const formatSalary = (min?: number, max?: number, period?: string) => {
    if (!min && !max) return null;

    const formatNumber = (num: number) => {
      if (num >= 1000) {
        return `$${(num / 1000).toFixed(0)}k`;
      }
      return `$${num}`;
    };

    if (min && max) {
      return `${formatNumber(min)} - ${formatNumber(max)} ${period || "yearly"}`;
    } else if (min) {
      return `${formatNumber(min)}+ ${period || "yearly"}`;
    } else if (max) {
      return `Up to ${formatNumber(max)} ${period || "yearly"}`;
    }
    return null;
  };

  if (step === "parsing") {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Parsing Job Description
          </CardTitle>
          <CardDescription>
            Extracting job details from your description
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{parsingSteps[currentStepIndex]}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            {parsingSteps.map((step, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 text-sm ${
                  index <= currentStepIndex
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {index < currentStepIndex ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : index === currentStepIndex ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-muted-foreground" />
                )}
                <span>{step}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === "preview") {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Review Parsed Job Details</CardTitle>
          <CardDescription>
            Review and confirm the extracted job information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {parsedData && (
            <div className="space-y-6">
              {/* Job Header */}
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">{parsedData.title}</h2>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    {parsedData.company}
                  </div>
                  {parsedData.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {parsedData.location}
                    </div>
                  )}
                  {parsedData.isRemote && (
                    <Badge variant="secondary">Remote</Badge>
                  )}
                </div>
              </div>

              <Separator />

              {/* Key Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formatSalary(
                  parsedData.salaryMin,
                  parsedData.salaryMax,
                  parsedData.salaryPeriod
                ) && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">
                      {formatSalary(
                        parsedData.salaryMin,
                        parsedData.salaryMax,
                        parsedData.salaryPeriod
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* Skills */}
              {parsedData.requiredSkills &&
                parsedData.requiredSkills.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Required Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {parsedData.requiredSkills.map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

              {/* Description Preview */}
              <div className="space-y-2">
                <h3 className="font-semibold">Job Description</h3>
                <div className="bg-muted p-4 rounded-lg max-h-64 overflow-y-auto">
                  <p className="whitespace-pre-wrap text-sm">
                    {parsedData.description.substring(0, 500)}
                    {parsedData.description.length > 500 && "..."}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between">
                <OutlineButton
                  onClick={() => {
                    setStep("input");
                    setParsedData(null);
                  }}
                >
                  Back to Edit
                </OutlineButton>
                <LoadingButton
                  onClick={handleCreateJob}
                  loading={isLoading}
                  loadingText="Creating..."
                >
                  Create Job
                  <ArrowRight className="w-4 h-4 ml-2" />
                </LoadingButton>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (step === "complete") {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            Job Created Successfully!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>
              Your job posting has been created and is ready for resume
              optimization.
            </AlertDescription>
          </Alert>

          {createdJob && (
            <div className="space-y-2">
              <h3 className="font-semibold">{createdJob.title}</h3>
              <p className="text-muted-foreground">{createdJob.company}</p>
            </div>
          )}

          <div className="flex gap-3">
            <OutlineButton onClick={() => router.push("/jobs")}>
              View All Jobs
            </OutlineButton>
            <PreviewButton onClick={handleEditAndCreate}>
              View Job Details
              <ArrowRight className="w-4 h-4 ml-2" />
            </PreviewButton>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Add Job Posting</CardTitle>
        <CardDescription>
          Paste a job description or provide a URL to automatically extract job
          details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">Job URL (Optional)</Label>
            <div className="flex gap-2">
              <Link className="w-4 h-4 mt-3 text-muted-foreground" />
              <Input
                id="url"
                type="url"
                placeholder="https://example.com/jobs/software-engineer"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Provide the job posting URL if available
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Job Description *</Label>
            <Textarea
              id="description"
              placeholder="Paste the complete job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={12}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Include the full job description with title, company,
              requirements, and responsibilities
            </p>
          </div>
        </div>

        <div className="flex justify-between">
          <OutlineButton onClick={() => router.push("/jobs")}>
            Cancel
          </OutlineButton>
          <LoadingButton
            onClick={handleParseJob}
            disabled={!jobDescription.trim()}
            loading={isLoading}
            loadingText="Parsing..."
          >
            <FileText className="w-4 h-4 mr-2" />
            Parse Job Description
          </LoadingButton>
        </div>
      </CardContent>
    </Card>
  );
}
