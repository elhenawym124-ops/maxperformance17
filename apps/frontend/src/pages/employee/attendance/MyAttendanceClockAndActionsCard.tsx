import React from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileCheck,
  Home,
  Laptop,
  LogIn,
  LogOut,
  MapPin,
  RefreshCw,
  Target,
} from "lucide-react";
import type { TFunction } from "i18next";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Progress } from "../../../components/ui/progress";
import { TodayAttendance, TodayGoal } from "./types";
import {
  formatDateWithTZ,
  formatTime,
  formatTimeWithTZ,
  statusConfig,
} from "./helpers";
import { QueuedPunch, formatTimeArabic } from "../../../services/attendanceQueueService";

interface MyAttendanceClockAndActionsCardProps {
  t: TFunction;
  timezone: string;
  currentTime: Date;
  todayAttendance: TodayAttendance | null;
  showOvernightWarning: boolean;
  recordDateLabel: string;
  formattedCheckIn: string;
  formattedCheckOut: string;
  duration: string;
  checkInDate: Date | null;
  staleHours: number | null;
  canCheckIn: boolean;
  canCheckOut: boolean;
  checkingIn: boolean;
  checkingOut: boolean;
  workMode: "OFFICE" | "HOME";
  onWorkModeChange: (mode: "OFFICE" | "HOME") => void;
  onCheckIn: () => void;
  onCheckOut: () => void;
  todayGoals: TodayGoal[];
  queuedPunches?: QueuedPunch[];
  retryingQueue?: boolean;
  onRetryQueue?: () => void;
  onOpenRegularize?: (timeStr?: string) => void;
}

export const MyAttendanceClockAndActionsCard: React.FC<
  MyAttendanceClockAndActionsCardProps
