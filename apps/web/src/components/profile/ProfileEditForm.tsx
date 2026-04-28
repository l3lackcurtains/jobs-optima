"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { Profile } from "@/types/profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, GripVertical } from "lucide-react";

export interface ProfileEditFormRef {
  submit: () => Promise<Partial<Profile> | null>;
  cancel: () => void;
}

interface ProfileEditFormProps {
  profile: Profile;
  tab: "resume" | "additional";
}

// Common options for job applications
const WORK_AUTHORIZATION_OPTIONS = [
  "US Citizen",
  "Green Card Holder",
  "H1B Visa",
  "H4 Visa (EAD)",
  "L1 Visa",
  "L2 Visa (EAD)",
  "F1 Visa (OPT)",
  "F1 Visa (CPT)",
  "TN Visa",
  "O1 Visa",
  "E3 Visa",
  "Other Work Visa",
  "Require Sponsorship"
];

const GENDER_OPTIONS = [
  "Male",
  "Female",
  "Non-binary",
  "Prefer not to say",
  "Prefer to self-describe"
];

const RACE_OPTIONS = [
  "American Indian or Alaska Native",
  "Asian",
  "Black or African American",
  "Hispanic or Latino",
  "Native Hawaiian or Other Pacific Islander",
  "White",
  "Two or More Races",
  "Prefer not to say"
];

const VETERAN_STATUS_OPTIONS = [
  "I am not a protected veteran",
  "I identify as one or more of the classifications of protected veteran",
  "I don't wish to answer"
];

const DISABILITY_STATUS_OPTIONS = [
  "Yes, I have a disability (or previously had a disability)",
  "No, I don't have a disability",
  "I don't wish to answer"
];

const WORK_TYPE_OPTIONS = [
  "Remote",
  "Hybrid",
  "On-site",
  "Flexible"
];

const JOB_TYPE_OPTIONS = [
  "Full-time",
  "Part-time",
  "Contract",
  "Temporary",
  "Internship",
  "Freelance"
];

const SEXUAL_ORIENTATION_OPTIONS = [
  "Heterosexual or Straight",
  "Gay or Lesbian",
  "Bisexual",
  "Queer",
  "Prefer to self-describe",
  "Prefer not to say"
];

