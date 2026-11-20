import React from "react";
import { Truck, Package, Zap, Clock, ArrowDownUp, Boxes, CheckCircle2 } from "lucide-react";
import type { VelocityKpis } from "../types";

interface Props {
  kpis: VelocityKpis;
}

export const VelocityKpisStrip: React.FC<Props> = ({ kpis }) => {
  const isPrepMilestone = kpis.milestone === "READY_TO_SHIP";
  const isBacklogDraining = kpis.netBacklogDelta >= 0;

  const leadTimeDisplay =
    kpis.avgLeadTimeHours >= 24
      ? `${(kpis.avgLeadTimeHours / 24).toFixed(1)} يوم`
      : `${kpis.avgLeadTimeHours} س`;

  return (
    <div className="space-y-3">
      {/* 5-KPI Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Total Processed */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-white p-4 shadow-xs dark:border-border dark:bg-muted">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground dark:text-muted-foreground">
            <span>{isPrepMilestone ? "إنجاز التجهيز اليوم (المخزن)" : "إجمالي المشحون الفعلي (الكابتن)"}</span>
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                isPrepMilestone
                  ? "bg-amber-50 text-warning dark:bg-warning/50 dark:text-warning"
                  : "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
              }`}
            >
              {isPrepMilestone ? <Package className="h-4 w-4" /> : <Truck className="h-4 w-4" />}
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums dark:text-white">
              {kpis.totalShippedCount.toLocaleString("ar-EG")}
            </span>
            <span className="text-xs text-muted-foreground dark:text-muted-foreground">
              {isPrepMilestone ? "طلب مجهز" : "طلب مشحون"}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground dark:text-muted-foreground">
            <span>القيمة الإجمالية</span>
            <span className="font-semibold text-foreground tabular-nums dark:text-muted-foreground">
              {kpis.totalShippedRevenue.toLocaleString("ar-EG")} ج.م
            </span>
          </div>
        </div>

        {/* 2. Same-Day Fulfillment */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-white p-4 shadow-xs dark:border-border dark:bg-muted">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground dark:text-muted-foreground">
            <span>{isPrepMilestone ? "تجهيز فوري (نفس اليوم)" : "شحن فوري (نفس اليوم)"}</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success/10 text-success dark:bg-success/50 dark:text-success">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-success tabular-nums dark:text-success">
              {kpis.sameDayRate}%
            </span>
            <span className="text-xs text-muted-foreground dark:text-muted-foreground">
              ({kpis.sameDayCount.toLocaleString("ar-EG")} طلب)
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground dark:text-muted-foreground">
            <span>متأخر (&gt; 3 أيام)</span>
            <span className="font-semibold text-warning tabular-nums dark:text-warning">
              {kpis.agedBacklogRate}% ({kpis.agedBacklogCount})
            </span>
          </div>
        </div>

        {/* 3. Avg Lead Time */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-white p-4 shadow-xs dark:border-border dark:bg-muted">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground dark:text-muted-foreground">
            <span>{isPrepMilestone ? "متوسط سرعة التجهيز" : "متوسط دورة الشحن"}</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary/50 dark:text-primary">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums dark:text-white">
              {leadTimeDisplay}
            </span>
            <span className="text-xs text-muted-foreground dark:text-muted-foreground">
              {isPrepMilestone ? "من الطلب إلى جاهز" : "من الطلب للكابتن"}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground dark:text-muted-foreground">
            <span>الساعات الدقيقة</span>
            <span className="font-semibold text-foreground tabular-nums dark:text-muted-foreground">
              {kpis.avgLeadTimeHours} ساعة
            </span>
          </div>
        </div>

        {/* 4. Inflow vs Outflow */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-white p-4 shadow-xs dark:border-border dark:bg-muted">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground dark:text-muted-foreground">
            <span>{isPrepMilestone ? "ميزان التجهيز (وارد vs مجهّز)" : "ميزان الشحن (وارد vs مشحون)"}</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary/50 dark:text-primary">
              <ArrowDownUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums dark:text-white">
              {kpis.outflowCount} / {kpis.inflowCount}
            </span>
            <span
              className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-bold ${
                isBacklogDraining
                  ? "bg-emerald-50 text-success dark:bg-success/60 dark:text-success"
                  : "bg-rose-50 text-destructive dark:bg-destructive/60 dark:text-destructive"
              }`}
            >
              {isBacklogDraining ? `+${kpis.netBacklogDelta} تصفية` : `${kpis.netBacklogDelta} تراكم`}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground dark:text-muted-foreground">
            <span>الوارد الجديد : المنجز</span>
            <span className="font-semibold text-foreground tabular-nums dark:text-muted-foreground">
              {kpis.inflowCount} جديد · {kpis.outflowCount} {isPrepMilestone ? "تجهيز" : "شحن"}
            </span>
          </div>
        </div>
      </div>

      {/* Carrier Handoff Staging Buffer Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-warning/70 bg-gradient-to-l from-warning/70 via-white to-warning/40 px-4 py-2.5 text-xs dark:border-warning/40 dark:bg-muted dark:from-warning/20 dark:via-slate-900 dark:to-slate-900">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning dark:bg-warning/10 dark:text-warning">
            <Boxes className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground dark:text-white">
                بانتظار استلام مندوب الشحن حالياً في المخزن:
              </span>
              <span className="rounded-md bg-warning/15 px-2 py-0.5 font-bold tabular-nums text-warning dark:text-warning">
                {(kpis.waitingCarrierCount ?? 0).toLocaleString("ar-EG")} أوردر جاهز ومغلّف
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground dark:text-muted-foreground">
              أوردرات أنهى عمال التجهيز تغليفها وطباعة بوالصها وتقف على منصة التسليم بانتظار حضور الكابتن
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 self-end sm:self-auto text-[11px]">
          <div>
            <span className="text-slate-500 dark:text-muted-foreground">القيمة المعلقة: </span>
            <span className="font-bold tabular-nums text-foreground dark:text-muted-foreground">
              {(kpis.waitingCarrierRevenue ?? 0).toLocaleString("ar-EG")} ج.م
            </span>
          </div>
          {isPrepMilestone && kpis.handoffDoneCount !== undefined && (
            <div className="flex items-center gap-1.5 border-s border-warning ps-3 dark:border-warning/60">
              <CheckCircle2 className="h-3.5 w-3.5 text-success dark:text-success" />
              <span className="text-slate-600 dark:text-muted-foreground">
                استلم الكابتن من دفعة اليوم:{" "}
                <strong className="text-emerald-600 tabular-nums dark:text-success">
                  {kpis.handoffDoneCount}
                </strong>{" "}
                · متبقي بالمخزن:{" "}
                <strong className="text-amber-600 tabular-nums dark:text-warning">
                  {kpis.handoffPendingCount}
                </strong>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
