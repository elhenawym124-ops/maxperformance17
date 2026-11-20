import React, { type ReactNode } from "react";
import {
  Sparkles,
  BadgePercent,
  Package,
  ShoppingCart,
  Mail,
  Settings2,
} from "lucide-react";
import UpsellManualManager from "../../UpsellManualManager";
import { UpsellOverviewSection } from "./UpsellOverviewSection";
import { UpsellProductPageSection } from "./UpsellProductPageSection";
import { UpsellCartDrawerSection } from "./UpsellCartDrawerSection";
import { UpsellPostPurchaseSection } from "./UpsellPostPurchaseSection";
import { UpsellGeneralSection } from "./UpsellGeneralSection";
import {
  JsonRecord,
  UpsellCenterSectionId,
} from "../../types/appSettingsTypes";

interface UpsellCenterTabProps {
  activeUpsellSection: UpsellCenterSectionId;
  setUpsellSection: (section: UpsellCenterSectionId) => void;
  generalSettings: JsonRecord;
  modulesSettings: JsonRecord;
  uiSettings: JsonRecord;
  thresholdsSettings: JsonRecord;
  copySettings: JsonRecord;
  activeUpsellPlacements: number;
  cartPlacementEnabled: boolean;
  upsellFallbackSummary: string;
  upsellCenterMetrics: {
    crossSellViews: number;
    boughtTogetherViews: number;
    boughtTogetherQuickAdds: number;
    boughtTogetherBundleAdds: number;
    cartUpsellViews: number;
    cartUpsellQuickAdds: number;
    postPurchaseViews: number;
    postPurchaseClicks: number;
    postPurchaseAdds: number;
  };
  updateAtPath: (path: string, value: unknown) => void;
  applyPreset: (preset: string) => void;
  navigate: (path: string) => void;
}

export const UpsellCenterTab: React.FC<UpsellCenterTabProps> = ({
  activeUpsellSection,
  setUpsellSection,
  generalSettings,
  modulesSettings,
  uiSettings,
  thresholdsSettings,
  copySettings,
  activeUpsellPlacements,
  cartPlacementEnabled,
  upsellFallbackSummary,
  upsellCenterMetrics,
  updateAtPath,
  applyPreset,
  navigate,
}) => {
  const sections: Array<{
    id: UpsellCenterSectionId;
    title: string;
    description: string;
    icon: ReactNode;
    badge: string;
  }> = [
    {
      id: "overview",
      title: "نظرة عامة",
      description: "ملخص سريع، خطوات العمل، والروابط الأساسية.",
      icon: <Sparkles size={18} />,
      badge: `${activeUpsellPlacements}/3`,
    },
    {
      id: "manual-links",
      title: "ربط المنتجات",
      description: "اختيار المنتج وإدارة Related وCross-sell وUpsell.",
      icon: <BadgePercent size={18} />,
      badge: "Manual",
    },
    {
      id: "product-page",
      title: "صفحة المنتج",
      description: "Related و Cross-sell و Bought Together.",
      icon: <Package size={18} />,
      badge: `${[
        Boolean(modulesSettings["crossSell"]),
        Boolean(modulesSettings["boughtTogether"]),
      ].filter(Boolean).length}/2`,
    },
    {
      id: "cart-drawer",
      title: "السلة",
      description: "اقتراحات الـ cart drawer والـ quick add.",
      icon: <ShoppingCart size={18} />,
      badge: cartPlacementEnabled ? "Live" : "Off",
    },
    {
      id: "post-purchase",
      title: "ما بعد الشراء",
      description: "Upsell صفحة الشكر وتفضيل السعر.",
      icon: <Mail size={18} />,
      badge: modulesSettings["postPurchaseUpsell"] ? "Live" : "Off",
    },
    {
      id: "general",
      title: "إعدادات عامة",
      description: "المحرك العام، الـ preset، والنصوص المشتركة.",
      icon: <Settings2 size={18} />,
      badge: String(generalSettings["preset"] || "balanced"),
    },
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="self-start xl:sticky xl:top-24">
        <div className="rounded-[28px] border border-border bg-white p-4 shadow-sm dark:border-border dark:bg-muted">
          <div className="px-2">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">
              Upsell Center
            </div>
            <h2 className="mt-2 text-xl font-black text-foreground">
              أقسام الصفحة
            </h2>
            <p className="mt-2 text-sm leading-7 text-foreground dark:text-muted-foreground">
              افتح القسم المطلوب مباشرة بدل التنقل داخل صفحة طويلة.
            </p>
          </div>

          <div className="mt-5 space-y-2">
            {sections.map((section) => {
              const isActive = section.id === activeUpsellSection;

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setUpsellSection(section.id)}
                  className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                    isActive
                      ? "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-100"
                      : "border-transparent bg-muted text-foreground hover:border-border hover:bg-white dark:bg-muted dark:text-muted-foreground dark:hover:border-border dark:hover:bg-muted"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <div
                    className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      isActive
                        ? "bg-white text-blue-700 dark:bg-blue-950/60 dark:text-blue-200"
                        : "bg-white text-foreground dark:bg-muted dark:text-muted-foreground"
                    }`}
                  >
                    {section.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold">{section.title}</span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${
                          isActive
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200"
                            : "bg-gray-200 text-foreground dark:bg-muted dark:text-muted-foreground"
                        }`}
                      >
                        {section.badge}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-6 text-muted-foreground">
                      {section.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      <div className="space-y-8">
        <UpsellOverviewSection
          active={activeUpsellSection === "overview"}
          generalSettings={generalSettings}
          activeUpsellPlacements={activeUpsellPlacements}
          upsellCenterMetrics={upsellCenterMetrics}
          upsellFallbackSummary={upsellFallbackSummary}
          setUpsellSection={setUpsellSection}
          navigate={navigate}
        />

        <div
          id="upsell-manual-links"
          className={activeUpsellSection === "manual-links" ? "scroll-mt-24" : "hidden"}
        >
          <UpsellManualManager active={activeUpsellSection === "manual-links"} />
        </div>

        <UpsellProductPageSection
          active={activeUpsellSection === "product-page"}
          modulesSettings={modulesSettings}
          uiSettings={uiSettings}
          copySettings={copySettings}
          upsellCenterMetrics={upsellCenterMetrics}
          updateAtPath={updateAtPath}
        />

        <UpsellCartDrawerSection
          active={activeUpsellSection === "cart-drawer"}
          cartPlacementEnabled={cartPlacementEnabled}
          modulesSettings={modulesSettings}
          uiSettings={uiSettings}
          copySettings={copySettings}
          upsellCenterMetrics={upsellCenterMetrics}
          updateAtPath={updateAtPath}
        />

        <UpsellPostPurchaseSection
          active={activeUpsellSection === "post-purchase"}
          modulesSettings={modulesSettings}
          thresholdsSettings={thresholdsSettings}
          copySettings={copySettings}
          upsellFallbackSummary={upsellFallbackSummary}
          upsellCenterMetrics={upsellCenterMetrics}
          updateAtPath={updateAtPath}
        />

        <UpsellGeneralSection
          active={activeUpsellSection === "general"}
          generalSettings={generalSettings}
          modulesSettings={modulesSettings}
          copySettings={copySettings}
          cartPlacementEnabled={cartPlacementEnabled}
          updateAtPath={updateAtPath}
          applyPreset={applyPreset}
        />
      </div>
    </div>
  );
};
