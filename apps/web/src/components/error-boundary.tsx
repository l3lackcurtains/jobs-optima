'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp, Copy, RotateCcw } from 'lucide-react'
import { PrimaryButton, OutlineButton } from '@/components/custom/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from 'sonner'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  showDetails: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    this.setState({
      error,
      errorInfo,
    })

    // You could also log to an error reporting service here
    // logErrorToService(error, errorInfo)
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    })
  }

  copyErrorDetails = () => {
    const { error, errorInfo } = this.state
    const errorDetails = `
Error: ${error?.message || 'Unknown error'}

Stack Trace:
${error?.stack || 'No stack trace available'}

Component Stack:
${errorInfo?.componentStack || 'No component stack available'}

Time: ${new Date().toISOString()}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}
    `.trim()

    navigator.clipboard.writeText(errorDetails)
    toast.success('Error details copied to clipboard')
  }

  parseStackTrace = (stack: string | undefined) => {
    if (!stack) return []
    
    const lines = stack.split('\n')
    const parsed = []
    
    for (const line of lines) {
      // Match common stack trace patterns
      const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/) ||
                   line.match(/at\s+(.+?)\s+(.+?):(\d+):(\d+)/) ||
                   line.match(/(.+?)@(.+?):(\d+):(\d+)/)
      
      if (match) {
        parsed.push({
          function: match[1].trim(),
          file: match[2],
          line: match[3],
          column: match[4],
        })
      }
    }
    
    return parsed
  }

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, showDetails } = this.state
      const stackTrace = this.parseStackTrace(error?.stack)
      const firstRelevantError = stackTrace.find(trace => 
        !trace.file.includes('node_modules') && 
        !trace.file.includes('webpack')
      )

      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-red-500" />
                <CardTitle className="text-2xl">Something went wrong</CardTitle>
              </div>
              <CardDescription>
                We encountered an error while rendering this component
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Main Error Alert */}
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Details</AlertTitle>
                <AlertDescription className="mt-2 space-y-2">
                  <div className="font-mono text-sm">
                    {error?.message || 'An unexpected error occurred'}
                  </div>
                  {firstRelevantError && (
                    <div className="text-xs text-muted-foreground">
                      at {firstRelevantError.function} ({firstRelevantError.file}:{firstRelevantError.line}:{firstRelevantError.column})
                    </div>
                  )}
                </AlertDescription>
              </Alert>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <PrimaryButton onClick={this.handleReset}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Try Again
                </PrimaryButton>
                <OutlineButton onClick={() => window.history.back()}>
                  Go Back
                </OutlineButton>
                <OutlineButton
                  onClick={() => this.setState({ showDetails: !showDetails })}
                >
                  {showDetails ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-2" />
                      Hide Details
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-2" />
                      Show Details
                    </>
                  )}
                </OutlineButton>
                <OutlineButton onClick={this.copyErrorDetails}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </OutlineButton>
              </div>

              {/* Detailed Error Information */}
              {showDetails && (
                <div className="space-y-4">
                  {/* Stack Trace */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Stack Trace</h3>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 max-h-64 overflow-auto">
                      {stackTrace.length > 0 ? (
                        <div className="space-y-1">
                          {stackTrace.slice(0, 10).map((trace, index) => (
                            <div
                              key={index}
                              className={`text-xs font-mono ${
                                trace.file.includes('node_modules') || trace.file.includes('webpack')
                                  ? 'text-gray-500'
                                  : 'text-red-600 dark:text-red-400 font-semibold'
                              }`}
                            >
                              <span className="text-blue-600 dark:text-blue-400">
                                {trace.function}
                              </span>
                              <span className="text-gray-600 dark:text-gray-400">
                                {' '}at {trace.file}:{trace.line}:{trace.column}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <pre className="text-xs font-mono whitespace-pre-wrap text-gray-600 dark:text-gray-400">
                          {error?.stack || 'No stack trace available'}
                        </pre>
                      )}
                    </div>
                  </div>

                  {/* Component Stack */}
                  {errorInfo?.componentStack && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold">Component Stack</h3>
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 max-h-40 overflow-auto">
                        <pre className="text-xs font-mono whitespace-pre-wrap text-gray-600 dark:text-gray-400">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Environment Info */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Environment</h3>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                      <dl className="text-xs space-y-1">
                        <div className="flex gap-2">
                          <dt className="font-semibold text-gray-600 dark:text-gray-400">Time:</dt>
                          <dd>{new Date().toLocaleString()}</dd>
                        </div>
                        <div className="flex gap-2">
                          <dt className="font-semibold text-gray-600 dark:text-gray-400">URL:</dt>
                          <dd className="truncate">{window.location.href}</dd>
                        </div>
                        <div className="flex gap-2">
                          <dt className="font-semibold text-gray-600 dark:text-gray-400">Browser:</dt>
                          <dd className="truncate">{navigator.userAgent}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>
              )}

              {/* Help Text */}
              <div className="text-sm text-muted-foreground">
                {process.env.NODE_ENV === 'development' ? (
                  <p>
                    Check the browser console for more details. The error has been logged with
                    full stack trace information.
                  </p>
                ) : (
                  <p>
                    If this problem persists, please contact support with the error details above.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}