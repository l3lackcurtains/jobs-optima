'use client'

import { useState, useMemo, useEffect } from 'react'
import { Sparkles, Check, Copy, Zap, Wrench, Users, BookOpen } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { PrimaryButton, GhostButton, SparkButton } from '@/components/custom/Button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api/client'
import { getMatchedKeywords } from '@/lib/utils/keyword-matcher'
import { cn } from '@/lib/utils'

interface SkillsOptimizationDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentSkills: string[]
  skillType: 'technical' | 'soft' | 'development'
  allKeywords: string[]
  matchedKeywords: string[]
  onSelect: (optimizedSkills: string[]) => void
  keywordsByCategory?: {
    actionVerbs?: string[]
    hardSkills?: string[]
    softSkills?: string[]
    knowledge?: string[]
  }
}

export function SkillsOptimizationDrawer({
  open,
  onOpenChange,
  currentSkills,
  skillType,
  allKeywords,
  matchedKeywords,
  onSelect,
  keywordsByCategory,
}: SkillsOptimizationDrawerProps) {
  const [prompt, setPrompt] = useState('')
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  const [excludedKeywords, setExcludedKeywords] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasCopied, setHasCopied] = useState(false)

  // Reset state when drawer opens with new content
  useEffect(() => {
    if (open) {
      setSuggestions([])
      setHasCopied(false)
      setPrompt('')
      setSelectedKeywords([])
      setExcludedKeywords([])
    }
  }, [open, currentSkills])

  // Keywords that are in the current skills (for exclude section)
  const keywordsInSkills = useMemo(() => {
    const skillsText = currentSkills.join(' ')
    return getMatchedKeywords(skillsText, allKeywords)
  }, [currentSkills, allKeywords])

  // Keywords not yet matched in the resume
  const unmatchedKeywords = allKeywords.filter(
    keyword => !matchedKeywords.includes(keyword)
  )

  // Organize keywords by category if not provided
  const categorizedKeywords = useMemo(() => {
    if (keywordsByCategory) return keywordsByCategory
    
    // Simple categorization based on keyword patterns
    const actionVerbs: string[] = []
    const hardSkills: string[] = []
    const softSkills: string[] = []
    const knowledge: string[] = []
    
    const actionVerbPatterns = ['led', 'managed', 'developed', 'implemented', 'designed', 'created', 'built', 'established', 'improved', 'optimized', 'analyzed', 'coordinated']
    const softSkillPatterns = ['leadership', 'communication', 'teamwork', 'collaboration', 'problem-solving', 'analytical', 'creative', 'adaptable']
    
    allKeywords.forEach(keyword => {
      const lowerKeyword = keyword.toLowerCase()
      if (actionVerbPatterns.some(pattern => lowerKeyword.includes(pattern))) {
        actionVerbs.push(keyword)
      } else if (softSkillPatterns.some(pattern => lowerKeyword.includes(pattern))) {
        softSkills.push(keyword)
      } else if (keyword.match(/[A-Z]{2,}/) || keyword.includes('.') || keyword.includes('#')) {
        hardSkills.push(keyword)
      } else {
        knowledge.push(keyword)
      }
    })
    
    return { actionVerbs, hardSkills, softSkills, knowledge }
  }, [allKeywords, keywordsByCategory])

  // Helper function to find keywords in a specific skill set
  const getMatchedKeywordsInSkills = (skills: string[]) => {
    const skillsText = skills.join(' ')
    return getMatchedKeywords(skillsText, allKeywords)
  }

  const handleKeywordToggle = (keyword: string) => {
    setSelectedKeywords(prev =>
      prev.includes(keyword)
        ? prev.filter(k => k !== keyword)
        : [...prev, keyword]
    )
  }

  const handleExcludedKeywordToggle = (keyword: string) => {
    setExcludedKeywords(prev =>
      prev.includes(keyword)
        ? prev.filter(k => k !== keyword)
        : [...prev, keyword]
    )
  }

  const handleOptimize = async () => {
    setIsLoading(true)
    try {
      const response = await apiClient.post('/ai/optimize-skills-with-keywords', {
        currentSkills,
        prompt,
        keywords: selectedKeywords,
        excludeKeywords: excludedKeywords,
        skillType,
      })

      if (response.data?.suggestions) {
        setSuggestions(response.data.suggestions)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error: any) {
      console.error('Skills optimization error:', error)
      toast.error(error.response?.data?.message || 'Failed to optimize skills. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = (skills: string[]) => {
    navigator.clipboard.writeText(skills.join(', '))
    setHasCopied(true)
    toast.success('Skills copied to clipboard')
    setTimeout(() => setHasCopied(false), 2000)
  }

  const handleSelect = (skills: string[]) => {
    onSelect(skills)
    toast.success('Skills updated successfully')
  }

  const getSkillTypeLabel = () => {
    switch (skillType) {
      case 'technical':
        return 'Technical Skills'
      case 'soft':
        return 'Personal Skills'
      case 'development':
        return 'Development Practices & Methodologies'
      default:
        return 'Skills'
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col h-full">
        <SheetHeader className="px-6 pt-6 pb-4 space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-green-600" />
            <SheetTitle>AI {getSkillTypeLabel()} Optimization</SheetTitle>
          </div>
          <SheetDescription>
            Optimize your skills with AI-powered suggestions tailored to include relevant keywords
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6">
          <div className="space-y-4 pb-4">
            {/* Current Skills */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Current {getSkillTypeLabel()}</Label>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex flex-wrap gap-1.5">
                  {currentSkills.map((skill, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Keywords to Include */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Keywords to Include
                <span className="text-xs text-muted-foreground ml-2">
                  ({selectedKeywords.length} selected)
                </span>
              </Label>
              <Card className="p-4">
                <div className="space-y-4">
                  {unmatchedKeywords.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      All relevant keywords are already in your skills
                    </p>
                  ) : (
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
                              <div key={keyword} className="flex items-center gap-1.5">
                                <Checkbox
                                  id={`include-${keyword}`}
                                  checked={selectedKeywords.includes(keyword)}
                                  onCheckedChange={() => handleKeywordToggle(keyword)}
                                />
                                <label
                                  htmlFor={`include-${keyword}`}
                                  className="text-sm cursor-pointer select-none">
                                  {keyword}
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
                              <div key={keyword} className="flex items-center gap-1.5">
                                <Checkbox
                                  id={`include-${keyword}`}
                                  checked={selectedKeywords.includes(keyword)}
                                  onCheckedChange={() => handleKeywordToggle(keyword)}
                                />
                                <label
                                  htmlFor={`include-${keyword}`}
                                  className="text-sm cursor-pointer select-none">
                                  {keyword}
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
                              <div key={keyword} className="flex items-center gap-1.5">
                                <Checkbox
                                  id={`include-${keyword}`}
                                  checked={selectedKeywords.includes(keyword)}
                                  onCheckedChange={() => handleKeywordToggle(keyword)}
                                />
                                <label
                                  htmlFor={`include-${keyword}`}
                                  className="text-sm cursor-pointer select-none">
                                  {keyword}
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
                              <div key={keyword} className="flex items-center gap-1.5">
                                <Checkbox
                                  id={`include-${keyword}`}
                                  checked={selectedKeywords.includes(keyword)}
                                  onCheckedChange={() => handleKeywordToggle(keyword)}
                                />
                                <label
                                  htmlFor={`include-${keyword}`}
                                  className="text-sm cursor-pointer select-none">
                                  {keyword}
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

            {/* Keywords to Exclude */}
            {keywordsInSkills.length> 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Keywords to Remove
                  <span className="text-xs text-muted-foreground ml-2">
                    ({excludedKeywords.length} selected)
                  </span>
                </Label>
                <Card className="p-4">
                  <div className="space-y-4">
                    <p className="text-sm font-semibold text-foreground">
                      Select keywords from current skills to remove
                    </p>
                    {/* Action Verbs */}
                    {(categorizedKeywords.actionVerbs?.filter(k => keywordsInSkills.includes(k)).length ?? 0) > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Zap className="w-3.5 h-3.5 text-red-600" />
                          <span className="text-xs text-muted-foreground">Action Verbs</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {categorizedKeywords.actionVerbs?.filter(k => keywordsInSkills.includes(k)).map((keyword) => (
                            <div key={keyword} className="flex items-center gap-1.5">
                              <Checkbox
                                id={`exclude-${keyword}`}
                                checked={excludedKeywords.includes(keyword)}
                                onCheckedChange={() => handleExcludedKeywordToggle(keyword)}
                              />
                              <label
                                htmlFor={`exclude-${keyword}`}
                                className="text-sm cursor-pointer select-none">
                                {keyword}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Hard Skills */}
                    {(categorizedKeywords.hardSkills?.filter(k => keywordsInSkills.includes(k)).length ?? 0) > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Wrench className="w-3.5 h-3.5 text-red-600" />
                          <span className="text-xs text-muted-foreground">Technical Skills</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {categorizedKeywords.hardSkills?.filter(k => keywordsInSkills.includes(k)).map((keyword) => (
                            <div key={keyword} className="flex items-center gap-1.5">
                              <Checkbox
                                id={`exclude-${keyword}`}
                                checked={excludedKeywords.includes(keyword)}
                                onCheckedChange={() => handleExcludedKeywordToggle(keyword)}
                              />
                              <label
                                htmlFor={`exclude-${keyword}`}
                                className="text-sm cursor-pointer select-none">
                                {keyword}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Soft Skills */}
                    {(categorizedKeywords.softSkills?.filter(k => keywordsInSkills.includes(k)).length ?? 0) > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Users className="w-3.5 h-3.5 text-red-600" />
                          <span className="text-xs text-muted-foreground">Soft Skills</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {categorizedKeywords.softSkills?.filter(k => keywordsInSkills.includes(k)).map((keyword) => (
                            <div key={keyword} className="flex items-center gap-1.5">
                              <Checkbox
                                id={`exclude-${keyword}`}
                                checked={excludedKeywords.includes(keyword)}
                                onCheckedChange={() => handleExcludedKeywordToggle(keyword)}
                              />
                              <label
                                htmlFor={`exclude-${keyword}`}
                                className="text-sm cursor-pointer select-none">
                                {keyword}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Knowledge */}
                    {(categorizedKeywords.knowledge?.filter(k => keywordsInSkills.includes(k)).length ?? 0) > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 mb-2">
                          <BookOpen className="w-3.5 h-3.5 text-red-600" />
                          <span className="text-xs text-muted-foreground">Knowledge Areas</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {categorizedKeywords.knowledge?.filter(k => keywordsInSkills.includes(k)).map((keyword) => (
                            <div key={keyword} className="flex items-center gap-1.5">
                              <Checkbox
                                id={`exclude-${keyword}`}
                                checked={excludedKeywords.includes(keyword)}
                                onCheckedChange={() => handleExcludedKeywordToggle(keyword)}
                              />
                              <label
                                htmlFor={`exclude-${keyword}`}
                                className="text-sm cursor-pointer select-none">
                                {keyword}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            )}

            {/* Additional Instructions */}
            <div className="space-y-2">
              <Label htmlFor="prompt" className="text-sm font-medium">
                Additional Instructions (Optional)
              </Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., Focus on cloud technologies, emphasize leadership skills..."
                rows={3}
                className="resize-none"
              />
            </div>


            {/* Suggestions */}
            {suggestions.length> 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Optimized Skills
                </Label>
                <Card className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          {suggestions.length} skills total
                        </span>
                        {getMatchedKeywordsInSkills(suggestions).length> 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {getMatchedKeywordsInSkills(suggestions).length} keywords matched
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {suggestions.map((skill, skillIdx) => {
                          const isNew = !currentSkills.includes(skill)
                          const isKeyword = getMatchedKeywordsInSkills([skill]).length> 0
                          
                          return (
                            <Badge
                              key={skillIdx}
                              variant={isNew ? "default" : "secondary"}
                              className={cn(
                                "text-xs",
                                isNew && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
                                isKeyword && !isNew && "ring-1 ring-primary"
                              )}>
                              {skill}
                            </Badge>
                          )
                        })}
                      </div>
                      
                      {/* Show removed skills if any */}
                      {(() => {
                        const removedSkills = currentSkills.filter(skill => !suggestions.includes(skill))
                        return removedSkills.length> 0 ? (
                          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-md">
                            <div className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">
                              Skills to be removed:
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {removedSkills.map((skill, idx) => (
                                <Badge
                                  key={idx}
                                  variant="secondary"
                                  className="text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 line-through">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ) : null
                      })()}
                      
                      <div className="text-xs text-muted-foreground mt-2">
                        <span className="text-green-700 dark:text-green-400">● New additions</span>
                        {' • '}
                        <span className="text-gray-600 dark:text-gray-400">● Existing skills</span>
                        {(() => {
                          const removedCount = currentSkills.filter(skill => !suggestions.includes(skill)).length
                          return removedCount> 0 ? (
                            <>
                              {' • '}
                              <span className="text-red-700 dark:text-red-400">● Removed ({removedCount})</span>
                            </>
                          ) : null
                        })()}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <GhostButton
                        onClick={() => handleCopy(suggestions)}
                        size="sm"
                        className="h-8 w-8 p-0">
                        {hasCopied ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </GhostButton>
                      <PrimaryButton
                        onClick={() => handleSelect(suggestions)}
                        size="sm">
                        <Check className="w-4 h-4 mr-1" />
                        Apply Changes
                      </PrimaryButton>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
        
        {/* Fixed Footer with Optimize Button */}
        <div className="border-t bg-background px-6 py-4">
          <SparkButton
            onClick={handleOptimize}
            loading={isLoading}
            loadingText="Optimizing Skills..."
            className="w-full"
            size="lg">
            Optimize Skills
          </SparkButton>
        </div>
      </SheetContent>
    </Sheet>
  )
}