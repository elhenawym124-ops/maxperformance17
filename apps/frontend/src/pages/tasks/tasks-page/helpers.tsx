import React from "react";
import {
  CheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentCheckIcon,
  PauseCircleIcon,
} from "@heroicons/react/24/outline";
import { normalizeTaskStatus } from "./types";
import type { TaskScopeFilter } from "../types";

export const getStatusIcon = (status: string) => {
  switch (normalizeTaskStatus(status)) {
    case "pending":
      return <ClockIcon className="h-5 w-5 text-warning" />;
    case "in_progress":
      return <ExclamationTriangleIcon className="h-5 w-5 text-primary" />;
    case "in_review":
      return <ClipboardDocumentCheckIcon className="h-5 w-5 text-primary" />;
    case "on_hold":
      return <PauseCircleIcon className="h-5 w-5 text-warning" />;
    case "completed":
      return <CheckIcon className="h-5 w-5 text-success" />;
    case "cancelled":
      return <ExclamationTriangleIcon className="h-5 w-5 text-destructive" />;
    default:
      return <ClockIcon className="h-5 w-5 text-muted-foreground" />;
  }
};

export const getStatusColor = (status: string) => {
  switch (normalizeTaskStatus(status)) {
    case "pending":
      return "bg-yellow-100 dark:bg-warning/30 text-warning dark:text-warning";
    case "in_progress":
      return "bg-blue-100 dark:bg-primary/30 text-primary dark:text-primary";
    case "in_review":
      return "bg-purple-100 dark:bg-primary/30 text-primary dark:text-primary";
    case "on_hold":
      return "bg-amber-100 dark:bg-warning/30 text-warning dark:text-warning";
    case "completed":
      return "bg-green-100 dark:bg-success/30 text-success dark:text-success";
    case "cancelled":
      return "bg-red-100 dark:bg-destructive/30 text-destructive dark:text-destructive";
    default:
      return "bg-muted text-foreground dark:text-muted-foreground";
  }
};

export const getStatusText = (status: string) => {
  switch (normalizeTaskStatus(status)) {
    case "pending":
      return "في الانتظار";
    case "in_progress":
      return "قيد التنفيذ";
    case "in_review":
      return "بانتظار الاعتماد";
    case "on_hold":
      return "معلّقة";
    case "completed":
      return "مكتمل";
    case "cancelled":
      return "ملغي";
    default:
      return status;
  }
};

export const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "urgent":
      return "bg-red-100 dark:bg-destructive/30 text-destructive dark:text-destructive";
    case "high":
      return "bg-orange-100 dark:bg-warning/30 text-warning dark:text-warning";
    case "medium":
      return "bg-yellow-100 dark:bg-warning/30 text-warning dark:text-warning";
    case "low":
      return "bg-green-100 dark:bg-success/30 text-success dark:text-success";
    default:
      return "bg-muted text-foreground dark:text-muted-foreground";
  }
};

export const getPriorityText = (priority: string) => {
  switch (priority) {
    case "urgent":
      return "عاجل";
    case "high":
      return "عالي";
    case "medium":
      return "متوسط";
    case "low":
      return "منخفض";
    default:
      return priority;
  }
};

export const isOverdue = (dueDate: string | null, status: string) => {
  if (!dueDate) {
    return false;
  }

  return (
    new Date(dueDate) < new Date() &&
    !["completed", "cancelled"].includes(normalizeTaskStatus(status))
  );
};

export interface ServerTaskStatsPayload {
  totalTasks?: number;
  total?: number;
  myTasks?: number;
  totalMyTasks?: number;
  tasksByStatus?: {
    pending?: number;
    inProgress?: number;
    in_progress?: number;
    inReview?: number;
    in_review?: number;
    onHold?: number;
    on_hold?: number;
    completed?: number;
    cancelled?: number;
    [key: string]: number | undefined;
  };
  myTasksByStatus?: {
    pending?: number;
    inProgress?: number;
    in_progress?: number;
    inReview?: number;
    in_review?: number;
    onHold?: number;
    on_hold?: number;
    completed?: number;
    cancelled?: number;
    [key: string]: number | undefined;
  };
  tasksByPriority?: Record<string, number>;
  overdueTasks?: number;
  myOverdueTasks?: number;
  overdue?: number;
  myOverdue?: number;
}

export interface TaskStatsSummary {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

export function computeTaskStats({
  serverStats,
  safeTasks = [],
  serverTotalTasks = 0,
  taskFilter = "all",
}: {
  serverStats?: ServerTaskStatsPayload | null;
  safeTasks?: Array<{ dueDate?: string | null; status?: string | null }>;
  serverTotalTasks?: number;
  taskFilter?: TaskScopeFilter | string;
}): TaskStatsSummary {
  if (serverStats) {
    const statusCounts =
      (taskFilter === "my-tasks"
        ? serverStats.myTasksByStatus || serverStats.tasksByStatus
        : serverStats.tasksByStatus) || null;

    if (statusCounts) {
      const overdue =
        taskFilter === "my-tasks"
          ? (serverStats.myOverdue ??
             serverStats.myOverdueTasks ??
             serverStats.overdue ??
             serverStats.overdueTasks ??
             0)
          : (serverStats.overdue ?? serverStats.overdueTasks ?? 0);

      const total =
        serverTotalTasks > 0
          ? serverTotalTasks
          : taskFilter === "my-tasks"
            ? (serverStats.myTasks ??
               serverStats.totalMyTasks ??
               serverStats.totalTasks ??
               serverStats.total ??
               0)
            : (serverStats.totalTasks ?? serverStats.total ?? 0);

      const pending =
        (statusCounts.pending ?? 0) +
        (statusCounts.inReview ?? statusCounts.in_review ?? 0);

      const inProgress =
        statusCounts.inProgress ?? statusCounts.in_progress ?? 0;

      const completed = statusCounts.completed ?? 0;

      return {
        total,
        pending,
        inProgress,
        completed,
        overdue,
      };
    }
  }

  // Fallback when serverStats is not available (e.g. offline)
  return {
    total: serverTotalTasks > 0 ? serverTotalTasks : safeTasks.length,
    pending: safeTasks.filter((t) => {
      const s = t.status?.toLowerCase();
      return s === "pending" || s === "in_review";
    }).length,
    inProgress: safeTasks.filter(
      (t) => t.status?.toLowerCase() === "in_progress"
    ).length,
    completed: safeTasks.filter(
      (t) => t.status?.toLowerCase() === "completed"
    ).length,
    overdue: safeTasks.filter((t) => isOverdue(t.dueDate ?? null, t.status ?? "")).length,
  };
}
