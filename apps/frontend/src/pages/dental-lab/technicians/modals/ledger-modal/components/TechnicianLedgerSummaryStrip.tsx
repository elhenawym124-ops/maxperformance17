import { fmtMoney, type TechnicianPayoutSummary } from "../../../../shared";

interface TechnicianLedgerSummaryStripProps {
  summary: TechnicianPayoutSummary | null;
}

export function TechnicianLedgerSummaryStrip({ summary }: TechnicianLedgerSummaryStripProps) {
  return (
    <div className="p-4 bg-muted dark:bg-muted border-b dark:border-border shrink-0">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-card p-3 rounded-lg border dark:border-border">
          <span className="text-[11px] text-muted-foreground block">
            أجر الإنتاج المكتسب
          </span>
          <span className="text-base font-bold text-primary dark:text-primary font-mono tabular-nums">
            {fmtMoney(summary?.totalEarned ?? 0)} ج.م
          </span>
          <span className="text-[10px] text-muted-foreground block mt-0.5 font-mono tabular-nums">
            {summary?.completedStages ?? 0} مرحلة ({summary?.completedUnits ?? 0} وحدة)
          </span>
        </div>
        <div className="bg-card p-3 rounded-lg border dark:border-border">
          <span className="text-[11px] text-muted-foreground block">
            إجمالي ما صُرف للفني
          </span>
          <span className="text-base font-bold text-primary dark:text-primary font-mono tabular-nums">
            {fmtMoney(summary?.totalPaid ?? 0)} ج.م
          </span>
          <span className="text-[10px] text-muted-foreground block mt-0.5 font-mono tabular-nums">
            سلف: {fmtMoney(summary?.totalAdvances ?? 0)} ج.م
          </span>
        </div>
        <div className="bg-card p-3 rounded-lg border dark:border-border">
          <span className="text-[11px] text-muted-foreground block">
            المكافآت والحوافز
          </span>
          <span className="text-base font-bold text-success dark:text-success font-mono tabular-nums">
            +{fmtMoney(summary?.totalBonuses ?? 0)} ج.م
          </span>
        </div>
        <div className="bg-card p-3 rounded-lg border dark:border-border">
          <span className="text-[11px] text-muted-foreground block">
            الخصومات والتوالف
          </span>
          <span className="text-base font-bold text-destructive dark:text-destructive font-mono tabular-nums">
            -{fmtMoney(summary?.totalDeductions ?? 0)} ج.م
          </span>
        </div>
        <div className="bg-card p-3 rounded-lg border-2 border-success/40 col-span-2 sm:col-span-1">
          <span className="text-[11px] text-success dark:text-success font-semibold block">
            صافي المستحق القائم
          </span>
          <span
            className={`text-lg font-bold block font-mono tabular-nums ${
              Number(summary?.netDue ?? 0) > 0
                ? "text-emerald-600 dark:text-success"
                : "text-foreground"
            }`}
          >
            {fmtMoney(summary?.netDue ?? 0)} ج.م
          </span>
        </div>
      </div>
    </div>
  );
}
