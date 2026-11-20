import React from "react";
import { CreditCardIcon } from "@heroicons/react/24/outline";
import { InfoRow, MerchantProfileStats, toNumber } from "./types";

interface MerchantFinancialSummarySectionProps {
  stats: MerchantProfileStats;
  formatPrice: (amount: number) => string;
}

export const MerchantFinancialSummarySection: React.FC<MerchantFinancialSummarySectionProps> = ({
  stats,
  formatPrice,
}) => {
  return (
    <section className="rounded-xl border border-border bg-white p-5 shadow-sm dark:border-border dark:bg-muted">
      <div className="flex items-center gap-2">
        <CreditCardIcon className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-bold">ملخص مالي</h2>
      </div>
      <div className="mt-4">
        <InfoRow
          label="مستحق مؤكد"
          value={<span className="tabular-nums">{formatPrice(toNumber(stats.confirmedCommissionAmount))}</span>}
        />
        <InfoRow
          label="مستحق معلق"
          value={<span className="tabular-nums">{formatPrice(toNumber(stats.pendingCommissionAmount))}</span>}
        />
        <InfoRow
          label="قيد التحويل"
          value={<span className="tabular-nums">{formatPrice(toNumber(stats.pendingPayoutAmount))}</span>}
        />
        <InfoRow
          label="تم سداده"
          value={<span className="tabular-nums">{formatPrice(toNumber(stats.paidPayoutAmount))}</span>}
        />
        <InfoRow
          label="قيمة طلبات مسلمة"
          value={<span className="tabular-nums">{formatPrice(toNumber(stats.deliveredPayableAmount))}</span>}
        />
        <InfoRow
          label="قيمة في الشحن"
          value={<span className="tabular-nums">{formatPrice(toNumber(stats.inShippingAmount))}</span>}
        />
      </div>
    </section>
  );
};
