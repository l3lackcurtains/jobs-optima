'use client'

import { useState, useEffect } from 'react'
import { 
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Resume } from '@/types/resume'

interface ResumeComparisonViewProps {
  optimizedResume: Resume
  baseResume: Resume
}

interface DiffResult {
  type: 'added' | 'removed' | 'modified' | 'unchanged'
  content: string
  original?: string
}

const DIFF_COLORS = {
  added: {
    bg: 'bg-green-50 dark:bg-green-950/20',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-700 dark:text-green-300',
    badge: 'bg-green-500 text-white',
    icon: 'text-green-600',
    legend: 'bg-green-500'
  },
  modified: {
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
    badge: 'bg-blue-500 text-white',
    icon: 'text-blue-600',
    legend: 'bg-blue-500'
  },
  removed: {
    bg: 'bg-red-50 dark:bg-red-950/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-700 dark:text-red-300',
    badge: 'bg-red-500 text-white',
    icon: 'text-red-600',
    legend: 'bg-red-500'
  },
  unchanged: {
    bg: 'bg-gray-50 dark:bg-gray-900/20',
    border: 'border-gray-200 dark:border-gray-700',
    text: 'text-gray-600 dark:text-gray-400',
    badge: 'bg-gray-400 text-white',
    icon: 'text-gray-500',
    legend: 'bg-gray-400'
  }
}

