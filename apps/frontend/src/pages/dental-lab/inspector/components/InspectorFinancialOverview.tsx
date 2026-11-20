import { CreditCard } from "lucide-react";
import { type DentalLabCase, fmtMoney } from "../../shared";

interface InspectorFinancialOverviewProps {
  caseData: DentalLabCase;
}

export function InspectorFinancialOverview({
  caseData,
}: InspectorFinancialOverviewProps) {
  const total = Number(caseData.total) || 0;
  const paid = Number(caseData.paid) || 0;
  const remaining = Number(caseData.remaining) || 0;
  const isPaidFull = total > 0 && remaining <= 0;
  const isPartial = paid > 0 && remaining > 0;

  return (
    <div className="p-3 bg-white dark:bg-muted border border-border dark:border-border rounded-xl space-y-2">
      <div className="flex items-center justify-between border-b border-border dark:border-border pb-1.5">
        <span className="font-bold text-foreground dark:text-muted-foreground flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5 text-success" />
          <span>الحساب والمستحقات</span>
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            isPaidFull
              ? "bg-emerald-100 text-success dark:bg-success/40 dark:text-success"
              : isPartial
              ? "bg-amber-100 text-warning dark:bg-warning/40 dark:text-warning"
              : "bg-rose-100 text-destructive dark:bg-destructive/40 dark:text-destructive"
          }`}
        >
          {isPaidFull
            ? "مسدد بالكامل"
            : isPartial
            ? "مسدد جزئياً"
            : "غير مسدد"}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center pt-1">
        <div className="p-2 bg-muted dark:bg-muted rounded-lg">
          <span className="text-slate-400 block text-[10px]">الإجمالي</span>
          <span className="font-bold font-mono tabular-nums text-foreground dark:text-muted-foreground text-xs">
            {fmtMoney(total)}
          </span>
        </div>

        <div className="p-2 bg-success/60 dark:bg-success/20 rounded-lg">
          <span className="text-emerald-600 dark:text-success block text-[10px]">المدفوع</span>
          <span className="font-bold font-mono tabular-nums text-success dark:text-success text-xs">
            {fmtMoney(paid)}
          </span>
        </div>

        <div className="p-2 bg-destructive/60 dark:bg-destructive/20 rounded-lg">
          <span className="text-rose-600 dark:text-destructive block text-[10px]">المتبقي</span>
          <span className="font-bold font-mono tabular-nums text-destructive dark:text-destructive text-xs">
            {fmtMoney(remaining)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default InspectorFinancialOverview;
