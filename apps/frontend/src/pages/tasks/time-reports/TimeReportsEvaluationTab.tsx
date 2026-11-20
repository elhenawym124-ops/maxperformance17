import React from "react";
import { Link } from "react-router-dom";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import {
  type TimeEvaluationSummary,
  type TimeEvaluationTask,
  RETURN_REASON_LABELS,
  RETURN_SEVERITY_LABELS,
} from "./types";

interface TimeReportsEvaluationTabProps {
  summary?: TimeEvaluationSummary | null;
  tasks?: TimeEvaluationTask[];
}

export const TimeReportsEvaluationTab: React.FC<TimeReportsEvaluationTabProps> = ({
  summary,
  tasks,
}) => {
  return (
    <div className="space-y-6">
      {/* Telemetry Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 bg-muted dark:bg-muted rounded-lg border border-border dark:border-border text-sm">
        <div>
          <span className="text-muted-foreground block text-xs">
            المهام المقيّمة
          </span>
          <span className="text-lg font-bold text-foreground tabular-nums">
            {summary?.totalTasks ?? 0}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground block text-xs">
            إجمالي الساعات المقدرة
          </span>
          <span className="text-lg font-bold text-foreground tabular-nums">
            {summary?.totalEstimatedHours ?? 0} س
          </span>
        </div>
        <div>
          <span className="text-muted-foreground block text-xs">
            إجمالي الساعات الفعلية
          </span>
          <span className="text-lg font-bold text-primary tabular-nums">
            {summary?.totalActualHours ?? 0} س
          </span>
        </div>
        <div>
          <span className="text-muted-foreground block text-xs">
            دقة التقدير الإجمالية
          </span>
          <span className="text-lg font-bold text-success dark:text-success tabular-nums">
            {summary?.overallAccuracyPct ?? 0}%
          </span>
        </div>
        <div>
          <span className="text-muted-foreground block text-xs">
            إجمالي وقت إعادة العمل
          </span>
          <span className="text-lg font-bold text-warning dark:text-warning tabular-nums">
            {Math.round(summary?.totalReworkMinutes ?? 0)} دقيقة
          </span>
        </div>
      </div>

      {/* Tasks Evaluation Table */}
      <div className="overflow-x-auto">
        {!tasks || tasks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ArrowPathIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground dark:text-foreground" />
            <p>لا توجد بيانات تقييم وقت أو مهام مطابقة في هذه الفترة</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-border dark:divide-border">
            <thead className="bg-gray-50 dark:bg-muted">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                  المهمة والمشروع
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                  المكلّف
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                  الحالة
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                  المقدّر
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                  الفعلي
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                  الانحراف والدقة
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                  الجلسات
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                  وقت إعادة العمل
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border dark:divide-border">
              {tasks.map((task) => {
                const isOver =
                  task.diffMinutes > 0 && task.estimatedMinutes > 0;
                const returnReasonLabel = task.returnReasonType
                  ? RETURN_REASON_LABELS[task.returnReasonType] ||
                    task.returnReasonType
                  : null;
                const returnSeverityLabel = task.returnSeverity
                  ? RETURN_SEVERITY_LABELS[task.returnSeverity] ||
                    `شدة ${task.returnSeverity}`
                  : null;

                return (
                  <tr
                    key={task.taskId}
                    className="hover:bg-gray-50/75 dark:hover:bg-muted transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link
                        to={`/tasks/${task.taskId}`}
                        className="text-indigo-600 hover:text-primary dark:text-primary font-medium block truncate max-w-xs"
                        title={task.title}
                      >
                        {task.title}
                      </Link>
                      <span className="text-xs text-muted-foreground/80">
                        {task.projectName || "بدون مشروع"}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground dark:text-muted-foreground">
                      {task.assigneeName || "غير محدد"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs">
                      <span className="px-2 py-0.5 rounded font-medium bg-muted text-foreground dark:bg-muted dark:text-muted-foreground">
                        {task.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground tabular-nums">
                      {task.estimatedHours} س
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold tabular-nums text-foreground">
                      {task.actualHours} س
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs">
                      <div className="flex items-center gap-1.5 tabular-nums">
                        <span
                          className={`px-1.5 py-0.5 rounded font-semibold ${
                            isOver
                              ? "bg-rose-50 text-destructive dark:bg-destructive/40 dark:text-destructive"
                              : "bg-emerald-50 text-success dark:bg-success/40 dark:text-success"
                          }`}
                        >
                          {task.diffHours > 0
                            ? `+${task.diffHours}س`
                            : `${task.diffHours}س`}{" "}
                          (
                          {task.diffPct > 0
                            ? `+${task.diffPct}%`
                            : `${task.diffPct}%`}
                          )
                        </span>
                        <span className="text-muted-foreground">
                          دقة: {task.accuracyPct}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground tabular-nums">
                      <span>{task.sessionsCount} جلسات</span>
                      {task.firstSession && (
                        <span className="block text-[10px] text-muted-foreground">
                          {new Date(task.firstSession).toLocaleDateString(
                            "ar-EG",
                            { month: "short", day: "numeric" }
                          )}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs">
                      <span
                        className={`px-2 py-0.5 rounded font-bold tabular-nums ${
                          task.reworkMinutes > 0
                            ? "bg-amber-100 text-warning dark:bg-warning/50 dark:text-warning"
                            : "bg-gray-100 text-foreground dark:bg-muted dark:text-muted-foreground"
                        }`}
                      >
                        {Math.round(task.reworkMinutes)} د
                      </span>
                      {returnReasonLabel && (
                        <div className="text-[10px] text-warning dark:text-warning mt-1 flex items-center gap-1">
                          <span>{returnReasonLabel}</span>
                          {returnSeverityLabel && (
                            <span className="font-semibold">
                              ({returnSeverityLabel})
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
