import React from "react";
import { fmtMoney, type DoctorStatement } from "../../../../shared";

interface StatementTotalsSummaryProps {
  statement: DoctorStatement | null;
}

export const StatementTotalsSummary: React.FC<StatementTotalsSummaryProps> = ({
  statement,
}) => {
  const totalCards =
    statement?.totals?.totalCards ??
    statement?.totals?.invoicesCount ??
    statement?.invoices?.length ??
    0;

  const totalUnits =
    statement?.totals?.totalUnits ??
    statement?.invoices?.reduce(
      (sum, inv) => sum + (inv.unitsCount || inv.case?.unitsCount || 1),
      0
    ) ??
    0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4 print:grid-cols-4 print:border print:border-slate-300 print:p-2">
      <div className="p-3 bg-primary/60 dark:bg-primary/20 border border-primary dark:border-primary/50 rounded-xl print:border-none print:p-1 font-mono tabular-nums">
        <span className="text-[11px] text-muted-foreground font-medium print:text-black font-sans">
          عدد الحالات والوحدات
        </span>
        <p className="text-base sm:text-lg font-bold text-primary dark:text-primary mt-0.5 print:text-black">
          <span className="tabular-nums">{totalCards}</span> حالة (
          <span className="tabular-nums">{totalUnits}</span> وحدة)
        </p>
      </div>

      <div className="p-3 bg-muted dark:bg-muted border dark:border-border rounded-xl print:border-none print:p-1 font-mono tabular-nums">
        <span className="text-[11px] text-muted-foreground font-medium print:text-black font-sans">
          إجمالي المفوتر
        </span>
        <p className="text-base sm:text-lg font-bold text-foreground mt-0.5 print:text-black">
          <span className="tabular-nums">{fmtMoney(statement?.totals?.invoiced)}</span> ج.م
        </p>
      </div>

      <div className="p-3 bg-success/60 dark:bg-success/20 border border-success dark:border-success/50 rounded-xl print:border-none print:p-1 font-mono tabular-nums">
        <span className="text-[11px] text-success dark:text-success font-medium print:text-black font-sans">
          إجمالي المسدد
        </span>
        <p className="text-base sm:text-lg font-bold text-success dark:text-success mt-0.5 print:text-black">
          <span className="tabular-nums">{fmtMoney(statement?.totals?.paid)}</span> ج.م
        </p>
      </div>

      <div className="p-3 bg-destructive/60 dark:bg-destructive/20 border border-destructive dark:border-destructive/50 rounded-xl print:border-none print:p-1 font-mono tabular-nums">
        <span className="text-[11px] text-destructive dark:text-destructive font-medium print:text-black font-sans">
          الرصيد المتبقي المستحق
        </span>
        <p className="text-base sm:text-lg font-bold text-destructive mt-0.5 print:text-black">
          <span className="tabular-nums">{fmtMoney(statement?.totals?.remaining)}</span> ج.م
        </p>
      </div>
    </div>
  );
};

export default StatementTotalsSummary;
