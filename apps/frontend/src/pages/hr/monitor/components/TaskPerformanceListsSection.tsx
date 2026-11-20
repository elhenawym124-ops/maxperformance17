import React from "react";
import { CheckCircle2, Clock, AlertCircle, ListTodo } from "lucide-react";
import {
  CompletedTaskItem,
  CreatedTaskItem,
  OpenTaskItem,
} from "./TaskPerformanceCard";

interface TaskPerformanceListsSectionProps {
  tasks: CompletedTaskItem[];
  createdTasks: CreatedTaskItem[];
  openTasks: OpenTaskItem[];
  overdueCount: number;
  totalActiveSeconds: number;
  formatDuration: (seconds: number) => string;
}

export const TaskPerformanceListsSection: React.FC<
  TaskPerformanceListsSectionProps
> = ({
  tasks,
  createdTasks,
  openTasks,
  overdueCount,
  totalActiveSeconds,
  formatDuration,
}) => {
  return (
    <>
      {/* Completed Tasks List Table / Feed */}
      {tasks.length > 0 ? (
        <div className="mt-3 overflow-hidden rounded-lg border border-border/40 bg-card dark:bg-muted">
          <div className="border-b border-border/40 bg-muted/50 dark:bg-muted px-3 py-2 text-xs font-semibold text-foreground">
            المهام المنفذة والمسجلة اليوم (
            <span className="font-mono tabular-nums">{tasks.length}</span>)
          </div>
          <div className="divide-y divide-border/20">
            {tasks.map((task) => {
              const timeStr = task.completedAt
                ? new Date(task.completedAt).toLocaleTimeString("ar-EG", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—";

              const isReview = task.status === "IN_REVIEW";

              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-2.5 text-xs transition-colors hover:bg-muted/50 dark:hover:bg-muted"
                >
                  <div className="flex items-center gap-2">
                    {isReview ? (
                      <Clock className="h-3.5 w-3.5 text-warning dark:text-warning shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 text-success dark:text-success shrink-0" />
                    )}
                    <div>
                      <div className="font-semibold text-foreground">
                        {task.title}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        المشروع: {task.projectName || "عام"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 font-mono tabular-nums">
                    {isReview ? (
                      <span className="rounded bg-warning/10 text-warning border border-warning dark:border-transparent dark:bg-warning/10 dark:text-warning px-1.5 py-0.5 text-[10px] font-medium">
                        قيد الاعتماد
                      </span>
                    ) : (
                      <span className="rounded bg-success/10 text-success border border-success dark:border-transparent dark:bg-success/10 dark:text-success px-1.5 py-0.5 text-[10px] font-medium">
                        معتمدة
                      </span>
                    )}
                    {task.priority && (
                      <span className="rounded bg-muted dark:bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground dark:text-muted-foreground">
                        {task.priority}
                      </span>
                    )}
                    <span className="text-[11px] text-muted-foreground">
                      {isReview ? "سُلّمت:" : "اكتملت:"} {timeStr}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-dashed border-border/40 p-3 text-xs text-muted-foreground">
          <AlertCircle className="h-4 w-4 text-warning dark:text-warning shrink-0" />
          <span>
            لم تُسجل مهام رسمية مكتملة اليوم على النظام. قد يكون وقت العمل
            الفعلي (
            <span className="font-mono tabular-nums">
              {formatDuration(totalActiveSeconds)}
            </span>
            ) مستهلكاً في اجتماعات، تواصل، أو مهام غير مسندة في النظام.
          </span>
        </div>
      )}

      {/* Created / Delegated Tasks List */}
      {createdTasks.length > 0 && (
        <div className="mt-3 overflow-hidden rounded-lg border border-border/40 bg-card dark:bg-muted">
          <div className="flex items-center gap-1.5 border-b border-border/40 bg-muted/50 dark:bg-muted px-3 py-2 text-xs font-semibold text-info dark:text-info">
            <ListTodo className="h-3.5 w-3.5" />
            <span>
              المهام التي قام الموظف بإنشائها وتكليفها اليوم (
              <span className="font-mono tabular-nums">
                {createdTasks.length}
              </span>
              )
            </span>
          </div>
          <div className="divide-y divide-border/20">
            {createdTasks.map((task) => {
              const timeStr = task.createdAt
                ? new Date(task.createdAt).toLocaleTimeString("ar-EG", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—";

              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-2.5 text-xs transition-colors hover:bg-muted/50 dark:hover:bg-muted"
                >
                  <div className="flex items-center gap-2">
                    <ListTodo className="h-3.5 w-3.5 text-info dark:text-info shrink-0" />
                    <div>
                      <div className="font-semibold text-foreground">
                        {task.title}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        المشروع: {task.projectName || "عام"} • المكلّف به:{" "}
                        <span className="text-foreground font-medium">
                          {task.assignedToName}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 font-mono tabular-nums">
                    {task.priority && (
                      <span className="rounded bg-muted dark:bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground dark:text-muted-foreground">
                        {task.priority}
                      </span>
                    )}
                    <span className="text-[11px] text-muted-foreground">
                      أُنشئت: {timeStr}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Open & Overdue Tasks List */}
      {openTasks.length > 0 && (
        <div className="mt-3 overflow-hidden rounded-lg border border-border/40 bg-card dark:bg-muted">
          <div className="flex items-center justify-between border-b border-border/40 bg-muted/50 dark:bg-muted px-3 py-2 text-xs font-semibold text-foreground">
            <div className="flex items-center gap-1.5 text-primary">
              <Clock className="h-3.5 w-3.5" />
              <span>
                المهام المتبقية قيد التنفيذ (
                <span className="font-mono tabular-nums">
                  {openTasks.length}
                </span>
                )
              </span>
            </div>
            {overdueCount > 0 && (
              <span className="text-[10px] font-bold text-destructive dark:text-destructive font-mono tabular-nums">
                منها {overdueCount} متأخرة عن موعدها
              </span>
            )}
          </div>
          <div className="divide-y divide-border/20">
            {openTasks.map((task) => {
              const dueStr = task.dueDate
                ? new Date(task.dueDate).toLocaleDateString("ar-EG", {
                    month: "short",
                    day: "numeric",
                  })
                : null;
              const isOverdue =
                task.dueDate && new Date(task.dueDate) < new Date();

              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-2.5 text-xs transition-colors hover:bg-muted/50 dark:hover:bg-muted"
                >
                  <div className="flex items-center gap-2">
                    <Clock
                      className={`h-3.5 w-3.5 shrink-0 ${isOverdue ? "text-rose-500" : "text-indigo-500 dark:text-primary"}`}
                    />
                    <div>
                      <div className="font-semibold text-foreground">
                        {task.title}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        المشروع: {task.projectName || "عام"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 font-mono tabular-nums">
                    {isOverdue ? (
                      <span className="rounded bg-destructive/10 text-destructive border border-destructive dark:border-transparent dark:bg-destructive/10 dark:text-destructive px-1.5 py-0.5 text-[10px] font-bold">
                        متأخرة ({dueStr})
                      </span>
                    ) : dueStr ? (
                      <span className="text-[11px] text-muted-foreground">
                        تاريخ التسليم: {dueStr}
                      </span>
                    ) : null}
                    {task.priority && (
                      <span className="rounded bg-muted dark:bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground dark:text-muted-foreground">
                        {task.priority}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};
