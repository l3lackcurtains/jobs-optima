import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { ComponentProps } from 'react'

type SecondaryButtonProps = Omit<ComponentProps<typeof Button>, 'variant'>

export function SecondaryButton({ 
  className, 
  children,
  ...props 
}: SecondaryButtonProps) {
  return (
    <Button
      variant="secondary"
      className={cn(
        'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        'transition-all duration-200',
        className
      )}
      {...props}
    >
      {children}
    </Button>
  )
}