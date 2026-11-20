import React from "react";
import {
  ClipboardDocumentIcon,
  ClockIcon,
  FolderIcon,
  PencilIcon,
  TagIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { TaskTemplate } from "./types";
import { getPriorityColor, getPriorityText } from "./helpers";

interface TaskTemplateCardProps {
  template: TaskTemplate;
  onUse: (template: TaskTemplate) => void;
  onEdit: (template: TaskTemplate) => void;
  onDelete: (id: string) => void;
}

export const TaskTemplateCard: React.FC<TaskTemplateCardProps> = ({
  template,
  onUse,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="bg-card rounded-lg shadow hover:shadow-md transition-shadow border border-border dark:border-border">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-foreground">
              {template.name}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {template.description}
            </p>
          </div>
          <span
            className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(template.priority)}`}
          >
            {getPriorityText(template.priority)}
          </span>
        </div>

        <div className="mb-4">
          <p className="text-sm font-medium text-foreground">
            {template.taskTitle}
          </p>
          {template.taskDescription && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
              {template.taskDescription}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {template.estimatedHours > 0 && (
            <span className="inline-flex items-center text-xs text-muted-foreground tabular-nums">
              <ClockIcon className="h-3 w-3 ms-1" />
              {template.estimatedHours} ساعة
            </span>
          )}
          {template.projectName && (
            <span className="inline-flex items-center text-xs text-muted-foreground">
              <FolderIcon className="h-3 w-3 ms-1" />
              {template.projectName}
            </span>
          )}
          {template.categoryName && (
            <span className="inline-flex items-center text-xs text-muted-foreground">
              <TagIcon className="h-3 w-3 ms-1" />
              {template.categoryName}
            </span>
          )}
        </div>

        {template.tags && Array.isArray(template.tags) && template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {template.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-0.5 text-xs bg-primary dark:bg-primary/50 text-primary dark:text-primary rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-border dark:border-border">
          <span className="text-xs text-muted-foreground/80 tabular-nums">
            استُخدم {template.usageCount || 0} مرة
          </span>
          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              onClick={() => onUse(template)}
              className="inline-flex items-center px-3 py-1.5 text-sm bg-primary dark:bg-primary text-white rounded-md hover:bg-primary dark:hover:bg-primary transition-colors cursor-pointer"
            >
              <ClipboardDocumentIcon className="h-4 w-4 ms-1" />
              استخدام
            </button>
            <button
              onClick={() => onEdit(template)}
              aria-label="تعديل القالب"
              className="p-1.5 text-muted-foreground/80 hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/30 rounded transition-colors cursor-pointer"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(template.id)}
              aria-label="حذف القالب"
              className="p-1.5 text-muted-foreground/80 hover:text-destructive dark:hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/30 rounded transition-colors cursor-pointer"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
