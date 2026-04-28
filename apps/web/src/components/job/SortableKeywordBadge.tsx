import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SortableKeywordBadgeProps {
  id: string;
  keyword: string;
  isEditing: boolean;
  onRemove: () => void;
  variant?: "default" | "secondary" | "destructive" | "outline";
  className?: string;
}

export function SortableKeywordBadge({
  id,
  keyword,
  isEditing,
  onRemove,
  variant = "secondary",
  className = "",
}: SortableKeywordBadgeProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (isEditing) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`inline-flex items-center gap-1 ${className}`}
      >
        <Badge
          variant={variant}
          className="pl-1 pr-2 py-1 cursor-move select-none"
        >
          <button
            className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-3 h-3" />
          </button>
          <span className="ml-1">{keyword}</span>
          <button
            onClick={onRemove}
            className="ml-1 p-0.5 hover:bg-red-100 dark:hover:bg-red-900 rounded-sm"
          >
            <X className="w-3 h-3 text-red-500" />
          </button>
        </Badge>
      </div>
    );
  }

  return (
    <Badge variant={variant} className={className}>
      {keyword}
    </Badge>
  );
}