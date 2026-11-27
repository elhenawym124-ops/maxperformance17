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
    <div className="space-y-6">
      <div className="bg-gray-50/50 dark:bg-muted rounded-xl p-6 border border-border dark:border-border">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {t("storeSettings.checkoutFieldsTitle")}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {t("storeSettings.checkoutFieldsDesc")}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate("/settings/store/tools")}
              className="px-4 py-2 rounded-md text-sm font-semibold bg-white text-foreground border border-border hover:bg-muted dark:bg-muted dark:text-muted-foreground dark:border-border dark:hover:bg-muted"
            >
              {t("storeSettings.openConversionTools")}
            </button>
            <button
              type="button"
              onClick={() => {
                void handleResetCheckoutTabSettings();
              }}
              disabled={checkoutTabBusy}
              className={`px-4 py-2 rounded-md text-sm font-semibold ${
                checkoutTabBusy
                  ? "bg-gray-200 text-muted-foreground dark:bg-muted dark:text-muted-foreground cursor-not-allowed"
                  : "bg-white text-foreground border border-border hover:bg-muted dark:bg-muted dark:text-muted-foreground dark:border-border dark:hover:bg-muted"
              }`}
            >
              {t("storeSettings.resetToDefault")}
            </button>
          </div>
        </div>
      </div>

      {/* Product Image Action Buttons: Wishlist & Comparison */}
      <div className="bg-card/90 rounded-xl p-6 border border-border dark:border-border shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-base font-bold text-foreground">
              {t(
                "storeSettings.productPageActionsTitle",
                "أزرار التفاعل على صور المنتج",
              )}
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              {t(
                "storeSettings.productPageActionsDesc",
                "التحكم في ظهور زري المفضلة والمقارنة العائمين فوق صور المنتج في المتجر.",
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/settings/store/product-conversion")}
            className="text-xs font-bold text-primary hover:text-primary dark:text-primary"
          >
            {t("storeSettings.viewInConversionTools", "عرض في أدوات التحويل")}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="flex items-center justify-between p-4 rounded-xl border border-border dark:border-border bg-muted dark:bg-muted">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-destructive/10 dark:bg-destructive/40 text-destructive dark:text-destructive flex items-center justify-center font-bold text-base shadow-sm">
                <HeartIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  {t("storeSettings.wishlistToggle", "زر قائمة المفضلة")}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {t(
                    "storeSettings.wishlistToggleDesc",
                    "إظهار أيقونة القلب لحفظ المنتج",
                  )}
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={storefrontSettings?.wishlistEnabled !== false}
              onChange={(e) => handleToggleWishlist(e.target.checked)}
              className="h-5 w-5 rounded border-border text-primary focus:ring-primary cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-border dark:border-border bg-muted dark:bg-muted">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 dark:bg-primary/40 text-primary dark:text-primary flex items-center justify-center font-bold text-base shadow-sm">
                <ArrowsRightLeftIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  {t("storeSettings.comparisonToggle", "زر مقارنة المنتجات")}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {t(
                    "storeSettings.comparisonToggleDesc",
                    "إظهار زر المقارنة بين المواصفات",
                  )}
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={storefrontSettings?.comparisonEnabled !== false}
              onChange={(e) => handleToggleComparison(e.target.checked)}
              className="h-5 w-5 rounded border-border text-primary focus:ring-primary cursor-pointer"
            />
          </div>
        </div>
      </div>

      {checkoutFormSettingsLoading && !checkoutFormSettings ? (
        <div className="flex items-center justify-center min-h-[240px] rounded-xl border border-border bg-muted dark:border-border dark:bg-muted">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
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
