"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save, X, Download } from "lucide-react";
import { Profile } from "@/types/profile";
import { ProfileResumeView } from "./ProfileResumeView";
import { ProfileAdditionalView } from "./ProfileAdditionalView";
import { ProfileEditForm, ProfileEditFormRef } from "./ProfileEditForm";
import { toast } from "sonner";

interface UnifiedProfileViewProps {
  profile: Profile;
  onSave: (updatedProfile: Partial<Profile>) => Promise<void>;
  onDownload?: () => void;
}

export default function UnifiedProfileView({
  profile: initialProfile,
  onSave,
  onDownload,
}: UnifiedProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [isSaving, setIsSaving] = useState(false);
  const formRef = useRef<ProfileEditFormRef>(null);

  const handleEditToggle = (checked: boolean) => {
    setIsEditing(checked);
  };

  const handleSave = async () => {
    if (!formRef.current) return;
    
    setIsSaving(true);
    try {
      const updatedData = await formRef.current.submit();
      if (updatedData) {
        await onSave(updatedData);
        setProfile({ ...profile, ...updatedData });
        setIsEditing(false);
        toast.success("Profile saved successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setProfile(initialProfile);
    setIsEditing(false);
  };

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="sticky top-4 z-10 flex justify-between items-center bg-card/95 backdrop-blur-sm p-4 rounded-lg border border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50">
            <Switch
              id="edit-mode"
              checked={isEditing}
              onCheckedChange={handleEditToggle}
              className="data-[state=checked]:bg-orange-600"
            />
            <Label
              htmlFor="edit-mode"
              className="cursor-pointer font-medium text-sm"
            >
              {isEditing ? "Edit Mode" : "View Mode"}
            </Label>
          </div>
          {isEditing && (
            <div className="text-xs text-muted-foreground px-2 py-1 bg-orange-50 dark:bg-orange-950/30 rounded-md border">
              Make your changes and click Save
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {onDownload && (
            <Button variant="outline" onClick={onDownload} size="sm" className="hover:bg-blue-50 dark:hover:bg-blue-950/30">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          )}
          {isEditing && (
            <>
              <Button 
                onClick={handleSave} 
                disabled={isSaving} 
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="ghost" onClick={handleCancel} disabled={isSaving} size="sm" className="hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="resume" className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md bg-muted/50 p-1 h-10">
          <TabsTrigger value="resume" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-950 data-[state=active]:shadow-sm">
            Resume Info
          </TabsTrigger>
          <TabsTrigger value="additional" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-950 data-[state=active]:shadow-sm">
            Additional Fields
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resume" className="pt-4">
          {isEditing ? (
            <ProfileEditForm
              ref={formRef}
              profile={profile}
              tab="resume"
            />
          ) : (
            <ProfileResumeView profile={profile} />
          )}
        </TabsContent>

        <TabsContent value="additional" className="pt-4">
          {isEditing ? (
            <ProfileEditForm
              ref={formRef}
              profile={profile}
              tab="additional"
            />
          ) : (
            <ProfileAdditionalView profile={profile} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}