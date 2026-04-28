'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { PrimaryButton, OutlineButton } from '@/components/custom/Button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <CardTitle>Something went wrong</CardTitle>
              </div>
              <CardDescription>
                An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="rounded-md bg-muted p-3 text-sm font-mono text-muted-foreground">
                  {this.state.error.message}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex gap-2">
              <PrimaryButton onClick={this.handleReset}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Page
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

    return this.props.children
  }
}

// Async Error Boundary for Next.js App Router
export function AsyncErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>
}