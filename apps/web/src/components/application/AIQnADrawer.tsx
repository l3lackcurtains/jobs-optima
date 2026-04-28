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
  HelpCircle,
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
  SparkButton,
} from "@/components/custom/Button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Resume } from "@/types/resume";
import { Job } from "@/types/job";
import { QuestionAnswer } from "@/types/application";
import { toast } from "sonner";
import { useGenerateQnA } from "@/hooks/api/use-ai";
import { useApplications } from "@/hooks/api/use-applications";
import { MarkdownViewer } from "@/components/ui/markdown-viewer";

interface AIQnADrawerProps {
  resume?: Resume;
  job?: Job;
  trigger?: React.ReactNode;
  applicationId?: string;
  existingQAs?: QuestionAnswer[];
  onSave?: (qa: QuestionAnswer) => void;
}

export function AIQnADrawer({
  resume,
  job,
  trigger,
  applicationId,
  existingQAs = [],
  onSave,
}: AIQnADrawerProps) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState<string>("general");
  const [customInstructions, setCustomInstructions] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const generateQnA = useGenerateQnA();
  const { updateApplication } = useApplications();

  const handleGenerate = async () => {
    if (!resume || !job || !question.trim()) {
      toast.error("Please enter a question");
      return;
    }

    setSuggestions([]);
    setSelectedIndex(0);

    try {
      const result = await generateQnA.mutateAsync({
        question: question.trim(),
        optimizedResumeId: resume._id,
        jobId: job._id,
        customInstructions,
      });

      setSuggestions(result.suggestions || []);
    } catch (error) {
      console.error("Error generating answers:", error);
    }
  };

  const handleCopy = async () => {
    if (suggestions[selectedIndex]) {
      await navigator.clipboard.writeText(suggestions[selectedIndex]);
      setIsCopied(true);
      toast.success("Answer copied to clipboard");
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleSave = async () => {
    if (!suggestions[selectedIndex] || !question.trim()) return;

    const newQA: QuestionAnswer = {
      question: question.trim(),
      answer: suggestions[selectedIndex],
      createdAt: new Date().toISOString(),
    };

    setIsSaving(true);

    try {
      // Save to database if application ID is provided
      if (applicationId) {
        // Clean existing QAs to remove any extra fields
        const cleanExistingQAs = (existingQAs || []).map((qa) => ({
          question: qa.question,
          answer: qa.answer,
          createdAt: qa.createdAt,
        }));
        const updatedQAs = [...cleanExistingQAs, newQA];
        await updateApplication.mutateAsync({
          id: applicationId,
          data: {
            questionsAnswers: updatedQAs,
          },
        });
        toast.success("Q&A saved to application");
      }

      // Call the onSave callback if provided
      if (onSave) {
        onSave(newQA);
      }

      // Reset form for next question
      setQuestion("");
      setSuggestions([]);
      setSelectedIndex(0);
      setCustomInstructions("");
    } catch (error) {
      console.error("Failed to save Q&A:", error);
      toast.error("Failed to save Q&A");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectSuggestion = (index: number) => {
    setSelectedIndex(index);
  };

  const questionCategories = [
    { value: "general", label: "General" },
    { value: "technical", label: "Technical" },
    { value: "behavioral", label: "Behavioral" },
    { value: "situational", label: "Situational" },
    { value: "culture", label: "Culture Fit" },
    { value: "motivation", label: "Motivation" },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <OutlineButton size="sm">
            <MessageSquare className="w-4 h-4 mr-2" />
            AI Q&A Assistant
          </OutlineButton>
        )}
      </SheetTrigger>
      <SheetContent className="w-[900px] sm:max-w-[900px] p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Interview Q&A Assistant
          </SheetTitle>
          <SheetDescription>
            Generate multiple answer variations for interview questions tailored
            to your experience and the job
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 pb-6">
          {/* Question Input */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question">Interview Question</Label>
              <Textarea
                id="question"
                placeholder="Enter an interview question (e.g., 'Tell me about yourself', 'Why do you want to work here?', 'Describe a challenging project you worked on')"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Question Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {questionCategories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">
                  Additional Context (Optional)
                </Label>
                <Textarea
                  id="instructions"
                  placeholder="E.g., Focus on leadership, emphasize remote work experience..."
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  className="min-h-[52px] resize-none"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Generate Button */}
          {suggestions.length === 0 && (
            <div>
              <SparkButton
                onClick={handleGenerate}
                disabled={
                  generateQnA.isPending || !resume || !job || !question.trim()
                }
                className="w-full"
                loading={generateQnA.isPending}
                loadingText="Generating 5 Answer Variations..."
              >
                Generate Answer Variations
              </SparkButton>
            </div>
          )}

          {/* Generated Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Generated Answers</Label>
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
                    onClick={handleGenerate}
                    disabled={generateQnA.isPending}
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
                      Answer {index + 1}
                    </PrimaryButton>
                  ) : (
                    <OutlineButton
                      key={index}
                      size="sm"
                      onClick={() => handleSelectSuggestion(index)}
                      className="flex-1"
                    >
                      Answer {index + 1}
                    </OutlineButton>
                  )
                )}
              </div>

              {/* Selected Answer Display */}
              <Card className="border-2">
                <CardHeader className="pb-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-semibold">
                        Answer {selectedIndex + 1}
                      </Badge>
                      {selectedIndex === 0 && (
                        <span className="text-xs text-muted-foreground font-medium">
                          Direct & Technical
                        </span>
                      )}
                      {selectedIndex === 1 && (
                        <span className="text-xs text-muted-foreground font-medium">
                          Story-Driven
                        </span>
                      )}
                      {selectedIndex === 2 && (
                        <span className="text-xs text-muted-foreground font-medium">
                          Achievement-Focused
                        </span>
                      )}
                      {selectedIndex === 3 && (
                        <span className="text-xs text-muted-foreground font-medium">
                          Team & Collaboration
                        </span>
                      )}
                      {selectedIndex === 4 && (
                        <span className="text-xs text-muted-foreground font-medium">
                          Growth & Learning
                        </span>
                      )}
                    </div>
                    <Badge variant="secondary">{category}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex gap-2 mb-3">
                    <HelpCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-sm font-medium text-muted-foreground">
                      {question}
                    </p>
                  </div>
                  <MarkdownViewer content={suggestions[selectedIndex]} className="text-sm" />
                </CardContent>
              </Card>

              <Alert>
                <MessageSquare className="w-4 h-4" />
                <AlertDescription>
                  Each answer variation emphasizes different aspects of your
                  experience. Choose the one that best fits the interview
                  context and your communication style.
                </AlertDescription>
              </Alert>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <OutlineButton
                  onClick={() => {
                    setQuestion("");
                    setSuggestions([]);
                    setSelectedIndex(0);
                    setCustomInstructions("");
                  }}
                  className="flex-1"
                >
                  Ask Another Question
                </OutlineButton>
                <PrimaryButton
                  onClick={handleSave}
                  className="flex-1"
                  disabled={isSaving}
                  loading={isSaving}
                  loadingText="Saving..."
                >
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Save Answer & Continue
                </PrimaryButton>
              </div>
            </div>
          )}

          {/* Existing Q&As Count */}
          {existingQAs && existingQAs.length > 0 && (
            <div className="px-6 py-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>{existingQAs.length}</strong> Q&As saved for this
                application
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
