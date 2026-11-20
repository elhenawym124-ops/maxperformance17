import React from "react";
import { ChevronLeft } from "lucide-react";
import type { VintageBucket, FulfillmentMilestone } from "../types";

interface Props {
  buckets: VintageBucket[];
  milestone?: FulfillmentMilestone;
  onSelectBucket: (bucketKey: string, bucketLabel: string) => void;
}

export const VintageDistributionCards: React.FC<Props> = ({ buckets, milestone, onSelectBucket }) => {
  const isPrep = milestone === "READY_TO_SHIP";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-foreground dark:text-white">
          {isPrep
            ? "توزيع الطلبات المجهزة يدوياً حسب عمر الطلب الأصلي (Order Vintage)"
            : "توزيع الطلبات المشحونة حسب عمر الطلب الأصلي (Order Vintage)"}
        </h2>
        <span className="text-xs text-muted-foreground dark:text-muted-foreground">
          اضغط على أي شريحة لاستعراض أوردراتها فوراً
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {buckets.map((b) => (
          <button
            key={b.key}
            type="button"
            onClick={() => onSelectBucket(b.key, b.label)}
            className="group relative flex flex-col justify-between rounded-xl border border-border bg-white p-3 text-right transition-all hover:border-border hover:shadow-xs active:scale-[0.98] dark:border-border dark:bg-muted dark:hover:border-border"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground dark:text-muted-foreground">
                  {b.shortLabel}
                </span>
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: b.color }}
                />
              </div>

              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-foreground tabular-nums dark:text-white">
                  {b.count.toLocaleString("ar-EG")}
                </span>
                <span className="text-[11px] font-medium text-muted-foreground dark:text-muted-foreground">
                  ({b.percent}%)
                </span>
              </div>
            </div>

            <div className="mt-2.5 border-t border-border pt-2 text-[11px] dark:border-border">
              <div className="flex items-center justify-between text-muted-foreground dark:text-muted-foreground">
                <span className="truncate tabular-nums">
                  {b.revenue.toLocaleString("ar-EG")} ج.م
                </span>
                <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:-translate-x-0.5" />
              </div>
            </div>

            {/* Visual ratio bar */}
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted dark:bg-muted">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.max(b.percent, b.count > 0 ? 4 : 0)}%`, backgroundColor: b.color }}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
