import React from "react";
import {
  Activity,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { CustomerRatingHealthData } from "../../../services/returnService";

interface RatingHealthReportCardProps {
  healthData: CustomerRatingHealthData | null;
}

export const RatingHealthReportCard: React.FC<RatingHealthReportCardProps> = ({
  healthData,
}) => {
  return (
    <div className="bg-white dark:bg-muted rounded-xl shadow-xs border border-border dark:border-border overflow-hidden">
      <div className="p-5 border-b border-border dark:border-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-success/10 dark:bg-success/40 text-success dark:text-success">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground dark:text-muted-foreground">
              تقرير صحة التقييم الآلي للعملاء
            </h2>
            <p className="text-xs text-muted-foreground dark:text-muted-foreground">
              متابعة حية لتصنيف العملاء المعتمد على نسبة الاستلام ومزامنة الطلبات التلقائية
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-success/10 text-success border border-success/80 dark:bg-success/40 dark:text-success dark:border-success/60">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>نظام تلقائي 100%</span>
          </span>
          {healthData?.rulesVersion && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-muted dark:bg-muted text-foreground dark:text-muted-foreground tabular-nums">
              v{healthData.rulesVersion}
            </span>
          )}
        </div>
      </div>

      <div className="p-5 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 bg-muted dark:bg-muted">
        <div className="p-3 bg-white dark:bg-muted rounded-lg border border-border dark:border-border shadow-2xs">
          <span className="text-xs text-muted-foreground dark:text-muted-foreground block mb-1">إجمالي العملاء</span>
          <span className="text-xl font-bold tabular-nums text-foreground dark:text-muted-foreground">
            {healthData?.totalCustomers ?? 0}
          </span>
        </div>

        <div className="p-3 bg-white dark:bg-muted rounded-lg border border-success dark:border-success/40 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-success dark:text-success font-medium">ممتاز</span>
            <span className="w-2 h-2 rounded-full bg-success" />
          </div>
          <span className="text-xl font-bold tabular-nums text-success dark:text-success">
            {healthData?.breakdown?.EXCELLENT ?? 0}
          </span>
        </div>

        <div className="p-3 bg-white dark:bg-muted rounded-lg border border-info dark:border-info/40 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-info dark:text-info font-medium">جيد</span>
            <span className="w-2 h-2 rounded-full bg-info" />
          </div>
          <span className="text-xl font-bold tabular-nums text-info dark:text-info">
            {healthData?.breakdown?.GOOD ?? 0}
          </span>
        </div>

        <div className="p-3 bg-white dark:bg-muted rounded-lg border border-warning dark:border-warning/40 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-warning dark:text-warning font-medium">متوسط</span>
            <span className="w-2 h-2 rounded-full bg-warning" />
          </div>
          <span className="text-xl font-bold tabular-nums text-warning dark:text-warning">
            {healthData?.breakdown?.AVERAGE ?? 0}
          </span>
        </div>

        <div className="p-3 bg-white dark:bg-muted rounded-lg border border-destructive dark:border-destructive/40 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-destructive dark:text-destructive font-medium">ضعيف</span>
            <span className="w-2 h-2 rounded-full bg-destructive" />
          </div>
          <span className="text-xl font-bold tabular-nums text-destructive dark:text-destructive">
            {healthData?.breakdown?.POOR ?? 0}
          </span>
        </div>

        <div className="p-3 bg-white dark:bg-muted rounded-lg border border-border dark:border-border shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground dark:text-muted-foreground font-medium">جديد / غير مصنف</span>
            <span className="w-2 h-2 rounded-full bg-muted" />
          </div>
          <span className="text-xl font-bold tabular-nums text-foreground dark:text-muted-foreground">
            {healthData?.breakdown?.UNKNOWN ?? 0}
          </span>
        </div>
      </div>

      <div className="px-5 py-3 border-t border-border dark:border-border flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground dark:text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span>العملاء المصنفون: <strong className="tabular-nums font-semibold text-foreground dark:text-muted-foreground">{healthData?.ratedCustomers ?? 0}</strong></span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>آخر مزامنة فحص: {healthData?.lastRunAt ? new Date(healthData.lastRunAt).toLocaleTimeString("ar-EG") : "نشط الآن"}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-emerald-600 dark:text-success font-medium">
            الأخطاء المسجلة: {healthData?.failureCount ?? 0} (سليم)
          </span>
        </div>
      </div>
    </div>
  );
};
