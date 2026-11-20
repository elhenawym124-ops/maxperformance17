import React from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import {
  MerchantAccountInfoSection,
  MerchantCommissionsTable,
  MerchantFinancialSummarySection,
  MerchantInventoryProductsSection,
  MerchantMetricsRow,
  MerchantOperationsConfigSection,
  MerchantOrdersHistoryTable,
  MerchantPayoutsTable,
  MerchantProfileHeader,
  MerchantWarehousesSection,
  useMerchantProfileDetailsState,
} from "./merchant-profile-details";

const MerchantProfileDetails: React.FC = () => {
  const {
    navigate,
    formatPrice,
    profile,
    loading,
    merchant,
    user,
    stats,
    displayName,
    fulfillmentMode,
  } = useMerchantProfileDetailsState();

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (!profile || !merchant || !stats) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate("/merchants")}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          رجوع للتجار
        </button>
        <div className="mt-8 rounded-xl border border-destructive bg-destructive/10 p-8 text-destructive">
          ملف التاجر غير متاح.
        </div>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-muted px-3 py-4 text-foreground dark:bg-muted dark:text-white sm:px-6 sm:py-6"
    >
      <div className="mx-auto max-w-6xl 2xl:max-w-7xl space-y-5">
        <MerchantProfileHeader
          merchant={merchant}
          displayName={displayName}
          fulfillmentMode={fulfillmentMode}
          stats={stats}
          formatPrice={formatPrice}
          onBack={() => navigate("/merchants")}
        />

        <MerchantMetricsRow
          stats={stats}
          formatPrice={formatPrice}
        />

        <div className="grid gap-5 xl:grid-cols-[1fr_390px]">
          <div className="space-y-5">
            <MerchantOrdersHistoryTable
              merchantId={merchant.id}
              rows={profile.operationsSummary?.rows}
              formatPrice={formatPrice}
            />

            <MerchantCommissionsTable
              commissions={profile.commissions}
              formatPrice={formatPrice}
            />

            <MerchantPayoutsTable
              payouts={profile.payouts}
              formatPrice={formatPrice}
            />
          </div>

          <aside className="space-y-5">
            <MerchantAccountInfoSection
              merchant={merchant}
              user={user}
            />

            <MerchantOperationsConfigSection
              merchant={merchant}
              fulfillmentMode={fulfillmentMode}
              defaultWarehouse={profile.defaultWarehouse}
              defaultShippingCompany={profile.defaultShippingCompany}
            />

            <MerchantInventoryProductsSection
              stats={stats}
              products={profile.products}
              inventorySummary={profile.inventorySummary}
              formatPrice={formatPrice}
            />

            <MerchantWarehousesSection
              warehouses={profile.merchantWarehouses}
            />

            <MerchantFinancialSummarySection
              stats={stats}
              formatPrice={formatPrice}
            />
          </aside>
        </div>
      </div>
    </div>
  );
};

export default MerchantProfileDetails;
export * from "./merchant-profile-details/types";
