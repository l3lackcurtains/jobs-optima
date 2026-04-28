import { AlertCircle, ArrowLeft, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface ErrorStateProps {
  title?: string
  message?: string
  showBackButton?: boolean
  backButtonText?: string
  backButtonHref?: string
  onBack?: () => void
  showRetryButton?: boolean
  retryButtonText?: string
  onRetry?: () => void
  showHomeButton?: boolean
  variant?: 'default' | 'not-found' | 'permission' | 'server'
}

const variantConfig = {
  default: {
    icon: AlertCircle,
    iconColor: 'text-red-500',
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Please try again.',
  },
  'not-found': {
    icon: AlertCircle,
    iconColor: 'text-orange-500',
    title: 'Not Found',
    message: "We couldn't find what you're looking for.",
  },
  permission: {
    icon: AlertCircle,
    iconColor: 'text-yellow-500',
    title: 'Access Denied',
    message: "You don't have permission to view this content.",
  },
  server: {
    icon: AlertCircle,
    iconColor: 'text-red-500',
    title: 'Server Error',
    message: 'The server encountered an error. Please try again later.',
  },
}

export function ErrorState({
  title,
  message,
  showBackButton = true,
  backButtonText = 'Go Back',
  backButtonHref,
  onBack,
  showRetryButton = false,
  retryButtonText = 'Try Again',
  onRetry,
  showHomeButton = false,
  variant = 'default',
}: ErrorStateProps) {
  const config = variantConfig[variant]
  const Icon = config.icon

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else if (backButtonHref) {
      window.location.href = backButtonHref
    } else {
      window.history.back()
    }
  }

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <div className="p-8 text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className={`rounded-full bg-gray-100 dark:bg-gray-800 p-4 ${config.iconColor}`}>
              <Icon className="w-8 h-8" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              {title || config.title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {message || config.message}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {showBackButton && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="min-w-[120px]"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {backButtonText}
              </Button>
            )}
            
            {showRetryButton && onRetry && (
              <Button
                variant="default"
                onClick={onRetry}
                className="min-w-[120px]"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {retryButtonText}
              </Button>
            )}
            
            {showHomeButton && (
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="min-w-[120px]"
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}