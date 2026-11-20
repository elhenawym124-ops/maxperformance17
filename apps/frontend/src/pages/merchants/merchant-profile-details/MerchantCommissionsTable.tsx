import React from "react";
import { Link } from "react-router-dom";
import {
  Badge,
  EmptyState,
  formatDate,
  MerchantCommissionRow,
  statusLabels,
  statusTone,
  toNumber,
} from "./types";

interface MerchantCommissionsTableProps {
  commissions: MerchantCommissionRow[];
  formatPrice: (amount: number) => string;
}

export const MerchantCommissionsTable: React.FC<MerchantCommissionsTableProps> = ({
  commissions,
  formatPrice,
}) => {
  return (
    <section className="rounded-xl border border-border bg-white p-5 shadow-sm dark:border-border dark:bg-muted">
      <h2 className="text-lg font-bold">عمولات التاجر</h2>
      <div className="mt-4 overflow-x-auto">
        {commissions.length ? (
          <table className="min-w-full text-right text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th className="py-2">الطلب</th>
                <th className="py-2">الحالة</th>
                <th className="py-2">العمولة</th>
                <th className="py-2">قيمة الطلب</th>
                <th className="py-2">السحب</th>
                <th className="py-2">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-border">
              {commissions.map((commission) => (
                <tr key={commission.id}>
                  <td className="py-3">
                    {commission.order?.orderNumber ? (
                      <Link
                        to={`/orders/${commission.order.orderNumber}`}
                        className="font-semibold text-primary hover:underline dark:text-primary font-mono"
                      >
                        {commission.order.orderNumber}
                      </Link>
                    ) : (
                      "طلب غير محدد"
                    )}
                  </td>
                  <td className="py-3">
                    <Badge
                      label={
                        statusLabels[commission.status] || commission.status
                      }
                      tone={statusTone(commission.status)}
                    />
                  </td>
                  <td className="py-3 font-semibold tabular-nums">
                    {formatPrice(toNumber(commission.amount))}
                  </td>
                  <td className="py-3 text-foreground dark:text-muted-foreground tabular-nums">
                    {formatPrice(toNumber(commission.orderTotal))}
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {commission.merchant_payout ? (
                      <Badge
                        label={
                          statusLabels[
                            commission.merchant_payout.status || ""
                          ] ||
                          commission.merchant_payout.status ||
                          "مرتبط"
                        }
                        tone={statusTone(commission.merchant_payout.status)}
                      />
                    ) : (
                      "لم يطلب بعد"
                    )}
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {formatDate(commission.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState text="لا توجد عمولات مسجلة لهذا التاجر." />
        )}
      </div>
    </section>
  );
};
