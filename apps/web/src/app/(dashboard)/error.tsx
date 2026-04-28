'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'
import { PrimaryButton, OutlineButton } from '@/components/custom/Button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useRouter } from 'next/navigation'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="container max-w-2xl mx-auto p-6">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error loading dashboard</AlertTitle>
        <AlertDescription>
          We encountered an error while loading this section. This might be a temporary issue.
        </AlertDescription>
      </Alert>

      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 rounded-md bg-muted p-4 text-sm font-mono">
          <p className="font-semibold">Debug info:</p>
          <p className="mt-1 text-muted-foreground">{error.message}</p>
        </div>
      )}

      <div className="mt-6 flex gap-2">
        <PrimaryButton onClick={reset}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </PrimaryButton>
        <OutlineButton onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </OutlineButton>
      </div>
    </div>
  )
}