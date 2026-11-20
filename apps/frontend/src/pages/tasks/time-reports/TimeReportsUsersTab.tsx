import React from "react";
import { UserGroupIcon } from "@heroicons/react/24/outline";
import type { UserTimeStats } from "./types";
import { formatDuration } from "./helpers";

interface TimeReportsUsersTabProps {
  userStats: UserTimeStats[];
  totalMinutes: number;
}

export const TimeReportsUsersTab: React.FC<TimeReportsUsersTabProps> = ({
  userStats,
  totalMinutes,
}) => {
  if (userStats.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <UserGroupIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground dark:text-foreground" />
        <p>لا توجد بيانات</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {userStats.map((stat, index) => (
        <div
          key={stat.userId}
          className="bg-gray-50 dark:bg-muted rounded-lg p-4 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <span className="w-8 h-8 bg-primary dark:bg-primary/60 text-primary rounded-full flex items-center justify-center font-bold ms-3 tabular-nums">
                {index + 1}
              </span>
              <span className="font-medium text-foreground">
                {stat.userName}
              </span>
            </div>
            <div className="text-left tabular-nums">
              <span className="text-lg font-bold text-primary">
                {formatDuration(stat.totalMinutes)}
              </span>
              <span className="text-sm text-muted-foreground me-2">
                ({stat.tasksCount} سجل)
              </span>
            </div>
          </div>
          <div className="w-full bg-muted dark:bg-muted rounded-full h-2">
            <div
              className="bg-indigo-600 dark:bg-primary h-2 rounded-full transition-all duration-300"
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
