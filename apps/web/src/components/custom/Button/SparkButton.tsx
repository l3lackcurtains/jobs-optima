import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import type { ComponentProps } from "react";

interface SparkButtonProps
  extends Omit<ComponentProps<typeof Button>, "variant"> {
  loading?: boolean;
  loadingText?: string;
  showIcon?: boolean;
  icon?: React.ReactNode;
}

export function SparkButton({
  className,
  children,
  loading,
  loadingText = "Processing...",
  disabled,
  showIcon = true,
  icon,
  ...props
}: SparkButtonProps) {
  return (
    <Button
      className={cn(
        "bg-gradient-to-r from-blue-600 to-purple-600 text-white",
        "hover:from-blue-700 hover:to-purple-700",
        "shadow-md hover:shadow-lg",
        "transition-all duration-300",
        "font-medium",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {showIcon && !loading && (icon || <Sparkles className="mr-2 h-4 w-4" />)}
      {loading ? loadingText : children}
    </Button>
  );
}
