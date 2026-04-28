'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PrimaryButton, OutlineButton, GhostButton, IconButton } from '@/components/custom/Button';
import { Separator } from '@/components/ui/separator';
import { 
  Target, 
  CheckCircle, 
  XCircle, 
  Eye, 
  EyeOff,
  TrendingUp,
  Hash,
  Zap,
  Wrench,
  Users,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Resume } from '@/types/resume';
import { calculateWeightedATSScore, calculateKeywordMatchScore } from '@/lib/utils/keyword-scoring';

interface OptimizationATSWidgetProps {
  resume: Resume;
  showOrangeHighlight?: boolean;
  onToggleHighlight?: () => void;
  selectedKeywords: Set<string>;
  onKeywordClick: (keyword: string) => void;
  sortedMatchedKeywords: { keyword: string; count: number }[];
  sortedUnmatchedKeywords: string[];
}

export function OptimizationATSWidget({
  resume,
  showOrangeHighlight = true,
  onToggleHighlight,
  selectedKeywords,
  onKeywordClick,
  sortedMatchedKeywords,
  sortedUnmatchedKeywords,
}: OptimizationATSWidgetProps) {
  if (!resume?.isOptimized) return null;

  // Calculate weighted ATS score (technical focus)
  const weightedATSScore = useMemo(() => {
    return calculateWeightedATSScore(
      resume.matchedKeywordsByCategory,
      resume.unmatchedKeywordsByCategory,
      resume.category || 'General'
    );
  }, [resume.matchedKeywordsByCategory, resume.unmatchedKeywordsByCategory, resume.category]);

  // Calculate keyword match score (overall coverage)
  const keywordScore = useMemo(() => {
    return calculateKeywordMatchScore(
      resume.matchedKeywordsByCategory,
      resume.unmatchedKeywordsByCategory,
      resume.category || 'General'
    );
  }, [resume.matchedKeywordsByCategory, resume.unmatchedKeywordsByCategory, resume.category]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="w-5 h-5 text-orange-600" />
          Optimization & ATS Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ATS Score Grid */}
        <div className="space-y-2">
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp className="w-3 h-3 text-blue-600" />
            <span className="text-xs font-medium text-blue-600">ATS Score</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {/* Initial ATS Score - using weighted calculation */}
            <div className="text-center p-2 bg-gray-50 dark:bg-gray-900/50 rounded">
              <p className="text-[10px] text-muted-foreground">Initial</p>
              <p className="text-lg font-bold">{resume?.initialATSScore || 0}%</p>
            </div>
            {/* ATS Improvement - now uses weighted ATS score */}
            <div className="text-center p-2 bg-green-50 dark:bg-green-950/20 rounded">
              <p className="text-[10px] text-muted-foreground">Change</p>
              <p className={`text-lg font-bold ${
                (Math.round(weightedATSScore.overall) || resume?.finalATSScore || 0) >= (resume?.initialATSScore || 0) 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {(Math.round(weightedATSScore.overall) || resume?.finalATSScore || 0) - (resume?.initialATSScore || 0) >= 0 ? '+' : ''}{(Math.round(weightedATSScore.overall) || resume?.finalATSScore || 0) - (resume?.initialATSScore || 0)}%
              </p>
            </div>
            {/* Final ATS Score - now shows weighted ATS score */}
            <div className="text-center p-2 bg-orange-50 dark:bg-orange-950/20 rounded">
              <p className="text-[10px] text-muted-foreground">Final</p>
              <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                {Math.round(weightedATSScore.overall) || resume?.finalATSScore || 0}%
              </p>
            </div>
          </div>
        </div>

        {/* Keyword Score Grid */}
        {(resume?.initialKeywordScore !== undefined || resume?.finalKeywordScore !== undefined) && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-1 mb-1">
                <Hash className="w-3 h-3 text-purple-600" />
                <span className="text-xs font-medium text-purple-600">Keyword Score</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {/* Initial Keyword Score */}
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-900/50 rounded">
                  <p className="text-[10px] text-muted-foreground">Initial</p>
                  <p className="text-lg font-bold">{resume?.initialKeywordScore || 0}%</p>
                </div>
                {/* Keyword Improvement - using keyword match score */}
                <div className="text-center p-2 bg-purple-50 dark:bg-purple-950/20 rounded">
                  <p className="text-[10px] text-muted-foreground">Change</p>
                  <p className={`text-lg font-bold ${
                    (Math.round(keywordScore) || resume?.finalKeywordScore || 0) >= (resume?.initialKeywordScore || 0) 
                      ? 'text-purple-600 dark:text-purple-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {(Math.round(keywordScore) || resume?.finalKeywordScore || 0) - (resume?.initialKeywordScore || 0) >= 0 ? '+' : ''}{(Math.round(keywordScore) || resume?.finalKeywordScore || 0) - (resume?.initialKeywordScore || 0)}%
                  </p>
                </div>
                {/* Final Keyword Score - now shows keyword match score */}
                <div className="text-center p-2 bg-purple-50 dark:bg-purple-950/20 rounded">
                  <p className="text-[10px] text-muted-foreground">Final</p>
                  <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    {Math.round(keywordScore) || resume?.finalKeywordScore || 0}%
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Orange Highlight Toggle */}
        {onToggleHighlight && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Show All Keywords</span>
              <GhostButton
               
                size="sm"
                onClick={onToggleHighlight}
                className="h-8 px-2"
              >
                {showOrangeHighlight ? (
                  <Eye className="w-4 h-4 text-orange-600" />
                ) : (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                )}
              </GhostButton>
            </div>
            <Separator />
          </>
        )}

        {/* Keywords Stats */}
        {(resume?.matchedKeywords || resume?.unmatchedKeywords) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-600" />
                Matched
              </span>
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400">
                {resume?.matchedKeywords?.length || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <XCircle className="w-3 h-3 text-amber-600" />
                Missing
              </span>
              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400">
                {resume?.unmatchedKeywords?.length || 0}
              </Badge>
            </div>
          </div>
        )}

        {/* Keywords Display - Categorized or Flat */}
        {(resume?.matchedKeywordsByCategory || resume?.unmatchedKeywordsByCategory) ? (
          // Display categorized keywords if available
          <>
            <Separator />
            <div className="space-y-4">
              {/* Matched Keywords by Category */}
              {resume?.matchedKeywordsByCategory && (
                <div className="space-y-3">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span className="text-xs font-medium text-green-600">Matched Keywords</span>
                  </div>
                  
                  {/* Action Verbs */}
                  {resume.matchedKeywordsByCategory.actionVerbs?.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Action Verbs</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {resume.matchedKeywordsByCategory.actionVerbs.map((keyword, index) => {
                          const keywordData = sortedMatchedKeywords.find(k => k.keyword === keyword);
                          return (
                            <GhostButton
                              key={index}
                              onClick={() => onKeywordClick(keyword)}
                              size="sm"
                              className={cn(
                                "inline-flex items-center px-2 py-1 rounded text-xs font-medium border transition-all cursor-pointer h-auto",
                                selectedKeywords.has(keyword)
                                  ? "bg-blue-500 text-white border-blue-600 hover:bg-blue-600"
                                  : "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 border-green-200/60 dark:border-green-900/60"
                              )}
                            >
                              {keyword}
                              {keywordData && keywordData.count > 0 && (
                                <span className="ml-1 font-bold">({keywordData.count})</span>
                              )}
                            </GhostButton>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Hard Skills */}
                  {resume.matchedKeywordsByCategory.hardSkills?.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Wrench className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Technical Skills</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {resume.matchedKeywordsByCategory.hardSkills.map((keyword, index) => {
                          const keywordData = sortedMatchedKeywords.find(k => k.keyword === keyword);
                          return (
                            <GhostButton
                              key={index}
                              onClick={() => onKeywordClick(keyword)}
                              size="sm"
                              className={cn(
                                "inline-flex items-center px-2 py-1 rounded text-xs font-medium border transition-all cursor-pointer h-auto",
                                selectedKeywords.has(keyword)
                                  ? "bg-blue-500 text-white border-blue-600 hover:bg-blue-600"
                                  : "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 border-green-200/60 dark:border-green-900/60"
                              )}
                            >
                              {keyword}
                              {keywordData && keywordData.count > 0 && (
                                <span className="ml-1 font-bold">({keywordData.count})</span>
                              )}
                            </GhostButton>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Soft Skills */}
                  {resume.matchedKeywordsByCategory.softSkills?.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Soft Skills</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {resume.matchedKeywordsByCategory.softSkills.map((keyword, index) => {
                          const keywordData = sortedMatchedKeywords.find(k => k.keyword === keyword);
                          return (
                            <GhostButton
                              key={index}
                              onClick={() => onKeywordClick(keyword)}
                              size="sm"
                              className={cn(
                                "inline-flex items-center px-2 py-1 rounded text-xs font-medium border transition-all cursor-pointer h-auto",
                                selectedKeywords.has(keyword)
                                  ? "bg-blue-500 text-white border-blue-600 hover:bg-blue-600"
                                  : "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 border-green-200/60 dark:border-green-900/60"
                              )}
                            >
                              {keyword}
                              {keywordData && keywordData.count > 0 && (
                                <span className="ml-1 font-bold">({keywordData.count})</span>
                              )}
                            </GhostButton>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Knowledge */}
                  {resume.matchedKeywordsByCategory.knowledge?.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Knowledge Areas</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {resume.matchedKeywordsByCategory.knowledge.map((keyword, index) => {
                          const keywordData = sortedMatchedKeywords.find(k => k.keyword === keyword);
                          return (
                            <GhostButton
                              key={index}
                              onClick={() => onKeywordClick(keyword)}
                              size="sm"
                              className={cn(
                                "inline-flex items-center px-2 py-1 rounded text-xs font-medium border transition-all cursor-pointer h-auto",
                                selectedKeywords.has(keyword)
                                  ? "bg-blue-500 text-white border-blue-600 hover:bg-blue-600"
                                  : "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 border-green-200/60 dark:border-green-900/60"
                              )}
                            >
                              {keyword}
                              {keywordData && keywordData.count > 0 && (
                                <span className="ml-1 font-bold">({keywordData.count})</span>
                              )}
                            </GhostButton>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Unmatched Keywords by Category */}
              {resume?.unmatchedKeywordsByCategory && (
                <div className="space-y-3">
                  <div className="flex items-center gap-1">
                    <XCircle className="w-3 h-3 text-amber-600" />
                    <span className="text-xs font-medium text-amber-600">Missing Keywords</span>
                  </div>
                  
                  {/* Action Verbs */}
                  {resume.unmatchedKeywordsByCategory.actionVerbs?.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Action Verbs</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {resume.unmatchedKeywordsByCategory.actionVerbs.map((keyword, index) => (
                          <div
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium border bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200/60 dark:border-amber-900/60"
                          >
                            {keyword}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hard Skills */}
                  {resume.unmatchedKeywordsByCategory.hardSkills?.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Wrench className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Technical Skills</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {resume.unmatchedKeywordsByCategory.hardSkills.map((keyword, index) => (
                          <div
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium border bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200/60 dark:border-amber-900/60"
                          >
                            {keyword}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Soft Skills */}
                  {resume.unmatchedKeywordsByCategory.softSkills?.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Soft Skills</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {resume.unmatchedKeywordsByCategory.softSkills.map((keyword, index) => (
                          <div
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium border bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200/60 dark:border-amber-900/60"
                          >
                            {keyword}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Knowledge */}
                  {resume.unmatchedKeywordsByCategory.knowledge?.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Knowledge Areas</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {resume.unmatchedKeywordsByCategory.knowledge.map((keyword, index) => (
                          <div
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium border bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200/60 dark:border-amber-900/60"
                          >
                            {keyword}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : ((resume?.matchedKeywords?.length ?? 0) > 0 || (resume?.unmatchedKeywords?.length ?? 0) > 0) && (
          // Display flat keywords for backward compatibility
          <>
            <Separator />
            <div className="space-y-3">
              {/* Matched Keywords */}
              {sortedMatchedKeywords.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span className="text-xs font-medium text-green-600">Matched Keywords</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {sortedMatchedKeywords.map(({ keyword, count }, index) => (
                      <GhostButton
                        key={index}
                        onClick={() => onKeywordClick(keyword)}
                        size="sm"
                        className={cn(
                          "inline-flex items-center px-2 py-1 rounded text-xs font-medium border transition-all cursor-pointer h-auto",
                          selectedKeywords.has(keyword)
                            ? "bg-blue-500 text-white border-blue-600 hover:bg-blue-600 dark:bg-blue-600 dark:border-blue-700 dark:hover:bg-blue-700"
                            : "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 border-green-200/60 dark:border-green-900/60 hover:bg-green-100 dark:hover:bg-green-950/30"
                        )}
                      >
                        {keyword}
                        {count > 0 && (
                          <span className="ml-1 font-bold">({count})</span>
                        )}
                      </GhostButton>
                    ))}
                  </div>
                </div>
              )}

              {/* Unmatched Keywords */}
              {sortedUnmatchedKeywords.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <XCircle className="w-3 h-3 text-amber-600" />
                    <span className="text-xs font-medium text-amber-600">Missing Keywords</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {sortedUnmatchedKeywords.map((keyword, index) => (
                      <div
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium border bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200/60 dark:border-amber-900/60"
                      >
                        {keyword}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}