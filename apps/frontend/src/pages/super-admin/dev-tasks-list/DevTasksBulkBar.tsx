import React from "react";
import { TeamMemberOption } from "./types";

interface DevTasksBulkBarProps {
  selectedCount: number;
  bulkAction: string;
  setBulkAction: (action: string) => void;
  teamMembers: TeamMemberOption[];
  onDeselectAll: () => void;
  onExecute: () => void;
}

export const DevTasksBulkBar: React.FC<DevTasksBulkBarProps> = ({
  selectedCount,
  bulkAction,
  setBulkAction,
  teamMembers,
  onDeselectAll,
  onExecute,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="bg-indigo-50 dark:bg-primary/20 border border-primary dark:border-primary rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-indigo-700 dark:text-primary font-medium text-sm">
            <span className="font-mono tabular-nums font-bold">{selectedCount}</span> مهمة محددة
          </span>
          <button
            onClick={onDeselectAll}
            className="text-xs text-primary hover:text-primary dark:hover:text-primary underline"
          >
            إلغاء التحديد
          </button>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className="border border-primary dark:border-primary rounded-lg px-3 py-1.5 bg-background text-foreground text-xs"
          >
            <option value="">اختر إجراء...</option>
            <option value="delete">حذف المحدد</option>
            <optgroup label="تغيير الحالة">
              <option value="status:TODO">للتنفيذ</option>
              <option value="status:IN_PROGRESS">قيد العمل</option>
              <option value="status:IN_REVIEW">مراجعة</option>
              <option value="status:DONE">مكتمل</option>
            </optgroup>
            <optgroup label="تعيين مسؤول">
              {teamMembers.map((member) => (
                <option key={member.id} value={`assignee:${member.userId}`}>
                  {member.name}
                </option>
              ))}
            </optgroup>
          </select>
          <button
            onClick={onExecute}
            disabled={!bulkAction}
            className="px-3.5 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium transition-colors shadow-xs"
          >
            تنفيذ
          </button>
        </div>
      </div>
    </div>
  );
};