export const ProfileEditForm = forwardRef<ProfileEditFormRef, ProfileEditFormProps>(
  ({ profile, tab }, ref) => {
    const [formData, setFormData] = useState<Partial<Profile>>(profile);

    useImperativeHandle(ref, () => ({
      submit: async () => {
        // Return data in Profile schema format (no transformation needed)
        const submissionData: any = {
          profileName: formData.profileName,
          isDefault: formData.isDefault,
          contactInfo: formData.contactInfo,
          experience: formData.experience,
          projects: formData.projects,
          education: formData.education,
          skills: formData.skills,
          category: formData.category,
          
          // Professional fields
          professionalSummary: formData.professionalSummary,
          objective: formData.objective,
          totalYearsExperience: formData.totalYearsExperience,
          currentSalary: formData.currentSalary,
          desiredSalary: formData.desiredSalary,
          workAuthorization: formData.workAuthorization,
          requiresSponsorship: formData.requiresSponsorship,
          availableStartDate: formData.availableStartDate ? 
            (typeof formData.availableStartDate === 'string' ? 
              formData.availableStartDate : 
              new Date(formData.availableStartDate).toISOString()) : 
            undefined,
          preferredWorkTypes: formData.preferredWorkTypes,
          preferredJobTypes: formData.preferredJobTypes,
          achievements: formData.achievements,
          
          // EEO fields
          authorizedToWorkInUS: formData.authorizedToWorkInUS,
          gender: formData.gender,
          race: formData.race,
          veteranStatus: formData.veteranStatus,
          disabilityStatus: formData.disabilityStatus,
          lgbtq: formData.lgbtq,
          sexualOrientation: formData.sexualOrientation,
          
          // Other fields
          isActive: formData.isActive,
          usageCount: formData.usageCount,
          lastUsedAt: formData.lastUsedAt,
          linkedResumeId: formData.linkedResumeId,
          lastImportedFromResume: formData.lastImportedFromResume
        };
        
        // Remove undefined values
        Object.keys(submissionData).forEach(key => {
          if (submissionData[key] === undefined) {
            delete submissionData[key];
          }
        });
        
        return submissionData;
      },
      cancel: () => {
        setFormData(profile);
      },
    }));

    const handleInputChange = (field: keyof Profile, value: any) => {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    };

    const handleNestedChange = (parent: keyof Profile, field: string, value: any) => {
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent] as any),
          [field]: value,
        },
      }));
    };

    // Helper functions for array fields
    const addExperience = () => {
      const newExp = {
        title: "",
        company: "",
        location: "",
        dates: "",
        responsibilities: [],
      };
      handleInputChange("experience", [...(formData.experience || []), newExp]);
    };

    const updateExperience = (index: number, field: string, value: any) => {
      const updated = [...(formData.experience || [])];
      updated[index] = { ...updated[index], [field]: value };
      handleInputChange("experience", updated);
    };

    const removeExperience = (index: number) => {
      const updated = (formData.experience || []).filter((_, i) => i !== index);
      handleInputChange("experience", updated);
    };

    const addEducation = () => {
      const newEdu = {
        institution: "",
        location: "",
        dates: "",
        degree: "",
        achievements: [],
      };
      handleInputChange("education", [...(formData.education || []), newEdu]);
    };

    const updateEducation = (index: number, field: string, value: any) => {
      const updated = [...(formData.education || [])];
      updated[index] = { ...updated[index], [field]: value };
      handleInputChange("education", updated);
    };

    const removeEducation = (index: number) => {
      const updated = (formData.education || []).filter((_, i) => i !== index);
      handleInputChange("education", updated);
    };

    const addProject = () => {
      const newProj = {
        name: "",
        technologies: "",
        description: "",
      };
      handleInputChange("projects", [...(formData.projects || []), newProj]);
    };

    const updateProject = (index: number, field: string, value: any) => {
      const updated = [...(formData.projects || [])];
      updated[index] = { ...updated[index], [field]: value };
      handleInputChange("projects", updated);
    };

    const removeProject = (index: number) => {
      const updated = (formData.projects || []).filter((_, i) => i !== index);
      handleInputChange("projects", updated);
    };

    if (tab === "resume") {
      return (
        <div className="space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.contactInfo?.name || ""}
                    onChange={(e) => handleNestedChange("contactInfo", "name", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="preferredFirstName">Preferred First Name</Label>
                  <Input
                    id="preferredFirstName"
                    value={formData.contactInfo?.preferredFirstName || ""}
                    onChange={(e) => handleNestedChange("contactInfo", "preferredFirstName", e.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.contactInfo?.email || ""}
                    onChange={(e) => handleNestedChange("contactInfo", "email", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={formData.contactInfo?.phone || ""}
                    onChange={(e) => handleNestedChange("contactInfo", "phone", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.contactInfo?.location || ""}
                    onChange={(e) => handleNestedChange("contactInfo", "location", e.target.value)}
                    placeholder="City, State"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.contactInfo?.city || ""}
                    onChange={(e) => handleNestedChange("contactInfo", "city", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.contactInfo?.state || ""}
                    onChange={(e) => handleNestedChange("contactInfo", "state", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    value={formData.contactInfo?.zipCode || ""}
                    onChange={(e) => handleNestedChange("contactInfo", "zipCode", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.contactInfo?.country || ""}
                    onChange={(e) => handleNestedChange("contactInfo", "country", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    value={formData.contactInfo?.linkedin || ""}
                    onChange={(e) => handleNestedChange("contactInfo", "linkedin", e.target.value)}
                    placeholder="linkedin.com/in/..."
                  />
                </div>
                <div>
                  <Label htmlFor="github">GitHub</Label>
                  <Input
                    id="github"
                    value={formData.contactInfo?.github || ""}
                    onChange={(e) => handleNestedChange("contactInfo", "github", e.target.value)}
                    placeholder="github.com/..."
                  />
                </div>
                <div>
                  <Label htmlFor="personalWebsite">Personal Website</Label>
                  <Input
                    id="personalWebsite"
                    value={formData.contactInfo?.personalWebsite || ""}
                    onChange={(e) => handleNestedChange("contactInfo", "personalWebsite", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Professional Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.professionalSummary || ""}
                onChange={(e) => handleInputChange("professionalSummary", e.target.value)}
                rows={4}
                placeholder="Write a brief professional summary..."
              />
            </CardContent>
          </Card>

          {/* Experience */}
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                Work Experience
                <Button onClick={addExperience} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Experience
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(formData.experience || []).map((exp, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="grid grid-cols-2 gap-3 flex-1">
                        <Input
                          placeholder="Job Title"
                          value={exp.title}
                          onChange={(e) => updateExperience(index, "title", e.target.value)}
                        />
                        <Input
                          placeholder="Company"
                          value={exp.company}
                          onChange={(e) => updateExperience(index, "company", e.target.value)}
                        />
                        <Input
                          placeholder="Location"
                          value={exp.location}
                          onChange={(e) => updateExperience(index, "location", e.target.value)}
                        />
                        <Input
                          placeholder="Dates (e.g., Jan 2020 - Present)"
                          value={exp.dates}
                          onChange={(e) => updateExperience(index, "dates", e.target.value)}
                        />
                      </div>
                      <Button
                        onClick={() => removeExperience(index)}
                        size="sm"
                        variant="ghost"
                        className="ml-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea
                      placeholder="Responsibilities (one per line)"
                      value={exp.responsibilities?.join("\n") || ""}
                      onChange={(e) => updateExperience(index, "responsibilities", 
                        e.target.value.split("\n").filter(Boolean)
                      )}
                      rows={3}
                    />
                  </div>
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* Education */}
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                Education
                <Button onClick={addEducation} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Education
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(formData.education || []).map((edu, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="grid grid-cols-2 gap-3 flex-1">
                        <Input
                          placeholder="Institution"
                          value={edu.institution}
                          onChange={(e) => updateEducation(index, "institution", e.target.value)}
                        />
                        <Input
                          placeholder="Degree"
                          value={edu.degree}
                          onChange={(e) => updateEducation(index, "degree", e.target.value)}
                        />
                        <Input
                          placeholder="Location"
                          value={edu.location}
                          onChange={(e) => updateEducation(index, "location", e.target.value)}
                        />
                        <Input
                          placeholder="Dates"
                          value={edu.dates}
                          onChange={(e) => updateEducation(index, "dates", e.target.value)}
                        />
                      </div>
                      <Button
                        onClick={() => removeEducation(index)}
                        size="sm"
                        variant="ghost"
                        className="ml-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea
                      placeholder="Achievements (one per line)"
                      value={edu.achievements?.join("\n") || ""}
                      onChange={(e) => updateEducation(index, "achievements", 
                        e.target.value.split("\n").filter(Boolean)
                      )}
                      rows={2}
                    />
                  </div>
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* Projects */}
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                Projects
                <Button onClick={addProject} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Project
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(formData.projects || []).map((proj, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="grid grid-cols-2 gap-3 flex-1">
                        <Input
                          placeholder="Project Name"
                          value={proj.name}
                          onChange={(e) => updateProject(index, "name", e.target.value)}
                        />
                        <Input
                          placeholder="Technologies"
                          value={proj.technologies}
                          onChange={(e) => updateProject(index, "technologies", e.target.value)}
                        />
                      </div>
                      <Button
                        onClick={() => removeProject(index)}
                        size="sm"
                        variant="ghost"
                        className="ml-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea
                      placeholder="Project Description"
                      value={proj.description}
                      onChange={(e) => updateProject(index, "description", e.target.value)}
                      rows={2}
                    />
                  </div>
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="technicalSkills">Technical Skills (comma-separated)</Label>
                <Textarea
                  id="technicalSkills"
                  placeholder="e.g., JavaScript, React, Node.js, Python, AWS"
                  value={formData.skills?.technicalSkills?.join(", ") || ""}
                  onChange={(e) => handleNestedChange("skills", "technicalSkills", 
                    e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                  )}
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="softSkills">Soft Skills (comma-separated)</Label>
                <Textarea
                  id="softSkills"
                  placeholder="e.g., Leadership, Communication, Problem Solving"
                  value={formData.skills?.softSkills?.join(", ") || ""}
                  onChange={(e) => handleNestedChange("skills", "softSkills", 
                    e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                  )}
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="methodologies">Development Practices & Methodologies (comma-separated)</Label>
                <Textarea
                  id="methodologies"
                  placeholder="e.g., Agile, Scrum, CI/CD, TDD"
                  value={formData.skills?.developmentPracticesMethodologies?.join(", ") || ""}
                  onChange={(e) => handleNestedChange("skills", "developmentPracticesMethodologies", 
                    e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                  )}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Additional tab
    return (
      <div className="space-y-6">
        {/* Professional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Professional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="objective">Career Objective</Label>
              <Textarea
                id="objective"
                value={formData.objective || ""}
                onChange={(e) => handleInputChange("objective", e.target.value)}
                rows={3}
                placeholder="Your career goals and objectives..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currentCompany">Current Company</Label>
                <Input
                  id="currentCompany"
                  value={formData.currentCompany || ""}
                  onChange={(e) => handleInputChange("currentCompany", e.target.value)}
                  placeholder="Your current employer"
                />
              </div>
              <div>
                <Label htmlFor="currentLocation">Current Location</Label>
                <Input
                  id="currentLocation"
                  value={formData.currentLocation || ""}
                  onChange={(e) => handleInputChange("currentLocation", e.target.value)}
                  placeholder="Current city, state/country"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="experience">Years of Experience</Label>
                <Input
                  id="experience"
                  type="number"
                  min="0"
                  max="50"
                  value={formData.totalYearsExperience || ""}
                  onChange={(e) => handleInputChange("totalYearsExperience", Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="workAuth">Work Authorization *</Label>
                <Select
                  value={formData.workAuthorization || ""}
                  onValueChange={(value) => handleInputChange("workAuthorization", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select work authorization" />
                  </SelectTrigger>
                  <SelectContent>
                    {WORK_AUTHORIZATION_OPTIONS.map(option => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Salary Information */}
        <Card>
          <CardHeader>
            <CardTitle>Salary Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="currentSalary">Current Salary (Annual USD)</Label>
              <Input
                id="currentSalary"
                type="number"
                min="0"
                value={formData.currentSalary || ""}
                onChange={(e) => handleInputChange("currentSalary", Number(e.target.value))}
                placeholder="e.g., 120000"
              />
            </div>
            <div>
              <Label htmlFor="desiredSalary">Desired Salary (Annual USD)</Label>
              <Input
                id="desiredSalary"
                type="number"
                min="0"
                value={formData.desiredSalary || ""}
                onChange={(e) => handleInputChange("desiredSalary", Number(e.target.value))}
                placeholder="e.g., 150000"
              />
            </div>
          </CardContent>
        </Card>

        {/* Work Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Work Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="requiresSponsorship">Requires Sponsorship</Label>
                <Select
                  value={formData.requiresSponsorship?.toString() || "false"}
                  onValueChange={(value) => handleInputChange("requiresSponsorship", value === "true")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">No</SelectItem>
                    <SelectItem value="true">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="availableStartDate">Available Start Date</Label>
                <Input
                  id="availableStartDate"
                  type="date"
                  value={formData.availableStartDate ? new Date(formData.availableStartDate).toISOString().split('T')[0] : ""}
                  onChange={(e) => handleInputChange("availableStartDate", e.target.value ? new Date(e.target.value) : undefined)}
                />
              </div>
            </div>
            
            <div>
              <Label>Preferred Work Types</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {WORK_TYPE_OPTIONS.map(option => (
                  <label key={option} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.preferredWorkTypes?.includes(option) || false}
                      onChange={(e) => {
                        const current = formData.preferredWorkTypes || [];
                        if (e.target.checked) {
                          handleInputChange("preferredWorkTypes", [...current, option]);
                        } else {
                          handleInputChange("preferredWorkTypes", current.filter(t => t !== option));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <Label>Preferred Job Types</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {JOB_TYPE_OPTIONS.map(option => (
                  <label key={option} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.preferredJobTypes?.includes(option) || false}
                      onChange={(e) => {
                        const current = formData.preferredJobTypes || [];
                        if (e.target.checked) {
                          handleInputChange("preferredJobTypes", [...current, option]);
                        } else {
                          handleInputChange("preferredJobTypes", current.filter(t => t !== option));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle>Key Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={5}
              placeholder="List your key achievements (one per line)..."
              value={formData.achievements?.join("\n") || ""}
              onChange={(e) => handleInputChange("achievements", 
                e.target.value.split("\n").filter(Boolean)
              )}
            />
          </CardContent>
        </Card>

        {/* EEO Information */}
        <Card>
          <CardHeader>
            <CardTitle>Equal Employment Opportunity (Optional)</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              This information is used for EEO reporting and will be kept confidential
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="authorizedToWorkInUS">Authorized to Work in US</Label>
                <Select
                  value={formData.authorizedToWorkInUS?.toString() || "not_specified"}
                  onValueChange={(value) => handleInputChange("authorizedToWorkInUS", 
                    value === "not_specified" ? undefined : value === "true"
                  )}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_specified">Prefer not to say</SelectItem>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={formData.gender || "not_specified"}
                  onValueChange={(value) => handleInputChange("gender", value === "not_specified" ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_specified">Prefer not to say</SelectItem>
                    {GENDER_OPTIONS.map(option => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="race">Race/Ethnicity</Label>
                <Select
                  value={formData.race || "not_specified"}
                  onValueChange={(value) => handleInputChange("race", value === "not_specified" ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select race/ethnicity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_specified">Prefer not to say</SelectItem>
                    {RACE_OPTIONS.map(option => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="veteranStatus">Veteran Status</Label>
                <Select
                  value={formData.veteranStatus || "not_specified"}
                  onValueChange={(value) => handleInputChange("veteranStatus", value === "not_specified" ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select veteran status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_specified">Prefer not to say</SelectItem>
                    {VETERAN_STATUS_OPTIONS.map(option => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="disabilityStatus">Disability Status</Label>
                <Select
                  value={formData.disabilityStatus || "not_specified"}
                  onValueChange={(value) => handleInputChange("disabilityStatus", value === "not_specified" ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select disability status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_specified">Prefer not to say</SelectItem>
                    {DISABILITY_STATUS_OPTIONS.map(option => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="lgbtq">LGBTQ+ Identity</Label>
                <Select
                  value={formData.lgbtq?.toString() || "not_specified"}
                  onValueChange={(value) => handleInputChange("lgbtq", 
                    value === "not_specified" ? undefined : value === "true"
                  )}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_specified">Prefer not to say</SelectItem>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="sexualOrientation">Sexual Orientation</Label>
                <Select
                  value={formData.sexualOrientation || "not_specified"}
                  onValueChange={(value) => handleInputChange("sexualOrientation", value === "not_specified" ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sexual orientation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_specified">Prefer not to say</SelectItem>
                    {SEXUAL_ORIENTATION_OPTIONS.map(option => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
);

ProfileEditForm.displayName = "ProfileEditForm";