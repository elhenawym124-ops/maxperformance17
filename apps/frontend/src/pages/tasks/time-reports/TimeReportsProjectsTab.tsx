import React from "react";
import { FolderIcon } from "@heroicons/react/24/outline";
import type { ProjectTimeStats } from "./types";
import { formatDuration } from "./helpers";

interface TimeReportsProjectsTabProps {
  projectStats: ProjectTimeStats[];
  totalMinutes: number;
}

export const TimeReportsProjectsTab: React.FC<TimeReportsProjectsTabProps> = ({
  projectStats,
  totalMinutes,
}) => {
  if (projectStats.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FolderIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground dark:text-foreground" />
        <p>لا توجد بيانات</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {projectStats.map((stat, index) => (
        <div
          key={stat.projectId}
          className="bg-gray-50 dark:bg-muted rounded-lg p-4 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <span className="w-8 h-8 bg-success dark:bg-success/60 text-success dark:text-success rounded-full flex items-center justify-center font-bold ms-3 tabular-nums">
                {index + 1}
              </span>
              <span className="font-medium text-foreground">
                {stat.projectName}
              </span>
            </div>
            <div className="text-left tabular-nums">
              <span className="text-lg font-bold text-success dark:text-success">
                {formatDuration(stat.totalMinutes)}
              </span>
              <span className="text-sm text-muted-foreground me-2">
                ({stat.tasksCount} سجل)
              </span>
            </div>
          </div>
          <div className="w-full bg-muted dark:bg-muted rounded-full h-2">
            <div
              className="bg-green-600 dark:bg-success h-2 rounded-full transition-all duration-300"
              style={{
                width: `${
                  totalMinutes > 0 ? (stat.totalMinutes / totalMinutes) * 100 : 0
                }%`,
              }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};
