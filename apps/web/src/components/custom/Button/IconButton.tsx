import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import type { ComponentProps } from "react";

interface IconButtonProps extends Omit<ComponentProps<typeof Button>, "size"> {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg";
}

export function IconButton({
  className,
  children,
  variant = "ghost",
  size = "default",
  ...props
}: IconButtonProps) {
  const sizeClasses = {
    default: "size-9",
    sm: "size-8",
    lg: "size-10",
  };

  return (
    <Button
      variant={variant}
      size="icon"
      className={cn(
        sizeClasses[size],
        "transition-all duration-200",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}

export function DestructiveIconButton({
  className,
  children,
  size = "default",
  ...props
}: Omit<IconButtonProps, "variant">) {
  const sizeClasses = {
    default: "size-9",
    sm: "size-8",
    lg: "size-10",
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        sizeClasses[size],
        "text-destructive hover:text-destructive hover:bg-destructive/10",
        "transition-all duration-200",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}

export function SparkIconButton({
  className,
  size = "default",
  ...props
}: Omit<IconButtonProps, "variant" | "children">) {
  const sizeClasses = {
    default: "size-9",
    sm: "size-7",
    lg: "size-10",
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        sizeClasses[size],
        // Base styles
        "bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-500",
        "border border-blue-200 dark:border-blue-800 shadow-sm",
        // Hover styles - subtle background change with enhanced border
        "hover:bg-blue-50 hover:dark:bg-blue-950/30",
        "hover:border-blue-400 hover:dark:border-blue-600",
        "hover:shadow-md hover:scale-105",
        // Focus styles
        "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600/50",
        // Active state
        "active:scale-100",
        // Transitions
        "transition-all duration-200 ease-in-out",
        className
      )}
      {...props}
    >
      <Sparkles className="h-4 w-4" />
    </Button>
  );
}
