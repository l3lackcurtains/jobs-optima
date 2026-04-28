import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { ComponentProps } from 'react'

interface DestructiveButtonProps extends Omit<ComponentProps<typeof Button>, 'variant'> {
  confirmText?: string
  onConfirm?: () => void
}

export function DestructiveButton({ 
  className, 
  children,
  confirmText,
  onConfirm,
  onClick,
  ...props 
}: DestructiveButtonProps) {
  const [isConfirming, setIsConfirming] = React.useState(false)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (confirmText && !isConfirming) {
      setIsConfirming(true)
      setTimeout(() => setIsConfirming(false), 3000)
      return
    }
    
    if (isConfirming && onConfirm) {
      onConfirm()
      setIsConfirming(false)
      return
    }

    onClick?.(e)
  }

  return (
    <Button
      variant="destructive"
      className={cn(
        'bg-destructive text-white shadow-xs hover:bg-destructive/90',
        'focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
        'dark:bg-destructive/60 transition-all duration-200',
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {isConfirming ? confirmText : children}
    </Button>
  )
}