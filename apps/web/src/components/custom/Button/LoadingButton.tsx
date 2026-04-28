import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import type { ComponentProps } from 'react'

interface LoadingButtonProps extends ComponentProps<typeof Button> {
  loading?: boolean
  loadingText?: string
  loadingIcon?: React.ReactNode
}

export function LoadingButton({ 
  className, 
  children,
  loading = false,
  loadingText,
  loadingIcon,
  disabled,
  ...props 
}: LoadingButtonProps) {
  return (
    <Button
      className={cn(
        'transition-all duration-200',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          {loadingIcon || <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loadingText || children}
        </>
      ) : (
        children
      )}
    </Button>
  )
}