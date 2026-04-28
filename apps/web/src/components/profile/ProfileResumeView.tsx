"use client";

import { Profile } from "@/types/profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Mail,
  Phone,
  Github,
  Linkedin,
  Globe,
  Twitter,
  Calendar,
  Building,
  GraduationCap,
  Code,
  User,
  Briefcase,
} from "lucide-react";

interface ProfileResumeViewProps {
  profile: Profile;
}

export function ProfileResumeView({ profile }: ProfileResumeViewProps) {
  return (
    <div className="space-y-6">
      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{profile.contactInfo?.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 text-sm">
            {profile.contactInfo?.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{profile.contactInfo.location}</span>
              </div>
            )}
            {profile.contactInfo?.email && (
              <div className="flex items-center gap-1">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{profile.contactInfo.email}</span>
              </div>
            )}
            {profile.contactInfo?.phone && (
              <div className="flex items-center gap-1">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{profile.contactInfo.phone}</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm">
            {profile.contactInfo?.linkedin && (
              <div className="flex items-center gap-1">
                <Linkedin className="h-4 w-4 text-muted-foreground" />
                <span>{profile.contactInfo.linkedin}</span>
              </div>
            )}
            {profile.contactInfo?.github && (
              <div className="flex items-center gap-1">
                <Github className="h-4 w-4 text-muted-foreground" />
                <span>{profile.contactInfo.github}</span>
              </div>
            )}
            {profile.contactInfo?.personalWebsite && (
              <div className="flex items-center gap-1">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span>{profile.contactInfo.personalWebsite}</span>
              </div>
            )}
            {profile.contactInfo?.twitter && (
              <div className="flex items-center gap-1">
                <Twitter className="h-4 w-4 text-muted-foreground" />
                <span>{profile.contactInfo.twitter}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Professional Summary */}
      {profile.professionalSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Professional Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{profile.professionalSummary}</p>
          </CardContent>
        </Card>
      )}

      {/* Experience */}
      {profile.experience && profile.experience.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Experience
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {profile.experience.map((exp, index) => (
              <div key={index} className="space-y-2">
                <div>
                  <h3 className="font-semibold">{exp.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building className="h-3 w-3" />
                    <span>{exp.company}</span>
                    <span>•</span>
                    <MapPin className="h-3 w-3" />
                    <span>{exp.location}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <Calendar className="h-3 w-3" />
                    <span>{exp.dates}</span>
                  </div>
                </div>
                {exp.responsibilities && exp.responsibilities.length > 0 && (
                  <ul className="list-disc list-inside space-y-1 text-sm ml-2">
                    {exp.responsibilities.map((resp, i) => (
                      <li key={i}>{resp}</li>
                    ))}
                  </ul>
                )}
                {index < profile.experience.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Education */}
      {profile.education && profile.education.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Education
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.education.map((edu, index) => (
              <div key={index} className="space-y-2">
                <div>
                  <h3 className="font-semibold">{edu.degree}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <GraduationCap className="h-3 w-3" />
                    <span>{edu.institution}</span>
                    <span>•</span>
                    <MapPin className="h-3 w-3" />
                    <span>{edu.location}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <Calendar className="h-3 w-3" />
                    <span>{edu.dates}</span>
                  </div>
                </div>
                {edu.achievements && edu.achievements.length > 0 && (
                  <ul className="list-disc list-inside space-y-1 text-sm ml-2">
                    {edu.achievements.map((achievement, i) => (
                      <li key={i}>{achievement}</li>
                    ))}
                  </ul>
                )}
                {index < profile.education.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Projects */}
      {profile.projects && profile.projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Projects
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.projects.map((project, index) => (
              <div key={index} className="space-y-2">
                <h3 className="font-semibold">{project.name}</h3>
                <div className="flex flex-wrap gap-2">
                  {project.technologies.split(",").map((tech, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {tech.trim()}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm">{project.description}</p>
                {index < profile.projects.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Skills */}
      {profile.skills && (
        <Card>
          <CardHeader>
            <CardTitle>Skills</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.skills.technicalSkills && profile.skills.technicalSkills.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Technical Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.technicalSkills.map((skill, i) => (
                    <Badge key={i} variant="default">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {profile.skills.developmentPracticesMethodologies && 
             profile.skills.developmentPracticesMethodologies.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Development Practices & Methodologies</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.developmentPracticesMethodologies.map((skill, i) => (
                    <Badge key={i} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {profile.skills.personalSkills && profile.skills.personalSkills.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Personal Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.personalSkills.map((skill, i) => (
                    <Badge key={i} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}