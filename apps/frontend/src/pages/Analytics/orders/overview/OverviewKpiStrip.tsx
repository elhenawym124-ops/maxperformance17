import React from "react";
import { Link } from "react-router-dom";
import {
  ShoppingCartIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  RectangleStackIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { DashboardStats } from "./types";

interface OverviewKpiStripProps {
  stats: DashboardStats;
  formatPrice: (val: number) => string;
}

export const OverviewKpiStrip: React.FC<OverviewKpiStripProps> = ({
  stats,
  formatPrice,
}) => {
  const calcDelta = (current: number, prev?: number | null) => {
    if (prev === undefined || prev === null || prev === 0) return null;
    const delta = ((current - prev) / prev) * 100;
    return delta;
  };

  const ordersDelta = calcDelta(stats.totalOrders, stats.prevPeriod?.totalOrders);
  const revenueDelta = calcDelta(stats.totalRevenue, stats.prevPeriod?.revenue);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
      {/* 1. إجمالي الطلبات */}
      <Link
        to="/analytics/orders/orders"
        className="group relative flex flex-col justify-between rounded-xl border border-border bg-white p-3.5 sm:p-4 shadow-sm hover:border-primary/60 dark:border-white/10 dark:bg-[#121214] dark:hover:border-primary/40 transition-all hover:shadow-md"
      >
        <div>
          <div className="flex items-center justify-between gap-1 text-muted-foreground">
            <span className="text-xs font-medium">إجمالي الطلبات</span>
            <div className="rounded-lg bg-primary/10 dark:bg-primary/40 p-1.5 text-primary dark:text-primary">
              <ShoppingCartIcon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {stats.totalOrders.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground/80">طلب</span>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-border dark:border-white/5 flex items-center justify-between text-xs">
          {ordersDelta !== null ? (
            <span
              className={`inline-flex items-center gap-0.5 font-semibold tabular-nums ${
                ordersDelta >= 0
                  ? "text-emerald-600 dark:text-success"
                  : "text-rose-600 dark:text-destructive"
              }`}
            >
              {ordersDelta >= 0 ? (
                <ArrowTrendingUpIcon className="h-3 w-3" />
              ) : (
                <ArrowTrendingDownIcon className="h-3 w-3" />
              )}
              {ordersDelta >= 0 ? "+" : ""}
              {ordersDelta.toFixed(1)}%
            </span>
          ) : (
            <span className="text-muted-foreground/80">الفترة الحالية</span>
          )}
          <span className="text-[11px] text-muted-foreground group-hover:text-primary dark:group-hover:text-primary transition-colors">
            تفاصيل ↗
          </span>
        </div>
      </Link>

      {/* 2. معدل التسليم الصافي */}
      <Link
        to="/analytics/orders/delivery-rate"
        className="group relative flex flex-col justify-between rounded-xl border border-border bg-white p-3.5 sm:p-4 shadow-sm hover:border-success/60 dark:border-white/10 dark:bg-[#121214] dark:hover:border-success/40 transition-all hover:shadow-md"
      >
        <div>
          <div className="flex items-center justify-between gap-1 text-muted-foreground">
            <span className="text-xs font-medium">معدل التسليم الصافي</span>
            <div className="rounded-lg bg-success/10 dark:bg-success/40 p-1.5 text-success dark:text-success">
              <CheckCircleIcon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-success dark:text-success tabular-nums">
              {stats.deliveryRate > 0
                ? `${stats.deliveryRate.toFixed(1)}%`
                : stats.totalOrders > 0
                ? `${((stats.completedOrders / stats.totalOrders) * 100).toFixed(1)}%`
                : "0.0%"}
            </span>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-border dark:border-white/5 flex items-center justify-between text-xs">
          <span className="text-muted-foreground tabular-nums text-[11px]">
            {stats.completedOrders.toLocaleString()} مسلّم بنجاح
          </span>
          <span className="text-[11px] text-muted-foreground group-hover:text-success dark:group-hover:text-success transition-colors">
            نسب الشحن ↗
          </span>
        </div>
      </Link>

      {/* 3. إجمالي الإيرادات */}
      <Link
        to="/analytics/orders/revenue"
        className="group relative flex flex-col justify-between rounded-xl border border-border bg-white p-3.5 sm:p-4 shadow-sm hover:border-primary/60 dark:border-white/10 dark:bg-[#121214] dark:hover:border-primary/40 transition-all hover:shadow-md"
      >
        <div>
          <div className="flex items-center justify-between gap-1 text-muted-foreground">
            <span className="text-xs font-medium">إجمالي الإيرادات</span>
            <div className="rounded-lg bg-primary/10 dark:bg-primary/40 p-1.5 text-primary dark:text-primary">
              <CurrencyDollarIcon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-foreground tabular-nums truncate">
              {formatPrice(stats.totalRevenue)}
            </span>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-border dark:border-white/5 flex items-center justify-between text-xs">
          {revenueDelta !== null ? (
            <span
              className={`inline-flex items-center gap-0.5 font-semibold tabular-nums ${
                revenueDelta >= 0
                  ? "text-emerald-600 dark:text-success"
                  : "text-rose-600 dark:text-destructive"
              }`}
            >
              {revenueDelta >= 0 ? "+" : ""}
              {revenueDelta.toFixed(1)}%
            </span>
          ) : (
            <span className="text-muted-foreground/80">المبيعات المؤكدة</span>
          )}
          <span className="text-[11px] text-muted-foreground group-hover:text-primary dark:group-hover:text-primary transition-colors">
            الإيراد ↗
          </span>
        </div>
      </Link>

      {/* 4. متوسط قيمة الطلب (AOV) */}
      <div className="relative flex flex-col justify-between rounded-xl border border-border bg-white p-3.5 sm:p-4 shadow-sm dark:border-white/10 dark:bg-[#121214]">
        <div>
          <div className="flex items-center justify-between gap-1 text-muted-foreground">
            <span className="text-xs font-medium">متوسط قيمة الطلب</span>
            <div className="rounded-lg bg-warning/10 dark:bg-warning/40 p-1.5 text-warning dark:text-warning">
              <ArrowTrendingUpIcon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-foreground tabular-nums truncate">
              {formatPrice(stats.averageOrderValue)}
            </span>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-border dark:border-white/5 flex items-center justify-between text-xs text-muted-foreground/80">
          <span className="text-[11px]">معدل سلة الشراء (AOV)</span>
        </div>
      </div>

      {/* 5. الطلبات متعددة القطع */}
      <div className="relative flex flex-col justify-between rounded-xl border border-border bg-white p-3.5 sm:p-4 shadow-sm dark:border-white/10 dark:bg-[#121214]">
        <div>
          <div className="flex items-center justify-between gap-1 text-muted-foreground">
            <span className="text-xs font-medium">الطلبات متعددة القطع</span>
            <div className="rounded-lg bg-primary/10 dark:bg-primary/40 p-1.5 text-primary">
              <RectangleStackIcon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {stats.multiPieceOrders.toLocaleString()}
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-primary/10 text-primary dark:bg-primary/50 dark:text-primary tabular-nums">
              {stats.multiPiecePercentage || 0}%
            </span>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-border dark:border-white/5 flex items-center justify-between text-xs text-muted-foreground/80">
          <span className="text-[11px] tabular-nums">
            {stats.totalPieces > 0 ? `${stats.totalPieces} قطعة مباعة` : "قطعتين أو أكثر"}
          </span>
        </div>
      </div>

      {/* 6. فاقد الإلغاء والمرتجع */}
      <Link
        to="/analytics/orders/cancellations"
        className="group relative flex flex-col justify-between rounded-xl border border-border bg-white p-3.5 sm:p-4 shadow-sm hover:border-destructive/60 dark:border-white/10 dark:bg-[#121214] dark:hover:border-destructive/40 transition-all hover:shadow-md"
      >
        <div>
          <div className="flex items-center justify-between gap-1 text-muted-foreground">
            <span className="text-xs font-medium">الإلغاء والمرتجع</span>
            <div className="rounded-lg bg-destructive/10 dark:bg-destructive/40 p-1.5 text-destructive dark:text-destructive">
              <ExclamationCircleIcon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-destructive dark:text-destructive tabular-nums">
              {(stats.cancelledOrders + stats.returnedOrders).toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground/80">
              ({stats.totalOrders > 0
                ? `${(((stats.cancelledOrders + stats.returnedOrders) / stats.totalOrders) * 100).toFixed(1)}%`
                : "0%"})
            </span>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-border dark:border-white/5 flex items-center justify-between text-xs">
          <span className="text-muted-foreground/80 text-[11px] tabular-nums truncate">
            {stats.lostRevenue > 0
              ? `فاقد ${formatPrice(stats.lostRevenue)}`
              : `${stats.cancelledOrders} ملغي / ${stats.returnedOrders} مرتجع`}
          </span>
          <span className="text-[11px] text-muted-foreground group-hover:text-destructive dark:group-hover:text-destructive transition-colors">
            تحليل ↗
          </span>
        </div>
      </Link>
    </div>
  );
};

export default OverviewKpiStrip;
