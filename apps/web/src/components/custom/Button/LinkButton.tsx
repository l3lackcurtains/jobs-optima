import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { ComponentProps } from 'react'

type LinkButtonProps = Omit<ComponentProps<typeof Button>, 'variant'>

export function LinkButton({ 
  className, 
  children,
  ...props 
}: LinkButtonProps) {
  return (
    <Button
      variant="link"
      className={cn(
        'text-primary underline-offset-4 hover:underline',
        'transition-all duration-200',
        className
      )}
      {...props}
    >
      {children}
    </Button>
  )
}