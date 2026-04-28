'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, AlertCircle, XCircle, Clock, FileText, User, Briefcase, GraduationCap, Award } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PrimaryButton, OutlineButton, GhostButton, IconButton } from '@/components/custom/Button'
import { Resume } from '@/types/resume'
import { cn } from '@/lib/utils'

interface ParsingFeedbackProps {
  resume?: Resume
  isParsingComplete?: boolean
  parsingError?: string | null
  onContinue?: () => void
  onRetry?: () => void
  className?: string
}

interface ParsedSection {
  name: string
  icon: React.ReactNode
  status: 'found' | 'missing' | 'partial'
  count?: number
  details?: string[]
}

export default function ParsingFeedback({
  resume,
  isParsingComplete = false,
  parsingError,
  onContinue,
  onRetry,
  className
}: ParsingFeedbackProps) {
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    'Uploading file...',
    'Extracting text content...',
    'Parsing personal information...',
    'Identifying work experience...',
    'Extracting education details...',
    'Finding skills and certifications...',
    'Finalizing resume structure...'
  ]

  useEffect(() => {
    if (!isParsingComplete && !parsingError) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev>= 100) {
            clearInterval(interval)
            return 100
          }
          return prev + (100 / steps.length / 10)
        })
        
        setCurrentStep(prev => {
          const newStep = Math.floor(progress / (100 / steps.length))
          return Math.min(newStep, steps.length - 1)
        })
      }, 200)

      return () => clearInterval(interval)
    } else if (isParsingComplete) {
      setProgress(100)
      setCurrentStep(steps.length - 1)
    }
  }, [isParsingComplete, parsingError, progress, steps.length])

  const analyzeParsedSections = (resume: Resume): ParsedSection[] => {
    const sections: ParsedSection[] = [
      {
        name: 'Personal Information',
        icon: <User className="w-4 h-4" />,
        status: resume.contactInfo?.name && resume.contactInfo?.email ? 'found' : 'partial',
        details: [
          resume.contactInfo?.name ? `Name: ${resume.contactInfo.name}` : 'Name: Not found',
          resume.contactInfo?.email ? `Email: ${resume.contactInfo.email}` : 'Email: Not found',
          resume.contactInfo?.phone ? `Phone: ${resume.contactInfo.phone}` : 'Phone: Not found'
        ].filter(Boolean)
      },
      {
        name: 'Work Experience',
        icon: <Briefcase className="w-4 h-4" />,
        status: resume.experience?.length ? 'found' : 'missing',
        count: resume.experience?.length || 0,
        details: resume.experience?.slice(0, 3).map(exp => 
          `${exp.title} at ${exp.company}`
        )
      },
      {
        name: 'Education',
        icon: <GraduationCap className="w-4 h-4" />,
        status: resume.education?.length ? 'found' : 'missing',
        count: resume.education?.length || 0,
        details: resume.education?.slice(0, 3).map(edu => 
          `${edu.degree} from ${edu.institution}`
        )
      },
      {
        name: 'Skills',
        icon: <Award className="w-4 h-4" />,
        status: resume.skills ? 'found' : 'missing',
        count: (resume.skills?.technicalSkills?.length || 0) + (resume.skills?.personalSkills?.length || 0) + (resume.skills?.developmentPracticesMethodologies?.length || 0),
        details: [
          ...(resume.skills?.technicalSkills?.slice(0, 4) || []),
          `+${Math.max(0, (resume.skills?.technicalSkills?.length || 0) - 4)} more...`
        ].filter((detail, index) => index === 0 || (resume.skills?.technicalSkills?.length || 0)> 4)
      }
    ]

    return sections
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'found':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'partial':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
      case 'missing':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'found':
        return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
      case 'partial':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
      case 'missing':
        return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
    }
  }

  if (parsingError) {
    return (
      <Card className={cn('max-w-2xl mx-auto', className)}>
        <CardHeader>
          <CardTitle className="flex items-center text-red-600">
            <XCircle className="w-5 h-5 mr-2" />
            Parsing Failed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{parsingError}</AlertDescription>
          </Alert>
          
          <div className="flex justify-end space-x-2">
            {onRetry && (
              <PrimaryButton onClick={onRetry}>
                Try Again
              </PrimaryButton>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!isParsingComplete) {
    return (
      <Card className={cn('max-w-2xl mx-auto', className)}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Parsing Your Resume
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{steps[currentStep]}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
          
          <div className="space-y-2">
            {steps.map((step, index) => (
              <div 
                key={index}
                className={cn(
                  'flex items-center space-x-2 text-sm',
                  index <= currentStep ? 'text-primary' : 'text-muted-foreground'
                )}>
                {index < currentStep ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : index === currentStep ? (
                  <Clock className="w-4 h-4 text-primary animate-pulse" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-muted-foreground" />
                )}
                <span>{step}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!resume) {
    return (
      <Card className={cn('max-w-2xl mx-auto', className)}>
        <CardContent className="p-6 text-center">
          <div className="text-muted-foreground">No resume data available</div>
        </CardContent>
      </Card>
    )
  }

  const sections = analyzeParsedSections(resume)
  const foundSections = sections.filter(s => s.status === 'found').length
  const totalSections = sections.length

  return (
    <Card className={cn('max-w-4xl mx-auto', className)}>
      <CardHeader>
        <CardTitle className="flex items-center text-green-600">
          <CheckCircle className="w-5 h-5 mr-2" />
          Resume Parsing Complete
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
            {foundSections}/{totalSections} sections found
          </Badge>
          {resume.contactInfo?.name && (
            <Badge variant="outline">
              {resume.contactInfo.name}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          {sections.map((section, index) => (
            <div 
              key={index}
              className="flex items-start space-x-3 p-3 rounded-lg border">
              <div className="flex-shrink-0 mt-1">
                {getStatusIcon(section.status)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <div className="flex items-center space-x-1">
                    {section.icon}
                    <span className="font-medium">{section.name}</span>
                  </div>
                  {section.count !== undefined && (
                    <Badge 
                      variant="outline" 
                      className={getStatusColor(section.status)}>
                      {section.count}
                    </Badge>
                  )}
                </div>
                
                {section.details && section.details.length> 0 && (
                  <div className="text-sm text-muted-foreground space-y-1">
                    {section.details.slice(0, 3).map((detail, i) => (
                      <div key={i} className="truncate">{detail}</div>
                    ))}
                    {section.details.length> 3 && (
                      <div className="text-xs">
                        +{section.details.length - 3} more...
                      </div>
                    )}
                  </div>
                )}
                
                {section.status === 'missing' && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Consider adding this section manually
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Summary and Actions */}
        <div className="border-t pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <div>
              <h4 className="font-medium">Parsing Summary</h4>
              <p className="text-sm text-muted-foreground">
                Your resume has been successfully parsed and is ready for optimization.
              </p>
            </div>
            
            {onContinue && (
              <PrimaryButton onClick={onContinue}>
                Continue to Resume
              </PrimaryButton>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}