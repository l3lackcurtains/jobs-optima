"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, FileText, Calendar, User } from "lucide-react";
import { toast } from "sonner";
import { useProfiles } from "@/hooks/api/use-profiles";
import { useResumes } from "@/hooks/api/use-resumes";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface CreateProfileDialogProps {
  children?: React.ReactNode;
}

export function CreateProfileDialog({ children }: CreateProfileDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [selectedResumeId, setSelectedResumeId] = useState("");
  
  const { createProfileFromResume } = useProfiles();
  const { resumes, isLoading: isLoadingResumes } = useResumes(1, 100);

  // Auto-select first resume when loaded
  useEffect(() => {
    if (resumes && resumes.length > 0 && !selectedResumeId) {
      setSelectedResumeId(resumes[0]._id);
    }
  }, [resumes, selectedResumeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profileName.trim()) {
      toast.error("Please enter a profile name");
      return;
    }

    if (!selectedResumeId) {
      toast.error("Please select a resume");
      return;
    }

    setIsCreating(true);
    try {
      const newProfile = await createProfileFromResume.mutateAsync({
        profileName: profileName.trim(),
        resumeId: selectedResumeId,
      });

      toast.success("Profile created successfully from resume!");
      setOpen(false);
      setProfileName("");
      router.push(`/profiles/${newProfile._id}`);
    } catch (error) {
      toast.error("Failed to create profile");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Profile
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              Create Profile from Resume
            </DialogTitle>
            <DialogDescription>
              Select a resume to create a new profile with all the information imported automatically.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4 flex-1 overflow-hidden">
            {/* Profile Name Input */}
            <div className="space-y-2">
              <Label htmlFor="profileName" className="text-sm font-medium">Profile Name *</Label>
              <Input
                id="profileName"
                placeholder="e.g., Senior Developer Profile, Product Manager Profile"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                autoFocus
                className="transition-all focus:ring-2 focus:ring-blue-500/20"
              />
              <p className="text-xs text-muted-foreground">
                Give your profile a descriptive name to easily identify it later
              </p>
            </div>

            {/* Resume Selection */}
            <div className="space-y-2 flex-1 overflow-hidden">
              <Label className="text-sm font-medium">Select Resume *</Label>
              <ScrollArea className="h-[300px] w-full rounded-lg border border-border/50 p-4 bg-muted/20">
                {isLoadingResumes ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : resumes && resumes.length > 0 ? (
                  <RadioGroup 
                    value={selectedResumeId} 
                    onValueChange={setSelectedResumeId}
                    className="space-y-3"
                  >
                    {resumes.map((resume) => (
                      <div
                        key={resume._id}
                        className={`relative flex items-start space-x-3 rounded-lg border p-4 cursor-pointer transition-all duration-200 ${
                          selectedResumeId === resume._id 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-sm' 
                            : 'border-border/50 hover:bg-accent hover:border-border'
                        }`}
                      >
                        <RadioGroupItem value={resume._id} id={resume._id} className="mt-1" />
                        <Label
                          htmlFor={resume._id}
                          className="flex-1 cursor-pointer space-y-2"
                        >
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-md bg-green-50 dark:bg-green-950/30">
                              <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                            <span className="font-medium text-foreground">
                              {resume.title || resume.contactInfo?.name || "Untitled Resume"}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {resume.contactInfo?.name && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {resume.contactInfo.name}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(resume.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </div>
                            {resume.category && (
                              <Badge variant="outline" className="text-xs">
                                {resume.category}
                              </Badge>
                            )}
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No resumes found</p>
                    <p className="text-xs mt-1">Upload a resume first to create a profile</p>
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>

          <DialogFooter className="flex-shrink-0 pt-4 border-t border-border/50">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isCreating}
              className="hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isCreating || !selectedResumeId || !profileName.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50"
            >
              {isCreating ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Create Profile
                </div>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}