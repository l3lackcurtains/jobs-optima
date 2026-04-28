"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export type DialogSize = "sm" | "md" | "lg" | "xl"

const dialogSizes: Record<DialogSize, string> = {
  sm: "sm:max-w-[425px]",
  md: "sm:max-w-[550px]",
  lg: "sm:max-w-[650px]",
  xl: "sm:max-w-[800px]",
}

interface CustomDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  title?: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  size?: DialogSize
  className?: string
  icon?: React.ReactNode
}

export function CustomDialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  size = "md",
  className,
  icon,
}: CustomDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent 
        className={cn(
          dialogSizes[size],
          "max-h-[90vh] overflow-y-auto",
          className
        )}
      >
        {(title || description) && (
          <DialogHeader>
            {title && (
              <DialogTitle className="flex items-center gap-2">
                {icon}
                {title}
              </DialogTitle>
            )}
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
        )}
        
        <div className="py-4">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
}