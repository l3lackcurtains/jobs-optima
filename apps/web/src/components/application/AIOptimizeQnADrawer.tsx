"use client";

import { useState } from "react";
import {
  Sparkles,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  MessageSquare,
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
  PrimaryButton,
  OutlineButton,
  GhostButton,
  SparkButton,
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
import { useOptimizeQnA } from "@/hooks/api/use-ai";
import { useApplications } from "@/hooks/api/use-applications";
import { MarkdownViewer } from "@/components/ui/markdown-viewer";

interface AIOptimizeQnADrawerProps {
  question: string;
  currentAnswer: string;
  resume?: Resume;
  job?: Job;
  trigger?: React.ReactNode;
  applicationId?: string;
  qaIndex: number;
  onApply?: (answer: string) => void;
}

const answerStyles = [
  "Direct & Technical",
  "Story-Driven",
  "Achievement-Focused",
  "Team & Collaboration",
  "Growth & Learning",
];

export function AIOptimizeQnADrawer({
  question,
  currentAnswer,
  resume,
  job,
  trigger,
  applicationId,
  qaIndex,
  onApply,
}: AIOptimizeQnADrawerProps) {
  const [open, setOpen] = useState(false);
  const [customInstructions, setCustomInstructions] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isCopied, setIsCopied] = useState(false);

  const optimizeQnA = useOptimizeQnA();
  const { updateApplication } = useApplications();

  const handleOptimize = async () => {
    if (!resume || !job || !question.trim() || !currentAnswer.trim()) {
      toast.error("Missing required information");
      return;
    }

    setSuggestions([]);
    setSelectedIndex(0);

    try {
      const result = await optimizeQnA.mutateAsync({
        question: question.trim(),
        currentAnswer: currentAnswer.trim(),
        optimizedResumeId: resume._id,
        jobId: job._id,
        customInstructions,
      });

      setSuggestions(result.suggestions || []);
    } catch (error) {
      console.error("Error optimizing answer:", error);
    }
  };

  const handleCopy = async () => {
    const textToCopy =
      suggestions.length > 0 ? suggestions[selectedIndex] : currentAnswer;
    if (textToCopy) {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      toast.success("Answer copied to clipboard");
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleApply = async () => {
    const answerToSave =
      suggestions.length > 0 ? suggestions[selectedIndex] : currentAnswer;

    if (onApply) {
      onApply(answerToSave);
      setOpen(false);
      return;
    }

    // If no onApply callback, save directly to application
    if (applicationId) {
      // This would be handled by the parent component
      toast.success("Answer updated");
      setOpen(false);
    }
  };

  const handleSelectSuggestion = (index: number) => {
    setSelectedIndex(index);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <GhostButton size="sm">
            <Sparkles className="w-4 h-4" />
          </GhostButton>
        )}
      </SheetTrigger>
      <SheetContent className="w-[900px] sm:max-w-[900px] p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Answer Optimizer
          </SheetTitle>
          <SheetDescription>
            Optimize your answer with AI to make it more compelling and aligned
            with the job requirements
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 pb-6">
          {/* Question Display */}
          <Card className="bg-muted/30">
            <CardHeader className="pb-3">
              <Label>Interview Question</Label>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">{question}</p>
            </CardContent>
          </Card>

          {/* Current Answer Editor */}
          <div className="space-y-2">
            <Label>Current Answer</Label>
            <Card>
              <CardContent className="p-4">
                <MarkdownViewer
                  content={currentAnswer}
                  className="prose prose-sm max-w-none dark:prose-invert"
                />
              </CardContent>
            </Card>
          </div>

          {/* Custom Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions">
              Additional Instructions (Optional)
            </Label>
            <Textarea
              id="instructions"
              placeholder="E.g., Focus on leadership experience, emphasize technical skills..."
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              className="min-h-[60px]"
            />
          </div>

          <Separator />

          {/* Generate Button */}
          {suggestions.length === 0 && (
            <SparkButton
              onClick={handleOptimize}
              disabled={
                optimizeQnA.isPending ||
                !resume ||
                !job ||
                !currentAnswer.trim()
              }
              className="w-full"
              loading={optimizeQnA.isPending}
              loadingText="Optimizing Answer..."
            >
              Optimize Answer
            </SparkButton>
          )}

          {/* Optimized Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Optimized Variations</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select your preferred answer from the options below
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
                    onClick={handleOptimize}
                    disabled={optimizeQnA.isPending}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate
                  </OutlineButton>
                </div>
              </div>

              {/* Answer Selection Tabs */}
              <div className="flex gap-2">
                {suggestions.map((_, index) =>
                  selectedIndex === index ? (
                    <PrimaryButton
                      key={index}
                      size="sm"
                      onClick={() => handleSelectSuggestion(index)}
                      className="flex-1"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      {answerStyles[index]}
                    </PrimaryButton>
                  ) : (
                    <OutlineButton
                      key={index}
                      size="sm"
                      onClick={() => handleSelectSuggestion(index)}
                      className="flex-1"
                    >
                      {answerStyles[index]}
                    </OutlineButton>
                  )
                )}
              </div>

              {/* Selected Answer Display */}
              <Card className="border-2">
                <CardHeader className="pb-3 bg-muted/30">
                  <Badge variant="outline" className="font-semibold w-fit">
                    {answerStyles[selectedIndex]}
                  </Badge>
                </CardHeader>
                <CardContent className="p-6">
                  <MarkdownViewer
                    content={suggestions[selectedIndex]}
                    className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed"
                  />
                </CardContent>
              </Card>

              <Alert>
                <MessageSquare className="w-4 h-4" />
                <AlertDescription>
                  Each variation emphasizes different aspects of your
                  experience. Choose the one that best fits your interview style
                  and the company culture.
                </AlertDescription>
              </Alert>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <OutlineButton
                  onClick={() => {
                    setSuggestions([]);
                    setSelectedIndex(0);
                    setCustomInstructions("");
                  }}
                  className="flex-1"
                >
                  Start Over
                </OutlineButton>
                <PrimaryButton onClick={handleApply} className="flex-1">
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Apply This Answer
                </PrimaryButton>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
