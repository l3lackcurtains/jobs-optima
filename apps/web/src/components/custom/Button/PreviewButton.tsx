import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import type { ComponentProps } from "react";

interface PreviewButtonProps
  extends Omit<ComponentProps<typeof Button>, "variant"> {
  showIcon?: boolean;
  icon?: React.ReactNode;
}

export function PreviewButton({
  className,
  children,
  ...props
}: PreviewButtonProps) {
  return (
    <Button
      variant="outline"
      className={cn(
        "bg-white dark:bg-gray-900",
        "border-gray-200 dark:border-gray-700",
        "hover:bg-gray-50 dark:hover:bg-gray-800",
        "text-gray-700 dark:text-gray-300",
        "transition-all duration-200",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}