export default function ResumeComparisonView({ 
  optimizedResume, 
  baseResume
}: ResumeComparisonViewProps) {
  const [showOnlyChanges, setShowOnlyChanges] = useState(false)

  const detectTextDifferences = (original: string, optimized: string): DiffResult => {
    if (original === optimized) {
      return { type: 'unchanged', content: optimized }
    }
    if (!original && optimized) {
      return { type: 'added', content: optimized }
    }
    if (original && !optimized) {
      return { type: 'removed', content: original }
    }
    return { type: 'modified', content: optimized, original }
  }

  const detectArrayDifferences = (originalArray: string[], optimizedArray: string[]): DiffResult[] => {
    const results: DiffResult[] = []
    const maxLength = Math.max(originalArray.length, optimizedArray.length)
    
    for (let i = 0; i < maxLength; i++) {
      const original = originalArray[i] || ''
      const optimized = optimizedArray[i] || ''
      results.push(detectTextDifferences(original, optimized))
    }
    
    return results
  }

  const renderDiffText = (diff: DiffResult) => {
    const colors = DIFF_COLORS[diff.type]
    
    switch (diff.type) {
      case 'added':
        return (
          <div className={cn("p-2 rounded border", colors.bg, colors.border)}>
            <div className="flex items-start gap-1.5">
              <CheckCircle className={cn("w-3 h-3 mt-0.5 shrink-0", colors.icon)} />
              <div className="flex-1">
                <Badge className={cn("text-xs mb-1", colors.badge)}>Added</Badge>
                <p className={cn("text-sm", colors.text)}>{diff.content}</p>
              </div>
            </div>
          </div>
        )
      case 'modified':
        return (
          <div className={cn("p-2 rounded border", colors.bg, colors.border)}>
            <div className="flex items-start gap-1.5">
              <AlertCircle className={cn("w-3 h-3 mt-0.5 shrink-0", colors.icon)} />
              <div className="flex-1">
                <Badge className={cn("text-xs mb-1", colors.badge)}>Modified</Badge>
                {diff.original && (
                  <div className={cn("mb-1 p-1 rounded text-xs line-through", DIFF_COLORS.removed.bg, "border", DIFF_COLORS.removed.border)}>
                    <span className={DIFF_COLORS.removed.text}>{diff.original}</span>
                  </div>
                )}
                <p className={cn("text-sm font-medium", colors.text)}>{diff.content}</p>
              </div>
            </div>
          </div>
        )
      case 'removed':
        return (
          <div className={cn("p-2 rounded border", colors.bg, colors.border)}>
            <div className="flex items-start gap-1.5">
              <AlertCircle className={cn("w-3 h-3 mt-0.5 shrink-0", colors.icon)} />
              <div className="flex-1">
                <Badge className={cn("text-xs mb-1", colors.badge)}>Removed</Badge>
                <p className={cn("text-sm line-through", colors.text)}>{diff.content}</p>
              </div>
            </div>
          </div>
        )
      case 'unchanged':
        return showOnlyChanges ? null : (
          <div className={cn("p-2 rounded", colors.bg)}>
            <p className={cn("text-sm", colors.text)}>{diff.content}</p>
          </div>
        )
      default:
        return null
    }
  }

  // Handle experiences - compare all experiences by index
  const maxExperiences = Math.max(
    baseResume.experience?.length || 0,
    optimizedResume.experience?.length || 0
  )
  
  const experienceDiffs = Array.from({ length: maxExperiences }, (_, index) => {
    const baseExp = baseResume.experience?.[index]
    const optimizedExp = optimizedResume.experience?.[index]
    
    if (!baseExp && optimizedExp) {
      // New experience added
      return {
        titleDiff: { type: 'added' as const, content: optimizedExp.title },
        companyDiff: { type: 'added' as const, content: optimizedExp.company },
        locationDiff: { type: 'added' as const, content: optimizedExp.location || '' },
        datesDiff: { type: 'added' as const, content: optimizedExp.dates },
        responsibilityDiffs: optimizedExp.responsibilities.map(r => ({ 
          type: 'added' as const, 
          content: r 
        })),
        hasChanges: true
      }
    }
    
    if (baseExp && !optimizedExp) {
      // Experience removed
      return {
        titleDiff: { type: 'removed' as const, content: baseExp.title },
        companyDiff: { type: 'removed' as const, content: baseExp.company },
        locationDiff: { type: 'removed' as const, content: baseExp.location || '' },
        datesDiff: { type: 'removed' as const, content: baseExp.dates },
        responsibilityDiffs: baseExp.responsibilities.map(r => ({ 
          type: 'removed' as const, 
          content: r 
        })),
        hasChanges: true
      }
    }
    
    if (baseExp && optimizedExp) {
      const titleDiff = detectTextDifferences(baseExp.title, optimizedExp.title)
      const companyDiff = detectTextDifferences(baseExp.company, optimizedExp.company)
      const locationDiff = detectTextDifferences(baseExp.location || '', optimizedExp.location || '')
      const datesDiff = detectTextDifferences(baseExp.dates, optimizedExp.dates)
      const responsibilityDiffs = detectArrayDifferences(baseExp.responsibilities, optimizedExp.responsibilities)
      
      return {
        titleDiff,
        companyDiff,
        locationDiff,
        datesDiff,
        responsibilityDiffs,
        hasChanges: titleDiff.type !== 'unchanged' || companyDiff.type !== 'unchanged' || 
                    locationDiff.type !== 'unchanged' || datesDiff.type !== 'unchanged' ||
                    responsibilityDiffs.some(r => r.type !== 'unchanged')
      }
    }
    
    return null
  }).filter(Boolean)

  const skillsDiffs = {
    technical: detectArrayDifferences(
      baseResume.skills?.technicalSkills || [], 
      optimizedResume.skills?.technicalSkills || []
    ),
    development: detectArrayDifferences(
      baseResume.skills?.developmentPracticesMethodologies || [], 
      optimizedResume.skills?.developmentPracticesMethodologies || []
    ),
    personal: detectArrayDifferences(
      baseResume.skills?.personalSkills || [], 
      optimizedResume.skills?.personalSkills || []
    )
  }

  const projectsDiffs = (baseResume.projects || []).map((baseProject, index) => {
    const optimizedProject = (optimizedResume.projects || [])[index]
    if (!optimizedProject) return null

    const nameDiff = detectTextDifferences(baseProject.name, optimizedProject.name)
    const techDiff = detectTextDifferences(baseProject.technologies, optimizedProject.technologies)
    const descDiff = detectTextDifferences(baseProject.description, optimizedProject.description)

    return {
      nameDiff,
      techDiff,
      descDiff,
      hasChanges: nameDiff.type !== 'unchanged' || techDiff.type !== 'unchanged' || descDiff.type !== 'unchanged'
    }
  }).filter(Boolean)

  // Handle education comparison
  const maxEducation = Math.max(
    baseResume.education?.length || 0,
    optimizedResume.education?.length || 0
  )
  
  const educationDiffs = Array.from({ length: maxEducation }, (_, index) => {
    const baseEdu = baseResume.education?.[index]
    const optimizedEdu = optimizedResume.education?.[index]
    
    if (!baseEdu && optimizedEdu) {
      // New education added
      return {
        degreeDiff: { type: 'added' as const, content: optimizedEdu.degree },
        institutionDiff: { type: 'added' as const, content: optimizedEdu.institution },
        locationDiff: { type: 'added' as const, content: optimizedEdu.location || '' },
        datesDiff: { type: 'added' as const, content: optimizedEdu.dates },
        achievementsDiffs: (optimizedEdu.achievements || []).map(a => ({ 
          type: 'added' as const, 
          content: a 
        })),
        hasChanges: true
      }
    }
    
    if (baseEdu && !optimizedEdu) {
      // Education removed
      return {
        degreeDiff: { type: 'removed' as const, content: baseEdu.degree },
        institutionDiff: { type: 'removed' as const, content: baseEdu.institution },
        locationDiff: { type: 'removed' as const, content: baseEdu.location || '' },
        datesDiff: { type: 'removed' as const, content: baseEdu.dates },
        achievementsDiffs: (baseEdu.achievements || []).map(a => ({ 
          type: 'removed' as const, 
          content: a 
        })),
        hasChanges: true
      }
    }
    
    if (baseEdu && optimizedEdu) {
      const degreeDiff = detectTextDifferences(baseEdu.degree, optimizedEdu.degree)
      const institutionDiff = detectTextDifferences(baseEdu.institution, optimizedEdu.institution)
      const locationDiff = detectTextDifferences(baseEdu.location || '', optimizedEdu.location || '')
      const datesDiff = detectTextDifferences(baseEdu.dates, optimizedEdu.dates)
      const achievementsDiffs = detectArrayDifferences(
        baseEdu.achievements || [], 
        optimizedEdu.achievements || []
      )
      
      return {
        degreeDiff,
        institutionDiff,
        locationDiff,
        datesDiff,
        achievementsDiffs,
        hasChanges: degreeDiff.type !== 'unchanged' || institutionDiff.type !== 'unchanged' || 
                    locationDiff.type !== 'unchanged' || datesDiff.type !== 'unchanged' ||
                    achievementsDiffs.some(a => a.type !== 'unchanged')
      }
    }
    
    return null
  }).filter(Boolean)

  const totalChanges = [
    ...experienceDiffs.flatMap(exp => [exp?.titleDiff, exp?.companyDiff, exp?.locationDiff, exp?.datesDiff, ...exp?.responsibilityDiffs || []]),
    ...Object.values(skillsDiffs).flat(),
    ...projectsDiffs.flatMap(proj => [proj?.nameDiff, proj?.techDiff, proj?.descDiff]),
    ...educationDiffs.flatMap(edu => [edu?.degreeDiff, edu?.institutionDiff, edu?.locationDiff, edu?.datesDiff, ...edu?.achievementsDiffs || []])
  ].filter(diff => diff && diff.type !== 'unchanged').length

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Switch 
              id="show-changes-only"
              checked={showOnlyChanges}
              onCheckedChange={setShowOnlyChanges}
            />
            <Label htmlFor="show-changes-only" className="flex items-center gap-2">
              {showOnlyChanges ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              Show only changes
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1">
              <div className={cn("w-3 h-3 rounded", DIFF_COLORS.added.legend)}></div>
              <span>Added content</span>
            </div>
            <div className="flex items-center gap-1">
              <div className={cn("w-3 h-3 rounded", DIFF_COLORS.modified.legend)}></div>
              <span>Modified content</span>
            </div>
            <div className="flex items-center gap-1">
              <div className={cn("w-3 h-3 rounded", DIFF_COLORS.removed.legend)}></div>
              <span>Removed content</span>
            </div>
            <div className="flex items-center gap-1">
              <div className={cn("w-3 h-3 rounded", DIFF_COLORS.unchanged.legend)}></div>
              <span>Unchanged</span>
            </div>
          </div>
        </AlertDescription>
      </Alert>


      {/* Experience Comparison */}
      {experienceDiffs.some(exp => !showOnlyChanges || exp?.hasChanges) && (
        <Card>
          <CardHeader>
            <CardTitle>Work Experience Changes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {experienceDiffs.map((expDiff, index) => {
              if (showOnlyChanges && !expDiff?.hasChanges) return null
              
              return (
                <div key={index} className="space-y-2 pb-6 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0">
                  <div className="space-y-2">
                    {/* Multi-column layout for basic fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {(!showOnlyChanges || expDiff?.titleDiff.type !== 'unchanged') && (
                        <div>
                          <h5 className="text-sm font-medium mb-1">Job Title:</h5>
                          {renderDiffText(expDiff?.titleDiff!)}
                        </div>
                      )}
                      
                      {(!showOnlyChanges || expDiff?.companyDiff.type !== 'unchanged') && (
                        <div>
                          <h5 className="text-sm font-medium mb-1">Company:</h5>
                          {renderDiffText(expDiff?.companyDiff!)}
                        </div>
                      )}
                      
                      {(!showOnlyChanges || expDiff?.locationDiff?.type !== 'unchanged') && expDiff?.locationDiff?.content && (
                        <div>
                          <h5 className="text-sm font-medium mb-1">Location:</h5>
                          {renderDiffText(expDiff?.locationDiff!)}
                        </div>
                      )}
                      
                      {(!showOnlyChanges || expDiff?.datesDiff?.type !== 'unchanged') && (
                        <div>
                          <h5 className="text-sm font-medium mb-1">Dates:</h5>
                          {renderDiffText(expDiff?.datesDiff!)}
                        </div>
                      )}
                    </div>
                    
                    {/* Full width for responsibilities */}
                    {expDiff?.responsibilityDiffs && expDiff.responsibilityDiffs.some(r => !showOnlyChanges || r.type !== 'unchanged') && (
                      <div>
                        <h5 className="font-medium mb-1">Responsibilities:</h5>
                        <div className="space-y-1">
                          {expDiff.responsibilityDiffs
                            .filter(respDiff => !showOnlyChanges || respDiff.type !== 'unchanged')
                            .map((respDiff, respIndex) => (
                              <div key={respIndex}>
                                {renderDiffText(respDiff)}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Education Comparison */}
      {educationDiffs.length> 0 && educationDiffs.some(edu => !showOnlyChanges || edu?.hasChanges) ? (
        <Card>
          <CardHeader>
            <CardTitle>Education Changes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {educationDiffs.map((eduDiff, index) => {
              if (showOnlyChanges && !eduDiff?.hasChanges) return null
              
              return (
                <div key={index} className="space-y-2 pb-6 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0">
                  <div className="space-y-2">
                    {/* Multi-column layout for basic fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {(!showOnlyChanges || eduDiff?.degreeDiff.type !== 'unchanged') && (
                        <div>
                          <h5 className="text-sm font-medium mb-1">Degree:</h5>
                          {renderDiffText(eduDiff?.degreeDiff!)}
                        </div>
                      )}
                      
                      {(!showOnlyChanges || eduDiff?.institutionDiff.type !== 'unchanged') && (
                        <div>
                          <h5 className="text-sm font-medium mb-1">Institution:</h5>
                          {renderDiffText(eduDiff?.institutionDiff!)}
                        </div>
                      )}
                      
                      {(!showOnlyChanges || eduDiff?.locationDiff?.type !== 'unchanged') && 
                       (eduDiff?.locationDiff?.content || (eduDiff?.locationDiff?.type === 'modified' && eduDiff?.locationDiff?.original)) && (
                        <div>
                          <h5 className="text-sm font-medium mb-1">Location:</h5>
                          {renderDiffText(eduDiff?.locationDiff!)}
                        </div>
                      )}
                      
                      {(!showOnlyChanges || eduDiff?.datesDiff.type !== 'unchanged') && (
                        <div>
                          <h5 className="text-sm font-medium mb-1">Dates:</h5>
                          {renderDiffText(eduDiff?.datesDiff!)}
                        </div>
                      )}
                    </div>
                    
                    {/* Full width for achievements */}
                    {eduDiff?.achievementsDiffs && 
                     eduDiff.achievementsDiffs.some(a => !showOnlyChanges || a.type !== 'unchanged') && (
                      <div>
                        <h5 className="text-sm font-medium mb-1">Achievements:</h5>
                        <div className="space-y-1">
                          {eduDiff.achievementsDiffs
                            .filter(achDiff => !showOnlyChanges || achDiff.type !== 'unchanged')
                            .map((achDiff, achIndex) => (
                              <div key={achIndex}>
                                {renderDiffText(achDiff)}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      ) : null}

      {/* Projects Comparison */}
      {projectsDiffs.length> 0 && projectsDiffs.some(proj => !showOnlyChanges || proj?.hasChanges) ? (
        <Card>
          <CardHeader>
            <CardTitle>Projects Changes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {projectsDiffs.map((projDiff, index) => {
              if (showOnlyChanges && !projDiff?.hasChanges) return null
              
              return (
                <div key={index} className="space-y-4 pb-6 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0">
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {(!showOnlyChanges || projDiff?.nameDiff.type !== 'unchanged') && (
                        <div>
                          <h5 className="text-sm font-medium mb-1">Project Name:</h5>
                          {renderDiffText(projDiff?.nameDiff!)}
                        </div>
                      )}
                      
                      {(!showOnlyChanges || projDiff?.techDiff.type !== 'unchanged') && (
                        <div>
                          <h5 className="text-sm font-medium mb-1">Technologies:</h5>
                          {renderDiffText(projDiff?.techDiff!)}
                        </div>
                      )}
                    </div>
                    
                    {(!showOnlyChanges || projDiff?.descDiff.type !== 'unchanged') && (
                      <div>
                        <h5 className="text-sm font-medium mb-1">Description:</h5>
                        {renderDiffText(projDiff?.descDiff!)}
                      </div>
                    )}
                  </div>
                  
                  {index < projectsDiffs.length - 1 && <hr className="my-6" />}
                </div>
              )
            })}
          </CardContent>
        </Card>
      ) : null}

      {/* Skills Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Skills Changes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Technical Skills */}
          {(() => {
            const baseSkills = baseResume.skills?.technicalSkills || []
            const optimizedSkills = optimizedResume.skills?.technicalSkills || []
            const hasChanges = JSON.stringify(baseSkills) !== JSON.stringify(optimizedSkills)
            
            if (showOnlyChanges && !hasChanges) return null
            
            // Calculate actual differences
            const removedSkills = baseSkills.filter(skill => !optimizedSkills.includes(skill))
            const addedSkills = optimizedSkills.filter(skill => !baseSkills.includes(skill))
            const unchangedSkills = optimizedSkills.filter(skill => baseSkills.includes(skill))
            
            return (
              <div className="pb-6 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0">
                <h4 className="font-semibold mb-4">Technical Skills</h4>
                {!hasChanges ? (
                  <div className="flex flex-wrap gap-2">
                    {optimizedSkills.map((skill, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary"
                        className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Show all skills in context */}
                    <div className="flex flex-wrap gap-2">
                      {/* Removed skills */}
                      {removedSkills.map((skill, index) => (
                        <Badge 
                          key={`removed-${index}`}
                          variant="outline" 
                          className="line-through text-red-600 dark:text-red-400 opacity-70 text-xs">
                          {skill}
                        </Badge>
                      ))}
                      
                      {/* Unchanged skills */}
                      {unchangedSkills.map((skill, index) => (
                        <Badge 
                          key={`unchanged-${index}`}
                          variant="secondary"
                          className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      
                      {/* Added skills */}
                      {addedSkills.map((skill, index) => (
                        <Badge 
                          key={`added-${index}`}
                          className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-0 text-xs">
                          <span className="text-green-600 dark:text-green-400 mr-1">+</span>
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    
                    {/* Summary */}
                    {(removedSkills.length> 0 || addedSkills.length> 0) && (
                      <div className="text-xs text-muted-foreground">
                        {removedSkills.length> 0 && <span className="text-red-600 dark:text-red-400">−{removedSkills.length} removed</span>}
                        {removedSkills.length> 0 && addedSkills.length> 0 && <span className="mx-2">•</span>}
                        {addedSkills.length> 0 && <span className="text-green-600 dark:text-green-400">+{addedSkills.length} added</span>}
                        {unchangedSkills.length> 0 && <span className="mx-2">•</span>}
                        {unchangedSkills.length> 0 && <span>{unchangedSkills.length} unchanged</span>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })()}

          {/* Development Practices & Methodologies */}
          {(() => {
            const baseSkills = baseResume.skills?.developmentPracticesMethodologies || []
            const optimizedSkills = optimizedResume.skills?.developmentPracticesMethodologies || []
            
            // Flatten skills arrays by splitting on line breaks
            const flattenSkills = (skills: string[]) => {
              return skills.flatMap(skill => 
                skill.split('\n').map(s => s.trim()).filter(s => s.length> 0)
              )
            }
            
            const hasChanges = JSON.stringify(flattenSkills(baseSkills)) !== JSON.stringify(flattenSkills(optimizedSkills))
            
            if (showOnlyChanges && !hasChanges) return null
            if (baseSkills.length === 0 && optimizedSkills.length === 0) return null
            
            const flatBaseSkills = flattenSkills(baseSkills)
            const flatOptimizedSkills = flattenSkills(optimizedSkills)
            
            // Calculate actual differences
            const removedSkills = flatBaseSkills.filter(skill => !flatOptimizedSkills.includes(skill))
            const addedSkills = flatOptimizedSkills.filter(skill => !flatBaseSkills.includes(skill))
            const unchangedSkills = flatOptimizedSkills.filter(skill => flatBaseSkills.includes(skill))
            
            return (
              <div className="pb-6 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0">
                <h4 className="font-semibold mb-4">Development Practices & Methodologies</h4>
                {!hasChanges ? (
                  <div className="flex flex-wrap gap-2">
                    {optimizedSkills.map((skill, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary"
                        className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Show all skills in context */}
                    <div className="flex flex-wrap gap-2">
                      {/* Removed skills */}
                      {removedSkills.map((skill, index) => (
                        <Badge 
                          key={`removed-${index}`}
                          variant="outline" 
                          className="line-through text-red-600 dark:text-red-400 opacity-70 text-xs">
                          {skill}
                        </Badge>
                      ))}
                      
                      {/* Unchanged skills */}
                      {unchangedSkills.map((skill, index) => (
                        <Badge 
                          key={`unchanged-${index}`}
                          variant="secondary"
                          className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      
                      {/* Added skills */}
                      {addedSkills.map((skill, index) => (
                        <Badge 
                          key={`added-${index}`}
                          className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-0 text-xs">
                          <span className="text-green-600 dark:text-green-400 mr-1">+</span>
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    
                    {/* Summary */}
                    {(removedSkills.length> 0 || addedSkills.length> 0) && (
                      <div className="text-xs text-muted-foreground">
                        {removedSkills.length> 0 && <span className="text-red-600 dark:text-red-400">−{removedSkills.length} removed</span>}
                        {removedSkills.length> 0 && addedSkills.length> 0 && <span className="mx-2">•</span>}
                        {addedSkills.length> 0 && <span className="text-green-600 dark:text-green-400">+{addedSkills.length} added</span>}
                        {unchangedSkills.length> 0 && <span className="mx-2">•</span>}
                        {unchangedSkills.length> 0 && <span>{unchangedSkills.length} unchanged</span>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })()}

          {/* Personal Skills */}
          {(() => {
            const baseSkills = baseResume.skills?.personalSkills || []
            const optimizedSkills = optimizedResume.skills?.personalSkills || []
            
            // Flatten skills arrays by splitting on line breaks
            const flattenSkills = (skills: string[]) => {
              return skills.flatMap(skill => 
                skill.split('\n').map(s => s.trim()).filter(s => s.length> 0)
              )
            }
            
            const hasChanges = JSON.stringify(flattenSkills(baseSkills)) !== JSON.stringify(flattenSkills(optimizedSkills))
            
            if (showOnlyChanges && !hasChanges) return null
            if (baseSkills.length === 0 && optimizedSkills.length === 0) return null
            
            const flatBaseSkills = flattenSkills(baseSkills)
            const flatOptimizedSkills = flattenSkills(optimizedSkills)
            
            // Calculate actual differences
            const removedSkills = flatBaseSkills.filter(skill => !flatOptimizedSkills.includes(skill))
            const addedSkills = flatOptimizedSkills.filter(skill => !flatBaseSkills.includes(skill))
            const unchangedSkills = flatOptimizedSkills.filter(skill => flatBaseSkills.includes(skill))
            
            return (
              <div>
                <h4 className="font-semibold mb-4">Personal Skills</h4>
                {!hasChanges ? (
                  <div className="flex flex-wrap gap-2">
                    {optimizedSkills.map((skill, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary"
                        className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Show all skills in context */}
                    <div className="flex flex-wrap gap-2">
                      {/* Removed skills */}
                      {removedSkills.map((skill, index) => (
                        <Badge 
                          key={`removed-${index}`}
                          variant="outline" 
                          className="line-through text-red-600 dark:text-red-400 opacity-70 text-xs">
                          {skill}
                        </Badge>
                      ))}
                      
                      {/* Unchanged skills */}
                      {unchangedSkills.map((skill, index) => (
                        <Badge 
                          key={`unchanged-${index}`}
                          variant="secondary"
                          className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      
                      {/* Added skills */}
                      {addedSkills.map((skill, index) => (
                        <Badge 
                          key={`added-${index}`}
                          className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-0 text-xs">
                          <span className="text-green-600 dark:text-green-400 mr-1">+</span>
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    
                    {/* Summary */}
                    {(removedSkills.length> 0 || addedSkills.length> 0) && (
                      <div className="text-xs text-muted-foreground">
                        {removedSkills.length> 0 && <span className="text-red-600 dark:text-red-400">−{removedSkills.length} removed</span>}
                        {removedSkills.length> 0 && addedSkills.length> 0 && <span className="mx-2">•</span>}
                        {addedSkills.length> 0 && <span className="text-green-600 dark:text-green-400">+{addedSkills.length} added</span>}
                        {unchangedSkills.length> 0 && <span className="mx-2">•</span>}
                        {unchangedSkills.length> 0 && <span>{unchangedSkills.length} unchanged</span>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })()}
        </CardContent>
      </Card>
    </div>
  )
}