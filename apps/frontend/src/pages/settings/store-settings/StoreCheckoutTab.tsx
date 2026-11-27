import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  HeartIcon,
  ArrowsRightLeftIcon,
} from "@heroicons/react/24/outline";
import { CheckoutFormSection } from "../../../components/store/CheckoutFormSection";
import { CheckoutFormSettings } from "../../../services/checkoutFormSettingsService";
import { StorefrontSettings } from "../../../services/storefrontSettingsService";
import {
  getPdpQuickOrderSettingsFromDesignTokens,
  PdpQuickOrderSettings,
} from "../../../storefront/utils/pdpQuickOrderSettings";
import {
  getLocationCaptureSettingsFromDesignTokens,
  LocationCaptureSettings,
} from "../../../storefront/utils/locationCaptureSettings";
import { resolvePdpCheckoutEnabled } from "./types";

interface StoreCheckoutTabProps {
  checkoutFormSettings: CheckoutFormSettings;
  checkoutFormSettingsLoading: boolean;
  checkoutTabBusy: boolean;
  applyCheckoutFormSettings: (patch: Partial<CheckoutFormSettings>) => void;
  storefrontSettings: StorefrontSettings;
  handleToggleProductPageCheckout: (enabled: boolean) => void;
  handleChangePdpQuickOrderSettings: (
    settings: PdpQuickOrderSettings,
  ) => void;
  handleChangeLocationCaptureSettings?: (
    settings: LocationCaptureSettings,
  ) => void;
  handleSaveCheckoutTabSettings: () => Promise<boolean>;
  handleResetCheckoutTabSettings: () => Promise<void>;
  handleToggleWishlist: (enabled: boolean) => void;
  handleToggleComparison: (enabled: boolean) => void;
}

export const StoreCheckoutTab: React.FC<StoreCheckoutTabProps> = ({
  checkoutFormSettings,
  checkoutFormSettingsLoading,
  checkoutTabBusy,
  applyCheckoutFormSettings,
  storefrontSettings,
  handleToggleProductPageCheckout,
  handleChangePdpQuickOrderSettings,
  handleChangeLocationCaptureSettings,
  handleSaveCheckoutTabSettings,
  handleResetCheckoutTabSettings,
  handleToggleWishlist,
  handleToggleComparison,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const productPageCheckoutEnabled =
    resolvePdpCheckoutEnabled(storefrontSettings);
  const pdpQuickOrderSettings = getPdpQuickOrderSettingsFromDesignTokens(
    storefrontSettings.designTokens,
  );
  const locationCaptureSettings = getLocationCaptureSettingsFromDesignTokens(
    storefrontSettings.designTokens,
  );

  return (
    <div className="space-y-6 pb-8">
      {/* Polaris Control Strip */}
      <div className="bg-card border border-border/70 rounded-xl shadow-2xs px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-foreground">
              {t("storeSettings.checkoutFieldsTitle")}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("storeSettings.checkoutFieldsDesc")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => navigate("/settings/store/tools")}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-card text-foreground border border-border/70 hover:bg-muted/60 transition active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
            >
              {t("storeSettings.openConversionTools")}
            </button>
            <button
              type="button"
              onClick={() => {
                void handleResetCheckoutTabSettings();
              }}
              disabled={checkoutTabBusy}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-card text-foreground border border-border/70 hover:bg-muted/60 transition active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
            >
              {t("storeSettings.resetToDefault")}
            </button>
          </div>
        </div>
      </div>

      {/* Polaris Annotated Section: Product Image Action Buttons (Wishlist & Comparison) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
        <div className="lg:col-span-4 space-y-1.5 pt-1">
          <h4 className="text-sm font-semibold text-foreground">
            {t(
              "storeSettings.productPageActionsTitle",
              "أزرار التفاعل على صور المنتج",
            )}
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t(
              "storeSettings.productPageActionsDesc",
              "التحكم في ظهور زري المفضلة والمقارنة العائمين فوق صور المنتج في المتجر.",
            )}
          </p>
          <button
            type="button"
            onClick={() => navigate("/settings/store/product-conversion")}
            className="inline-flex items-center text-xs font-semibold text-primary hover:underline pt-1"
          >
            {t("storeSettings.viewInConversionTools", "عرض في أدوات التحويل")}
          </button>
        </div>

        <div className="lg:col-span-8 bg-card border border-border/70 rounded-xl shadow-2xs divide-y divide-border/70 overflow-hidden">
          <div className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-5 sm:py-4 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-8 w-8 rounded-lg bg-muted/70 text-foreground flex items-center justify-center shrink-0">
                <HeartIcon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {t("storeSettings.wishlistToggle", "زر قائمة المفضلة")}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t(
                    "storeSettings.wishlistToggleDesc",
                    "إظهار أيقونة القلب لحفظ المنتج",
                  )}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
              <input
                type="checkbox"
                aria-label={t("storeSettings.wishlistToggle", "زر قائمة المفضلة")}
                checked={storefrontSettings?.wishlistEnabled !== false}
                onChange={(e) => handleToggleWishlist(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-background after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary shadow-2xs" />
            </label>
          </div>

          <div className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-5 sm:py-4 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-8 w-8 rounded-lg bg-muted/70 text-foreground flex items-center justify-center shrink-0">
                <ArrowsRightLeftIcon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {t("storeSettings.comparisonToggle", "زر مقارنة المنتجات")}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t(
                    "storeSettings.comparisonToggleDesc",
                    "إظهار زر المقارنة بين المواصفات",
                  )}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
              <input
                type="checkbox"
                aria-label={t("storeSettings.comparisonToggle", "زر مقارنة المنتجات")}
                checked={storefrontSettings?.comparisonEnabled !== false}
                onChange={(e) => handleToggleComparison(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-background after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary shadow-2xs" />
            </label>
          </div>
        </div>
      </section>

      {checkoutFormSettingsLoading && !checkoutFormSettings ? (
        <div className="flex items-center justify-center min-h-[240px] rounded-xl border border-border/70 bg-card shadow-2xs">
          <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-primary"></div>
        </div>
      ) : (
        <CheckoutFormSection
          settings={checkoutFormSettings}
          onChange={applyCheckoutFormSettings}
          productPageCheckoutEnabled={productPageCheckoutEnabled}
          onProductPageCheckoutToggle={handleToggleProductPageCheckout}
          pdpQuickOrderSettings={pdpQuickOrderSettings}
          onPdpQuickOrderSettingsChange={handleChangePdpQuickOrderSettings}
          locationCaptureSettings={locationCaptureSettings}
          onLocationCaptureSettingsChange={handleChangeLocationCaptureSettings}
          onSave={() => {
            void handleSaveCheckoutTabSettings();
          }}
          onReset={() => {
            void handleResetCheckoutTabSettings();
          }}
          loading={checkoutTabBusy}
        />
      )}
    </div>
  );
};
