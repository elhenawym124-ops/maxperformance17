import React from "react";
import { Calendar, ArrowRight, ExternalLink } from "lucide-react";
import type { CreationCohort, FulfillmentMilestone } from "../types";

interface Props {
  cohorts: CreationCohort[];
  milestone?: FulfillmentMilestone;
  onSelectCohortDate: (date: string) => void;
}

export const CreationCohortTable: React.FC<Props> = ({ cohorts, milestone, onSelectCohortDate }) => {
  const isPrep = milestone === "READY_TO_SHIP";

  if (cohorts.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-white p-8 text-center text-muted-foreground dark:border-border dark:bg-muted">
        <Calendar className="mx-auto h-8 w-8 text-muted-foreground opacity-60" />
        <p className="mt-2 text-sm font-medium">
          {isPrep ? "لا توجد طلبات تم تجهيزها في هذا اليوم" : "لا توجد طلبات تم شحنها في هذا اليوم"}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-white shadow-xs dark:border-border dark:bg-muted">
      <div className="flex flex-col gap-1 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-border">
        <div>
          <h2 className="text-sm font-bold text-foreground dark:text-white">
            {isPrep
              ? "تفصيل الطلبات المجهزة حسب تاريخ الورود الدقيق (Cohort Vintage Table)"
              : "تفصيل الطلبات المشحونة حسب تاريخ الورود الدقيق (Cohort Vintage Table)"}
          </h2>
          <p className="text-xs text-muted-foreground dark:text-muted-foreground">
            {isPrep
              ? "توزيع كم أوردر تم تغليفه وتجهيزه من كل تاريخ ورود على حدة"
              : "توزيع كم أوردر خرج شحن من كل تاريخ ورود على حدة"}
          </p>
        </div>
        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
          {cohorts.length} تواريخ ورود مختلفة في هذه الدفعة
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="border-b border-border bg-muted text-muted-foreground dark:border-border dark:bg-muted dark:text-muted-foreground">
              <th className="py-2.5 px-4 font-semibold">تاريخ ورود الطلب</th>
              <th className="py-2.5 px-3 font-semibold">عمر الطلب</th>
              <th className="py-2.5 px-3 font-semibold text-center">
                {isPrep ? "الطلبات المجهزة" : "الطلبات المشحونة"}
              </th>
              <th className="py-2.5 px-3 font-semibold">حصة الدفعة</th>
              <th className="py-2.5 px-3 font-semibold">إجمالي القيمة</th>
              <th className="py-2.5 px-3 font-semibold">
                {isPrep ? "متوسط سرعة التجهيز" : "متوسط دورة التجهيز"}
              </th>
              <th className="py-2.5 px-4 font-semibold text-center">إجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border dark:divide-border">
            {cohorts.map((c) => {
              const ageBadgeColor =
                c.diffDays === 0
                  ? "bg-emerald-50 text-success dark:bg-success/50 dark:text-success border-success"
                  : c.diffDays === 1
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200"
                  : c.diffDays <= 3
                  ? "bg-amber-50 text-warning dark:bg-warning/50 dark:text-warning border-warning"
                  : "bg-rose-50 text-destructive dark:bg-destructive/50 dark:text-destructive border-destructive";

              return (
                <tr
                  key={c.creationDate}
                  className="transition-colors hover:bg-muted dark:hover:bg-muted"
                >
                  <td className="py-3 px-4 font-bold text-foreground tabular-nums dark:text-white">
                    {c.creationDate}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${ageBadgeColor}`}
                    >
                      {c.diffDays === 0
                        ? "نفس اليوم"
                        : c.diffDays === 1
                        ? "أمس (1 يوم)"
                        : `${c.diffDays} أيام مضت`}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-foreground tabular-nums dark:text-muted-foreground">
                    {c.ordersCount.toLocaleString("ar-EG")} طلب
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className="w-10 text-xs font-semibold tabular-nums text-foreground dark:text-muted-foreground">
                        {c.percentOfBatch}%
                      </span>
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted dark:bg-muted">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${Math.min(c.percentOfBatch, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-semibold text-foreground tabular-nums dark:text-muted-foreground">
                    {c.totalRevenue.toLocaleString("ar-EG")} ج.م
                  </td>
                  <td className="py-3 px-3 tabular-nums text-foreground dark:text-muted-foreground">
                    {c.avgLeadTimeHours >= 24
                      ? `${(c.avgLeadTimeHours / 24).toFixed(1)} يوم (${c.avgLeadTimeHours} س)`
                      : `${c.avgLeadTimeHours} ساعة`}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => onSelectCohortDate(c.creationDate)}
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2.5 py-1 text-xs font-semibold text-foreground shadow-2xs transition hover:bg-muted hover:text-blue-600 active:scale-95 dark:border-border dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted"
                    >
                      <span>عرض الطلبات</span>
                      <ArrowRight className="h-3 w-3 rtl:rotate-180" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
