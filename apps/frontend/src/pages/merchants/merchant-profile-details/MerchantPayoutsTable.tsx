import React from "react";
import {
  Badge,
  EmptyState,
  formatDate,
  MerchantPayoutRow,
  parsePaymentDetails,
  statusLabels,
  statusTone,
  toNumber,
} from "./types";

interface MerchantPayoutsTableProps {
  payouts: MerchantPayoutRow[];
  formatPrice: (amount: number, currency?: string) => string;
}

export const MerchantPayoutsTable: React.FC<MerchantPayoutsTableProps> = ({
  payouts,
  formatPrice,
}) => {
  return (
    <section className="rounded-xl border border-border bg-white p-5 shadow-sm dark:border-border dark:bg-muted">
      <h2 className="text-lg font-bold">طلبات السحب</h2>
      <div className="mt-4 overflow-x-auto">
        {payouts.length ? (
          <table className="min-w-full text-right text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th className="py-2">المبلغ</th>
                <th className="py-2">الحالة</th>
                <th className="py-2">طريقة الدفع</th>
                <th className="py-2">مرجع التحويل</th>
                <th className="py-2">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-border">
              {payouts.map((payout) => (
                <tr key={payout.id}>
                  <td className="py-3 font-semibold tabular-nums">
                    {formatPrice(toNumber(payout.amount), payout.currency || undefined)}
                  </td>
                  <td className="py-3">
                    <Badge
                      label={statusLabels[payout.status] || payout.status}
                      tone={statusTone(payout.status)}
                    />
                  </td>
                  <td className="py-3 text-foreground dark:text-muted-foreground">
                    <div>{payout.paymentMethod || "غير محدد"}</div>
                    <div className="text-xs text-muted-foreground">
                      {parsePaymentDetails(payout.paymentDetails)}
                    </div>
                  </td>
                  <td className="py-3 text-muted-foreground font-mono text-xs">
                    {payout.externalReference ||
                      payout.transactionId ||
                      "بدون مرجع"}
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {formatDate(payout.processedAt || payout.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState text="لا توجد طلبات سحب لهذا التاجر." />
        )}
      </div>
    </section>
  );
};
