"use client";

import { Profile } from "@/types/profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DollarSign,
  Calendar,
  Briefcase,
  CheckCircle,
  Globe,
  User,
  Shield,
  MapPin,
  Phone,
  Mail,
  Link,
} from "lucide-react";

interface ProfileAdditionalViewProps {
  profile: Profile;
}

export function ProfileAdditionalView({ profile }: ProfileAdditionalViewProps) {
  // Helper to format boolean values
  const formatBoolean = (value?: boolean) => {
    if (value === undefined) return "Not specified";
    return value ? "Yes" : "No";
  };

  return (
    <div className="space-y-6">
      {/* Contact & Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Contact & Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {profile.contactInfo?.name && (
              <div>
                <h3 className="text-sm font-semibold mb-1">Full Name</h3>
                <p className="text-sm text-muted-foreground">{profile.contactInfo.name}</p>
              </div>
            )}
            {profile.contactInfo?.email && (
              <div>
                <h3 className="text-sm font-semibold mb-1">Email</h3>
                <p className="text-sm text-muted-foreground">{profile.contactInfo.email}</p>
              </div>
            )}
            {profile.contactInfo?.phone && (
              <div>
                <h3 className="text-sm font-semibold mb-1">Phone</h3>
                <p className="text-sm text-muted-foreground">{profile.contactInfo.phone}</p>
              </div>
            )}
            {profile.contactInfo?.location && (
              <div>
                <h3 className="text-sm font-semibold mb-1">Location</h3>
                <p className="text-sm text-muted-foreground">{profile.contactInfo.location}</p>
              </div>
            )}
          </div>

          {/* Address Details */}
          {(profile.contactInfo?.street || profile.contactInfo?.city || profile.contactInfo?.state || profile.contactInfo?.zipCode) && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-2">Address Details</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {profile.contactInfo?.street && (
                    <div>
                      <span className="text-muted-foreground">Street: </span>
                      {profile.contactInfo.street}
                      {profile.contactInfo.apartment && `, ${profile.contactInfo.apartment}`}
                    </div>
                  )}
                  {profile.contactInfo?.city && (
                    <div>
                      <span className="text-muted-foreground">City: </span>
                      {profile.contactInfo.city}
                    </div>
                  )}
                  {profile.contactInfo?.state && (
                    <div>
                      <span className="text-muted-foreground">State: </span>
                      {profile.contactInfo.state}
                    </div>
                  )}
                  {profile.contactInfo?.zipCode && (
                    <div>
                      <span className="text-muted-foreground">ZIP: </span>
                      {profile.contactInfo.zipCode}
                    </div>
                  )}
                  {profile.contactInfo?.country && (
                    <div>
                      <span className="text-muted-foreground">Country: </span>
                      {profile.contactInfo.country}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Online Presence */}
          {(profile.contactInfo?.linkedin || profile.contactInfo?.github || profile.contactInfo?.personalWebsite || profile.contactInfo?.twitter) && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-2">Online Presence</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {profile.contactInfo?.linkedin && (
                    <div>
                      <span className="text-muted-foreground">LinkedIn: </span>
                      <a href={profile.contactInfo.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Profile
                      </a>
                    </div>
                  )}
                  {profile.contactInfo?.github && (
                    <div>
                      <span className="text-muted-foreground">GitHub: </span>
                      <a href={profile.contactInfo.github} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Profile
                      </a>
                    </div>
                  )}
                  {profile.contactInfo?.personalWebsite && (
                    <div>
                      <span className="text-muted-foreground">Website: </span>
                      <a href={profile.contactInfo.personalWebsite} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Visit
                      </a>
                    </div>
                  )}
                  {profile.contactInfo?.twitter && (
                    <div>
                      <span className="text-muted-foreground">Twitter: </span>
                      <a href={profile.contactInfo.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Profile
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Professional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Professional Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.professionalSummary && (
            <div>
              <h3 className="text-sm font-semibold mb-1">Professional Summary</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{profile.professionalSummary}</p>
            </div>
          )}
          
          {profile.objective && (
            <div>
              <h3 className="text-sm font-semibold mb-1">Career Objective</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{profile.objective}</p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            {profile.totalYearsExperience !== undefined && (
              <div>
                <h3 className="text-sm font-semibold mb-1">Total Experience</h3>
                <p className="text-sm text-muted-foreground">
                  {profile.totalYearsExperience} years
                </p>
              </div>
            )}
            
            {profile.workAuthorization && (
              <div>
                <h3 className="text-sm font-semibold mb-1">Work Authorization</h3>
                <p className="text-sm text-muted-foreground">{profile.workAuthorization}</p>
              </div>
            )}
            
            <div>
              <h3 className="text-sm font-semibold mb-1">Requires Sponsorship</h3>
              <p className="text-sm text-muted-foreground">
                {formatBoolean(profile.requiresSponsorship)}
              </p>
            </div>
            
            {profile.availableStartDate && (
              <div>
                <h3 className="text-sm font-semibold mb-1">Available From</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(profile.availableStartDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Salary Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Salary Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-semibold mb-1">Current Salary</h3>
            <p className="text-sm text-muted-foreground">
              {profile.currentSalary ? `$${profile.currentSalary.toLocaleString()}` : "Not specified"}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-1">Desired Salary</h3>
            <p className="text-sm text-muted-foreground">
              {profile.desiredSalary ? `$${profile.desiredSalary.toLocaleString()}` : "Not specified"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Work Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Work Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-2">Preferred Work Types</h3>
            <div className="flex flex-wrap gap-2">
              {profile.preferredWorkTypes && profile.preferredWorkTypes.length > 0 ? (
                profile.preferredWorkTypes.map((type, i) => (
                  <Badge key={i} variant="secondary">
                    {type}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">Not specified</span>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold mb-2">Preferred Job Types</h3>
            <div className="flex flex-wrap gap-2">
              {profile.preferredJobTypes && profile.preferredJobTypes.length > 0 ? (
                profile.preferredJobTypes.map((type, i) => (
                  <Badge key={i} variant="outline">
                    {type}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">Not specified</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profile.achievements && profile.achievements.length > 0 ? (
            <ul className="list-disc list-inside space-y-2">
              {profile.achievements.map((achievement, i) => (
                <li key={i} className="text-sm">{achievement}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No achievements specified</p>
          )}
        </CardContent>
      </Card>

      {/* Equal Employment Opportunity Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Equal Employment Opportunity Information
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            This information is used for EEO reporting and is kept confidential
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-semibold mb-1">Authorized to Work in US</h3>
              <p className="text-muted-foreground">
                {profile.authorizedToWorkInUS === undefined 
                  ? "Not specified" 
                  : profile.authorizedToWorkInUS ? "Yes" : "No"}
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-1">Gender</h3>
              <p className="text-muted-foreground">{profile.gender || "Not specified"}</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-1">Race/Ethnicity</h3>
              <p className="text-muted-foreground">{profile.race || "Not specified"}</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-1">Veteran Status</h3>
              <p className="text-muted-foreground">{profile.veteranStatus || "Not specified"}</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-1">Disability Status</h3>
              <p className="text-muted-foreground">{profile.disabilityStatus || "Not specified"}</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-1">LGBTQ+ Identity</h3>
              <p className="text-muted-foreground">
                {profile.lgbtq === undefined 
                  ? "Not specified" 
                  : profile.lgbtq ? "Yes" : "No"}
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-1">Sexual Orientation</h3>
              <p className="text-muted-foreground">{profile.sexualOrientation || "Not specified"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-semibold mb-1">Profile Name</h3>
              <p className="text-muted-foreground">{profile.profileName}</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-1">Category</h3>
              <Badge variant="outline">{profile.category || "General"}</Badge>
            </div>
            
            <div>
              <h3 className="font-semibold mb-1">Default Profile</h3>
              <p className="text-muted-foreground">{formatBoolean(profile.isDefault)}</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-1">Status</h3>
              <Badge variant={profile.isActive ? "default" : "secondary"}>
                {profile.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            
            {profile.usageCount !== undefined && (
              <div>
                <h3 className="font-semibold mb-1">Usage Count</h3>
                <p className="text-muted-foreground">{profile.usageCount}</p>
              </div>
            )}
            
            {profile.lastUsedAt && (
              <div>
                <h3 className="font-semibold mb-1">Last Used</h3>
                <p className="text-muted-foreground">
                  {new Date(profile.lastUsedAt).toLocaleDateString()}
                </p>
              </div>
            )}
            
            {profile.linkedResumeId && (
              <div>
                <h3 className="font-semibold mb-1">Linked Resume</h3>
                <p className="text-muted-foreground">Yes</p>
              </div>
            )}
            
            {profile.lastImportedFromResume && (
              <div>
                <h3 className="font-semibold mb-1">Last Imported</h3>
                <p className="text-muted-foreground">
                  {new Date(profile.lastImportedFromResume).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Custom Fields */}
      {profile.customFields && Object.keys(profile.customFields).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Additional Custom Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-muted p-3 rounded-md overflow-auto">
              {JSON.stringify(profile.customFields, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}