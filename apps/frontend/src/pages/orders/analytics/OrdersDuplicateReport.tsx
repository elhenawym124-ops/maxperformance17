import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DocumentDuplicateIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { DuplicateStats } from "./types";

interface OrdersDuplicateReportProps {
  duplicateStats?: DuplicateStats;
  loading: boolean;
  formatPrice: (amount: number) => string;
}

export const OrdersDuplicateReport: React.FC<OrdersDuplicateReportProps> = ({
  duplicateStats,
  loading,
  formatPrice,
}) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(true);

  const totalDuplicates = duplicateStats?.totalDuplicates ?? 0;
  const duplicateRate = duplicateStats?.duplicateRate ?? 0;
  const avoidedRevenue = duplicateStats?.avoidedRevenue ?? 0;
  const topDuplicates = duplicateStats?.topDuplicates ?? [];
  const dailyTrend = duplicateStats?.dailyTrend ?? [];

  const maxTrendCount = Math.max(...dailyTrend.map((t) => t.count), 1);

  return (
    <section className="p-3 sm:p-4 bg-white/50 dark:bg-[#070709]/50 transition-colors">
      {/* 1. Header with KPI Chips */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-warning/10 text-warning dark:text-warning border border-warning/20">
            <DocumentDuplicateIcon className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-foreground dark:text-white">
                تقرير الطلبات المكررة
              </h2>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-warning/10 text-warning dark:text-warning border border-warning/20">
                {duplicateRate}% من الإجمالي
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground dark:dark:text-muted-foreground">
              رصد الطلبات المكررة تلقائيًا وحماية الإيراد غير المشحون
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/orders?status=DUPLICATE_ORDER")}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md text-warning dark:text-warning bg-warning/10 dark:bg-warning/40 border border-warning dark:border-warning/60 hover:bg-warning dark:hover:bg-warning/40 transition-all active:scale-[0.97]"
          >
            <MagnifyingGlassIcon className="h-3.5 w-3.5" />
            <span>عرض كل المكرر</span>
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1 text-muted-foreground hover:hover:text-foreground dark:hover:text-white transition-colors"
            aria-label={isExpanded ? "طي التقرير" : "توسيع التقرير"}
          >
            {isExpanded ? (
              <ChevronUpIcon className="h-4 w-4" />
            ) : (
              <ChevronDownIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
        {/* Metric 1: Count & Rate */}
        <div className="p-3 rounded-lg /80/80bg-muted dark:bg-white/[0.02] border /80/80border-border dark:border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-[11px] text-muted-foreground dark:dark:text-muted-foreground block mb-0.5">
              عدد الطلبات المكررة
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-foreground dark:text-white font-mono tabular-nums">
                {loading ? "…" : totalDuplicates.toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground dark:dark:text-muted-foreground font-mono">
                طلب
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-muted-foreground block mb-0.5">نسبة التكرار</span>
            <span className="text-sm font-semibold text-warning dark:text-warning font-mono tabular-nums">
              {duplicateRate}%
            </span>
          </div>
        </div>

        {/* Metric 2: Avoided Revenue (القيمة المتجنبة) */}
        <div className="p-3 rounded-lg /80/80bg-muted dark:bg-white/[0.02] border /80/80border-border dark:border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-[11px] text-muted-foreground dark:dark:text-muted-foreground block mb-0.5">
              القيمة المتجنبة (لم تُشحن)
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-success dark:text-success font-mono tabular-nums">
                {loading ? "…" : formatPrice(avoidedRevenue)}
              </span>
            </div>
          </div>
          <div className="p-2 rounded-md bg-success/10 text-success dark:text-success border border-success/20">
            <ShieldCheckIcon className="h-4 w-4" />
          </div>
        </div>

        {/* Metric 3: Repeat Customers Count */}
        <div className="p-3 rounded-lg /80/80bg-muted dark:bg-white/[0.02] border /80/80border-border dark:border-white/[0.08] flex items-center justify-between">
          <div>
            <span className="text-[11px] text-muted-foreground dark:dark:text-muted-foreground block mb-0.5">
              العملاء الأكثر تكرارًا
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-foreground dark:text-white font-mono tabular-nums">
                {loading ? "…" : topDuplicates.length}
              </span>
              <span className="text-xs text-muted-foreground dark:dark:text-muted-foreground font-mono">
                عميل
              </span>
            </div>
          </div>
          <div className="p-2 rounded-md /10/10bg-muted text-foreground dark:dark:text-muted-foreground border /20/20border-border">
            <UserGroupIcon className="h-4 w-4" />
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-3 pt-1">
          {/* 3. Trend sparkbars (if trend exists) */}
          {dailyTrend.length > 1 && (
            <div className="p-3 rounded-lg /60/60bg-muted dark:bg-white/[0.015] border /60/60border-border dark:border-white/[0.06]">
              <span className="text-[11px] font-semibold text-foreground dark:dark:text-muted-foreground block mb-2">
                الاتجاه الزمني للمكرر والقيمة المتجنبة
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {dailyTrend.slice(-7).map((entry) => {
                  const heightPct = Math.max(
                    12,
                    Math.round((entry.count / maxTrendCount) * 100),
                  );
                  return (
                    <div
                      key={entry.date}
                      className="p-2 rounded bg-white dark:dark:bg-muted border /60/60border-border dark:border-white/[0.06] flex flex-col justify-between"
                    >
                      <span className="text-[10px] text-muted-foreground font-mono block">
                        {entry.date.slice(5)}
                      </span>
                      <div className="my-1.5 h-6 flex items-end">
                        <div
                          style={{ height: `${heightPct}%` }}
                          className="w-full bg-warning/40 hover:bg-warning/70 rounded-xs transition-all"
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
                        <span className="font-bold text-foreground dark:text-white">
                          {entry.count} طلب
                        </span>
                        <span className="text-[10px] text-success dark:text-success">
                          {formatPrice(entry.avoidedRevenue)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Top Duplicate Customers Table */}
          {topDuplicates.length > 0 ? (
            <div className="rounded-lg border /80/80border-border dark:border-white/[0.08] overflow-hidden">
              <div className="px-3 py-2 bg-muted dark:dark:bg-muted border-b /80/80border-border dark:border-white/[0.08] flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground dark:dark:text-muted-foreground">
                  قائمة العملاء الأكثر تكرارًا والربط بالطلب الأصلي
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  أعلى {topDuplicates.length} حالات
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="/50/50bg-muted dark:dark:bg-muted text-[11px] text-muted-foreground dark:dark:text-muted-foreground border-b /60/60border-border dark:border-white/[0.06]">
                    <tr>
                      <th className="py-2 px-3 font-medium">العميل / الهاتف</th>
                      <th className="py-2 px-3 font-medium text-center">مرات التكرار</th>
                      <th className="py-2 px-3 font-medium">الطلب الأصلي</th>
                      <th className="py-2 px-3 font-medium">الطلبات المكررة</th>
                      <th className="py-2 px-3 font-medium text-left">القيمة الإجمالية</th>
                      <th className="py-2 px-3 font-medium text-center">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y /60/60divide-border dark:divide-white/[0.06]">
                    {topDuplicates.map((item, idx) => (
                      <tr
                        key={`${item.customerPhone}-${idx}`}
                        className="hover:hover:bg-muted dark:hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-foreground dark:text-white">
                            {item.customerName}
                          </div>
                          <div className="text-[11px] text-muted-foreground font-mono">
                            {item.customerPhone}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold font-mono bg-warning/10 text-warning dark:text-warning">
                            {item.count} مرات
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {item.originalOrderNumber ? (
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/orders?search=${encodeURIComponent(item.originalOrderNumber!)}`)
                              }
                              className="font-mono text-xs text-primary dark:text-primary hover:underline"
                              title="فتح الطلب الأصلي"
                            >
                              {item.originalOrderNumber}
                            </button>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex flex-wrap gap-1 max-w-[220px]">
                            {item.orderNumbers.slice(0, 3).map((num) => (
                              <span
                                key={num}
                                className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted dark:dark:bg-muted text-foreground dark:dark:text-muted-foreground"
                              >
                                {num}
                              </span>
                            ))}
                            {item.orderNumbers.length > 3 && (
                              <span className="text-[10px] text-muted-foreground font-mono">
                                +{item.orderNumbers.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-left font-mono font-semibold text-foreground dark:text-white tabular-nums">
                          {formatPrice(item.totalValue)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/orders?search=${encodeURIComponent(
                                  item.customerPhone !== "-" ? item.customerPhone : item.customerName,
                                )}`,
                              )
                            }
                            className="px-2 py-1 rounded text-[11px] font-medium bg-muted dark:dark:bg-muted hover:hover:bg-muted dark:hover:dark:hover:bg-muted text-foreground dark:dark:text-muted-foreground transition-all active:scale-[0.97]"
                          >
                            فحص الطلبات
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-3 text-center rounded-lg bg-muted dark:dark:bg-muted border /60/60border-border dark:border-white/[0.06] text-xs text-muted-foreground">
              لم يتم رصد طلبات مكررة متطابقة في هذه الفترة المحددة.
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default OrdersDuplicateReport;
