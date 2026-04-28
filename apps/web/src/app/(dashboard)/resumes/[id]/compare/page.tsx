'use client'

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/custom/page-header'
import { OutlineButton, GhostButton } from '@/components/custom/Button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useResume } from '@/hooks/api/use-resumes'
import ResumeComparisonView from '@/components/resume/ResumeComparisonView'

interface ResumeComparePageProps {
  params: Promise<{
    id: string
  }>
}

export default function ResumeComparePage(props: ResumeComparePageProps) {
  const params = use(props.params);
  const [id, setId] = useState<string>(params.id)
  const router = useRouter()

  const { data: resume, isLoading, error } = useResume(id)
  const { data: baseResume, isLoading: baseLoading } = useResume(resume?.parentResumeId || '')


  const handleBack = () => {
    router.push(`/resumes/${id}`)
  }

  if (isLoading || baseLoading) {
    return (
      <div className="container max-w-8xl mx-auto py-8 space-y-8">
        {/* Header Skeleton */}
        <div className="flex items-center space-x-4">
          <Skeleton className="h-9 w-20" />
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        {/* Content Skeleton */}
        <Card className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (error || !resume) {
    return (
      <div className="container max-w-8xl mx-auto py-8">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Resume Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The resume you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
          </p>
          <OutlineButton onClick={() => router.push('/resumes')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Resumes
          </OutlineButton>
        </Card>
      </div>
    )
  }

  if (!resume.isOptimized || !resume.parentResumeId || !baseResume) {
    return (
      <div className="container max-w-8xl mx-auto py-8">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Comparison Not Available</h2>
          <p className="text-muted-foreground mb-6">
            This resume is not optimized or the base resume is not available for comparison.
          </p>
          <OutlineButton onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Resume
          </OutlineButton>
        </Card>
      </div>
    )
  }

  const optimizedTitle = resume.title || resume.contactInfo?.name || 'Optimized Resume'
  const baseTitle = baseResume.title || baseResume.contactInfo?.name || 'Base Resume'

  return (
    <div className="container mx-auto py-8 space-y-6">
      <PageHeader
        title="Resume Comparison"
        description={`Comparing optimized version with base resume`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Resumes', href: '/resumes' },
          { label: optimizedTitle, href: `/resumes/${id}` },
          { label: 'Compare' }
        ]}
        actions={
          <GhostButton
            onClick={handleBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Resume
          </GhostButton>
        }
      />
      <ResumeComparisonView
        optimizedResume={resume}
        baseResume={baseResume}
      />
    </div>
  )
}