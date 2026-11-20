import { Plus } from "lucide-react";
import type { DentalInvoice } from "../../../../shared";
import { fmtDateTime, fmtMoney } from "../../../../shared";

interface InvoicePaymentHistorySectionProps {
  payments?: DentalInvoice["payments"];
  remaining: number;
  onAddPayment: () => void;
}

export function InvoicePaymentHistorySection({
  payments,
  remaining,
  onAddPayment,
}: InvoicePaymentHistorySectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-foreground">
          سجل الدفعات المسددة ({payments?.length || 0})
        </span>
        {remaining > 0 && (
          <button
            type="button"
            onClick={onAddPayment}
            className="text-xs text-success font-bold hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> إضافة دفعة
          </button>
        )}
      </div>

      {!payments || payments.length === 0 ? (
        <p className="text-gray-400 text-center py-4 bg-muted dark:bg-muted rounded-xl border dark:border-border">
          لم يتم تسجيل أي دفعات لهذه الفاتورة بعد
        </p>
      ) : (
        <div className="border dark:border-border rounded-xl overflow-hidden divide-y dark:divide-border tabular-nums">
          {payments.map((p) => (
            <div
              key={p.id}
              className="p-2.5 flex items-center justify-between hover:bg-muted dark:hover:bg-muted"
            >
              <div>
                <p className="font-bold text-success dark:text-success font-mono">
                  {fmtMoney(p.amount)} ج.م
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {fmtDateTime(p.createdAt)} • طريقة: <span className="font-semibold">{p.method || "CASH"}</span>
                </p>
              </div>
              {p.note && (
                <span className="text-[11px] text-muted-foreground bg-muted dark:bg-muted px-2 py-0.5 rounded">
                  {p.note}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
