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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
            {pageTitle}
          </h2>
          <p className="mt-2 text-base text-muted-foreground">
            {pageDescription}
          </p>
        </div>
      </div>

      {!hideNavigation ? (
        <div className="border-b border-border dark:border-border pb-1 mb-6">
          <nav className="flex space-x-2 rtl:space-x-reverse overflow-x-auto no-scrollbar py-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id as StoreSettingsTab)}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 whitespace-nowrap shrink-0
                    ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-sm shadow-primary dark:shadow-none"
                        : "bg-gray-100/80 dark:bg-muted text-muted-foreground hover:bg-muted dark:hover:bg-muted hover:text-foreground dark:hover:text-white"
                    }
                  `}
                >
                  <Icon
                    className={`h-4 w-4 ${
                      isActive ? "text-white" : "text-muted-foreground"
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
