import React from "react";
import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  FolderPlusIcon,
  PlusIcon,
  QueueListIcon,
} from "@heroicons/react/24/outline";
import { Target } from "lucide-react";

import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import type { TaskScopeFilter } from "../types";

type TaskWorkspaceHeaderProps = {
  taskFilter: TaskScopeFilter;
  hasCommandState: boolean;
  selectedTasksCount: number;
  visibleTasksCount: number;
  headline: string;
  description: string;
  taskStats: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
  };
  setShowFilterSidebar: (show: boolean) => void;
  setShowCreateTaskModal: (show: boolean) => void;
  setShowCreateProjectModal: (show: boolean) => void;
  setShowCreateGoalModal?: (show: boolean) => void;
  exportToCSV: () => void;
  scrollToBulkActions: () => void;
  showOverdueIndicators: boolean;
  showProjectShortcut: boolean;
};

const scopeLabels: Record<TaskScopeFilter, string> = {
  all: "كل المهام",
  "my-tasks": "مهامي",
  "assigned-by-me": "أنشأتها أنا",
};

export const TaskWorkspaceHeader: React.FC<TaskWorkspaceHeaderProps> = ({
  taskFilter,
  hasCommandState,
  selectedTasksCount,
  visibleTasksCount,
  headline,
  description,
  taskStats,
  setShowFilterSidebar,
  setShowCreateTaskModal,
  setShowCreateProjectModal,
  setShowCreateGoalModal,
  exportToCSV,
  scrollToBulkActions,
  showOverdueIndicators,
  showProjectShortcut,
}) => {
  const openTasksCount = taskStats.pending + taskStats.inProgress;

  return (
    <section className="relative overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-card via-card/95 to-card/80 px-4 py-3.5 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.18)] md:px-5 md:py-4">
      {/* Subtle decorative gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-primary/[0.04] via-transparent to-transparent" />

      <div className="relative flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        {/* Left: Title + badges */}
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge
              variant="outline"
              className="rounded-full border-primary/20 bg-primary/8 px-2.5 py-0.5 text-[11px] font-medium text-primary"
            >
              {scopeLabels[taskFilter]}
            </Badge>
            {hasCommandState ? (
              <Badge
                variant="outline"
                className="rounded-full border-primary/20 bg-primary/8 px-2.5 py-0.5 text-[11px] font-medium text-primary dark:text-primary"
              >
                عرض مخصص
              </Badge>
            ) : null}
            {showOverdueIndicators && taskStats.overdue > 0 ? (
              <Badge
                variant="outline"
                className="animate-pulse rounded-full border-destructive/25 bg-destructive/8 px-2.5 py-0.5 text-[11px] font-medium text-destructive dark:text-destructive"
              >
                {taskStats.overdue} متأخرة
              </Badge>
            ) : null}
            {selectedTasksCount > 0 ? (
              <Badge
                variant="outline"
                className="rounded-full border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary"
              >
                {selectedTasksCount} محددة
              </Badge>
            ) : null}
          </div>

          <div className="flex min-w-0 flex-col gap-0.5 md:flex-row md:items-baseline md:gap-2.5">
            <h1 className="shrink-0 text-lg font-bold tracking-tight text-foreground">
              المهام
            </h1>
            <p
              className="truncate text-sm text-muted-foreground"
              title={description}
            >
              {headline}
            </p>
          </div>
        </div>

        {/* Right: Action buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-xl border-border/70 px-3 text-xs font-medium shadow-sm transition-all hover:border-border hover:shadow-md"
            onClick={selectedTasksCount > 0 ? scrollToBulkActions : exportToCSV}
          >
            {selectedTasksCount > 0 ? (
              <>
                <QueueListIcon className="size-4" />
                الإجراءات
              </>
            ) : (
              <>
                <ArrowDownTrayIcon className="size-4" />
                تصدير
              </>
            )}
          </Button>
          {showProjectShortcut ? (
            <Button
              type="button"
              variant="outline"
              className="hidden h-9 rounded-xl border-border/70 px-3 text-xs font-medium shadow-sm transition-all hover:border-border hover:shadow-md lg:inline-flex"
              onClick={() => setShowCreateProjectModal(true)}
            >
              <FolderPlusIcon className="size-4" />
              مشروع جديد
            </Button>
          ) : null}
          {setShowCreateGoalModal ? (
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-xl border-info/30 bg-info/5 px-3 text-xs font-medium text-info shadow-sm transition-all hover:bg-info/10 hover:border-info/40 dark:text-info"
              data-testid="tasks-open-create-goal-modal"
              onClick={() => setShowCreateGoalModal(true)}
            >
              <Target className="size-4 text-info" />
              أنشئ هدف
            </Button>
          ) : null}
          <Button
            type="button"
            className="h-9 rounded-xl px-3.5 text-xs font-semibold shadow-md transition-all hover:shadow-lg hover:brightness-105"
            data-testid="tasks-open-create-modal"
            onClick={() => setShowCreateTaskModal(true)}
          >
            <PlusIcon className="size-4" />
            مهمة جديدة
          </Button>
        </div>
      </div>

      {/* Inline Telemetry Bar (Compact 2026 single-surface style) */}
      <div className="relative mt-2.5 flex flex-wrap items-center gap-2 border-t border-border/40 pt-2 text-xs">
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 bg-background/60 px-2 py-0.5 text-[11px]">
          <span className="size-1.5 rounded-full bg-muted-foreground/40" />
          <span className="text-muted-foreground">ظاهر</span>
          <strong className="font-semibold text-foreground tabular-nums">{visibleTasksCount}</strong>
        </span>

        <span className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/6 px-2 py-0.5 text-[11px]">
          <ClockIcon className="size-3 text-primary" />
          <span className="text-blue-700 dark:text-primary">مفتوحة</span>
          <strong className="font-semibold text-primary dark:text-primary tabular-nums">{openTasksCount}</strong>
        </span>

        <span className="inline-flex items-center gap-1.5 rounded-lg border border-warning/20 bg-warning/6 px-2 py-0.5 text-[11px]">
          <span className="size-1.5 rounded-full bg-warning" />
          <span className="text-amber-700 dark:text-warning">انتظار</span>
          <strong className="font-semibold text-warning dark:text-warning tabular-nums">{taskStats.pending}</strong>
        </span>

        <span className="inline-flex items-center gap-1.5 rounded-lg border border-success/20 bg-success/6 px-2 py-0.5 text-[11px]">
          <CheckCircleIcon className="size-3 text-success" />
          <span className="text-emerald-700 dark:text-success">مكتملة</span>
          <strong className="font-semibold text-success dark:text-success tabular-nums">{taskStats.completed}</strong>
        </span>

        {showOverdueIndicators && taskStats.overdue > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/25 bg-destructive/8 px-2 py-0.5 text-[11px]">
            <ExclamationCircleIcon className="size-3 text-destructive" />
            <span className="text-rose-700 dark:text-destructive">متأخرة</span>
            <strong className="font-semibold text-destructive dark:text-destructive tabular-nums">{taskStats.overdue}</strong>
          </span>
        ) : null}
      </div>
    </section>
  );
};
