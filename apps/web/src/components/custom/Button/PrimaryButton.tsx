import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { ComponentProps } from 'react'

interface PrimaryButtonProps extends Omit<ComponentProps<typeof Button>, 'variant'> {
  loading?: boolean
  loadingText?: string
}

export function PrimaryButton({ 
  className, 
  children,
  loading,
  loadingText = 'Loading...',
  disabled,
  ...props 
}: PrimaryButtonProps) {
  return (
    <Button
      className={cn(
        'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
        'transition-all duration-200',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? loadingText : children}
    </Button>
  )
}