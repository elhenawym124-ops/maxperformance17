import React from "react";
import {
  ClockIcon,
  ChartBarIcon,
  UserGroupIcon,
  FolderIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { formatDuration } from "./helpers";
import type { TimeEvaluationSummary } from "./types";

interface TimeReportsSummaryCardsProps {
  totalMinutes: number;
  filteredCount: number;
  userCount: number;
  projectCount: number;
  summary?: TimeEvaluationSummary | null;
}

export const TimeReportsSummaryCards: React.FC<TimeReportsSummaryCardsProps> = ({
  totalMinutes,
  filteredCount,
  userCount,
  projectCount,
  summary,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {/* 1. Total Time */}
      <div className="bg-card rounded-lg shadow p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              إجمالي الوقت
            </p>
            <p className="text-lg sm:text-2xl font-bold text-primary tabular-nums">
              {formatDuration(totalMinutes)}
            </p>
          </div>
          <ClockIcon className="h-8 w-8 text-primary" />
        </div>
      </div>

      {/* 2. Entries Count */}
      <div className="bg-card rounded-lg shadow p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              عدد السجلات
            </p>
            <p className="text-lg sm:text-2xl font-bold text-foreground tabular-nums">
              {filteredCount}
            </p>
          </div>
          <ChartBarIcon className="h-8 w-8 text-muted-foreground" />
        </div>
      </div>

      {/* 3. Active Users */}
      <div className="bg-card rounded-lg shadow p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              المستخدمين النشطين
            </p>
            <p className="text-lg sm:text-2xl font-bold text-success dark:text-success tabular-nums">
              {userCount}
            </p>
          </div>
          <UserGroupIcon className="h-8 w-8 text-success" />
        </div>
      </div>

      {/* 4. Active Projects */}
      <div className="bg-card rounded-lg shadow p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              المشاريع النشطة
            </p>
            <p className="text-lg sm:text-2xl font-bold text-primary dark:text-primary tabular-nums">
              {projectCount}
            </p>
          </div>
          <FolderIcon className="h-8 w-8 text-primary" />
        </div>
      </div>

      {/* 5. Estimation Accuracy */}
      <div className="bg-card rounded-lg shadow p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              دقة التقدير
            </p>
            <p className="text-lg sm:text-2xl font-bold text-success dark:text-success tabular-nums">
              {summary?.overallAccuracyPct ?? 0}%
            </p>
          </div>
          <ChartBarIcon className="h-8 w-8 text-success" />
        </div>
      </div>

      {/* 6. Rework Time */}
      <div className="bg-card rounded-lg shadow p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              إعادة العمل
            </p>
            <p className="text-lg sm:text-2xl font-bold text-warning dark:text-warning tabular-nums">
              {Math.round(summary?.totalReworkMinutes ?? 0)} د
            </p>
          </div>
          <ArrowPathIcon className="h-8 w-8 text-warning" />
        </div>
      </div>
    </div>
  );
};
