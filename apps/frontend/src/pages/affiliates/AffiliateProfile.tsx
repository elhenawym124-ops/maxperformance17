import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import {
  AffiliateCommissionsPayouts,
  AffiliateDocumentsCard,
  AffiliateHeaderCard,
  AffiliateMetricsCards,
  AffiliateOrdersTable,
  AffiliatePaymentDetailsCard,
  AffiliateReferralsSection,
  AffiliateReviewHistoryCard,
  AffiliateSettingsCard,
  useAffiliateProfile,
} from "./profile";

const AffiliateProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    profile,
    affiliate,
    stats,
    displayName,
    loading,
    saving,
    commissionRate,
    setCommissionRate,
    policyForm,
    setPolicyForm,
    updateStatus,
    saveCommission,
    savePolicy,
    reviewDocument,
  } = useAffiliateProfile(id);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (!profile || !affiliate || !stats) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate("/affiliates/management")}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          رجوع لإدارة المسوقين
        </button>
        <div className="mt-8 rounded-xl border border-destructive bg-destructive/10 p-8 text-destructive">
          ملف المسوق غير متاح.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted px-3 py-4 text-foreground dark:bg-muted dark:text-white sm:px-6 sm:py-6">
      <div className="mx-auto max-w-6xl 2xl:max-w-7xl space-y-5">
        <AffiliateHeaderCard
          affiliate={affiliate}
          displayName={displayName}
          saving={saving}
          updateStatus={updateStatus}
        />

        <AffiliateMetricsCards
          affiliate={affiliate}
          stats={stats}
        />

        <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
          <div className="space-y-5">
            <AffiliateOrdersTable orders={profile.orders} />

            <AffiliateCommissionsPayouts
              commissions={profile.commissions}
              payouts={profile.payouts}
            />

            <AffiliateReferralsSection
              referrals={profile.referrals}
              canViewCustomerData={affiliate.canViewCustomerData}
            />
          </div>

          <aside className="space-y-5">
            <AffiliateSettingsCard
              commissionRate={commissionRate}
              setCommissionRate={setCommissionRate}
              saveCommission={saveCommission}
              commissionType={affiliate.commissionType}
              policyForm={policyForm}
              setPolicyForm={setPolicyForm}
              savePolicy={savePolicy}
              saving={saving}
            />

            <AffiliateDocumentsCard
              identityDocumentStatus={affiliate.identityDocumentStatus}
              identityDocumentUploadedAt={affiliate.identityDocumentUploadedAt}
              identityDocumentReviewNote={affiliate.identityDocumentReviewNote}
              identityDocumentUrl={affiliate.identityDocumentUrl}
              documentHistory={profile.documentHistory}
              reviewDocument={reviewDocument}
              saving={saving}
            />

            <AffiliateReviewHistoryCard reviewHistory={profile.reviewHistory} />
          </aside>
        </div>

        <AffiliatePaymentDetailsCard
          paymentMethod={affiliate.paymentMethod}
          paymentDetails={affiliate.paymentDetails}
        />
      </div>
    </div>
  );
};

export default AffiliateProfile;
