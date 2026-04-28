'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle, RefreshCw, Home, Bug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>
      }

      return <ErrorFallback 
        error={this.state.error}
        errorInfo={this.state.errorInfo}
        onReset={this.handleReset}
      />
    }

    return this.props.children
  }
}

interface ErrorFallbackProps {
  error: Error | null
  errorInfo: ErrorInfo | null
  onReset: () => void
}

export function ErrorFallback({ error, errorInfo, onReset }: ErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl font-semibold">Something went wrong</CardTitle>
          <CardDescription className="text-base mt-2">
            We encountered an unexpected error. This might be a temporary issue.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
              <Bug className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <AlertDescription className="text-sm">
                <span className="font-medium">Error: </span>
                {error.message || 'An unexpected error occurred'}
              </AlertDescription>
            </Alert>
          )}

          {isDevelopment && errorInfo && (
            <details className="cursor-pointer">
              <summary className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Debug Information
              </summary>
              <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-x-auto">
                <code>{errorInfo.componentStack}</code>
              </pre>
            </details>
          )}
        </CardContent>

        <CardFooter className="flex gap-2 justify-center">
          <Button 
            onClick={onReset}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/'}
            className="gap-2"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

// Standalone error component for use without error boundary
export function ErrorState({ 
  title = "Error loading content",
  description = "We encountered an error while loading this section.",
  error,
  onRetry,
  showHome = true 
}: {
  title?: string
  description?: string
  error?: string
  onRetry?: () => void
  showHome?: boolean
}) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-xl font-semibold">{title}</CardTitle>
          <CardDescription className="mt-2">
            {description}
          </CardDescription>
        </CardHeader>
        
        {error && (
          <CardContent>
            <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
              <AlertDescription className="text-sm">
                {error}
              </AlertDescription>
            </Alert>
          </CardContent>
        )}

        <CardFooter className="flex gap-2 justify-center">
          {onRetry && (
            <Button onClick={onRetry} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          )}
          {showHome && (
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="gap-2"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}