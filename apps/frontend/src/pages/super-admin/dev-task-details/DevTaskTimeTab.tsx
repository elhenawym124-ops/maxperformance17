import React from "react";
import {
  ClockIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import type { EditingTimeLogState, ConfirmModalState } from "./types";

export interface DevTaskTimeTabProps {
  timeLogs?: any[];
  isCurrentTaskTimerActive: boolean;
  isCurrentTaskTimerPaused: boolean;
  currentTaskElapsedSeconds: number;
  formatTime: (seconds: number) => string;
  handleStartTimer: () => void;
  handleStopTimer: () => void;
  handlePauseTimer: () => void;
  handleResumeTimer: () => void;
  setEditingTimeLog: React.Dispatch<React.SetStateAction<EditingTimeLogState | null>>;
  setConfirmModal: React.Dispatch<React.SetStateAction<ConfirmModalState>>;
  handleDeleteTimeLog: (id: string) => void;
}

export const DevTaskTimeTab: React.FC<DevTaskTimeTabProps> = ({
  timeLogs,
  isCurrentTaskTimerActive,
  isCurrentTaskTimerPaused,
  currentTaskElapsedSeconds,
  formatTime,
  handleStartTimer,
  handleStopTimer,
  handlePauseTimer,
  handleResumeTimer,
  setEditingTimeLog,
  setConfirmModal,
  handleDeleteTimeLog,
}) => {
  return (
    <div className="space-y-6">
      {/* Live Timer Section */}
      <div className="bg-gradient-to-br from-primary to-primary p-5 sm:p-6 rounded-xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -me-32 -mt-32" />
        <div className="relative z-10 text-center">
          <p className="text-indigo-100 font-medium mb-2 tracking-wide uppercase text-xs sm:text-sm">
            {isCurrentTaskTimerActive ? "جلسة نشطة" : "العداد متوقف"}
          </p>
          <p className="text-3xl sm:text-4xl font-mono font-bold mb-5 drop-shadow-md tracking-wider tabular-nums">
            {formatTime(currentTaskElapsedSeconds)}
          </p>

          <div className="flex justify-center">
            {isCurrentTaskTimerActive ? (
              <div className="flex flex-wrap justify-center gap-2.5">
                {isCurrentTaskTimerPaused ? (
                  <button
                    type="button"
                    onClick={handleResumeTimer}
                    className="flex items-center gap-2 px-5 py-2.5 bg-success hover:bg-success text-white rounded-full font-semibold shadow-md transition-all text-sm"
                  >
                    <PlayIcon className="h-4 w-4" />
                    استئناف العداد
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePauseTimer}
                    className="flex items-center gap-2 px-5 py-2.5 bg-warning hover:bg-warning text-white rounded-full font-semibold shadow-md transition-all text-sm"
                  >
                    <PauseIcon className="h-4 w-4" />
                    إيقاف مؤقت
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleStopTimer}
                  className="flex items-center gap-2 px-5 py-2.5 bg-destructive hover:bg-destructive text-white rounded-full font-semibold shadow-md transition-all text-sm"
                >
                  <StopIcon className="h-4 w-4" />
                  إيقاف العداد
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleStartTimer}
                className="flex items-center gap-2 px-6 py-2.5 bg-white text-primary hover:bg-primary/10 rounded-full font-semibold shadow-md transition-all text-sm"
              >
                <PlayIcon className="h-4 w-4" />
                ابدأ التسجيل
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Time Logs History */}
      <div>
        <h4 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <ClockIcon className="h-5 w-5 text-muted-foreground" />
          سجل الأوقات السابقة
        </h4>
        <div className="space-y-3">
          {timeLogs
            ?.filter((log: any) => !log.isRunning)
            .map((log: any) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-4 bg-card border border-border dark:border-border rounded-xl hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/30 flex items-center justify-center font-bold text-primary">
                    {log.memberName?.charAt(0) || "U"}
                  </div>
                  <div>
                    <p className="font-bold text-foreground">
                      {log.memberName}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                      <span>
                        {new Date(log.startTime).toLocaleDateString("ar-EG")}
                      </span>
                      <span>•</span>
                      <span>{log.description || "بدون وصف"}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-left font-mono tabular-nums">
                    <p className="text-lg font-bold text-foreground">
                      {Math.round((log.duration / 60) * 100) / 100}h
                    </p>
                    <p className="text-xs text-muted-foreground text-right">
                      {log.duration}m
                    </p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setEditingTimeLog({
                          id: log.id,
                          duration: log.duration,
                          description: log.description || "",
                        })
                      }
                      className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/30 rounded-lg"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmModal({
                          open: true,
                          message: "هل أنت متأكد من حذف سجل الوقت هذا؟",
                          onConfirm: () => handleDeleteTimeLog(log.id),
                        })
                      }
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/30 rounded-lg"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

          {(!timeLogs ||
            timeLogs.filter((l: any) => !l.isRunning).length === 0) && (
            <div className="text-center py-12 text-muted-foreground bg-muted dark:bg-muted rounded-xl border border-dashed border-border dark:border-border">
              <ClockIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground dark:text-foreground" />
              <p>لا توجد سجلات وقت</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
