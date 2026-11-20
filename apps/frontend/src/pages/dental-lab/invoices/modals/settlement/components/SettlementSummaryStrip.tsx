import React from "react";
import { fmtMoney, type MonthlySettlementSummary } from "../../../../shared";

interface SettlementSummaryStripProps {
  summary: MonthlySettlementSummary | null;
}

export const SettlementSummaryStrip: React.FC<SettlementSummaryStripProps> = ({
  summary,
}) => {
  if (!summary) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3 text-xs tabular-nums">
      <div className="p-2.5 bg-blue-50/60 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/40 rounded-xl">
        <span className="text-muted-foreground block text-[11px]">
          إجمالي فواتير الشهر
        </span>
        <p className="text-sm sm:text-base font-bold text-blue-700 dark:text-blue-300 mt-0.5 font-mono">
          <span className="tabular-nums">{fmtMoney(summary.totalBilled)}</span> ج.م
        </p>
      </div>

      <div className="p-2.5 bg-success/60 dark:bg-success/20 border border-success dark:border-success/40 rounded-xl">
        <span className="text-green-700 dark:text-success block text-[11px]">
          إجمالي المسدد
        </span>
        <p className="text-sm sm:text-base font-bold text-success dark:text-success mt-0.5 font-mono">
          <span className="tabular-nums">{fmtMoney(summary.totalPaid)}</span> ج.م
        </p>
      </div>

      <div className="p-2.5 bg-warning/60 dark:bg-warning/20 border border-warning dark:border-warning/40 rounded-xl">
        <span className="text-amber-700 dark:text-warning block text-[11px]">
          إجمالي التسويات
        </span>
        <p className="text-sm sm:text-base font-bold text-warning dark:text-warning mt-0.5 font-mono">
          <span className="tabular-nums">{fmtMoney(summary.totalAdjustments)}</span> ج.م
        </p>
      </div>

      <div className="p-2.5 bg-destructive/60 dark:bg-destructive/20 border border-destructive dark:border-destructive/40 rounded-xl">
        <span className="text-red-700 dark:text-destructive block text-[11px]">
          صافي المديونية المرحلة
        </span>
        <p className="text-sm sm:text-base font-bold text-destructive mt-0.5 font-mono">
          <span className="tabular-nums">{fmtMoney(summary.totalClosingBalance)}</span> ج.م
        </p>
      </div>

      <div className="p-2.5 bg-primary/60 dark:bg-primary/20 border border-primary dark:border-primary/40 rounded-xl col-span-2 sm:col-span-1">
        <span className="text-purple-700 dark:text-primary block text-[11px]">
          نسبة الاعتماد للشهر
        </span>
        <p className="text-sm sm:text-base font-bold text-primary dark:text-primary mt-0.5 font-mono">
          <span className="tabular-nums">{summary.closedCount}</span> /{" "}
          <span className="tabular-nums">{summary.totalDoctors}</span> طبيب
        </p>
      </div>
    </div>
  );
};

export default SettlementSummaryStrip;
