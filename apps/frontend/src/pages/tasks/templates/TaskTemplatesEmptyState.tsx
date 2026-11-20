import React from "react";
import { DocumentDuplicateIcon, PlusIcon } from "@heroicons/react/24/outline";

interface TaskTemplatesEmptyStateProps {
  onCreate?: () => void;
  onOpenCreateModal?: () => void;
}

export const TaskTemplatesEmptyState: React.FC<TaskTemplatesEmptyStateProps> = ({
  onCreate,
  onOpenCreateModal,
}) => {
  const handleClick = onOpenCreateModal || onCreate;

  return (
    <div className="text-center py-12 bg-card rounded-lg shadow border border-border dark:border-border">
      <DocumentDuplicateIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground dark:text-foreground" />
      <p className="text-muted-foreground mb-4">
        لا توجد قوالب بعد
      </p>
      <button
        onClick={handleClick}
        className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary cursor-pointer"
      >
        <PlusIcon className="h-5 w-5 ms-2" />
        إنشاء أول قالب
      </button>
    </div>
  );
};
