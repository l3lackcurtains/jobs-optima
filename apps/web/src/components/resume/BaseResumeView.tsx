'use client'

import { format } from 'date-fns'
import { 
  MapPin, 
  Mail, 
  Phone, 
  Github, 
  Linkedin, 
  Globe, 
  Calendar,
  Building,
  GraduationCap,
  Code,
  User,
  Briefcase,
  Award,
  Zap,
  Download,
  Edit
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PrimaryButton, OutlineButton, GhostButton, IconButton } from '@/components/custom/Button'
import { Separator } from '@/components/ui/separator'
import { Resume } from '@/types/resume'
import { HighlightedText } from '@/lib/utils/text-highlighter'

interface BaseResumeViewProps {
  resume: Resume
  onEdit?: () => void
  onDownload?: () => void
  highlightedKeywords?: Set<string>
  allKeywordsForHighlight?: Set<string>
}

export default function BaseResumeView({ 
  resume, 
  onEdit, 
  onDownload,
  highlightedKeywords = new Set(),
  allKeywordsForHighlight = new Set()
}: BaseResumeViewProps) {
  const formatDate = (dateString: string | Date) => {
    try {
      return format(new Date(dateString), 'MMMM d, yyyy')
    } catch {
      return 'Unknown date'
    }
  }


  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Actions */}
      <div className="flex justify-end space-x-3">
        <OutlineButton onClick={onDownload}>
          <Download className="w-4 h-4 mr-2" />
          Download PDF
        </OutlineButton>
        <PrimaryButton onClick={onEdit}>
          <Edit className="w-4 h-4 mr-2" />
          Edit Resume
        </PrimaryButton>
      </div>

      {/* Contact Information Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className="w-24 h-24 mx-auto rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <User className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </div>
            
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {resume.contactInfo?.name || 'Name not provided'}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
                Professional Resume
              </p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  Base Resume
                </Badge>
                <Badge variant="outline">
                  {resume.category}
                </Badge>
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
            {(resume.contactInfo?.linkedin || resume.contactInfo?.github || resume.contactInfo?.personalWebsite) && (
              <div className="flex justify-center gap-3">
                {resume.contactInfo.linkedin && (
                  <OutlineButton size="sm" asChild>
                    <a href={resume.contactInfo.linkedin} target="_blank" rel="noopener noreferrer">
                      <Linkedin className="w-4 h-4 mr-2" />
                      LinkedIn
                    </a>
                  </OutlineButton>
                )}
                {resume.contactInfo.github && (
                  <OutlineButton size="sm" asChild>
                    <a href={resume.contactInfo.github} target="_blank" rel="noopener noreferrer">
                      <Github className="w-4 h-4 mr-2" />
                      GitHub
                    </a>
                  </OutlineButton>
                )}
                {resume.contactInfo.personalWebsite && (
                  <OutlineButton size="sm" asChild>
                    <a href={resume.contactInfo.personalWebsite} target="_blank" rel="noopener noreferrer">
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
          {resume.experience && resume.experience.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  Work Experience
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {resume.experience.map((exp, index) => (
                  <div key={index} className="relative">
                    {index > 0 && <Separator className="mb-6" />}
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {exp.title}
                        </h3>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          {exp.dates}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Building className="w-4 h-4" />
                        <span className="font-medium">{exp.company}</span>
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
                              <HighlightedText 
                                text={resp} 
                                keywords={highlightedKeywords} 
                                mode="text"
                                alwaysHighlight={allKeywordsForHighlight}
                              />
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
          {resume.projects && resume.projects.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5 text-blue-600" />
                  Projects
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {resume.projects.map((project, index) => (
                  <div key={index} className="space-y-2">
                    {index > 0 && <Separator className="mb-4" />}
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {project.name}
                    </h3>
                    <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                      {project.technologies}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">
                      <HighlightedText 
                        text={project.description} 
                        keywords={highlightedKeywords} 
                        mode="text"
                        alwaysHighlight={allKeywordsForHighlight}
                      />
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}


          {/* Education */}
          {resume.education && resume.education.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                  Education
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {resume.education.map((edu, index) => (
                  <div key={index} className="relative">
                    {index > 0 && <Separator className="mb-6" />}
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {edu.degree}
                        </h3>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          {edu.dates}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <GraduationCap className="w-4 h-4" />
                        <span className="font-medium">{edu.institution}</span>
                        {edu.location && (
                          <>
                            <span>•</span>
                            <span>{edu.location}</span>
                          </>
                        )}
                      </div>
                      {edu.achievements && edu.achievements.length > 0 && (
                        <ul className="mt-3 space-y-2">
                          {edu.achievements.map((achievement, achIndex) => (
                            <li key={achIndex} className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                              <span className="text-gray-700 dark:text-gray-300">
                                <HighlightedText 
                                  text={achievement} 
                                  keywords={highlightedKeywords} 
                                  mode="text"
                                  alwaysHighlight={allKeywordsForHighlight}
                                />
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
                  <Code className="w-5 h-5 text-blue-600" />
                  Skills
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {resume.skills.technicalSkills && resume.skills.technicalSkills.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Technical Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {resume.skills.technicalSkills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          <HighlightedText 
                            text={skill} 
                            keywords={highlightedKeywords} 
                            mode="text"
                            alwaysHighlight={allKeywordsForHighlight}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {resume.skills.developmentPracticesMethodologies && resume.skills.developmentPracticesMethodologies.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Development Practices & Methodologies
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {resume.skills.developmentPracticesMethodologies.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          <HighlightedText 
                            text={skill} 
                            keywords={highlightedKeywords} 
                            mode="text"
                            alwaysHighlight={allKeywordsForHighlight}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {resume.skills.personalSkills && resume.skills.personalSkills.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Personal Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {resume.skills.personalSkills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          <HighlightedText 
                            text={skill} 
                            keywords={highlightedKeywords} 
                            mode="text"
                            alwaysHighlight={allKeywordsForHighlight}
                          />
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
  )
}