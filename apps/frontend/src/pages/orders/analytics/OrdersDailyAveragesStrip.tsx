import React from "react";
import {
  BanknotesIcon,
  CreditCardIcon,
  CalendarDaysIcon,
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { Skeleton } from "../../../components/ui/skeleton";

interface OrdersDailyAveragesStripProps {
  loading: boolean;
  daysCount: number;
  avgOrdersPerDay: number;
  avgDeliveredPerDay: number;
  avgCancelledPerDay: number;
  avgReturnedPerDay: number;
  avgPiecesPerOrder?: number;
  avgPiecesPerDay?: number;
  avgDeliveredPiecesPerDay?: number;
  avgCancelledPiecesPerDay?: number;
  avgReturnedPiecesPerDay?: number;
  netRevenue: number;
  pendingRevenue: number;
  lostRevenue: number;
  netRealizationPct: number;
  totalRevenue: number;
  totalOrders: number;
  codOrdersCount: number;
  prepaidOrdersCount: number;
  codCollectionRate: number;
  prepaidDeliveryRate: number;
  formatPrice: (amount: number) => string;
}

export const OrdersDailyAveragesStrip: React.FC<OrdersDailyAveragesStripProps> = ({
  loading,
  daysCount,
  avgOrdersPerDay,
  avgDeliveredPerDay,
  avgCancelledPerDay,
  avgReturnedPerDay,
  avgPiecesPerOrder = 0,
  avgPiecesPerDay = 0,
  avgDeliveredPiecesPerDay = 0,
  avgCancelledPiecesPerDay = 0,
  avgReturnedPiecesPerDay = 0,
  netRevenue,
  pendingRevenue,
  lostRevenue,
  netRealizationPct,
  totalRevenue,
  totalOrders,
  codOrdersCount,
  prepaidOrdersCount,
  codCollectionRate,
  prepaidDeliveryRate,
  formatPrice,
}) => {
  const safeTotal = totalOrders > 0 ? totalOrders : 1;
  const codPct = Math.round((codOrdersCount / safeTotal) * 100);
  const prepaidPct = Math.round((prepaidOrdersCount / safeTotal) * 100);

  return (
    <div className="border-b /80/80border-border dark:border-white/[0.08] /40/40bg-muted dark:dark:bg-muted">
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x /80/80divide-border dark:divide-white/[0.08]">
        
        {/* 1. DAILY RUN-RATE AVERAGES (6 Columns = 50% width) */}
        <div className="col-span-12 lg:col-span-6 p-3.5 sm:p-4 flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-6 h-6 rounded-md /10/10bg-muted text-foreground dark:dark:text-muted-foreground flex items-center justify-center shrink-0">
                <CalendarDaysIcon className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-bold text-foreground dark:text-white uppercase tracking-wider truncate">
                المعدلات اليومية للطلبات ({daysCount} يوم)
              </span>
            </div>
            <span className="text-[11px] font-semibold text-muted-foreground tabular-nums shrink-0">
              معدل الجريان اليومي
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-4 gap-2 py-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-1">
              {/* Overall Daily */}
              <div className="p-2 sm:p-2.5 rounded-lg bg-white dark:dark:bg-muted border /70/70border-border dark:border-white/[0.06] text-center shadow-2xs">
                <span className="block text-[10px] font-medium text-muted-foreground truncate mb-0.5">إجمالي يومياً</span>
                <span className="text-base sm:text-lg font-black tabular-nums text-foreground dark:text-white">
                  {avgOrdersPerDay}
                </span>
                <span className="block text-[9px] text-muted-foreground mt-0.5">
                  طلب / يوم {avgPiecesPerDay > 0 && `(${avgPiecesPerDay} ق)`}
                </span>
              </div>

              {/* Delivered Daily */}
              <div className="p-2 sm:p-2.5 rounded-lg bg-white dark:dark:bg-muted border border-success/20 text-center shadow-2xs">
                <span className="block text-[10px] font-medium text-success dark:text-success truncate flex items-center justify-center gap-0.5 mb-0.5">
                  <CheckIcon className="h-2.5 w-2.5" />
                  <span>مسلّم يومياً</span>
                </span>
                <span className="text-base sm:text-lg font-black tabular-nums text-success dark:text-success">
                  {avgDeliveredPerDay}
                </span>
                <span className="block text-[9px] text-success/80 dark:text-success/80 font-medium mt-0.5">
                  طلب {avgDeliveredPiecesPerDay > 0 && `· ${avgDeliveredPiecesPerDay} ق`}
                </span>
              </div>

              {/* Cancelled Daily */}
              <div className="p-2 sm:p-2.5 rounded-lg bg-white dark:dark:bg-muted border border-destructive/20 text-center shadow-2xs">
                <span className="block text-[10px] font-medium text-destructive dark:text-destructive truncate flex items-center justify-center gap-0.5 mb-0.5">
                  <XMarkIcon className="h-2.5 w-2.5" />
                  <span>ملغي يومياً</span>
                </span>
                <span className="text-base sm:text-lg font-black tabular-nums text-destructive dark:text-destructive">
                  {avgCancelledPerDay}
                </span>
                <span className="block text-[9px] text-destructive/80 dark:text-destructive/80 font-medium mt-0.5">
                  طلب {avgCancelledPiecesPerDay > 0 && `· ${avgCancelledPiecesPerDay} ق`}
                </span>
              </div>

              {/* Returned Daily */}
              <div className="p-2 sm:p-2.5 rounded-lg bg-white dark:dark:bg-muted border border-destructive/20 text-center shadow-2xs">
                <span className="block text-[10px] font-medium text-destructive dark:text-destructive truncate flex items-center justify-center gap-0.5 mb-0.5">
                  <ArrowPathIcon className="h-2.5 w-2.5" />
                  <span>مرتجع يومياً</span>
                </span>
                <span className="text-base sm:text-lg font-black tabular-nums text-destructive dark:text-destructive">
                  {avgReturnedPerDay}
                </span>
                <span className="block text-[9px] text-destructive/80 dark:text-destructive/80 font-medium mt-0.5">
                  طلب {avgReturnedPiecesPerDay > 0 && `· ${avgReturnedPiecesPerDay} ق`}
                </span>
              </div>
            </div>
          )}

          {avgPiecesPerOrder > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-muted-foreground dark:dark:text-muted-foreground mt-2.5 pt-2 border-t /60/60border-border dark:border-white/[0.06] tabular-nums">
              <span>
                معدل حجم السلة:{" "}
                <strong className="text-foreground dark:dark:text-muted-foreground font-bold">
                  {avgPiecesPerOrder}&nbsp;قطعة / طلب
                </strong>
              </span>
              <span className="hidden sm:inline text-muted-foreground dark:dark:text-foreground">|</span>
              <span>
                معدل خروج البضاعة:{" "}
                <strong className="text-foreground dark:dark:text-muted-foreground font-bold">
                  {avgPiecesPerDay}&nbsp;قطعة / يوم
                </strong>
              </span>
            </div>
          )}
        </div>

        {/* 2. REALIZED NET REVENUE & FINANCIAL FLOW (3 Columns = 25% width) */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 p-3.5 sm:p-4 flex flex-col justify-between min-w-0 bg-white/40 dark:dark:bg-muted">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-6 h-6 rounded-md bg-success/10 text-success dark:text-success flex items-center justify-center shrink-0">
                <BanknotesIcon className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-bold text-foreground dark:text-white uppercase tracking-wider truncate">
                صافي الإيراد الفعلي المحصل
              </span>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tabular-nums bg-success/10 text-success dark:text-success border border-success/20 shrink-0">
              {netRealizationPct}% محصل
            </span>
          </div>

          <div>
            {loading ? (
              <Skeleton className="h-8 w-32 rounded my-1" />
            ) : (
              <div className="text-xl sm:text-2xl font-black tabular-nums tracking-tight text-success dark:text-success my-0.5">
                {formatPrice(netRevenue)}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t /60/60border-border dark:border-white/[0.06] text-xs">
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-muted-foreground font-medium truncate">بالشحن (مع المندوب)</span>
                <span className="font-bold tabular-nums text-info dark:text-info text-xs truncate">
                  {formatPrice(pendingRevenue)}
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-muted-foreground font-medium truncate">فاقد (ملغي ومرتجع)</span>
                <span className="font-bold tabular-nums text-destructive dark:text-destructive text-xs truncate">
                  {formatPrice(lostRevenue)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. PAYMENT METHOD REALITY (COD vs PREPAID) (3 Columns = 25% width) */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 p-3.5 sm:p-4 flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-6 h-6 rounded-md /10/10bg-muted text-foreground dark:dark:text-muted-foreground flex items-center justify-center shrink-0">
                <CreditCardIcon className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-bold text-foreground dark:text-white uppercase tracking-wider truncate">
                طريقة الدفع والتحصيل
              </span>
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground shrink-0">
              COD مقابل مسبق
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            {/* COD Row */}
            <div className="flex items-center justify-between text-xs py-0.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />
                <span className="text-foreground dark:dark:text-muted-foreground font-medium truncate">
                  الدفع عند الاستلام (COD)
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 tabular-nums">
                <span className="font-bold text-foreground dark:text-white">
                  {codOrdersCount.toLocaleString()} طلب
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground bg-muted dark:bg-white/[0.06] px-1 py-0.5 rounded">
                  %{codPct}
                </span>
              </div>
            </div>

            {/* Prepaid Row */}
            <div className="flex items-center justify-between text-xs py-0.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-info shrink-0" />
                <span className="text-foreground dark:dark:text-muted-foreground font-medium truncate">
                  دفع إلكتروني مسبق
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 tabular-nums">
                <span className="font-bold text-foreground dark:text-white">
                  {prepaidOrdersCount.toLocaleString()} طلب
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground bg-muted dark:bg-white/[0.06] px-1 py-0.5 rounded">
                  %{prepaidPct}
                </span>
              </div>
            </div>

            {/* Delivery rate footer */}
            <div className="pt-1.5 border-t /60/60border-border dark:border-white/[0.06] flex items-center justify-between text-[10px] sm:text-[11px] text-muted-foreground tabular-nums">
              <span>تسليم COD: <strong className="text-success dark:text-success font-bold">%{codCollectionRate}</strong></span>
              <span>تسليم المسبق: <strong className="text-info dark:text-info font-bold">%{prepaidDeliveryRate}</strong></span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OrdersDailyAveragesStrip;
