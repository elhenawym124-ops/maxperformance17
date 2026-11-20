import React from "react";
import { AffiliateReferral } from "./types";
import { statusTone } from "./helpers";

interface AffiliateReferralsSectionProps {
  referrals: AffiliateReferral[];
  canViewCustomerData?: boolean;
}

export const AffiliateReferralsSection: React.FC<AffiliateReferralsSectionProps> = ({
  referrals,
  canViewCustomerData,
}) => {
  return (
    <section className="rounded-xl border border-border bg-white p-5 shadow-sm dark:border-border dark:bg-muted">
      <h2 className="text-lg font-bold">الإحالات والعملاء</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        صلاحية عرض بيانات العملاء:{" "}
        {canViewCustomerData ? "مفعلة" : "غير مفعلة"}
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {referrals.map((referral) => (
          <div
            key={referral.id}
            className="rounded-xl border border-border p-3 text-sm dark:border-border"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold">{referral.referralCode}</span>
              <span
                className={`rounded-full border px-2 py-1 text-xs font-semibold ${
                  referral.converted ? statusTone("ACTIVE") : statusTone("PENDING")
                }`}
              >
                {referral.converted ? "تم التحويل" : "زيارة فقط"}
              </span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {referral.order?.orderNumber || referral.source || "مصدر غير محدد"}
            </div>
            {canViewCustomerData && referral.customer ? (
              <div className="mt-2 text-xs text-foreground dark:text-muted-foreground">
                {`${referral.customer.firstName || ""} ${referral.customer.lastName || ""}`.trim() ||
                  referral.customer.phone ||
                  "عميل غير محدد"}
              </div>
            ) : null}
          </div>
        ))}
        {referrals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground dark:border-border">
            لا توجد إحالات مسجلة.
          </div>
        ) : null}
      </div>
    </section>
  );
};
