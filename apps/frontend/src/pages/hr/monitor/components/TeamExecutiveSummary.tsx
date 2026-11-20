import React from 'react';
import { Activity, Users, Clock, CheckCircle2, Archive, ShieldAlert } from 'lucide-react';

interface TeamExecutiveSummaryProps {
  stats: {
    totalTracked: number;
    activeNow: number;
    avgProductivity: number;
    totalHoursTracked: number;
    totalTasksCompleted?: number;
    totalTasksCreated?: number;
    avgWarmupMinutes?: number;
    avgActivityRatio?: number;
  };
  isSuperOrOwner: boolean;
  archiving: boolean;
  archiveSuccess: string | null;
  onTriggerArchive: () => void;
}

export const TeamExecutiveSummary: React.FC<TeamExecutiveSummaryProps> = ({
  stats,
  isSuperOrOwner,
  archiving,
  archiveSuccess,
  onTriggerArchive,
}) => {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border/40 bg-card/60 p-4 shadow-sm backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-info/10 text-info dark:text-info ring-1 ring-inset ring-info/25">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">
                الموجز الرقمي المباشر لإنتاجية الدوام (Executive Telemetry)
              </h3>
              <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success dark:text-success ring-1 ring-inset ring-success/20">
                تحديث لحظي
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              مؤشرات إحصائية دقيقة ومباشرة لساعات العمل الفعلية ونسبة النشاط ووقت التسخين وإنجاز المهام
            </p>
          </div>
        </div>

        {/* Admin Data Retention Archival Action */}
        {isSuperOrOwner && (
          <div className="flex items-center gap-2">
            {archiveSuccess && (
              <span className="text-[11px] font-medium text-success dark:text-success">
                {archiveSuccess}
              </span>
            )}
            <button
              onClick={onTriggerArchive}
              disabled={archiving}
              className="flex h-7 items-center gap-1.5 rounded-md border border-border/50 bg-muted/60 dark:bg-muted px-2.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-muted transition active:scale-95"
              title="أرشفة السجلات التفصيلية الأقدم من 60 يوماً وتفريغ مساحة التخزين"
            >
              <Archive className={`h-3 w-3 ${archiving ? 'animate-spin' : ''}`} />
              <span>{archiving ? 'جاري الأرشفة…' : 'أرشفة السجلات القديمة'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Telemetry Summary Text */}
      <div className="mt-3 rounded-lg border border-border/40 bg-muted/40 dark:bg-muted p-3 text-xs text-foreground">
        <div className="flex flex-wrap items-center gap-y-2 gap-x-6">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">حالة الفريق الحالية:</span>
            <span className="font-semibold text-foreground tabular-nums">
              {stats.activeNow} نشط من أصل {stats.totalTracked} موظف مسجل
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">ساعات العمل الموثقة:</span>
            <span className="font-semibold text-info dark:text-info tabular-nums">
              {stats.totalHoursTracked} ساعة عمل
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">نسبة النشاط من الدوام:</span>
            <span className="font-semibold text-primary tabular-nums">
              {stats.avgActivityRatio ?? 0}%
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">متوسط وقت التسخين:</span>
            <span className="font-semibold text-warning dark:text-warning tabular-nums">
              {stats.avgWarmupMinutes ?? 0} دقيقة
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">إجمالي المهام:</span>
            <span className="font-semibold text-success dark:text-success tabular-nums">
              {stats.totalTasksCompleted || 0} منجزة
            </span>
            {(stats.totalTasksCreated || 0) > 0 && (
              <span className="font-medium text-info dark:text-info tabular-nums">
                • {stats.totalTasksCreated} منشأة
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">متوسط كفاءة الدوام:</span>
            <span className="font-semibold text-foreground tabular-nums">
              {stats.avgProductivity}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamExecutiveSummary;
