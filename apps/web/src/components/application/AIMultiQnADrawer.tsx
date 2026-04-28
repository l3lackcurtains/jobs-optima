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
  Plus,
  Trash2,
  Save,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Resume } from "@/types/resume";
import { Job } from "@/types/job";
import { QuestionAnswer } from "@/types/application";
import { toast } from "sonner";
import { useGenerateMultipleQnA } from "@/hooks/api/use-ai";
import { useApplications } from "@/hooks/api/use-applications";
import { MarkdownViewer } from "@/components/ui/markdown-viewer";

interface QAPair {
  id: string;
  question: string;
  suggestions: string[];
  selectedIndex: number;
  isExpanded: boolean;
}

interface AIMultiQnADrawerProps {
  resume?: Resume;
  job?: Job;
  trigger?: React.ReactNode;
  applicationId?: string;
  existingQAs?: QuestionAnswer[];
  onSave?: (qas: QuestionAnswer[]) => void;
}

const answerStyles = [
  "Direct & Technical",
  "Story-Driven",
  "Achievement-Focused",
  "Team & Collaboration",
  "Growth & Learning",
];

export function AIMultiQnADrawer({
  resume,
  job,
  trigger,
  applicationId,
  existingQAs = [],
  onSave,
}: AIMultiQnADrawerProps) {
  const [open, setOpen] = useState(false);
  const [qaPairs, setQaPairs] = useState<QAPair[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const generateMultipleQnA = useGenerateMultipleQnA();
  const { updateApplication } = useApplications();

  const addQuestion = () => {
    if (!newQuestion.trim()) {
      toast.error("Please enter a question");
      return;
    }

    const newQA: QAPair = {
      id: Date.now().toString(),
      question: newQuestion.trim(),
      suggestions: [],
      selectedIndex: 0,
      isExpanded: true,
    };

    setQaPairs([...qaPairs, newQA]);
    setNewQuestion("");
  };

  const removeQuestion = (id: string) => {
    setQaPairs(qaPairs.filter((qa) => qa.id !== id));
  };

  const toggleExpanded = (id: string) => {
    setQaPairs(
      qaPairs.map((qa) =>
        qa.id === id ? { ...qa, isExpanded: !qa.isExpanded } : qa
      )
    );
  };

  const selectAnswer = (id: string, index: number) => {
    setQaPairs(
      qaPairs.map((qa) => (qa.id === id ? { ...qa, selectedIndex: index } : qa))
    );
  };

  const generateAnswersForQuestion = async (id: string) => {
    if (!resume || !job) return;

    const qa = qaPairs.find((q) => q.id === id);
    if (!qa) return;

    setIsGenerating(true);

    try {
      const result = await generateMultipleQnA.mutateAsync({
        questions: [
          {
            question: qa.question,
          },
        ],
        optimizedResumeId: resume._id,
        jobId: job._id,
      });

      if (result.results && result.results[0]) {
        setQaPairs(
          qaPairs.map((q) =>
            q.id === id
              ? { ...q, suggestions: result.results[0].suggestions || [] }
              : q
          )
        );
      }
    } catch (error) {
      console.error("Error generating answers:", error);
      toast.error("Failed to generate answers");
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAllAnswers = async () => {
    if (!resume || !job || qaPairs.length === 0) return;

    const unansweredQuestions = qaPairs.filter(
      (qa) => qa.suggestions.length === 0
    );
    if (unansweredQuestions.length === 0) {
      toast.info("All questions already have answers");
      return;
    }

    setIsGenerating(true);

    try {
      const result = await generateMultipleQnA.mutateAsync({
        questions: unansweredQuestions.map((qa) => ({
          question: qa.question,
        })),
        optimizedResumeId: resume._id,
        jobId: job._id,
      });

      if (result.results) {
        const updatedPairs = [...qaPairs];
        unansweredQuestions.forEach((qa, index) => {
          const pairIndex = updatedPairs.findIndex((p) => p.id === qa.id);
          if (pairIndex !== -1 && result.results[index]) {
            updatedPairs[pairIndex].suggestions =
              result.results[index].suggestions || [];
          }
        });
        setQaPairs(updatedPairs);
        toast.success(
          `Generated answers for ${unansweredQuestions.length} questions`
        );
      }
    } catch (error) {
      console.error("Error generating answers:", error);
      toast.error("Failed to generate answers");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAll = async () => {
    const validQAs = qaPairs.filter(
      (qa) => qa.suggestions.length > 0 && qa.suggestions[qa.selectedIndex]
    );

    if (validQAs.length === 0) {
      toast.error("No answers to save. Please generate answers first.");
      return;
    }

    const newQAs: QuestionAnswer[] = validQAs.map((qa) => ({
      question: qa.question,
      answer: qa.suggestions[qa.selectedIndex],
      createdAt: new Date().toISOString(),
    }));

    setIsSaving(true);

    try {
      if (applicationId) {
        // Clean existing QAs to remove any extra fields
        const cleanExistingQAs = (existingQAs || []).map((qa) => ({
          question: qa.question,
          answer: qa.answer,
          createdAt: qa.createdAt,
        }));
        const updatedQAs = [...cleanExistingQAs, ...newQAs];
        await updateApplication.mutateAsync({
          id: applicationId,
          data: {
            questionsAnswers: updatedQAs,
          },
        });
        toast.success(`Saved ${newQAs.length} Q&As to application`);
      }

      if (onSave) {
        onSave(newQAs);
      }

      // Reset after successful save
      setQaPairs([]);
      setOpen(false);
    } catch (error) {
      console.error("Failed to save Q&As:", error);
      toast.error("Failed to save Q&As");
    } finally {
      setIsSaving(false);
    }
  };

  const hasUnansweredQuestions = qaPairs.some(
    (qa) => qa.suggestions.length === 0
  );
  const readyToSave = qaPairs.some((qa) => qa.suggestions.length > 0);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <OutlineButton size="sm">
            <MessageSquare className="w-4 h-4 mr-2" />
            Multi Q&A Assistant
          </OutlineButton>
        )}
      </SheetTrigger>
      <SheetContent className="w-[1000px] sm:max-w-[1000px] p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Interview Q&A Assistant - Multiple Questions
          </SheetTitle>
          <SheetDescription>
            Add multiple questions, generate 5 answer variations for each,
            select the best ones, and save all at once
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6 py-6 px-6">
            {/* Add Question Section */}
            <Card className="border-dashed">
              <CardHeader className="pb-3">
                <Label>Add Interview Questions</Label>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Enter an interview question..."
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="min-h-[60px]"
                />
                <OutlineButton onClick={addQuestion} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question
                </OutlineButton>
              </CardContent>
            </Card>

            {/* Questions List */}
            {qaPairs.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Questions ({qaPairs.length})</Label>
                  {hasUnansweredQuestions && (
                    <SparkButton
                      onClick={generateAllAnswers}
                      disabled={isGenerating}
                      size="sm"
                      loading={isGenerating}
                      loadingText="Generating..."
                    >
                      Generate All Answers
                    </SparkButton>
                  )}
                </div>

                {qaPairs.map((qa, index) => (
                  <Card key={qa.id}>
                    <Collapsible open={qa.isExpanded}>
                      <CollapsibleTrigger asChild>
                        <CardHeader
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => toggleExpanded(qa.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 flex items-start gap-2">
                              <div className="pt-0.5">
                                {qa.isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-sm">
                                  {index + 1}. {qa.question}
                                </p>
                                {qa.suggestions.length > 0 && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs mt-2"
                                  >
                                    Answer selected
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <GhostButton
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeQuestion(qa.id);
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </GhostButton>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          {qa.suggestions.length === 0 ? (
                            <div className="text-center py-8">
                              <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground/50 mb-3" />
                              <p className="text-sm text-muted-foreground mb-3">
                                No answers generated yet
                              </p>
                              <SparkButton
                                onClick={() =>
                                  generateAnswersForQuestion(qa.id)
                                }
                                disabled={isGenerating || !resume || !job}
                                size="sm"
                              >
                                Generate Answers
                              </SparkButton>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex gap-2">
                                {qa.suggestions.map((_, idx) =>
                                  qa.selectedIndex === idx ? (
                                    <PrimaryButton
                                      key={idx}
                                      size="sm"
                                      onClick={() => selectAnswer(qa.id, idx)}
                                      className="flex-1"
                                    >
                                      <span className="hidden sm:inline">
                                        {answerStyles[idx]}
                                      </span>
                                      <span className="sm:hidden">
                                        #{idx + 1}
                                      </span>
                                    </PrimaryButton>
                                  ) : (
                                    <OutlineButton
                                      key={idx}
                                      size="sm"
                                      onClick={() => selectAnswer(qa.id, idx)}
                                      className="flex-1"
                                    >
                                      <span className="hidden sm:inline">
                                        {answerStyles[idx]}
                                      </span>
                                      <span className="sm:hidden">
                                        #{idx + 1}
                                      </span>
                                    </OutlineButton>
                                  )
                                )}
                              </div>

                              <div className="p-4 bg-muted/30 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <Badge
                                    variant="outline"
                                    className="font-semibold"
                                  >
                                    {answerStyles[qa.selectedIndex]}
                                  </Badge>
                                  <GhostButton
                                    size="sm"
                                    onClick={() =>
                                      generateAnswersForQuestion(qa.id)
                                    }
                                  >
                                    <RefreshCw className="w-4 h-4" />
                                  </GhostButton>
                                </div>
                                <MarkdownViewer 
                                  content={qa.suggestions[qa.selectedIndex]} 
                                  className="text-sm" 
                                />
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                ))}
              </div>
            )}

            {qaPairs.length === 0 && (
              <Alert>
                <HelpCircle className="w-4 h-4" />
                <AlertDescription>
                  Add interview questions above to start generating personalized
                  answers. You can add multiple questions and generate answers
                  for all at once.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        <SheetFooter className="border-t pt-4">
          <div className="flex gap-2 w-full">
            <OutlineButton onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </OutlineButton>
            <PrimaryButton
              onClick={handleSaveAll}
              disabled={!readyToSave || isSaving}
              className="flex-1"
              loading={isSaving}
              loadingText="Saving..."
            >
              <Save className="w-4 h-4 mr-2" />
              Save All Selected Answers
            </PrimaryButton>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
