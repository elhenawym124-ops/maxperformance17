import React from "react";
import {
  BuildingStorefrontIcon,
  TruckIcon,
  GiftIcon,
  DocumentTextIcon,
  CreditCardIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { StoreSettingsTab } from "./types";

interface StoreSettingsHeaderProps {
  pageTitle: string;
  pageDescription: string;
  hideNavigation: boolean;
  activeTab: StoreSettingsTab;
  onTabChange: (tab: StoreSettingsTab) => void;
}

export const StoreSettingsHeader: React.FC<StoreSettingsHeaderProps> = ({
  pageTitle,
  pageDescription,
  hideNavigation,
  activeTab,
  onTabChange,
}) => {
  const { t } = useTranslation();

  const tabs = [
    { id: "branches", label: t("storeSettings.tabBranches"), icon: BuildingStorefrontIcon },
    { id: "shipping", label: t("storeSettings.tabShipping"), icon: TruckIcon },
    { id: "checkout", label: t("storeSettings.tabCheckout"), icon: CreditCardIcon },
    { id: "payment", label: t("storeSettings.tabPayment"), icon: CreditCardIcon },
    { id: "footer", label: t("storeSettings.tabFooter"), icon: DocumentTextIcon },
    { id: "promotion", label: t("storeSettings.tabPromotion"), icon: GiftIcon },
    { id: "seo", label: t("storeSettings.tabSeo", "تحسين محركات البحث (SEO)"), icon: GlobeAltIcon },
  ];

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            {pageTitle}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {pageDescription}
          </p>
        </div>
      </div>

      {!hideNavigation ? (
        <div className="mb-6">
          <nav className="inline-flex max-w-full items-center gap-1 rounded-xl border border-border/70 bg-card p-1 shadow-2xs overflow-x-auto scrollbar-none">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id as StoreSettingsTab)}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 whitespace-nowrap shrink-0 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1
                    ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-2xs"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    }
                  `}
                >
                  <Icon
                    className={`h-4 w-4 ${
                      isActive ? "text-primary-foreground" : "text-muted-foreground"
                    }`}
                  />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      ) : null}
    </>
  );
};
