"use client";

import Image from "next/image";
import {
  MapPin,
  Mail,
  Phone,
  Globe,
  Calendar,
  Building,
  GraduationCap,
  Code,
  Briefcase,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PrimaryButton, OutlineButton, GhostButton, IconButton } from "@/components/custom/Button";
import { Separator } from "@/components/ui/separator";
import { Resume } from "@/types/resume";
import { getMatchedKeywords } from '@/lib/utils/keyword-matcher';
import { HighlightedText } from '@/lib/utils/text-highlighter';

interface OptimizedResumeViewProps {
  resume: Resume;
  highlightedKeywords?: Set<string>;
  allKeywordsForHighlight?: Set<string>;
}

export default function OptimizedResumeView({
  resume,
  highlightedKeywords = new Set(),
  allKeywordsForHighlight = new Set(),
}: OptimizedResumeViewProps) {

  // Helper function to highlight keywords in text
  const highlightKeywords = (text: string) => {
    // Use text mode for view page (colored text, not background)
    return (
      <HighlightedText 
        text={text} 
        keywords={highlightedKeywords} 
        mode="text"
        alwaysHighlight={allKeywordsForHighlight}
      />
    );
  };

  return (
    <div className="space-y-6">

      {/* Contact Information */}
      <Card>
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            {/* DiceBear Avatar */}
            <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-orange-200 dark:border-orange-800 relative">
              <Image
                src={`https://api.dicebear.com/9.x/bottts/svg?seed=${resume._id || "default"}&backgroundColor=f97316&textColor=ffffff`}
                alt={resume.contactInfo?.name || "User Avatar"}
                width={80}
                height={80}
                className="object-cover"
                unoptimized
              />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {resume.contactInfo?.name || "Name not provided"}
              </h1>
              <div className="flex items-center justify-center gap-2 mt-3">
                <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                  Optimized Resume
                </Badge>
                <Badge variant="outline">{resume.category}</Badge>
              </div>
            </div>

            {/* Contact Details */}
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              {resume.contactInfo?.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {resume.contactInfo.location}
                </div>
              )}
              {resume.contactInfo?.email && (
                <div className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {resume.contactInfo.email}
                </div>
              )}
              {resume.contactInfo?.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {resume.contactInfo.phone}
                </div>
              )}
            </div>

            {/* Social Links */}
            {(resume.contactInfo?.linkedin ||
              resume.contactInfo?.github ||
              resume.contactInfo?.personalWebsite) && (
              <div className="flex justify-center gap-3">
                {resume.contactInfo.linkedin && (
                  <OutlineButton size="sm" asChild>
                    <a
                      href={resume.contactInfo.linkedin}
                      target="_blank"
                      rel="noopener noreferrer">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      LinkedIn
                    </a>
                  </OutlineButton>
                )}
                {resume.contactInfo.github && (
                  <OutlineButton size="sm" asChild>
                    <a
                      href={resume.contactInfo.github}
                      target="_blank"
                      rel="noopener noreferrer">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                      GitHub
                    </a>
                  </OutlineButton>
                )}
                {resume.contactInfo.personalWebsite && (
                  <OutlineButton size="sm" asChild>
                    <a
                      href={resume.contactInfo.personalWebsite}
                      target="_blank"
                      rel="noopener noreferrer">
                      <Globe className="w-4 h-4 mr-2" />
                      Website
                    </a>
                  </OutlineButton>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {/* Experience */}
        {resume.experience && resume.experience.length> 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-orange-600" />
                Work Experience
                <Badge variant="outline" className="ml-auto">
                  Optimized
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {resume.experience.map((exp, index) => (
                <div key={index} className="relative">
                  {index> 0 && <Separator className="mb-6" />}
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {highlightKeywords(exp.title)}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {exp.dates}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Building className="w-4 h-4" />
                      <span className="font-medium">
                        {highlightKeywords(exp.company)}
                      </span>
                      {exp.location && (
                        <>
                          <span>•</span>
                          <span>{exp.location}</span>
                        </>
                      )}
                    </div>
                    <ul className="mt-3 space-y-2">
                      {exp.responsibilities.map((resp, respIndex) => (
                        <li key={respIndex} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300">
                            {highlightKeywords(resp)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Projects */}
        {resume.projects && resume.projects.length> 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5 text-orange-600" />
                Projects
                <Badge variant="outline" className="ml-auto">
                  Optimized
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {resume.projects.map((project, index) => (
                <div key={index} className="space-y-2">
                  {index> 0 && <Separator className="mb-4" />}
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {highlightKeywords(project.name)}
                  </h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    {highlightKeywords(project.technologies)}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">
                    {highlightKeywords(project.description)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Education */}
        {resume.education && resume.education.length> 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <GraduationCap className="w-5 h-5 text-orange-600" />
                Education
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {resume.education.map((edu, index) => (
                <div key={index} className="relative">
                  {index> 0 && <Separator className="mb-6" />}
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {highlightKeywords(edu.degree)}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {edu.dates}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <GraduationCap className="w-4 h-4" />
                      <span className="font-medium">
                        {highlightKeywords(edu.institution)}
                      </span>
                      {edu.location && (
                        <>
                          <span>•</span>
                          <span>{edu.location}</span>
                        </>
                      )}
                    </div>
                    {edu.achievements && edu.achievements.length> 0 && (
                      <ul className="mt-3 space-y-2">
                        {edu.achievements.map((achievement, achIndex) => (
                          <li key={achIndex} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300">
                              {highlightKeywords(achievement)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Skills */}
        {resume.skills && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Code className="w-5 h-5 text-orange-600" />
                Skills
                <Badge variant="outline" className="ml-auto text-xs">
                  Enhanced
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {resume.skills.technicalSkills &&
                resume.skills.technicalSkills.length> 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Technical Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {resume.skills.technicalSkills.map((skill, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          {highlightKeywords(skill)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

              {resume.skills.developmentPracticesMethodologies &&
                resume.skills.developmentPracticesMethodologies.length> 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Development Practices & Methodologies
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {resume.skills.developmentPracticesMethodologies.map(
                        (skill, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            {highlightKeywords(skill)}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                )}

              {resume.skills.personalSkills &&
                resume.skills.personalSkills.length> 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Personal Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {resume.skills.personalSkills.map((skill, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          {highlightKeywords(skill)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
