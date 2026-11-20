import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  TruckIcon,
  XCircleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { DashboardStats } from "./types";

interface OverviewPipelineFlowProps {
  stats: DashboardStats;
}

export const OverviewPipelineFlow: React.FC<OverviewPipelineFlowProps> = ({
  stats,
}) => {
  const total = Math.max(1, stats.totalOrders);
  const delivered = stats.completedOrders;
  const inTransit = stats.shippedOrders || 0;
  const processing =
    (stats.processingOrders || 0) +
    (stats.confirmedOrders || 0) +
    (stats.pendingOrders || 0);
  const cancelled = stats.cancelledOrders;
  const returned = stats.returnedOrders;

  // Percentage calculations
  const deliveredPct = ((delivered / total) * 100).toFixed(1);
  const inTransitPct = ((inTransit / total) * 100).toFixed(1);
  const processingPct = ((processing / total) * 100).toFixed(1);
  const dropPct = (((cancelled + returned) / total) * 100).toFixed(1);

  return (
    <div className="rounded-xl border border-border bg-white p-4 sm:p-5 shadow-sm dark:border-white/10 dark:bg-[#121214]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-border dark:border-white/5">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-foreground">
            مسار تدفق الطلبات ودورة الحياة (Order Velocity Pipeline)
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            توزيع تدفق الطلبات عبر محطات التشغيل من التسجيل وحتى التحصيل النهائي
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/analytics/orders/fulfillment-velocity"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary dark:text-primary hover:underline bg-primary/10 dark:bg-primary/40 px-2 py-1 rounded-md"
          >
            <span>سرعة الإنجاز وشحن اليوم</span>
            <ArrowRightIcon className="h-3 w-3 rotate-180" />
          </Link>
          <Link
            to="/analytics/orders/status-movement"
            className="inline-flex items-center gap-1 text-xs font-medium text-foreground dark:text-muted-foreground hover:underline"
          >
            <span>مصفوفة انتقال الحالات</span>
            <ArrowRightIcon className="h-3 w-3 rotate-180" />
          </Link>
        </div>
      </div>

      {/* Segmented Pipeline Bar */}
      <div className="w-full bg-muted dark:bg-muted rounded-full h-3 sm:h-3.5 flex overflow-hidden p-0.5 gap-0.5">
        <div
          style={{ width: `${Math.max(2, Number(deliveredPct))}%` }}
          className="bg-emerald-500 rounded-sm transition-all"
          title={`تم التسليم: ${delivered} (${deliveredPct}%)`}
        />
        {Number(inTransitPct) > 0 && (
          <div
            style={{ width: `${Number(inTransitPct)}%` }}
            className="bg-blue-500 rounded-sm transition-all"
            title={`مع الشحن: ${inTransit} (${inTransitPct}%)`}
          />
        )}
        {Number(processingPct) > 0 && (
          <div
            style={{ width: `${Number(processingPct)}%` }}
            className="bg-amber-500 rounded-sm transition-all"
            title={`قيد المعالجة والتجهيز: ${processing} (${processingPct}%)`}
          />
        )}
        {Number(dropPct) > 0 && (
          <div
            style={{ width: `${Number(dropPct)}%` }}
            className="bg-rose-500 rounded-sm transition-all"
            title={`إلغاء ومرتجع: ${cancelled + returned} (${dropPct}%)`}
          />
        )}
      </div>

      {/* Stage Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-4">
        {/* Stage 1: الناجحة والمسلمة */}
        <div className="rounded-lg bg-success/50 dark:bg-success/20 border border-success dark:border-success/30 p-2.5 sm:p-3">
          <div className="flex items-center justify-between text-success dark:text-success">
            <span className="text-xs font-semibold">مسلّم ومحصّل</span>
            <CheckCircleIcon className="h-4 w-4" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-lg sm:text-xl font-bold text-success dark:text-success tabular-nums">
              {delivered.toLocaleString()}
            </span>
            <span className="text-xs text-success dark:text-success tabular-nums">
              ({deliveredPct}%)
            </span>
          </div>
          <p className="text-[11px] text-success/80 dark:text-success/80 mt-1">
            كاش مستقر وناجح
          </p>
        </div>

        {/* Stage 2: مع الشحن / قيد التوصيل */}
        <div className="rounded-lg bg-primary/50 dark:bg-primary/20 border border-primary dark:border-primary/30 p-2.5 sm:p-3">
          <div className="flex items-center justify-between text-primary dark:text-primary">
            <span className="text-xs font-semibold">مع شركة الشحن</span>
            <TruckIcon className="h-4 w-4" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-lg sm:text-xl font-bold text-primary dark:text-primary tabular-nums">
              {inTransit.toLocaleString()}
            </span>
            <span className="text-xs text-primary dark:text-primary tabular-nums">
              ({inTransitPct}%)
            </span>
          </div>
          <p className="text-[11px] text-primary/80 dark:text-primary/80 mt-1">
            شحنات جارية مع المناديب
          </p>
        </div>

        {/* Stage 3: قيد المتابعة والتجهيز */}
        <div className="rounded-lg bg-warning/50 dark:bg-warning/20 border border-warning dark:border-warning/30 p-2.5 sm:p-3">
          <div className="flex items-center justify-between text-warning dark:text-warning">
            <span className="text-xs font-semibold">قيد التأكيد والتجهيز</span>
            <ArrowPathIcon className="h-4 w-4" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-lg sm:text-xl font-bold text-warning dark:text-warning tabular-nums">
              {processing.toLocaleString()}
            </span>
            <span className="text-xs text-warning dark:text-warning tabular-nums">
              ({processingPct}%)
            </span>
          </div>
          <p className="text-[11px] text-warning/80 dark:text-warning/80 mt-1">
            بانتظار التأكيد أو التعبئة
          </p>
        </div>

        {/* Stage 4: الهدر والإلغاء */}
        <div className="rounded-lg bg-destructive/50 dark:bg-destructive/20 border border-destructive dark:border-destructive/30 p-2.5 sm:p-3">
          <div className="flex items-center justify-between text-destructive dark:text-destructive">
            <span className="text-xs font-semibold">ملغي ومرتجع (RTO)</span>
            <XCircleIcon className="h-4 w-4" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-lg sm:text-xl font-bold text-destructive dark:text-destructive tabular-nums">
              {(cancelled + returned).toLocaleString()}
            </span>
            <span className="text-xs text-destructive dark:text-destructive tabular-nums">
              ({dropPct}%)
            </span>
          </div>
          <p className="text-[11px] text-destructive/80 dark:text-destructive/80 mt-1">
            {cancelled} إلغاء / {returned} مرتجع
          </p>
        </div>
      </div>
    </div>
  );
};

export default OverviewPipelineFlow;
