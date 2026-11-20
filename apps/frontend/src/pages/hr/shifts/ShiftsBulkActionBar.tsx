import React from "react";
import { CheckSquare, Trash2, X } from "lucide-react";
import { Button } from "../../../components/ui/button";

interface ShiftsBulkActionBarProps {
  selectedCount: number;
  onDeleteSelected: () => void;
  onClearSelection: () => void;
}

export const ShiftsBulkActionBar: React.FC<ShiftsBulkActionBarProps> = ({
  selectedCount,
  onDeleteSelected,
  onClearSelection,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="bg-blue-50 dark:bg-primary border border-primary dark:border-primary rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in slide-in-from-top-2">
      <div className="flex items-center gap-2">
        <CheckSquare className="h-5 w-5 text-primary dark:text-primary shrink-0" />
        <span className="font-semibold text-primary dark:text-primary text-sm">
          تم تحديد {selectedCount} مناوبة
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="bg-card hover:bg-destructive/10 dark:hover:bg-destructive text-destructive dark:text-destructive border-destructive dark:border-destructive text-xs font-bold"
          onClick={onDeleteSelected}
        >
          <Trash2 className="h-3.5 w-3.5 ms-1.5" />
          <span>حذف المحدد</span>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onClearSelection}
          className="text-xs"
        >
          <X className="h-3.5 w-3.5 ms-1.5" />
          <span>إلغاء التحديد</span>
        </Button>
      </div>
    </div>
  );
};
