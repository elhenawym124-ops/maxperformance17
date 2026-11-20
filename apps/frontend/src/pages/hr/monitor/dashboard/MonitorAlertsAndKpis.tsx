import React from "react";
import {
  Activity,
  Users,
  Clock,
  Laptop,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { MonitorOverviewStats } from "./types";

interface MonitorAlertsAndKpisProps {
  visibleAlerts: any[];
  onDismissAlert: (alertId: string) => void;
  stats: MonitorOverviewStats;
}

export const MonitorAlertsAndKpis: React.FC<MonitorAlertsAndKpisProps> = ({
  visibleAlerts,
  onDismissAlert,
  stats,
}) => {
  return (
    <>
      {visibleAlerts.length > 0 && (
        <div className="space-y-2">
          {visibleAlerts.map((al, idx) => (
            <div
              key={al.id || idx}
              className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-xs shadow-xs transition ${
                al.severity === "critical"
                  ? "border-rose-500/40 bg-destructive/10 text-destructive dark:text-destructive"
                  : "border-amber-500/40 bg-warning/10 text-warning dark:text-warning"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
                <span className="font-semibold truncate">{al.message}</span>
              </div>
              <button
                onClick={() => onDismissAlert(al.id)}
                className="shrink-0 rounded-md border border-border/40 bg-background/80 px-2 py-0.5 text-[11px] font-medium text-foreground hover:bg-muted active:scale-95"
              >
                تمت المراجعة
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-border/40 bg-card/60 p-3 shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>الموثقون اليوم</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-info/10 text-info dark:text-info ring-1 ring-info/20">
              <Users className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-2 text-xl font-bold text-foreground font-mono tabular-nums">
            {stats.totalTracked}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground truncate">
            أجهزة أرسلت بيانات
          </div>
        </div>

        <div className="rounded-xl border border-border/40 bg-card/60 p-3 shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>نشط ومتصل الآن</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-success/10 text-success dark:text-success ring-1 ring-success/20">
              <Activity className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-2 text-xl font-bold text-success dark:text-success font-mono tabular-nums">
            {stats.activeNow}
          </div>
          <div className="mt-1 text-[11px] text-success dark:text-success truncate">
            تفاعل خلال 15 دقيقة
          </div>
        </div>

        <div className="rounded-xl border border-border/40 bg-card/60 p-3 shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>متوسط وقت التسخين</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-warning/10 text-warning dark:text-warning ring-1 ring-warning/20">
              <Clock className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-2 text-xl font-bold text-foreground font-mono tabular-nums">
            <span
              className={
                stats.avgWarmupMinutes <= 15
                  ? "text-emerald-600 dark:text-success"
                  : stats.avgWarmupMinutes < 30
                    ? "text-amber-600 dark:text-warning"
                    : "text-rose-600 dark:text-destructive"
              }
            >
              {stats.avgWarmupMinutes} د
            </span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground truncate">
            بين البصمة وأول نشاط للجهاز
          </div>
        </div>

        <div className="rounded-xl border border-border/40 bg-card/60 p-3 shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>نسبة النشاط الفعلي</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-primary/20">
              <TrendingUp className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-2 text-xl font-bold text-primary font-mono tabular-nums">
            {stats.avgActivityRatio}%
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground truncate">
            من إجمالي ساعات الدوام
          </div>
        </div>

        <div className="rounded-xl border border-border/40 bg-card/60 p-3 shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>متوسط الإنتاجية</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary dark:text-primary ring-1 ring-primary/20">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-2 text-xl font-bold text-foreground font-mono tabular-nums">
            {stats.avgProductivity}%
          </div>
          <div className="mt-1 text-[11px] text-primary dark:text-primary truncate">
            معدل متوازن (نشاط + مهام)
          </div>
        </div>

        <div className="rounded-xl border border-border/40 bg-card/60 p-3 shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>المهام وساعات العمل</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-info/10 text-info dark:text-info ring-1 ring-info/20">
              <Laptop className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-2 text-lg font-bold text-foreground font-mono tabular-nums truncate">
            {stats.totalTasksCompleted} م • {stats.totalHoursTracked} س
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground truncate">
            مجموع مخرجات وساعات الفريق
          </div>
        </div>
      </div>
    </>
  );
};
