'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { PrimaryButton, OutlineButton } from '@/components/custom/Button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>Something went wrong!</CardTitle>
          </div>
          <CardDescription>
            An unexpected error occurred while loading this page. Please try again or contact support if the problem persists.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {process.env.NODE_ENV === 'development' && (
            <div className="rounded-md bg-muted p-3 text-sm font-mono text-muted-foreground">
              <p className="font-semibold">Error details:</p>
              <p className="mt-1">{error.message}</p>
              {error.digest && (
                <p className="mt-1 text-xs">Digest: {error.digest}</p>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          <PrimaryButton onClick={reset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </PrimaryButton>
          <Link href="/">
            <OutlineButton>
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </OutlineButton>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}