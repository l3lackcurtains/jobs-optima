'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Github, 
  Calendar,
  Building,
  GraduationCap,
  Award,
  User,
  Briefcase
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { PrimaryButton, OutlineButton, GhostButton, IconButton } from '@/components/custom/Button'
import { CustomTab } from '@/components/custom/Tab'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Resume } from '@/types/resume'
import { cn } from '@/lib/utils'

interface ResumePreviewProps {
  resume: Resume
  showActions?: boolean
  onEdit?: () => void
  onDownload?: () => void
  className?: string
}

export default function ResumePreview({ 
  resume, 
  showActions = true, 
  onEdit, 
  onDownload, 
  className 
}: ResumePreviewProps) {
  const [activeTab, setActiveTab] = useState('preview')

  const formatDate = (dateString: string | Date) => {
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString
      return format(date, 'MMM yyyy')
    } catch {
      return 'Present'
    }
  }

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '')
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`
    }
    return phone
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header Actions */}
      {showActions && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Resume Preview</h2>
            <p className="text-muted-foreground">
              {resume.title || resume.contactInfo?.name || 'Untitled Resume'}
            </p>
          </div>
          <div className="flex space-x-2">
            {onEdit && (
              <OutlineButton onClick={onEdit}>
                Edit Resume
              </OutlineButton>
            )}
            {onDownload && (
              <PrimaryButton onClick={onDownload}>
                Download PDF
              </PrimaryButton>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <CustomTab
        tabs={[
          {
            value: "preview",
            label: "Preview",
            content: (
              <Card className="max-w-4xl mx-auto">
                <CardContent className="p-8 space-y-8">
                  {/* Personal Information */}
                  {resume.contactInfo && (
                    <div className="text-center border-b pb-6">
                      <h1 className="text-3xl font-bold mb-2">
                        {resume.contactInfo.name || 'Name Not Provided'}
                      </h1>
                      
                      <div className="flex flex-wrap justify-center items-center gap-4 text-sm text-muted-foreground">
                        {resume.contactInfo.email && (
                          <div className="flex items-center">
                            <Mail className="w-4 h-4 mr-1" />
                            {resume.contactInfo.email}
                          </div>
                        )}
                        {resume.contactInfo.phone && (
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-1" />
                            {formatPhoneNumber(resume.contactInfo.phone)}
                          </div>
                        )}
                        {resume.contactInfo.location && (
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {resume.contactInfo.location}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap justify-center items-center gap-4 text-sm text-muted-foreground mt-2">
                        {resume.contactInfo?.personalWebsite && (
                          <div className="flex items-center">
                            <Globe className="w-4 h-4 mr-1" />
                            <a href={resume.contactInfo.personalWebsite} className="hover:underline">
                              Website
                            </a>
                          </div>
                        )}
                        {resume.contactInfo?.github && (
                          <div className="flex items-center">
                            <Github className="w-4 h-4 mr-1" />
                            <a href={resume.contactInfo.github} className="hover:underline">
                              GitHub
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}


                  {/* Experience */}
                  {resume.experience && resume.experience.length > 0 && (
                    <div>
                      <h2 className="text-xl font-semibold mb-4 flex items-center">
                        <Briefcase className="w-5 h-5 mr-2" />
                        Work Experience
                      </h2>
                      <div className="space-y-6">
                        {resume.experience.map((exp, index) => (
                          <div key={index} className="relative pl-8 border-l-2 border-muted">
                            <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-2"></div>
                            <div className="space-y-2">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                <h3 className="font-medium text-lg">{exp.title}</h3>
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Calendar className="w-4 h-4 mr-1" />
                                  {exp.dates}
                                </div>
                              </div>
                              <div className="flex items-center text-muted-foreground">
                                <Building className="w-4 h-4 mr-1" />
                                <span className="font-medium">{exp.company}</span>
                                {exp.location && <span className="ml-2">• {exp.location}</span>}
                              </div>
                              {exp.responsibilities && exp.responsibilities.length > 0 && (
                                <div className="prose prose-sm max-w-none">
                                  <ul className="text-sm space-y-1">
                                    {exp.responsibilities.map((responsibility, idx) => (
                                      <li key={idx}>{responsibility}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {resume.education && resume.education.length > 0 && (
                    <div>
                      <h2 className="text-xl font-semibold mb-4 flex items-center">
                        <GraduationCap className="w-5 h-5 mr-2" />
                        Education
                      </h2>
                      <div className="space-y-4">
                        {resume.education.map((edu, index) => (
                          <div key={index} className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{edu.degree}</h3>
                              <p className="text-muted-foreground">{edu.institution}</p>
                              {edu.location && (
                                <p className="text-sm text-muted-foreground">{edu.location}</p>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground text-right">
                              <div>{edu.dates}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  {resume.skills && (resume.skills.technicalSkills?.length || resume.skills.personalSkills?.length || resume.skills.developmentPracticesMethodologies?.length) && (
                    <div>
                      <h2 className="text-xl font-semibold mb-4 flex items-center">
                        <Award className="w-5 h-5 mr-2" />
                        Skills
                      </h2>
                      <div className="space-y-3">
                        {resume.skills.technicalSkills?.length > 0 && (
                          <div>
                            <h3 className="font-medium mb-2">Technical Skills</h3>
                            <div className="flex flex-wrap gap-2">
                              {resume.skills.technicalSkills.map((skill, index) => (
                                <Badge key={index} variant="secondary">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {resume.skills.developmentPracticesMethodologies?.length > 0 && (
                          <div>
                            <h3 className="font-medium mb-2">Development Practices & Methodologies</h3>
                            <div className="flex flex-wrap gap-2">
                              {resume.skills.developmentPracticesMethodologies.map((skill, index) => (
                                <Badge key={index} variant="secondary">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {resume.skills.personalSkills?.length > 0 && (
                          <div>
                            <h3 className="font-medium mb-2">Personal Skills</h3>
                            <div className="flex flex-wrap gap-2">
                              {resume.skills.personalSkills.map((skill, index) => (
                                <Badge key={index} variant="secondary">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Certifications - commented out until defined in Resume type
                  {resume.certifications && resume.certifications.length > 0 && (
                    <div>
                      <h2 className="text-xl font-semibold mb-4 flex items-center">
                        <Award className="w-5 h-5 mr-2" />
                        Certifications
                      </h2>
                      <div className="space-y-2">
                        {resume.certifications.map((cert, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <div>
                              <h3 className="font-medium">{cert.name}</h3>
                              <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                            </div>
                            {cert.date && (
                              <div className="text-sm text-muted-foreground">
                                {formatDate(cert.date)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )} */}
                </CardContent>
              </Card>
            )
          },
          {
            value: "raw",
            label: "Raw Data",
            content: (
              <Card>
                <CardHeader>
                  <CardTitle>Raw Resume Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
                      {JSON.stringify(resume, null, 2)}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            )
          }
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="grid"
      />
    </div>
  )
}