> = ({
  t,
  timezone,
  currentTime,
  todayAttendance,
  showOvernightWarning,
  recordDateLabel,
  formattedCheckIn,
  formattedCheckOut,
  duration,
  checkInDate,
  staleHours,
  canCheckIn,
  canCheckOut,
  checkingIn,
  checkingOut,
  workMode,
  onWorkModeChange,
  onCheckIn,
  onCheckOut,
  todayGoals,
  queuedPunches = [],
  retryingQueue = false,
  onRetryQueue,
  onOpenRegularize,
}) => {
  return (
    <>
      <Card className="bg-gradient-to-r from-primary to-primary dark:from-primary/20 dark:to-primary/20 border-primary dark:border-primary">
        <CardContent className="p-3.5 sm:p-6 md:p-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center">
              <Clock className="h-10 w-10 sm:h-14 sm:w-14 text-primary animate-pulse" />
            </div>

            <div>
              <div className="text-3xl sm:text-5xl md:text-6xl font-bold font-mono tabular-nums text-primary dark:text-primary">
                {formatTime(currentTime, timezone)}
              </div>
              <p className="text-muted-foreground text-sm">
                {t("employee.attendance.currentTime")}
              </p>
            </div>

            {todayAttendance && (
              <div className="mt-4 p-3 sm:p-4 bg-card rounded-xl border border-border dark:border-border">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle
                      className={`h-5 w-5 ${
                        showOvernightWarning
                          ? "text-amber-600"
                          : "text-green-500 dark:text-success"
                      }`}
                    />
                    <span className="font-medium text-foreground">
                      {t("employee.attendance.todayStatus")}
                    </span>
                  </div>
                  <Badge
                    className={
                      showOvernightWarning
                        ? "bg-amber-100 text-warning"
                        : statusConfig[todayAttendance.status]?.color || ""
                    }
                  >
                    {showOvernightWarning
                      ? t("employee.attendance.shiftNotClosed")
                      : t(
                          statusConfig[todayAttendance.status]?.labelKey ||
                            todayAttendance.status,
                        )}
                  </Badge>
                </div>
                {recordDateLabel && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("employee.attendance.linkedToDate", {
                      date: recordDateLabel,
                    })}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      {t("employee.attendance.checkIn")}
                    </p>
                    <p className="font-bold font-mono tabular-nums text-lg text-foreground">
                      {formattedCheckIn}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      {t("employee.attendance.checkOut")}
                    </p>
                    <p className="font-bold font-mono tabular-nums text-lg text-foreground">
                      {formattedCheckOut}
                    </p>
                  </div>
                </div>

                {(todayAttendance.checkIn || todayAttendance.checkOut) && (
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm">
                    {!todayAttendance.checkOut && todayAttendance.checkIn && (
                      <Badge className="bg-blue-100 text-primary font-mono tabular-nums">
                        <Clock className="h-3.5 w-3.5 ms-1 inline" />
                        {t("employee.attendance.shiftDuration", { duration })}
                      </Badge>
                    )}
                    {todayAttendance.lateMinutes !== null &&
                      todayAttendance.lateMinutes > 0 && (
                        <Badge className="bg-yellow-100 text-warning font-mono tabular-nums">
                          {t("employee.attendance.lateMinutes", {
                            minutes: todayAttendance.lateMinutes,
                          })}
                        </Badge>
                      )}
                    {todayAttendance.earlyLeaveMinutes !== null &&
                      todayAttendance.earlyLeaveMinutes > 0 && (
                        <Badge className="bg-amber-100 text-warning font-mono tabular-nums">
                          {t("employee.attendance.earlyLeave", {
                            minutes: todayAttendance.earlyLeaveMinutes,
                          })}
                        </Badge>
                      )}
                  </div>
                )}

                {!todayAttendance.checkOut && todayAttendance.checkIn && (
                  <div className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-primary/80 dark:bg-primary/40 border border-primary/70 dark:border-primary/75 px-3 py-2 text-xs text-primary dark:text-primary font-medium">
                    <Laptop className="h-4 w-4 shrink-0 text-primary dark:text-primary" />
                    <span>
                      {t(
                        "employee.attendance.desktopPrompt",
                        "تذكير: يرجى التأكد من تشغيل تطبيق سطح المكتب MaxP Workspace لتوثيق فترات النشاط وساعات العمل بدقة.",
                      )}
                    </span>
                  </div>
                )}
              </div>
            )}

            {showOvernightWarning && (
              <div className="mt-4 rounded-lg border border-warning bg-warning/10 p-4 text-warning text-right">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 mt-0.5 text-warning" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">
                      {t("employee.attendance.openShiftWarning")}
                    </p>
                    {checkInDate && (
                      <p className="text-xs text-warning font-mono tabular-nums">
                        {t("employee.attendance.checkinTime")}{" "}
                        {formatTimeWithTZ(checkInDate, timezone)} •{" "}
                        {formatDateWithTZ(checkInDate, timezone)}
                        {staleHours !== null &&
                          ` • ${t("employee.attendance.hoursElapsed", {
                            hours: staleHours,
                          })}`}
                      </p>
                    )}
                    <p className="text-xs text-warning">
                      {t("employee.attendance.closeShiftFirst")}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:justify-end">
                  <Button
                    variant="destructive"
                    onClick={onCheckOut}
                    disabled={checkingOut}
                    className="bg-amber-600 hover:bg-warning text-white"
                  >
                    {checkingOut
                      ? t("employee.attendance.closing")
                      : t("employee.attendance.closePendingShift")}
                  </Button>
                </div>
              </div>
            )}

            {/* بنر طابور البصمات المعلقة (Queue & Retry) */}
            {queuedPunches.length > 0 && (
              <div className="mt-4 p-4 rounded-xl border border-warning bg-warning/10 dark:bg-warning/40 dark:border-warning text-warning dark:text-warning text-right space-y-2">
                <div className="flex items-center justify-between">
                  <Badge className="bg-amber-200 text-warning font-bold">بصمات معلقة ({queuedPunches.length})</Badge>
                  <div className="flex items-center gap-1.5 text-xs text-warning dark:text-warning">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <span>تم حفظ البصمة محلياً على جهازك لضمان عدم ضياعها وسيتم إرسالها تلقائياً</span>
                  </div>
                </div>
                {queuedPunches.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-white/80 dark:bg-muted border border-warning text-xs"
                  >
                    <div>
                      <span className="font-semibold text-foreground">
                        {item.action === "CHECK_IN" ? "بصمة حضور" : "بصمة انصراف"}
                      </span>
                      <span className="mx-2 text-muted-foreground font-mono">
                        الوقت الأصلي: {formatTimeArabic(item.originalTimestamp)}
                      </span>
                      {item.lastError && (
                        <p className="text-red-600 dark:text-destructive mt-0.5 font-medium">السبب: {item.lastError}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={retryingQueue}
                        onClick={onRetryQueue}
                        className="text-xs h-8 gap-1 bg-white hover:bg-warning/10"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${retryingQueue ? "animate-spin" : ""}`} />
                        إعادة المحاولة الآن
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => onOpenRegularize?.(item.originalTimestamp)}
                        className="text-xs h-8 text-primary hover:text-primary"
                      >
                        طلب اعتماد
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(canCheckIn || canCheckOut) && (
              <div className="flex justify-center mb-6">
                <div className="inline-flex p-1 bg-muted dark:bg-muted rounded-xl border border-border dark:border-border shadow-inner">
                  <button
                    onClick={() => onWorkModeChange("OFFICE")}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg transition-all duration-300 ${
                      workMode === "OFFICE"
                        ? "bg-card text-primary shadow-md scale-105"
                        : "text-gray-500 hover:text-foreground dark:hover:text-muted-foreground"
                    }`}
                  >
                    <MapPin
                      className={`h-4 w-4 ${
                        workMode === "OFFICE" ? "text-blue-500" : ""
                      }`}
                    />
                    <span className="font-bold">
                      {t("employee.attendance.fromOffice")}
                    </span>
                  </button>
                  <button
                    onClick={() => onWorkModeChange("HOME")}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg transition-all duration-300 ${
                      workMode === "HOME"
                        ? "bg-card text-primary shadow-md scale-105"
                        : "text-gray-500 hover:text-foreground dark:hover:text-muted-foreground"
                    }`}
                  >
                    <Home
                      className={`h-4 w-4 ${
                        workMode === "HOME" ? "text-purple-500" : ""
                      }`}
                    />
                    <span className="font-bold">
                      {t("employee.attendance.fromHome")}
                    </span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
              {canCheckIn && (
                <Button
                  data-testid="attendance-checkin-button"
                  size="lg"
                  className="bg-green-600 hover:bg-success text-white px-6 py-6 text-lg w-full sm:w-auto"
                  onClick={onCheckIn}
                  disabled={checkingIn}
                >
                  {checkingIn ? (
                    <>
                      <div className="me-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t("employee.attendance.registering")}
                    </>
                  ) : (
                    <>
                      <LogIn className="me-2 h-6 w-6" />
                      {t("employee.attendance.login")}
                    </>
                  )}
                </Button>
              )}

              {canCheckOut && (
                <Button
                  data-testid="attendance-checkout-button"
                  size="lg"
                  className="bg-blue-600 hover:bg-primary text-white px-6 py-6 text-lg w-full sm:w-auto"
                  onClick={onCheckOut}
                  disabled={checkingOut}
                >
                  {checkingOut ? (
                    <>
                      <div className="me-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t("employee.attendance.registering")}
                    </>
                  ) : (
                    <>
                      <LogOut className="me-2 h-6 w-6" />
                      {t("employee.attendance.checkOut")}
                    </>
                  )}
                </Button>
              )}

              {!canCheckIn && !canCheckOut && (
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-success mx-auto mb-2" />
                  <p className="text-lg font-semibold text-foreground">
                    {t("employee.attendance.alreadyChecked")}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenRegularize?.()}
                className="gap-2 text-xs font-semibold border-primary dark:border-primary text-primary dark:text-primary hover:bg-primary/10 dark:hover:bg-primary/40"
              >
                <FileCheck className="h-4 w-4 text-primary" />
                طلب بصمة معتمدة (اعتماد يدوي للمالك)
              </Button>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{t("employee.attendance.locationAuto")}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {todayGoals.length > 0 && (
        <Card className="border-indigo-200 bg-primary/60 dark:border-primary dark:bg-primary/10">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-primary dark:text-primary">
                <Target className="h-5 w-5" />
                {t("employee.attendance.dailyGoals")}
              </CardTitle>
              <p className="text-sm text-primary/80 dark:text-primary/80">
                {t("employee.attendance.dailyGoalsDesc")}
              </p>
            </div>
            {canCheckOut ? (
              <Badge className="bg-indigo-100 text-primary dark:bg-primary/40 dark:text-primary">
                {t("employee.attendance.reviewBeforeCheckout")}
              </Badge>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-3">
            {todayGoals.map((goal) => (
              <div
                key={goal.id}
                className="rounded-xl border border-primary/70 bg-white/80 p-4 dark:border-primary/60 dark:bg-muted"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="font-semibold text-foreground dark:text-muted-foreground">
                      {goal.title}
                    </div>
                    <div className="mt-1 text-sm text-foreground dark:text-muted-foreground">
                      {goal.parentGoal?.title
                        ? t("employee.attendance.belongsTo", {
                            title: goal.parentGoal.title,
                          })
                        : t("employee.attendance.directDailyGoal")}
                      {goal.project?.name ? ` • ${goal.project.name}` : ""}
                    </div>
                  </div>
                  <div className="text-sm font-mono tabular-nums text-foreground dark:text-muted-foreground">
                    {Number(goal.currentValue || 0).toLocaleString("ar-EG")} /{" "}
                    {Number(goal.targetValue || 0).toLocaleString("ar-EG")}{" "}
                    {goal.unit || ""}
                  </div>
                </div>
                <Progress
                  value={Math.max(
                    0,
                    Math.min(100, Number(goal.progress || 0)),
                  )}
                  className="mt-3"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );
};
