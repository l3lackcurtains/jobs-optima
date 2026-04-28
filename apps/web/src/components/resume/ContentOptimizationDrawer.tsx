"use client";

import { useState, useMemo, useEffect } from "react";
import { Sparkles, Check, Copy, Zap, Wrench, Users, BookOpen } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  SparkButton,
  GhostButton,
  PrimaryButton,
} from "@/components/custom/Button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
import { getMatchedKeywords } from "@/lib/utils/keyword-matcher";

interface ContentOptimizationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: string;
  contentType: "responsibility" | "project_description" | "achievement";
  allKeywords: string[];
  matchedKeywords: string[];
  onSelect: (optimizedContent: string) => void;
  keywordsByCategory?: {
    actionVerbs?: string[];
    hardSkills?: string[];
    softSkills?: string[];
    knowledge?: string[];
  };
}

export function ContentOptimizationDrawer({
  open,
  onOpenChange,
  content,
  contentType,
  allKeywords,
  matchedKeywords,
  onSelect,
  keywordsByCategory,
}: ContentOptimizationDrawerProps) {
  const [editedContent, setEditedContent] = useState(content);
  const [prompt, setPrompt] = useState("");
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [excludedKeywords, setExcludedKeywords] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Reset state when content changes or drawer opens with new content
  useEffect(() => {
    if (open) {
      setEditedContent(content);
      setSuggestions([]);
      setSelectedIndex(null);
      setCopiedIndex(null);
      setPrompt("");
      setSelectedKeywords([]);
      setExcludedKeywords([]);
    }
  }, [open, content]);

  // Keywords that are in the edited content (for exclude section)
  const keywordsInContent = useMemo(() => {
    return getMatchedKeywords(editedContent, allKeywords);
  }, [editedContent, allKeywords]);

  // Keywords not yet matched in the resume
  const unmatchedKeywords = allKeywords.filter(
    (keyword) => !matchedKeywords.includes(keyword)
  );

  // Organize keywords by category if not provided
  const categorizedKeywords = useMemo(() => {
    if (keywordsByCategory) return keywordsByCategory;
    
    // Simple categorization based on keyword patterns
    const actionVerbs: string[] = [];
    const hardSkills: string[] = [];
    const softSkills: string[] = [];
    const knowledge: string[] = [];
    
    const actionVerbPatterns = ['led', 'managed', 'developed', 'implemented', 'designed', 'created', 'built', 'established', 'improved', 'optimized', 'analyzed', 'coordinated'];
    const softSkillPatterns = ['leadership', 'communication', 'teamwork', 'collaboration', 'problem-solving', 'analytical', 'creative', 'adaptable'];
    
    allKeywords.forEach(keyword => {
      const lowerKeyword = keyword.toLowerCase();
      if (actionVerbPatterns.some(pattern => lowerKeyword.includes(pattern))) {
        actionVerbs.push(keyword);
      } else if (softSkillPatterns.some(pattern => lowerKeyword.includes(pattern))) {
        softSkills.push(keyword);
      } else if (keyword.match(/[A-Z]{2,}/) || keyword.includes('.') || keyword.includes('#')) {
        hardSkills.push(keyword);
      } else {
        knowledge.push(keyword);
      }
    });
    
    return { actionVerbs, hardSkills, softSkills, knowledge };
  }, [allKeywords, keywordsByCategory]);

  // Helper function to find keywords in a specific text
  const getMatchedKeywordsInText = (text: string) => {
    return getMatchedKeywords(text, allKeywords);
  };

  const handleKeywordToggle = (keyword: string) => {
    setSelectedKeywords((prev) =>
      prev.includes(keyword)
        ? prev.filter((k) => k !== keyword)
        : [...prev, keyword]
    );
  };

  const handleExcludedKeywordToggle = (keyword: string) => {
    setExcludedKeywords((prev) =>
      prev.includes(keyword)
        ? prev.filter((k) => k !== keyword)
        : [...prev, keyword]
    );
  };

  const handleOptimize = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.post(
        "/ai/optimize-content-with-keywords",
        {
          content: editedContent,
          prompt,
          keywords: selectedKeywords,
          excludeKeywords: excludedKeywords,
          contentType,
        }
      );

      setSuggestions(response.data.suggestions || []);
      setSelectedIndex(null);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to optimize content"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSelect = (text: string, index: number) => {
    setSelectedIndex(index);
    onSelect(text);
    toast.success("Content updated");
    setTimeout(() => onOpenChange(false), 500);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px] p-0 flex flex-col h-full">
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-600" />
            AI Content Optimizer
          </SheetTitle>
          <SheetDescription>
            Optimize your {contentType.replace("_", " ")} with AI assistance
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6">
          <div className="space-y-4 pb-4">
            {/* Original Content */}
            <div className="space-y-2">
            <Label>Original Content</Label>
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={4}
              className="resize-none"
              placeholder="Enter the content you want to optimize..."
            />
            {keywordsInContent.length > 0 && (
              <Card className="p-3">
                <div className="flex flex-wrap gap-1">
                  <span className="text-xs text-muted-foreground">
                    Keywords detected:
                  </span>
                  {keywordsInContent.map((keyword, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="text-xs px-1.5 py-0"
                    >
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}
          </div>

            {/* Keywords to Include */}
            <div className="space-y-2">
            <Label>Keywords to Include</Label>
            <Card className="p-4">
              <div className="space-y-3">
                {unmatchedKeywords.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-foreground">
                      Missing Keywords (Recommended to Add)
                    </p>
                    
                    {/* Action Verbs */}
                    {(categorizedKeywords.actionVerbs?.filter(k => unmatchedKeywords.includes(k)).length ?? 0) > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Zap className="w-3.5 h-3.5 text-amber-600" />
                          <span className="text-xs text-muted-foreground">Action Verbs</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {categorizedKeywords.actionVerbs?.filter(k => unmatchedKeywords.includes(k)).map((keyword) => (
                            <div
                              key={`include-${keyword}`}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`include-${keyword}`}
                                checked={selectedKeywords.includes(keyword)}
                                onCheckedChange={() => handleKeywordToggle(keyword)}
                              />
                              <label
                                htmlFor={`include-${keyword}`}
                                className="text-sm cursor-pointer"
                              >
                                <Badge
                                  variant="outline"
                                  className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
                                >
                                  {keyword}
                                </Badge>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Hard Skills */}
                    {(categorizedKeywords.hardSkills?.filter(k => unmatchedKeywords.includes(k)).length ?? 0) > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Wrench className="w-3.5 h-3.5 text-blue-600" />
                          <span className="text-xs text-muted-foreground">Hard Skills</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {categorizedKeywords.hardSkills?.filter(k => unmatchedKeywords.includes(k)).map((keyword) => (
                            <div
                              key={`include-${keyword}`}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`include-${keyword}`}
                                checked={selectedKeywords.includes(keyword)}
                                onCheckedChange={() => handleKeywordToggle(keyword)}
                              />
                              <label
                                htmlFor={`include-${keyword}`}
                                className="text-sm cursor-pointer"
                              >
                                <Badge
                                  variant="outline"
                                  className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
                                >
                                  {keyword}
                                </Badge>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Soft Skills */}
                    {(categorizedKeywords.softSkills?.filter(k => unmatchedKeywords.includes(k)).length ?? 0) > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Users className="w-3.5 h-3.5 text-purple-600" />
                          <span className="text-xs text-muted-foreground">Soft Skills</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {categorizedKeywords.softSkills?.filter(k => unmatchedKeywords.includes(k)).map((keyword) => (
                            <div
                              key={`include-${keyword}`}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`include-${keyword}`}
                                checked={selectedKeywords.includes(keyword)}
                                onCheckedChange={() => handleKeywordToggle(keyword)}
                              />
                              <label
                                htmlFor={`include-${keyword}`}
                                className="text-sm cursor-pointer"
                              >
                                <Badge
                                  variant="outline"
                                  className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
                                >
                                  {keyword}
                                </Badge>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Knowledge */}
                    {(categorizedKeywords.knowledge?.filter(k => unmatchedKeywords.includes(k)).length ?? 0) > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 mb-2">
                          <BookOpen className="w-3.5 h-3.5 text-green-600" />
                          <span className="text-xs text-muted-foreground">Knowledge</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {categorizedKeywords.knowledge?.filter(k => unmatchedKeywords.includes(k)).map((keyword) => (
                            <div
                              key={`include-${keyword}`}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`include-${keyword}`}
                                checked={selectedKeywords.includes(keyword)}
                                onCheckedChange={() => handleKeywordToggle(keyword)}
                              />
                              <label
                                htmlFor={`include-${keyword}`}
                                className="text-sm cursor-pointer"
                              >
                                <Badge
                                  variant="outline"
                                  className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
                                >
                                  {keyword}
                                </Badge>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {matchedKeywords.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-foreground">
                      Already Present in Resume (Optional to Reinforce)
                    </p>
                    
                    {/* Action Verbs */}
                    {(categorizedKeywords.actionVerbs?.filter(k => matchedKeywords.includes(k)).length ?? 0) > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Zap className="w-3.5 h-3.5 text-green-600" />
                          <span className="text-xs text-muted-foreground">Action Verbs</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {categorizedKeywords.actionVerbs?.filter(k => matchedKeywords.includes(k)).map((keyword) => (
                            <div
                              key={`include-matched-${keyword}`}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`include-matched-${keyword}`}
                                checked={selectedKeywords.includes(keyword)}
                                onCheckedChange={() => handleKeywordToggle(keyword)}
                              />
                              <label
                                htmlFor={`include-matched-${keyword}`}
                                className="text-sm cursor-pointer"
                              >
                                <Badge
                                  variant="outline"
                                  className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                                >
                                  {keyword}
                                </Badge>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Hard Skills */}
                    {(categorizedKeywords.hardSkills?.filter(k => matchedKeywords.includes(k)).length ?? 0) > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Wrench className="w-3.5 h-3.5 text-green-600" />
                          <span className="text-xs text-muted-foreground">Hard Skills</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {categorizedKeywords.hardSkills?.filter(k => matchedKeywords.includes(k)).map((keyword) => (
                            <div
                              key={`include-matched-${keyword}`}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`include-matched-${keyword}`}
                                checked={selectedKeywords.includes(keyword)}
                                onCheckedChange={() => handleKeywordToggle(keyword)}
                              />
                              <label
                                htmlFor={`include-matched-${keyword}`}
                                className="text-sm cursor-pointer"
                              >
                                <Badge
                                  variant="outline"
                                  className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                                >
                                  {keyword}
                                </Badge>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Soft Skills */}
                    {(categorizedKeywords.softSkills?.filter(k => matchedKeywords.includes(k)).length ?? 0) > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Users className="w-3.5 h-3.5 text-green-600" />
                          <span className="text-xs text-muted-foreground">Soft Skills</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {categorizedKeywords.softSkills?.filter(k => matchedKeywords.includes(k)).map((keyword) => (
                            <div
                              key={`include-matched-${keyword}`}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`include-matched-${keyword}`}
                                checked={selectedKeywords.includes(keyword)}
                                onCheckedChange={() => handleKeywordToggle(keyword)}
                              />
                              <label
                                htmlFor={`include-matched-${keyword}`}
                                className="text-sm cursor-pointer"
                              >
                                <Badge
                                  variant="outline"
                                  className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                                >
                                  {keyword}
                                </Badge>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Knowledge */}
                    {(categorizedKeywords.knowledge?.filter(k => matchedKeywords.includes(k)).length ?? 0) > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 mb-2">
                          <BookOpen className="w-3.5 h-3.5 text-green-600" />
                          <span className="text-xs text-muted-foreground">Knowledge</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {categorizedKeywords.knowledge?.filter(k => matchedKeywords.includes(k)).map((keyword) => (
                            <div
                              key={`include-matched-${keyword}`}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`include-matched-${keyword}`}
                                checked={selectedKeywords.includes(keyword)}
                                onCheckedChange={() => handleKeywordToggle(keyword)}
                              />
                              <label
                                htmlFor={`include-matched-${keyword}`}
                                className="text-sm cursor-pointer"
                              >
                                <Badge
                                  variant="outline"
                                  className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                                >
                                  {keyword}
                                </Badge>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>

            {/* Keywords to Exclude - Only show keywords that are in the original content */}
            {keywordsInContent.length > 0 && (
              <div className="space-y-2">
              <Label>Keywords to Exclude (Optional)</Label>
              <Card className="p-4">
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-foreground">
                    Select keywords from the content you want to remove
                  </p>
                  <div className="flex flex-wrap gap-2">
                  {keywordsInContent.map((keyword) => (
                    <div
                      key={`exclude-${keyword}`}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`exclude-${keyword}`}
                        checked={excludedKeywords.includes(keyword)}
                        onCheckedChange={() =>
                          handleExcludedKeywordToggle(keyword)
                        }
                      />
                      <label
                        htmlFor={`exclude-${keyword}`}
                        className="text-sm cursor-pointer"
                      >
                        <Badge
                          variant="outline"
                          className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                        >
                          {keyword}
                        </Badge>
                      </label>
                    </div>
                  ))}
                  </div>
                </div>
              </Card>
            </div>
          )}

            {/* Custom Prompt */}
            <div className="space-y-2">
            <Label htmlFor="prompt">Custom Instructions (Optional)</Label>
            <Textarea
              id="prompt"
              placeholder="E.g., Make it more technical, add metrics, focus on leadership..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-2">
              <Label>Select an Optimized Version</Label>
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => {
                  const matchedInSuggestion =
                    getMatchedKeywordsInText(suggestion);
                  return (
                    <Card
                      key={index}
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedIndex === index
                          ? "bg-orange-50 border-orange-300 dark:bg-orange-950/20 dark:border-orange-800"
                          : "hover:bg-gray-50 dark:hover:bg-gray-900"
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <Badge variant="outline" className="text-xs">
                            Version {index + 1}
                          </Badge>
                          <div className="flex gap-1">
                            <GhostButton
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(suggestion, index);
                              }}
                            >
                              {copiedIndex === index ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </GhostButton>
                            <PrimaryButton
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelect(suggestion, index);
                              }}
                            >
                              Use This
                            </PrimaryButton>
                          </div>
                        </div>
                        <p className="text-sm">{suggestion}</p>
                        {matchedInSuggestion.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            <span className="text-xs text-muted-foreground">
                              Keywords:
                            </span>
                            {matchedInSuggestion.map((keyword, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="text-xs px-1.5 py-0"
                              >
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Fixed Footer with Optimize Button */}
        <div className="border-t bg-background px-6 py-4">
          <SparkButton
            onClick={handleOptimize}
            className="w-full"
            loading={isLoading}
            loadingText="Optimizing..."
          >
            Generate Optimized Versions
          </SparkButton>
        </div>
      </SheetContent>
    </Sheet>
  );
}
