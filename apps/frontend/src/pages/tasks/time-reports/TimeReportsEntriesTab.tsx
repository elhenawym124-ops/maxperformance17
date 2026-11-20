import React from "react";
import { Link } from "react-router-dom";
import { ClockIcon } from "@heroicons/react/24/outline";
import type { TimeEntry } from "./types";
import { formatDate, formatTime, formatDuration } from "./helpers";

interface TimeReportsEntriesTabProps {
  entries: TimeEntry[];
}

export const TimeReportsEntriesTab: React.FC<TimeReportsEntriesTabProps> = ({
  entries,
}) => {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <ClockIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground dark:text-foreground" />
        <p>لا توجد سجلات وقت في هذه الفترة</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border dark:divide-border">
        <thead className="bg-gray-50 dark:bg-muted">
          <tr>
            <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
              المهمة
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
              المشروع
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
              المستخدم
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
              التاريخ
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
              الوقت
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
              المدة
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
              الوصف
            </th>
          </tr>
        </thead>
        <tbody className="bg-card divide-y divide-border dark:divide-border">
          {entries.map((entry) => (
            <tr
              key={entry.id}
              className="hover:bg-muted/50/50 transition-colors"
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <Link
                  to={`/tasks/${entry.taskId}`}
                  className="text-primary hover:text-primary dark:hover:text-primary font-medium block truncate max-w-xs"
                >
                  {entry.taskTitle}
                </Link>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                {entry.projectName || "غير محدد"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                {entry.userName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground tabular-nums">
                {formatDate(entry.startTime)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground tabular-nums">
                {formatTime(entry.startTime)}
                {entry.endTime && ` - ${formatTime(entry.endTime)}`}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 py-1 text-sm font-medium bg-primary dark:bg-primary/60 text-primary dark:text-primary rounded tabular-nums">
                  {formatDuration(entry.duration || 0)}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
                {entry.description || "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
