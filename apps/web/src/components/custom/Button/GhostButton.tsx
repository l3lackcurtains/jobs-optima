import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { ComponentProps } from 'react'

type GhostButtonProps = Omit<ComponentProps<typeof Button>, 'variant'>

export function GhostButton({ 
  className, 
  children,
  ...props 
}: GhostButtonProps) {
  return (
    <Button
      variant="ghost"
      className={cn(
        'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        'transition-all duration-200',
        className
      )}
      {...props}
    >
      {children}
    </Button>
  )
}