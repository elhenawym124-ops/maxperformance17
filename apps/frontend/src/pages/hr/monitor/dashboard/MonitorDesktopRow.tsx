import React from "react";
import {
  Laptop,
  AlertTriangle,
  CheckCircle2,
  PauseCircle,
  XCircle,
  ExternalLink,
  ListTodo,
  Coffee,
} from "lucide-react";
import { TeamMemberSummary } from "./types";
import {
  formatClockTime,
  formatSeconds,
  getCheckInMethodLabel,
} from "./helpers";

interface MonitorDesktopRowProps {
  member: TeamMemberSummary;
  onSelectEmployee: (employeeId: string) => void;
}

export const MonitorDesktopRow: React.FC<MonitorDesktopRowProps> = ({
  member: m,
  onSelectEmployee,
}) => {
  const inTimeStr = formatClockTime(m.clockInTime);
  const firstActStr = formatClockTime(m.firstActivityTime);
  const methodLabel = getCheckInMethodLabel(m.checkInMethod);
  const warmupMin = m.lateStartMinutes ?? 0;
  const weeklyAvg = m.weeklyAvgLateStartMinutes ?? warmupMin;

  return (
    <tr className="transition-colors hover:bg-muted/50 dark:hover:bg-muted">
      <td className="px-4 py-3">
        <div className="font-semibold text-foreground">{m.employeeName}</div>
        <div className="text-[11px] text-muted-foreground">
          {m.departmentName} • {m.jobTitle}
        </div>
      </td>

      <td className="px-4 py-3">
        <div className="space-y-1">
          {m.status === "active" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success dark:text-success ring-1 ring-inset ring-success/20">
              <CheckCircle2 className="h-3 w-3" /> نشط الآن
            </span>
          )}
          {m.status === "break" && (
            <div className="space-y-0.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-semibold text-warning dark:text-warning ring-1 ring-inset ring-warning/30">
                <Coffee className="h-3 w-3 text-warning" /> استراحة:{" "}
                {m.breakReason || "استراحة رسمية"}
              </span>
              {m.deviceName && (
                <div className="text-[10px] text-muted-foreground">
                  {m.deviceName}
                </div>
              )}
            </div>
          )}
          {m.status === "idle" && (
            <div className="space-y-0.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-[11px] font-semibold text-warning dark:text-warning ring-1 ring-inset ring-warning/20">
                <PauseCircle className="h-3 w-3" /> خامل (مفتوح)
              </span>
              {m.deviceName && (
                <div className="text-[10px] text-muted-foreground">
                  {m.deviceName}
                </div>
              )}
            </div>
          )}
          {m.status === "offline" && (
            <div className="space-y-0.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-muted dark:bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground dark:text-muted-foreground ring-1 ring-inset ring-border/20">
                <XCircle className="h-3 w-3" /> غير متصل
              </span>
              {m.lastSeenTime && (
                <div className="text-[10px] text-muted-foreground font-mono tabular-nums">
                  آخر اتصال: {formatClockTime(m.lastSeenTime)}
                </div>
              )}
            </div>
          )}

          {m.operationalSignal && m.operationalSignal.type !== "NORMAL" && (
            <div>
              <span
                className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold ${
                  m.operationalSignal.type === "TASK_OVERLOAD"
                    ? "bg-indigo-50 text-primary border border-primary dark:border-transparent dark:bg-primary/15 dark:text-primary"
                    : m.operationalSignal.type === "DISTRACTION"
                      ? "bg-amber-50 text-warning border border-warning dark:border-transparent dark:bg-warning/15 dark:text-warning"
                      : m.operationalSignal.type === "NEGLECT"
                        ? "bg-rose-50 text-destructive border border-destructive dark:border-transparent dark:bg-destructive/15 dark:text-destructive"
                        : m.operationalSignal.type === "STEADY_PERFORMANCE"
                          ? "bg-emerald-50 text-success border border-success dark:border-transparent dark:bg-success/15 dark:text-success"
                          : "bg-sky-50 text-info border border-info dark:border-transparent dark:bg-info/15 dark:text-info"
                }`}
                title={m.operationalSignal.reason}
              >
                {m.operationalSignal.label}
              </span>
            </div>
          )}
        </div>
      </td>

      <td className="px-4 py-3">
        <div className="space-y-1 text-[11px]">
          <div className="flex items-center gap-1.5 font-mono tabular-nums">
            <span className="text-muted-foreground font-sans">البصمة:</span>
            {inTimeStr ? (
              <span className="font-semibold text-foreground">
                {inTimeStr}{" "}
                <span className="text-[10px] text-info dark:text-info font-normal font-sans">
                  ({methodLabel})
                </span>
              </span>
            ) : (
              <span className="text-rose-600 dark:text-destructive/80 font-medium font-sans">
                لم يسجل حضوراً
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 font-mono tabular-nums">
            <span className="text-muted-foreground font-sans">أول نشاط:</span>
            {firstActStr ? (
              <span className="font-semibold text-success dark:text-success">
                {firstActStr}
              </span>
            ) : (
              <span className="text-muted-foreground font-normal font-sans">
                لا توجد حركة مسجلة
              </span>
            )}
          </div>

          {m.clockInTime && (
            <div className="pt-0.5 space-y-0.5">
              <span
                className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold ${
                  warmupMin <= 15
                    ? "bg-emerald-50 text-success border border-success dark:border-transparent dark:bg-success/15 dark:text-success"
                    : warmupMin < 30
                      ? "bg-amber-50 text-warning border border-warning dark:border-transparent dark:bg-warning/15 dark:text-warning"
                      : "bg-rose-50 text-destructive border border-destructive dark:border-transparent dark:bg-destructive/15 dark:text-destructive"
                }`}
                title={`الفارق بين البصمة وبداية استخدام الجهاز: ${warmupMin} دقيقة`}
              >
                {warmupMin <= 0
                  ? "تسخين فوري (0 د)"
                  : `وقت تسخين: ${warmupMin} د`}
              </span>
              {weeklyAvg > 0 && (
                <div className="text-[10px] text-muted-foreground font-mono tabular-nums">
                  متوسط 7 أيام: {weeklyAvg} د
                </div>
              )}
            </div>
          )}

          {m.untrackedSeconds && m.untrackedSeconds >= 15 * 60 ? (
            <div className="pt-0.5">
              <span
                className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium bg-destructive/10 text-destructive border border-destructive dark:border-transparent dark:bg-destructive/15 dark:text-destructive"
                title="الموظف سجل حضوراً بالبصمة لكن الجهاز كان متوقفاً أو خارج نطاق العمل"
              >
                <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
                <span>غير موثق: {formatSeconds(m.untrackedSeconds)}</span>
              </span>
            </div>
          ) : null}
        </div>
      </td>

      <td className="px-4 py-3 font-mono tabular-nums">
        <div className="space-y-0.5">
          <div className="font-semibold text-foreground">
            {formatSeconds(m.totalActiveSeconds)}
          </div>
          {typeof m.activityRatio === "number" && (
            <div className="text-[10px] font-semibold text-primary">
              نسبة النشاط: {m.activityRatio}%
            </div>
          )}
          {m.totalClockSeconds && m.totalClockSeconds > 0 ? (
            <div className="text-[10px] text-muted-foreground">
              من دوام {formatSeconds(m.totalClockSeconds)}
            </div>
          ) : null}
        </div>
      </td>

      <td className="px-4 py-3 font-mono tabular-nums">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 font-medium text-foreground text-xs">
            <span className="text-muted-foreground text-[11px] font-sans">
              سكون:
            </span>
            <span className="font-semibold">
              {formatSeconds(m.totalSleepSeconds ?? m.totalIdleSeconds)}
            </span>
          </div>
          {(m.totalBreaksCount && m.totalBreaksCount > 0) ||
          (m.totalBreakSeconds && m.totalBreakSeconds > 0) ? (
            <div className="inline-flex items-center gap-1 rounded bg-warning/10 px-1.5 py-0.5 text-[10px] font-semibold text-warning dark:text-warning ring-1 ring-inset ring-warning/20">
              <span>بريك: {formatSeconds(m.totalBreakSeconds || 0)}</span>
              <span className="text-amber-600 dark:text-warning font-bold">
                ({m.totalBreaksCount} مرات)
              </span>
            </div>
          ) : (
            <div className="text-[10px] text-muted-foreground font-sans">
              لا توجد فترات بريك
            </div>
          )}
        </div>
      </td>

      <td className="px-4 py-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted dark:bg-muted">
              <div
                className={`h-full rounded-full ${
                  m.productivityScore >= 75
                    ? "bg-emerald-500"
                    : m.productivityScore >= 50
                      ? "bg-sky-500"
                      : "bg-amber-500"
                }`}
                style={{ width: `${Math.min(100, m.productivityScore)}%` }}
              />
            </div>
            <span className="font-semibold text-foreground font-mono tabular-nums">
              {m.productivityScore}%
            </span>
          </div>
          {m.tasksPerHour !== undefined && m.tasksPerHour > 0 && (
            <div className="text-[10px] font-medium text-primary dark:text-primary font-mono tabular-nums">
              {m.tasksPerHour} مهمة/ساعة
            </div>
          )}
        </div>
      </td>

      <td className="px-4 py-3 font-mono tabular-nums">
        <div className="flex flex-col gap-1">
          {m.activeTask && (
            <span
              className="inline-flex items-center gap-1 rounded bg-info/10 px-1.5 py-0.5 text-[10px] font-semibold text-info dark:text-info ring-1 ring-info/25 max-w-[155px] truncate font-sans"
              title={`يعمل الآن على: ${m.activeTask.title}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-info dark:bg-info animate-pulse shrink-0" />
              <span className="truncate">{m.activeTask.title}</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1 font-semibold text-success dark:text-success">
            <CheckCircle2 className="h-3 w-3 shrink-0" />
            <span>{m.completedTasksCount || 0} منجزة</span>
          </span>
          {m.openTasksCount !== undefined && m.openTasksCount > 0 && (
            <span className="text-[10px] font-medium text-primary">
              {m.openTasksCount} قيد التنفيذ
            </span>
          )}
          {m.overdueTasksCount !== undefined && m.overdueTasksCount > 0 && (
            <span className="text-[10px] font-bold text-destructive dark:text-destructive">
              {m.overdueTasksCount} متأخرة
            </span>
          )}
          {(m.createdTasksCount || 0) > 0 && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-medium text-info dark:text-info"
              title="مهام تم إنشاؤها وتكليفها اليوم"
            >
              <ListTodo className="h-2.5 w-2.5 shrink-0" />
              <span>{m.createdTasksCount} منشأة</span>
            </span>
          )}
        </div>
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 text-foreground">
          <Laptop className="h-3.5 w-3.5 text-info dark:text-info shrink-0" />
          <span
            className="truncate max-w-[130px] font-medium"
            title={m.topApp || "سطح المكتب"}
          >
            {m.topApp || "سطح المكتب"}
          </span>
        </div>
      </td>

      <td className="px-4 py-3 text-left">
        <button
          onClick={() => onSelectEmployee(m.employeeId)}
          className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-background dark:bg-muted px-2.5 py-1 text-xs font-medium text-info dark:text-info transition hover:bg-info/10 hover:border-info/30 active:scale-95 shadow-xs"
          title="عرض المخطط الزمني والبرامج والمواقع لهذا الموظف"
        >
          <span>التفاصيل</span>
          <ExternalLink className="h-3 w-3" />
        </button>
      </td>
    </tr>
  );
};
