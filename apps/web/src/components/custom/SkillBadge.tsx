import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { HighlightedText } from "@/lib/utils/text-highlighter";
import { X } from "lucide-react";
import type { ComponentProps } from "react";

interface SkillBadgeProps
  extends Omit<ComponentProps<typeof Badge>, "children"> {
  isHighlighted?: boolean;
  text: string;
  allKeywordsForHighlight?: Set<string>;
  onDelete?: () => void;
  children?: React.ReactNode;
}

export function SkillBadge({
  className,
  text,
  isHighlighted = false,
  allKeywordsForHighlight,
  onDelete,
  children,
  ...props
}: SkillBadgeProps) {
  return (
    <Badge
      className={cn(
        "text-xs px-2 py-1",
        onDelete && "pr-0.5 group",
        isHighlighted
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-secondary text-secondary-foreground",
        className
      )}
      {...props}
    >
      {allKeywordsForHighlight && !isHighlighted ? (
        <HighlightedText
          text={text}
          keywords={new Set()}
          mode="text"
          alwaysHighlight={allKeywordsForHighlight}
        />
      ) : (
        <span>{text}</span>
      )}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className={cn(
            "ml-1 inline-flex items-center justify-center w-5 h-5 rounded-sm transition-colors",
            isHighlighted
              ? "text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/20"
              : "text-destructive hover:bg-destructive/10"
          )}
        >
          <X className="w-3 h-3" />
        </button>
      )}
      {children}
    </Badge>
  );
}
