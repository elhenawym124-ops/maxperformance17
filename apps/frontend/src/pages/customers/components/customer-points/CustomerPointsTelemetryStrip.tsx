import React from "react";
import { CustomerPointsStats, formatPoints } from "./types";

interface CustomerPointsTelemetryStripProps {
  stats: CustomerPointsStats;
}

export const CustomerPointsTelemetryStrip: React.FC<CustomerPointsTelemetryStripProps> = ({
  stats,
}) => {
  return (
    <div className="rounded-xl border border-border dark:border-border bg-white dark:bg-muted shadow-2xs overflow-hidden">
      <div className="grid grid-cols-2 divide-y divide-border dark:divide-border sm:grid-cols-4 sm:divide-y-0 sm:divide-x rtl:">
        <div className="p-3 sm:p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium mb-1">
            <span>أعضاء الولاء</span>
            <span className="flex h-1.5 w-1.5 rounded-full bg-muted dark:bg-muted" />
          </div>
          <div className="text-lg sm:text-xl font-bold tracking-tight text-foreground dark:text-white font-mono tabular-nums">
            {stats.activeMembers.toLocaleString("ar-EG")}
          </div>
          <div className="text-[11px] text-muted-foreground/80 mt-1">عضو نشط</div>
        </div>

        <div className="p-3 sm:p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium mb-1">
            <span>إجمالي الرصيد</span>
            <span className="flex h-1.5 w-1.5 rounded-full bg-warning" />
          </div>
          <div className="text-lg sm:text-xl font-bold tracking-tight text-foreground dark:text-white font-mono tabular-nums">
            {formatPoints(stats.totalPointsBalance)}
          </div>
          <div className="text-[11px] text-muted-foreground/80 mt-1">نقطة متاحة</div>
        </div>

        <div className="p-3 sm:p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium mb-1">
            <span>معدل الاستبدال</span>
            <span className="flex h-1.5 w-1.5 rounded-full bg-success" />
          </div>
          <div className="text-lg sm:text-xl font-bold tracking-tight text-success dark:text-success font-mono tabular-nums">
            {stats.redemptionRate}%
          </div>
          <div className="text-[11px] text-muted-foreground/80 mt-1">نسبة الفاعلية</div>
        </div>

        <div className="p-3 sm:p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium mb-1">
            <span>مهدد بالانتهاء</span>
            <span className="flex h-1.5 w-1.5 rounded-full bg-destructive" />
          </div>
          <div className="text-lg sm:text-xl font-bold tracking-tight text-destructive dark:text-destructive font-mono tabular-nums">
            {stats.atRiskCount.toLocaleString("ar-EG")}
          </div>
          <div className="text-[11px] text-muted-foreground/80 mt-1">عميل بحاجة لتنبيه</div>
        </div>
      </div>
    </div>
  );
};
