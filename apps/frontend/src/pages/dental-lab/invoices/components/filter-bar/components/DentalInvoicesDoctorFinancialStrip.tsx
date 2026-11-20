import React from "react";
import { fmtMoney } from "../../../../shared";
import type { ActiveDoctorStats } from "../types";

export interface DentalInvoicesDoctorFinancialStripProps {
  stats: ActiveDoctorStats;
}

export const DentalInvoicesDoctorFinancialStrip: React.FC<DentalInvoicesDoctorFinancialStripProps> = ({
  stats,
}) => {
  return (
    <div className="pt-2 border-t dark:border-border grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs tabular-nums">
      <div className="p-2.5 bg-muted dark:bg-muted rounded-lg">
        <span className="text-gray-400 block text-[11px]">إجمالي الفواتير</span>
        <p className="text-sm sm:text-base font-bold text-foreground mt-0.5 font-mono">
          {fmtMoney(stats.totalBilled)} ج.م{" "}
          <span className="text-[10px] text-muted-foreground font-normal">
            ({stats.invoicesCount} فاتورة)
          </span>
        </p>
      </div>

      <div className="p-2.5 bg-success/60 dark:bg-success/20 rounded-lg">
        <span className="text-green-700 dark:text-success block text-[11px]">إجمالي المسدد</span>
        <p className="text-sm sm:text-base font-bold text-success dark:text-success mt-0.5 font-mono">
          {fmtMoney(stats.totalPaid)} ج.م
        </p>
      </div>

      <div className="p-2.5 bg-destructive/60 dark:bg-destructive/20 rounded-lg">
        <span className="text-red-700 dark:text-destructive block text-[11px]">المديونية الحالية المتبقية</span>
        <p className="text-sm sm:text-base font-bold text-destructive mt-0.5 font-mono">
          {fmtMoney(stats.outstanding)} ج.م
        </p>
      </div>

      <div className="p-2.5 bg-warning/60 dark:bg-warning/20 rounded-lg">
        <span className="text-amber-700 dark:text-warning block text-[11px]">حالات غير مفوترة</span>
        <p className="text-sm sm:text-base font-bold text-warning dark:text-warning mt-0.5 font-mono">
          {stats.uninvoicedCases} حالة ({fmtMoney(stats.uninvoicedAmount)} ج.م)
        </p>
      </div>
    </div>
  );
};
