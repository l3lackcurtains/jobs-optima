import React, { useState, useRef, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface SortableSkillBadgeProps {
  id: string;
  skill: string;
  isEditing: boolean;
  onRemove: () => void;
  onUpdate?: (newSkill: string) => void;
  variant?: "default" | "secondary" | "destructive" | "outline";
  className?: string;
}

export function SortableSkillBadge({
  id,
  skill,
  isEditing,
  onRemove,
  onUpdate,
  variant = "secondary",
  className = "",
}: SortableSkillBadgeProps) {
  const [isEditingText, setIsEditingText] = useState(false);
  const [editedSkill, setEditedSkill] = useState(skill);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isEditing || isEditingText });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  useEffect(() => {
    if (isEditingText && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingText]);

  const handleSave = () => {
    const trimmedSkill = editedSkill.trim();
    if (trimmedSkill && trimmedSkill !== skill && onUpdate) {
      onUpdate(trimmedSkill);
    } else {
      setEditedSkill(skill); // Reset if empty or unchanged
    }
    setIsEditingText(false);
  };

  const handleCancel = () => {
    setEditedSkill(skill);
    setIsEditingText(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="inline-flex items-center gap-1"
      >
        <Badge
          variant={variant}
          className={`pl-1 pr-2 py-1 ${!isEditingText ? 'cursor-move' : ''} select-none ${className}`}
        >
          {!isEditingText && (
            <button
              className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded cursor-grab active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="w-3 h-3" />
            </button>
          )}
          
          {isEditingText ? (
            <div className="flex items-center gap-1 ml-1">
              <Input
                ref={inputRef}
                value={editedSkill}
                onChange={(e) => setEditedSkill(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSave}
                className="h-5 px-1 py-0 text-xs min-w-[80px] max-w-[150px]"
              />
              <button
                onClick={handleSave}
                className="p-0.5 hover:bg-green-100 dark:hover:bg-green-900 rounded-sm"
                onMouseDown={(e) => e.preventDefault()} // Prevent blur
              >
                <Check className="w-3 h-3 text-green-600" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingText(true)}
              className="ml-1 hover:underline text-left"
            >
              {skill}
            </button>
          )}
          
          {!isEditingText && (
            <button
              onClick={onRemove}
              className="ml-1 p-0.5 hover:bg-red-100 dark:hover:bg-red-900 rounded-sm"
            >
              <X className="w-3 h-3 text-red-500" />
            </button>
          )}
        </Badge>
      </div>
    );
  }

  return (
    <Badge variant={variant} className={className}>
      {skill}
    </Badge>
  );
}
