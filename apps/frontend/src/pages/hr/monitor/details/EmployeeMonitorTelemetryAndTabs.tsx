import React from "react";
import {
  Clock,
  Coffee,
  Activity,
  ShieldCheck,
  ListTodo,
  History,
  Grid,
} from "lucide-react";
import {
  EmployeeMonitorTimelineData,
  MonitorDetailsTabId,
} from "./types";
import { formatMonitorSeconds, getCheckInMethodLabel } from "./helpers";

interface EmployeeMonitorTelemetryAndTabsProps {
  data: EmployeeMonitorTimelineData;
  totalActive: number;
  totalIdle: number;
  prodScore: number;
  clockInStr: string | null;
  firstActivityStr: string | null;
  activityLagMinutes: number | null;
  activeTab: MonitorDetailsTabId;
  onSelectTab: (tab: MonitorDetailsTabId) => void;
}

export const EmployeeMonitorTelemetryAndTabs: React.FC<
  EmployeeMonitorTelemetryAndTabsProps
> = ({
  data,
  totalActive,
  totalIdle,
  prodScore,
  clockInStr,
  firstActivityStr,
  activityLagMinutes,
  activeTab,
  onSelectTab,
}) => {
  return (
    <>
      {/* 4 Primary Bento Telemetry Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {/* Active Time */}
        <div className="rounded-xl border border-border/40 bg-card/60 p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>وقت العمل الفعلي</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-success/10 text-success dark:text-success ring-1 ring-inset ring-success/20">
              <Clock className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-2 text-xl font-bold text-foreground font-mono tabular-nums">
            {formatMonitorSeconds(totalActive)}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-success dark:text-success">
            <span>تفاعل موثق عبر الماوس والكيبورد</span>
            {data.summary?.activityRatio !== undefined && (
              <span className="font-bold text-primary font-mono tabular-nums">
                نشاط {data.summary.activityRatio}%
              </span>
            )}
          </div>
        </div>

        {/* Idle & Break Breakdown */}
        <div className="rounded-xl border border-border/40 bg-card/60 p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>سكون الجهاز وفترات البريك</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-warning/10 text-warning dark:text-warning ring-1 ring-inset ring-warning/20">
              <Coffee className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-2 text-xl font-bold text-foreground font-mono tabular-nums">
            {formatMonitorSeconds(totalIdle)}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground font-medium font-mono tabular-nums">
              سكون:{" "}
              {formatMonitorSeconds(
                data.summary?.totalSleepSeconds ??
                  Math.max(
                    0,
                    totalIdle - (data.breaksSummary?.totalBreakSeconds || 0),
                  ),
              )}
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-warning/10 px-1.5 py-0.5 text-[10px] font-bold text-warning dark:text-warning ring-1 ring-inset ring-warning/20 font-mono tabular-nums">
              بريك:{" "}
              {formatMonitorSeconds(
                data.summary?.totalBreakSeconds ??
                  data.breaksSummary?.totalBreakSeconds ??
                  0,
              )}
              {data.summary?.totalBreaksCount ??
              data.breaksSummary?.totalBreaksCount
                ? ` (${data.summary?.totalBreaksCount ?? data.breaksSummary?.totalBreaksCount} مرات)`
                : ""}
            </span>
          </div>
        </div>

        {/* Productivity Score */}
        <div className="rounded-xl border border-border/40 bg-card/60 p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>معدل الإنتاجية اليومية</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-info/10 text-info dark:text-info ring-1 ring-inset ring-info/20">
              <Activity className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-2 text-xl font-bold text-foreground font-mono tabular-nums">
            {prodScore}%
          </div>
          <div className="mt-1 text-[11px] text-info dark:text-info">
            {prodScore >= 75
              ? "مستوى أداء ممتاز"
              : prodScore >= 50
                ? "مستوى أداء معتدل"
                : "يحتاج متابعة وتوجيه"}
          </div>
        </div>

        {/* Attendance & First Activity Match */}
        <div className="rounded-xl border border-border/40 bg-card/60 p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>البصمة وأول نشاط للجهاز</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary dark:text-primary ring-1 ring-inset ring-primary/20">
              <ShieldCheck className="h-3.5 w-3.5" />
            </span>
          </div>

          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">وقت الحضور:</span>
              <div className="flex items-center gap-1.5">
                {clockInStr ? (
                  <>
                    <span className="font-semibold text-foreground font-mono tabular-nums">
                      {clockInStr}
                    </span>
                    <span className="rounded bg-primary/10 text-primary border border-primary dark:border-transparent dark:bg-primary/15 dark:text-primary px-1.5 py-0.5 text-[10px] font-medium">
                      {getCheckInMethodLabel(data.summary?.checkInMethod)}
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground">لم يُسجل</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">أول نشاط للجهاز:</span>
              <span className="font-semibold text-foreground font-mono tabular-nums">
                {firstActivityStr || "لا يوجد"}
              </span>
            </div>

            {/* Warmup Time + Weekly Average */}
            {data.summary?.lateStartMinutes !== undefined ? (
              <div className="pt-1 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">وقت التسخين:</span>
                  <span
                    className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold font-mono tabular-nums ${
                      data.summary.lateStartMinutes <= 15
                        ? "bg-emerald-50 text-success dark:bg-success/10 dark:text-success"
                        : data.summary.lateStartMinutes < 30
                          ? "bg-amber-50 text-warning dark:bg-warning/10 dark:text-warning"
                          : "bg-rose-50 text-destructive dark:bg-destructive/15 dark:text-destructive"
                    }`}
                  >
                    {data.summary.lateStartMinutes <= 0
                      ? "بدأ فوراً (0 د)"
                      : `${data.summary.lateStartMinutes} دقيقة`}
                  </span>
                </div>
                {data.summary?.weeklyAvgLateStartMinutes !== undefined &&
                  data.summary.weeklyAvgLateStartMinutes > 0 && (
                    <div className="text-[10px] text-muted-foreground font-mono tabular-nums">
                      متوسط التسخين (7 أيام):{" "}
                      {data.summary.weeklyAvgLateStartMinutes} دقيقة
                    </div>
                  )}
              </div>
            ) : activityLagMinutes !== null ? (
              <div className="pt-1">
                {activityLagMinutes <= 5 ? (
                  <span className="inline-flex items-center gap-1 rounded bg-success/10 text-success border border-success dark:border-transparent dark:bg-success/10 dark:text-success px-1.5 py-0.5 text-[10px] font-semibold font-mono tabular-nums">
                    {activityLagMinutes < 0
                      ? `نشاط مبكر (${Math.abs(activityLagMinutes)} د قبل الحضور)`
                      : "نشاط فوري (متطابق)"}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded bg-warning/10 text-warning border border-warning dark:border-transparent dark:bg-warning/10 dark:text-warning px-1.5 py-0.5 text-[10px] font-semibold font-mono tabular-nums">
                    تأخر بدء النشاط: +{activityLagMinutes} دقيقة
                  </span>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Ergonomic Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-border/40 pb-1 text-xs">
        <button
          onClick={() => onSelectTab("tasks")}
          className={`flex items-center gap-1.5 rounded-t-lg border-b-2 px-3 py-2 font-semibold transition ${
            activeTab === "tasks"
              ? "border-emerald-500 text-success dark:text-success bg-success/10"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-muted"
          }`}
        >
          <ListTodo className="h-4 w-4" />
          <span>المهام واستغلال الوقت</span>
          <span className="rounded-full bg-success/15 px-1.5 py-0.2 text-[10px] font-bold text-success dark:text-success font-mono tabular-nums">
            {data.taskPerformance?.tasksCompletedCount || 0}
          </span>
        </button>

        <button
          onClick={() => onSelectTab("timeline")}
          className={`flex items-center gap-1.5 rounded-t-lg border-b-2 px-3 py-2 font-semibold transition ${
            activeTab === "timeline"
              ? "border-sky-500 text-info dark:text-info bg-info/10"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-muted"
          }`}
        >
          <History className="h-4 w-4" />
          <span>المخطط الزمني وفترات الاستراحة</span>
          {data.breaksSummary?.totalBreaksCount ? (
            <span className="rounded-full bg-warning/15 px-1.5 py-0.2 text-[10px] font-bold text-warning dark:text-warning font-mono tabular-nums">
              {data.breaksSummary.totalBreaksCount} بريك
            </span>
          ) : null}
        </button>

        <button
          onClick={() => onSelectTab("apps")}
          className={`flex items-center gap-1.5 rounded-t-lg border-b-2 px-3 py-2 font-semibold transition ${
            activeTab === "apps"
              ? "border-purple-500 text-primary dark:text-primary bg-primary/10"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-muted"
          }`}
        >
          <Grid className="h-4 w-4" />
          <span>البرامج والمواقع المستخدمة</span>
          <span className="rounded-full bg-primary/15 px-1.5 py-0.2 text-[10px] font-bold text-primary dark:text-primary font-mono tabular-nums">
            {(data.apps?.length || 0) + (data.websites?.length || 0)}
          </span>
        </button>
      </div>
    </>
  );
};
