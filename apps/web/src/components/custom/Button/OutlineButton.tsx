import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { ComponentProps } from 'react'

type OutlineButtonProps = Omit<ComponentProps<typeof Button>, 'variant'>

export function OutlineButton({ 
  className, 
  children,
  ...props 
}: OutlineButtonProps) {
  return (
    <Button
      variant="outline"
      className={cn(
        'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground',
        'dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        'transition-all duration-200',
        className
      )}
      {...props}
    >
      {children}
    </Button>
  )
}