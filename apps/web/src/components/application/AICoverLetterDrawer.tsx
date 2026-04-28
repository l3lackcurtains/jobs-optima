"use client";

import { useState } from "react";
import {
  Sparkles,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  FileText,
  Briefcase,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  SparkButton,
  OutlineButton,
  LoadingButton,
} from "@/components/custom/Button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Resume } from "@/types/resume";
import { Job } from "@/types/job";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useGenerateCoverLetter,
  useOptimizeCoverLetter,
} from "@/hooks/api/use-ai";
import { MarkdownViewer } from "@/components/ui/markdown-viewer";
import { useApplications } from "@/hooks/api/use-applications";

interface AICoverLetterDrawerProps {
  resume?: Resume;
  job?: Job;
  trigger?: React.ReactNode;
  onApply?: (coverLetter: string) => void;
  existingCoverLetter?: string;
  applicationId?: string;
}

export function AICoverLetterDrawer({
  resume,
  job,
  trigger,
  onApply,
  existingCoverLetter,
  applicationId,
}: AICoverLetterDrawerProps) {
  const [open, setOpen] = useState(false);
  const [customInstructions, setCustomInstructions] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const generateCoverLetter = useGenerateCoverLetter();
  const optimizeCoverLetter = useOptimizeCoverLetter();
  const { updateApplication } = useApplications();

  const isOptimizing = Boolean(existingCoverLetter);

  const handleGenerate = async () => {
    if (!resume || !job) {
      toast.error("Resume and job information are required");
      return;
    }

    setSuggestions([]);
    setSelectedIndex(0);

    try {
      if (isOptimizing && existingCoverLetter) {
        // Use the optimization endpoint for existing cover letters
        const result = await optimizeCoverLetter.mutateAsync({
          coverLetter: existingCoverLetter,
          optimizedResumeId: resume._id,
          jobId: job._id,
          customInstructions:
            customInstructions || "Make it more concise and impactful",
        });
        setSuggestions(result.suggestions || []);
      } else {
        // Use the generation endpoint for new cover letters
        const result = await generateCoverLetter.mutateAsync({
          optimizedResumeId: resume._id,
          jobId: job._id,
          customInstructions: customInstructions,
        });
        setSuggestions(result.suggestions || []);
      }
    } catch (error) {
      console.error("Error with cover letter:", error);
    }
  };

  const handleCopy = async () => {
    if (suggestions[selectedIndex]) {
      await navigator.clipboard.writeText(suggestions[selectedIndex]);
      setIsCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleApply = async () => {
    if (!suggestions[selectedIndex]) return;

    const selectedCoverLetter = suggestions[selectedIndex];
    setIsSaving(true);

    try {
      // Save to database if application ID is provided
      if (applicationId) {
        await updateApplication.mutateAsync({
          id: applicationId,
          data: {
            coverLetter: selectedCoverLetter,
          },
        });
        toast.success("Cover letter saved to application");
      }

      // Call the onApply callback if provided
      if (onApply) {
        onApply(selectedCoverLetter);
      }

      setOpen(false);
    } catch (error) {
      console.error("Failed to save cover letter:", error);
      toast.error("Failed to save cover letter");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectSuggestion = (index: number) => {
    setSelectedIndex(index);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <SparkButton size="sm">
            {isOptimizing ? "Optimize Cover Letter" : "AI Cover Letter"}
          </SparkButton>
        )}
      </SheetTrigger>
      <SheetContent className="w-[900px] sm:max-w-[900px] p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            {isOptimizing ? "Optimize Cover Letter" : "AI Cover Letter Builder"}
          </SheetTitle>
          <SheetDescription>
            {isOptimizing
              ? "Optimize your existing cover letter with AI-powered improvements tailored to the job requirements"
              : "Generate multiple professional cover letter variations tailored to your resume and the job"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 pb-6">
          {/* Job & Resume Info */}
          <div className="grid grid-cols-2 gap-4">
            {job && (
              <Card className="bg-muted/50">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <Briefcase className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        Target Position
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {job.title} at {job.company}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {resume && (
              <Card className="bg-muted/50">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-orange-600 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">Resume</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {resume.title}
                      </p>
                      {resume.finalATSScore && (
                        <Badge className="text-xs bg-green-100 text-green-800 mt-1">
                          ATS: {resume.finalATSScore.toFixed(0)}%
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <Separator />

          {/* Show existing cover letter if optimizing */}
          {isOptimizing && existingCoverLetter && suggestions.length === 0 && (
            <div>
              <div className="space-y-2">
                <Label>Current Cover Letter</Label>
                <Card className="bg-muted/50">
                  <CardContent className="p-4 max-h-[200px] overflow-y-auto">
                    <MarkdownViewer
                      content={existingCoverLetter}
                      className="prose-sm"
                    />
                  </CardContent>
                </Card>
                <p className="text-xs text-muted-foreground">
                  This is your current cover letter that will be optimized
                </p>
              </div>
            </div>
          )}

          {/* Custom Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions">
              {isOptimizing
                ? "Optimization Instructions (Optional)"
                : "Custom Instructions (Optional)"}
            </Label>
            <Textarea
              id="instructions"
              placeholder={
                isOptimizing
                  ? "E.g., Make it more concise, strengthen the opening, add more quantifiable achievements..."
                  : "E.g., Emphasize my leadership experience, mention specific technologies, highlight remote work experience..."
              }
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              className="min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground">
              {isOptimizing
                ? "Specify how you want to improve your existing cover letter"
                : "Add any specific requirements or areas to emphasize"}
            </p>
          </div>

          {/* Generate/Optimize Button */}
          {suggestions.length === 0 && (
            <div>
              <SparkButton
                onClick={handleGenerate}
                disabled={!resume || !job}
                loading={
                  isOptimizing
                    ? optimizeCoverLetter.isPending
                    : generateCoverLetter.isPending
                }
                loadingText={
                  isOptimizing
                    ? "Optimizing Cover Letter..."
                    : "Generating 5 Variations..."
                }
                className="w-full"
              >
                {isOptimizing
                  ? "Optimize Cover Letter"
                  : "Generate Cover Letter Variations"}
              </SparkButton>
            </div>
          )}

          {/* Generated Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Generated Cover Letters</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select your preferred variation from the options below
                  </p>
                </div>
                <div className="flex gap-2">
                  <OutlineButton size="sm" onClick={handleCopy}>
                    {isCopied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </>
                    )}
                  </OutlineButton>
                  <OutlineButton
                    size="sm"
                    onClick={handleGenerate}
                    disabled={generateCoverLetter.isPending}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate
                  </OutlineButton>
                </div>
              </div>

              {/* Suggestion Tabs */}
              <div className="flex gap-2">
                {suggestions.map((_, index) => (
                  <OutlineButton
                    key={index}
                    size="sm"
                    onClick={() => handleSelectSuggestion(index)}
                    className={cn(
                      "flex-1",
                      selectedIndex === index &&
                        "ring-2 ring-primary bg-primary/10"
                    )}
                  >
                    {selectedIndex === index && (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    )}
                    Option {index + 1}
                  </OutlineButton>
                ))}
              </div>

              {/* Selected Cover Letter */}
              <Card className="border-2">
                <CardHeader className="pb-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-semibold">
                        Option {selectedIndex + 1}
                      </Badge>
                      {selectedIndex === 0 && (
                        <span className="text-xs text-muted-foreground font-medium">
                          Technical Match - Must-Have Skills
                        </span>
                      )}
                      {selectedIndex === 1 && (
                        <span className="text-xs text-muted-foreground font-medium">
                          Impact Focus - Major Achievements
                        </span>
                      )}
                      {selectedIndex === 2 && (
                        <span className="text-xs text-muted-foreground font-medium">
                          Unique Angle - Differentiators
                        </span>
                      )}
                      {selectedIndex === 3 && (
                        <span className="text-xs text-muted-foreground font-medium">
                          Cultural Fit - Team Collaboration
                        </span>
                      )}
                      {selectedIndex === 4 && (
                        <span className="text-xs text-muted-foreground font-medium">
                          Growth Potential - Future Contributions
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[400px] overflow-y-auto">
                    <div className="p-6">
                      <MarkdownViewer
                        content={suggestions[selectedIndex]}
                        className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-p:mb-4 prose-strong:text-foreground prose-li:my-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Alert>
                <Sparkles className="w-4 h-4" />
                <AlertDescription>
                  Each variation emphasizes different strengths while addressing
                  the job requirements. Choose the one that best represents your
                  professional brand.
                </AlertDescription>
              </Alert>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <OutlineButton
                  onClick={() => setOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </OutlineButton>
                {(onApply || applicationId) && (
                  <LoadingButton
                    onClick={handleApply}
                    className="flex-1"
                    loading={isSaving}
                    loadingText="Saving..."
                  >
                    <ChevronRight className="w-4 h-4 mr-2" />
                    {applicationId
                      ? "Save & Apply to Application"
                      : "Apply Selected"}
                  </LoadingButton>
                )}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
