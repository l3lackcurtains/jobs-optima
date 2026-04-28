'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { PrimaryButton, GhostButton } from '@/components/custom/Button';
import { Search, Zap, Wrench, Users, BookOpen, Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddSkillsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skillType: 'technical' | 'development' | 'personal';
  currentSkills: string[];
  allKeywords: string[];
  keywordsByCategory?: {
    actionVerbs?: string[];
    hardSkills?: string[];
    softSkills?: string[];
    knowledge?: string[];
  };
  onAdd: (skills: string[]) => void;
}

export function AddSkillsDialog({
  open,
  onOpenChange,
  skillType,
  currentSkills,
  allKeywords,
  keywordsByCategory,
  onAdd,
}: AddSkillsDialogProps) {
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [customSkill, setCustomSkill] = useState('');

  // Get skill type label
  const getSkillTypeLabel = () => {
    switch (skillType) {
      case 'technical':
        return 'Technical Skills';
      case 'development':
        return 'Development Practices & Methodologies';
      case 'personal':
        return 'Personal Skills';
    }
  };

  // Filter keywords based on skill type
  const relevantKeywords = useMemo(() => {
    if (!keywordsByCategory) return allKeywords;

    switch (skillType) {
      case 'technical':
        // For technical skills, focus on hard skills and knowledge
        return [
          ...(keywordsByCategory.hardSkills || []),
          ...(keywordsByCategory.knowledge || [])
        ];
      case 'personal':
        // For personal skills, focus on soft skills
        return [
          ...(keywordsByCategory.softSkills || []),
          ...(keywordsByCategory.actionVerbs || [])
        ];
      case 'development':
        // For development practices, mix of knowledge and some hard skills
        return [
          ...(keywordsByCategory.knowledge || []),
          ...(keywordsByCategory.hardSkills?.filter(skill => 
            skill.toLowerCase().includes('agile') ||
            skill.toLowerCase().includes('scrum') ||
            skill.toLowerCase().includes('devops') ||
            skill.toLowerCase().includes('ci/cd') ||
            skill.toLowerCase().includes('test') ||
            skill.toLowerCase().includes('review')
          ) || [])
        ];
      default:
        return allKeywords;
    }
  }, [allKeywords, keywordsByCategory, skillType]);

  // Organize keywords by status and category
  const organizedKeywords = useMemo(() => {
    const existing = new Set(currentSkills.map(s => s.toLowerCase()));
    
    const missing: Record<string, string[]> = {
      hardSkills: [],
      softSkills: [],
      knowledge: [],
      actionVerbs: []
    };
    
    const alreadyAdded: string[] = [];

    // Categorize keywords
    if (keywordsByCategory) {
      Object.entries(keywordsByCategory).forEach(([category, keywords]) => {
        keywords?.forEach(keyword => {
          if (existing.has(keyword.toLowerCase())) {
            alreadyAdded.push(keyword);
          } else if (relevantKeywords.includes(keyword)) {
            missing[category as keyof typeof missing].push(keyword);
          }
        });
      });
    } else {
      // Fallback if no categories provided
      relevantKeywords.forEach(keyword => {
        if (existing.has(keyword.toLowerCase())) {
          alreadyAdded.push(keyword);
        } else {
          missing.hardSkills.push(keyword);
        }
      });
    }

    // Filter by search term
    const filterBySearch = (items: string[]) => {
      if (!searchTerm) return items;
      return items.filter(item => 
        item.toLowerCase().includes(searchTerm.toLowerCase())
      );
    };

    return {
      missing: {
        hardSkills: filterBySearch(missing.hardSkills),
        softSkills: filterBySearch(missing.softSkills),
        knowledge: filterBySearch(missing.knowledge),
        actionVerbs: filterBySearch(missing.actionVerbs)
      },
      alreadyAdded: filterBySearch(alreadyAdded)
    };
  }, [currentSkills, relevantKeywords, keywordsByCategory, searchTerm]);

  const handleToggle = (skill: string) => {
    setSelectedSkills(prev => {
      const newSet = new Set(prev);
      if (newSet.has(skill)) {
        newSet.delete(skill);
      } else {
        newSet.add(skill);
      }
      return newSet;
    });
  };

  const handleSelectAll = (skills: string[]) => {
    setSelectedSkills(prev => {
      const newSet = new Set(prev);
      skills.forEach(skill => newSet.add(skill));
      return newSet;
    });
  };

  const handleDeselectAll = (skills: string[]) => {
    setSelectedSkills(prev => {
      const newSet = new Set(prev);
      skills.forEach(skill => newSet.delete(skill));
      return newSet;
    });
  };

  const handleAddCustom = () => {
    if (customSkill.trim() && !currentSkills.includes(customSkill.trim())) {
      setSelectedSkills(prev => {
        const newSet = new Set(prev);
        newSet.add(customSkill.trim());
        return newSet;
      });
      setCustomSkill('');
    }
  };

  const handleConfirm = () => {
    if (selectedSkills.size > 0) {
      onAdd(Array.from(selectedSkills));
      setSelectedSkills(new Set());
      setSearchTerm('');
      setCustomSkill('');
      onOpenChange(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'hardSkills':
        return <Wrench className="w-3.5 h-3.5 text-blue-600" />;
      case 'softSkills':
        return <Users className="w-3.5 h-3.5 text-purple-600" />;
      case 'knowledge':
        return <BookOpen className="w-3.5 h-3.5 text-green-600" />;
      case 'actionVerbs':
        return <Zap className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return null;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'hardSkills':
        return 'Hard Skills';
      case 'softSkills':
        return 'Soft Skills';
      case 'knowledge':
        return 'Knowledge';
      case 'actionVerbs':
        return 'Action Verbs';
      default:
        return category;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add {getSkillTypeLabel()}</DialogTitle>
          <DialogDescription>
            Select multiple skills to add to your resume. Keywords from the job are highlighted.
          </DialogDescription>
        </DialogHeader>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Custom Skill Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Add custom skill..."
            value={customSkill}
            onChange={(e) => setCustomSkill(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddCustom()}
          />
          <PrimaryButton
            size="sm"
            onClick={handleAddCustom}
            disabled={!customSkill.trim() || currentSkills.includes(customSkill.trim())}
          >
            <Plus className="w-4 h-4" />
          </PrimaryButton>
        </div>

        {/* Selected Count */}
        {selectedSkills.size > 0 && (
          <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
              {selectedSkills.size} skill{selectedSkills.size !== 1 ? 's' : ''} selected
            </span>
            <GhostButton
              size="sm"
              onClick={() => setSelectedSkills(new Set())}
            >
              Clear All
            </GhostButton>
          </div>
        )}

        {/* Skills List */}
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Missing Keywords (Recommended) */}
            {Object.entries(organizedKeywords.missing).map(([category, skills]) => {
              if (skills.length === 0) return null;
              
              return (
                <div key={category} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(category)}
                      <h3 className="font-medium text-sm">{getCategoryLabel(category)}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {skills.length} available
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <GhostButton
                        size="sm"
                        onClick={() => handleSelectAll(skills)}
                      >
                        Select All
                      </GhostButton>
                      <GhostButton
                        size="sm"
                        onClick={() => handleDeselectAll(skills)}
                      >
                        Deselect All
                      </GhostButton>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <div
                        key={skill}
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => handleToggle(skill)}
                      >
                        <Checkbox
                          checked={selectedSkills.has(skill)}
                          onCheckedChange={() => handleToggle(skill)}
                        />
                        <Badge
                          variant="outline"
                          className={cn(
                            "cursor-pointer transition-colors",
                            selectedSkills.has(skill) &&
                              "bg-blue-50 dark:bg-blue-950/20 border-blue-500"
                          )}
                        >
                          {skill}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Already Added Skills */}
            {organizedKeywords.alreadyAdded.length > 0 && (
              <div className="space-y-3 opacity-50">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-green-600" />
                  <h3 className="font-medium text-sm">Already Added</h3>
                  <Badge variant="secondary" className="text-xs">
                    {organizedKeywords.alreadyAdded.length} skills
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {organizedKeywords.alreadyAdded.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="cursor-not-allowed"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <GhostButton onClick={() => onOpenChange(false)}>
            Cancel
          </GhostButton>
          <PrimaryButton
            onClick={handleConfirm}
            disabled={selectedSkills.size === 0}
          >
            Add {selectedSkills.size} Skill{selectedSkills.size !== 1 ? 's' : ''}
          </PrimaryButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}