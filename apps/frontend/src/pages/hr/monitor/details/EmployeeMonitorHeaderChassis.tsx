import React from "react";
import {
  ArrowRight,
  Calendar,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
} from "lucide-react";
import { TeamMemberSwitchOption } from "./types";
import { getOperationalSignalClassName } from "./helpers";
import { DateInput } from '../../../../components/ui/DateInput';

interface EmployeeMonitorHeaderChassisProps {
  employeeName: string;
  departmentName: string;
  jobTitle: string;
  summary: any;
  teamMembersProp: TeamMemberSwitchOption[];
  currentMemberIndex: number;
  hasPrevMember: boolean;
  hasNextMember: boolean;
  onSwitchEmployee: (id: string) => void;
  onBack: () => void;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  todayStr: string;
  isToday: boolean;
  yesterdayStr: string;
  onDateStep: (offset: number) => void;
  loading: boolean;
  onRefresh: () => void;
}

export const EmployeeMonitorHeaderChassis: React.FC<
  EmployeeMonitorHeaderChassisProps
> = ({
  employeeName,
  departmentName,
  jobTitle,
  summary,
  teamMembersProp,
  currentMemberIndex,
  hasPrevMember,
  hasNextMember,
  onSwitchEmployee,
  onBack,
  selectedDate,
  onSelectDate,
  todayStr,
  isToday,
  yesterdayStr,
  onDateStep,
  loading,
  onRefresh,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/40 bg-card/60 p-4 shadow-sm backdrop-blur-md">
      {/* Left/Start side: Back + Employee Identity + Switcher */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/50 bg-muted/50 dark:bg-muted text-muted-foreground transition hover:bg-muted dark:hover:bg-muted hover:text-foreground active:scale-95"
          title="العودة إلى لوحة المراقبة العامة"
        >
          <ArrowRight className="h-4 w-4" />
        </button>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
              تقرير النشاط الميداني: {employeeName}
            </h1>
            <span className="rounded-full bg-info/10 px-2.5 py-0.5 text-xs font-semibold text-info dark:text-info ring-1 ring-inset ring-info/20">
              {departmentName}
            </span>
            {summary?.status === "active" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success dark:text-success ring-1 ring-inset ring-success/20">
                <span className="h-1.5 w-1.5 rounded-full bg-success dark:bg-success animate-pulse" />
                متصل ويعمل الآن
              </span>
            )}
            {summary?.status === "idle" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-[11px] font-semibold text-warning dark:text-warning ring-1 ring-inset ring-warning/20">
                <span className="h-1.5 w-1.5 rounded-full bg-warning dark:bg-warning" />
                خامل (الجهاز مفتوح)
              </span>
            )}
            {summary?.status === "offline" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted dark:bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground dark:text-muted-foreground ring-1 ring-inset ring-border/30">
                <span className="h-1.5 w-1.5 rounded-full bg-muted dark:bg-muted" />
                غير متصل (مغلق)
                {summary?.lastSeenTime && (
                  <span className="me-1 text-[10px] text-muted-foreground dark:text-muted-foreground font-mono tabular-nums">
                    (آخر ظهور:{" "}
                    {new Date(summary.lastSeenTime).toLocaleTimeString(
                      "ar-EG",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                    )
                  </span>
                )}
              </span>
            )}
            {summary?.operationalSignal &&
              summary.operationalSignal.type !== "NORMAL" && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${getOperationalSignalClassName(
                    summary.operationalSignal.type,
                  )}`}
                  title={summary.operationalSignal.reason}
                >
                  {summary.operationalSignal.label}
                </span>
              )}
          </div>
          <p className="text-xs text-muted-foreground">
            {jobTitle} •{" "}
            {summary?.deviceName ? `الجهاز: ${summary.deviceName} • ` : ""}
            توثيق النشاط وسجلات البرامج وتطابق الحضور
          </p>
        </div>

        {/* Next / Previous Employee Fast Switcher */}
        {teamMembersProp.length > 1 && currentMemberIndex >= 0 && (
          <div className="flex items-center gap-1 rounded-lg border border-border/50 bg-muted/50 dark:bg-muted p-1 text-xs">
            <button
              onClick={() =>
                onSwitchEmployee(
                  teamMembersProp[currentMemberIndex - 1].employeeId,
                )
              }
              disabled={!hasPrevMember}
              className="flex h-7 items-center gap-1 rounded px-2 font-medium text-muted-foreground transition hover:bg-muted dark:hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
              title={
                hasPrevMember
                  ? `الانتقال إلى: ${teamMembersProp[currentMemberIndex - 1].employeeName}`
                  : ""
              }
            >
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">السابق</span>
            </button>

            <span className="px-1 text-[11px] text-muted-foreground font-mono tabular-nums">
              {currentMemberIndex + 1} / {teamMembersProp.length}
            </span>

            <button
              onClick={() =>
                onSwitchEmployee(
                  teamMembersProp[currentMemberIndex + 1].employeeId,
                )
              }
              disabled={!hasNextMember}
              className="flex h-7 items-center gap-1 rounded px-2 font-medium text-muted-foreground transition hover:bg-muted dark:hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
              title={
                hasNextMember
                  ? `الانتقال إلى: ${teamMembersProp[currentMemberIndex + 1].employeeName}`
                  : ""
              }
            >
              <span className="hidden sm:inline">التالي</span>
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Right side: Fast Date Navigation */}
      <div className="flex flex-wrap items-center gap-1.5">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onSelectDate(todayStr)}
            className={`rounded-md px-2 py-1 text-xs font-medium transition ${
              isToday
                ? "bg-sky-500/15 text-info dark:text-info ring-1 ring-info/30"
                : "text-muted-foreground hover:bg-muted dark:hover:bg-muted hover:text-foreground"
            }`}
          >
            اليوم
          </button>
          <button
            onClick={() => onSelectDate(yesterdayStr)}
            className={`rounded-md px-2 py-1 text-xs font-medium transition ${
              selectedDate === yesterdayStr
                ? "bg-sky-500/15 text-info dark:text-info ring-1 ring-info/30"
                : "text-muted-foreground hover:bg-muted dark:hover:bg-muted hover:text-foreground"
            }`}
          >
            أمس
          </button>
        </div>

        <div className="flex items-center rounded-lg border border-border/50 bg-muted/50 dark:bg-muted p-0.5 text-xs">
          <button
            onClick={() => onDateStep(-1)}
            className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted dark:hover:bg-muted hover:text-foreground active:scale-95"
            title="اليوم السابق"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>

          <div className="flex items-center gap-1.5 px-2">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <DateInput
              value={selectedDate}
              onChange={(e) => onSelectDate(e.target.value)}
              className="bg-transparent text-xs text-foreground focus:outline-none font-mono tabular-nums"
            />
          </div>

          <button
            onClick={() => onDateStep(1)}
            disabled={isToday}
            className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted dark:hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent active:scale-95"
            title="اليوم التالي"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex h-8 items-center gap-1.5 rounded-lg border border-border/50 bg-muted/50 dark:bg-muted px-3 text-xs font-medium text-muted-foreground transition hover:bg-muted dark:hover:bg-muted hover:text-foreground active:scale-95"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">تحديث</span>
        </button>
      </div>
    </div>
  );
};
