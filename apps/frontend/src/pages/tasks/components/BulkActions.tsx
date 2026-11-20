import React from "react";

export interface BulkActionsProps {
  selectedTasksCount: number;
  handleBulkStatusChange: (status: string) => void;
  handleBulkDelete: () => void;
  onClearSelection: () => void;
}

export const BulkActions: React.FC<BulkActionsProps> = ({
  selectedTasksCount,
  handleBulkStatusChange,
  handleBulkDelete,
  onClearSelection,
}) => {
  if (selectedTasksCount === 0) return null;

  return (
    <div className="bg-indigo-50 dark:bg-primary/30 border border-primary dark:border-primary rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-primary dark:text-primary">
          تم تحديد {selectedTasksCount} مهمة
        </span>
        <div className="flex space-x-2 space-x-reverse">
          <button
            onClick={() => handleBulkStatusChange("in_progress")}
            className="px-3 py-1 bg-primary text-white text-sm rounded-md hover:bg-primary"
          >
            بدء التنفيذ
          </button>
          <button
            onClick={() => handleBulkStatusChange("completed")}
            className="px-3 py-1 bg-success text-white text-sm rounded-md hover:bg-success"
          >
            إكمال
          </button>
          <button
            onClick={handleBulkDelete}
            className="px-3 py-1 bg-destructive text-white text-sm rounded-md hover:bg-destructive"
          >
            حذف
          </button>
          <button
            onClick={onClearSelection}
            className="px-3 py-1 bg-muted dark:bg-muted text-foreground text-sm rounded-md hover:bg-muted dark:hover:bg-muted"
          >
            إلغاء التحديد
          </button>
        </div>
      </div>
    </div>
  );
};
