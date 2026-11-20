import React from "react";
import { parsePaymentDetails } from "./helpers";

interface AffiliatePaymentDetailsCardProps {
  paymentMethod?: string | null;
  paymentDetails?: unknown;
}

export const AffiliatePaymentDetailsCard: React.FC<AffiliatePaymentDetailsCardProps> = ({
  paymentMethod,
  paymentDetails,
}) => {
  return (
    <section className="rounded-xl border border-border bg-white p-5 shadow-sm dark:border-border dark:bg-muted">
      <h2 className="text-lg font-bold">بيانات الدفع</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-border p-3 text-sm dark:border-border">
          <div className="text-xs text-muted-foreground">طريقة الدفع</div>
          <div className="mt-1 font-semibold">
            {paymentMethod || "غير محدد"}
          </div>
        </div>
        <div className="rounded-xl border border-border p-3 text-sm dark:border-border md:col-span-2">
          <div className="text-xs text-muted-foreground">بيانات التحويل</div>
          <div className="mt-1 break-words font-semibold tabular-nums">
            {parsePaymentDetails(paymentDetails)}
          </div>
        </div>
      </div>
    </section>
  );
};
