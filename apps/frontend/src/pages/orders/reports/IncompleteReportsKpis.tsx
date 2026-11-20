import React from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ShoppingCart,
} from "lucide-react";
import { useCurrency } from "../../../hooks/useCurrency";
import type { SummaryData } from "./IncompleteReportsTypes";

interface IncompleteReportsKpisProps {
  period: string;
  summary: SummaryData;
  totalUncompletedCount: number;
  totalUncompletedValue: number;
}

export const IncompleteReportsKpis: React.FC<IncompleteReportsKpisProps> = ({
  period,
  summary,
  totalUncompletedCount,
  totalUncompletedValue,
}) => {
  const { formatPrice } = useCurrency();

  const getSectionTitle = () => {
    if (period === "today") return "كشف السلات غير المكتملة لليوم (الفاقد والمعلق)";
    if (period === "yesterday") return "كشف السلات غير المكتملة لأمس";
    if (period === "custom") return "كشف السلات غير المكتملة (فترة مخصصة)";
    return `كشف السلات غير المكتملة (آخر ${period} يوم)`;
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">
          {getSectionTitle()}
        </h2>
        <span className="text-xs text-muted-foreground font-mono tabular-nums">
          استرد الفريق:{" "}
          <strong className="text-success dark:text-success font-bold">
            {summary.byTeam.toLocaleString()}
          </strong>{" "}
          طلب بقيمة {formatPrice(summary.byTeamValue)} | المتبقي:{" "}
          <strong className="text-foreground font-bold">
            {totalUncompletedCount.toLocaleString()}
          </strong>{" "}
          (ألغاها: {summary.cancelled}، مفقودة: {summary.lost}، معلقة:{" "}
          {summary.active})
        </span>
      </div>

      <div className="rounded-xl border border-border/70 bg-card shadow-2xs overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y divide-border/50 lg:divide-y-0 lg:divide-x rtl:">
          {/* 1. حولها الفريق لأوردرات */}
          <div className="p-3.5 sm:p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-success dark:text-success">
                  حولها الفريق لأوردرات
                </span>
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-success/10 text-success dark:text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-success dark:text-success font-mono tabular-nums">
                {summary.byTeam.toLocaleString()}
              </div>
              <div className="text-xs font-semibold text-success/90 dark:text-success/90 mt-0.5 font-mono tabular-nums">
                {formatPrice(summary.byTeamValue)}
              </div>
            </div>
            <div className="text-[11px] text-muted-foreground mt-2.5 pt-2 border-t border-border/40">
              سلات استردها الفريق كطلبات فعلية
            </div>
          </div>

          {/* 2. ألغاها الفريق بالتأكيد */}
          <div className="p-3.5 sm:p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-destructive dark:text-destructive">
                  ألغاها الفريق بالتأكيد
                </span>
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-destructive/10 text-destructive dark:text-destructive">
                  <XCircle className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-destructive dark:text-destructive font-mono tabular-nums">
                {summary.cancelled.toLocaleString()}
              </div>
              <div className="text-xs font-semibold text-destructive/90 dark:text-destructive/90 mt-0.5 font-mono tabular-nums">
                {formatPrice(summary.cancelledValue)}
              </div>
            </div>
            <div className="text-[11px] text-muted-foreground mt-2.5 pt-2 border-t border-border/40">
              تم التواصل وتأكيد الإلغاء
            </div>
          </div>

          {/* 3. معلقة في الطابور */}
          <div className="p-3.5 sm:p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-primary dark:text-primary">
                  معلقة في الطابور (فرص)
                </span>
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary dark:text-primary">
                  <Clock className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-primary dark:text-primary font-mono tabular-nums">
                {summary.active.toLocaleString()}
              </div>
              <div className="text-xs font-semibold text-primary/90 dark:text-primary/90 mt-0.5 font-mono tabular-nums">
                {formatPrice(summary.activeValue)}
              </div>
            </div>
            <div className="text-[11px] text-muted-foreground mt-2.5 pt-2 border-t border-border/40">
              متاحة للإنقاذ والتواصل الآن
            </div>
          </div>

          {/* 4. مفقودة بالتقادم */}
          <div className="p-3.5 sm:p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-warning dark:text-warning">
                  مفقودة بالتقادم
                </span>
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-warning/10 text-warning dark:text-warning">
                  <AlertTriangle className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-warning dark:text-warning font-mono tabular-nums">
                {summary.lost.toLocaleString()}
              </div>
              <div className="text-xs font-semibold text-warning/90 dark:text-warning/90 mt-0.5 font-mono tabular-nums">
                {formatPrice(summary.lostValue)}
              </div>
            </div>
            <div className="text-[11px] text-muted-foreground mt-2.5 pt-2 border-t border-border/40">
              انتهت مهلة الصلاحية ({summary.lostAfterHours || 24} س)
            </div>
          </div>

          {/* 5. إجمالي غير المكتمل */}
          <div className="p-3.5 sm:p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-foreground">
                  إجمالي غير المكتمل
                </span>
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <ShoppingCart className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-foreground font-mono tabular-nums">
                {totalUncompletedCount.toLocaleString()}
              </div>
              <div className="text-xs font-semibold text-muted-foreground mt-0.5 font-mono tabular-nums">
                {formatPrice(totalUncompletedValue)}
              </div>
            </div>
            <div className="text-[11px] text-muted-foreground mt-2.5 pt-2 border-t border-border/40">
              سلات بدأت الشراء ولم تكتمل
            </div>
          </div>
        </div>
      </div>

      {/* سطر مرجعي شفاف لتوضيح حركة السلات */}
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground bg-card p-2.5 rounded-lg border border-border/70 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-success" />
          <span className="font-medium text-foreground">
            نجح الفريق في استرداد وتحويل {summary.byTeam.toLocaleString()} سلة
            بقيمة {formatPrice(summary.byTeamValue)} إلى طلبات فعلية
          </span>
        </div>
        {summary.natural > 0 && (
          <span className="text-[11px] text-muted-foreground font-mono tabular-nums">
            * تحول ذاتياً من المتجر بدون تدخل الفريق:{" "}
            {summary.natural.toLocaleString()} طلب ({formatPrice(summary.naturalValue)})
          </span>
        )}
      </div>
    </section>
  );
};

export default IncompleteReportsKpis;
