import { fmtMoney } from "../../../../shared";

interface InvoiceFinancialTotalsCardProps {
  total: number;
  paid: number;
  remaining: number;
  displayNote?: string;
}

export function InvoiceFinancialTotalsCard({
  total,
  paid,
  remaining,
  displayNote,
}: InvoiceFinancialTotalsCardProps) {
  return (
    <>
      <div className="grid grid-cols-3 gap-2.5 p-3 bg-muted dark:bg-muted rounded-xl border dark:border-border tabular-nums">
        <div>
          <span className="text-gray-400">الإجمالي</span>
          <p className="text-base font-bold text-foreground font-mono">
            {fmtMoney(total)} ج.م
          </p>
        </div>
        <div>
          <span className="text-gray-400">المسدد</span>
          <p className="text-base font-bold text-success dark:text-success font-mono">
            {fmtMoney(paid)} ج.م
          </p>
        </div>
        <div>
          <span className="text-gray-400">المتبقي</span>
          <p className="text-base font-bold text-destructive font-mono">{fmtMoney(remaining)} ج.م</p>
        </div>
      </div>

      {displayNote && (
        <div className="p-2.5 bg-warning/60 dark:bg-warning/20 rounded-lg text-warning dark:text-warning">
          <span className="font-semibold">ملاحظات:</span> {displayNote}
        </div>
      )}
    </>
  );
}
