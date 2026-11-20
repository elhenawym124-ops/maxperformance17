import React from "react";
import { AffiliateCommission, AffiliatePayout } from "./types";
import { formatDate, formatPrice, statusLabels, toNumber } from "./helpers";

interface AffiliateCommissionsPayoutsProps {
  commissions: AffiliateCommission[];
  payouts: AffiliatePayout[];
}

export const AffiliateCommissionsPayouts: React.FC<AffiliateCommissionsPayoutsProps> = ({
  commissions,
  payouts,
}) => {
  return (
    <section className="rounded-xl border border-border bg-white p-5 shadow-sm dark:border-border dark:bg-muted">
      <h2 className="text-lg font-bold">تاريخ العمولات والسحوبات</h2>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-bold text-foreground dark:text-muted-foreground">
            العمولات
          </h3>
          <div className="space-y-2">
            {commissions.slice(0, 10).map((commission) => (
              <div
                key={commission.id}
                className="rounded-xl border border-border px-3 py-2 text-sm dark:border-border"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">
                    {commission.order?.orderNumber || "طلب غير محدد"}
                  </span>
                  <span className="font-bold text-success dark:text-success tabular-nums">
                    {formatPrice(toNumber(commission.amount))}
                  </span>
                </div>
                <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                  <span>{statusLabels[commission.status] || commission.status}</span>
                  <span className="tabular-nums">{formatDate(commission.createdAt)}</span>
                </div>
              </div>
            ))}
            {commissions.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                لا توجد عمولات.
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold text-foreground dark:text-muted-foreground">
            السحوبات
          </h3>
          <div className="space-y-2">
            {payouts.slice(0, 10).map((payout) => (
              <div
                key={payout.id}
                className="rounded-xl border border-border px-3 py-2 text-sm dark:border-border"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">
                    {payout.paymentMethod || "طريقة غير محددة"}
                  </span>
                  <span className="font-bold tabular-nums">
                    {formatPrice(toNumber(payout.amount))}
                  </span>
                </div>
                <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                  <span>{statusLabels[payout.status] || payout.status}</span>
                  <span className="tabular-nums">{formatDate(payout.createdAt)}</span>
                </div>
                {payout.proofFileUrl ? (
                  <a
                    href={payout.proofFileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-xs font-semibold text-primary hover:underline"
                  >
                    إثبات التحويل
                  </a>
                ) : null}
              </div>
            ))}
            {payouts.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                لا توجد سحوبات.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
};
