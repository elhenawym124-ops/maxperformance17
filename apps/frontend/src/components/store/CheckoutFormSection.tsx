import React from "react";
import {
  UserIcon,
  MapPinIcon,
  PlusIcon,
  SparklesIcon,
  Squares2X2Icon,
  CheckBadgeIcon
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { getDirection } from "../../i18n";
import { CheckoutFormSettings } from "../../services/checkoutFormSettingsService";
import { SelectSetting, ToggleSetting } from "../settings/SettingControls";
import {
  DEFAULT_PDP_QUICK_ORDER_SETTINGS,
  PDP_QUICK_ORDER_PLACEMENT_OPTIONS,
  PdpQuickOrderFieldKey,
  PdpQuickOrderSettings,
  PDP_QUICK_ORDER_SURFACE_MODE_OPTIONS,
} from "../../storefront/utils/pdpQuickOrderSettings";
import { LocationCaptureSettingsCard } from "./LocationCaptureSettingsCard";
import type { LocationCaptureSettings } from "../../storefront/utils/locationCaptureSettings";

interface CheckoutFormSectionProps {
  settings: Partial<CheckoutFormSettings>;
  onChange: (settings: Partial<CheckoutFormSettings>) => void;
  onSave: () => void;
  onReset: () => void;
  loading?: boolean;
  showLocalSave?: boolean;
  productPageCheckoutEnabled?: boolean;
  onProductPageCheckoutToggle?: (enabled: boolean) => void;
  pdpQuickOrderSettings?: PdpQuickOrderSettings;
  onPdpQuickOrderSettingsChange?: (settings: PdpQuickOrderSettings) => void;
  locationCaptureSettings?: LocationCaptureSettings;
  onLocationCaptureSettingsChange?: (settings: LocationCaptureSettings) => void;
}

export const CheckoutFormSection: React.FC<CheckoutFormSectionProps> = ({
  settings,
  onChange,
  onSave,
  onReset,
  loading = false,
  showLocalSave = true,
  productPageCheckoutEnabled,
  onProductPageCheckoutToggle,
  pdpQuickOrderSettings,
  onPdpQuickOrderSettingsChange,
  locationCaptureSettings,
  onLocationCaptureSettingsChange,
}) => {
  const { t } = useTranslation();
  const handleToggle = (field: keyof CheckoutFormSettings, value: boolean) => {
    onChange({ ...settings, [field]: value });
  };

  const handleQuickOrderFieldToggle = (
    fieldKey: PdpQuickOrderFieldKey,
    settingKey: "enabled" | "required",
    value: boolean,
  ) => {
    if (!pdpQuickOrderSettings || !onPdpQuickOrderSettingsChange) {
      return;
    }

    const currentField =
      pdpQuickOrderSettings.fields?.[fieldKey] ||
      DEFAULT_PDP_QUICK_ORDER_SETTINGS.fields[fieldKey] ||
      { enabled: true, required: true };
    const nextField = {
      ...currentField,
      [settingKey]: value,
    };

    if (settingKey === "enabled" && !value) {
      nextField.required = false;
    }

    onPdpQuickOrderSettingsChange({
      ...pdpQuickOrderSettings,
      fields: {
        ...(pdpQuickOrderSettings.fields || {}),
        [fieldKey]: nextField,
      },
    });
  };

  const handleQuickOrderCustomFieldChange = (
    key: "enabled" | "required" | "label" | "placeholder",
    value: boolean | string,
  ) => {
    if (!pdpQuickOrderSettings || !onPdpQuickOrderSettingsChange) {
      return;
    }

    const currentCustomField =
      pdpQuickOrderSettings.customField ||
      DEFAULT_PDP_QUICK_ORDER_SETTINGS.customField ||
      {
        enabled: false,
        required: false,
        label: "نوع وموديل وسنة صنع السيارة / مواصفات خاصة",
        placeholder: "اكتب المواصفات هنا...",
      };

    const nextCustomField = {
      ...currentCustomField,
      [key]: value,
    };

    if (key === "enabled" && !value) {
      nextCustomField.required = false;
    }

    onPdpQuickOrderSettingsChange({
      ...pdpQuickOrderSettings,
      customField: nextCustomField,
    });
  };

  const AnnotatedSection = ({
    icon: Icon,
    title,
    description,
    children,
  }: {
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    title: string;
    description: string;
    children: React.ReactNode;
  }) => (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
      <div className="lg:col-span-4 flex items-start gap-3 pt-1">
        <div className="h-8 w-8 rounded-lg bg-card border border-border/70 shadow-2xs flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-foreground leading-snug">
            {title}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      <div className="lg:col-span-8 bg-card border border-border/70 rounded-xl shadow-2xs divide-y divide-border/70 overflow-hidden">
        {children}
      </div>
    </section>
  );

  const QuickOrderSettingRow = ({
    label,
    fieldKey,
    description,
  }: {
    label: string;
    fieldKey: PdpQuickOrderFieldKey;
    description: string;
  }) => {
    if (!pdpQuickOrderSettings) {
      return null;
    }

    const fieldSettings =
      pdpQuickOrderSettings.fields?.[fieldKey] ||
      DEFAULT_PDP_QUICK_ORDER_SETTINGS.fields[fieldKey] ||
      { enabled: true, required: true };

    return (
      <div className="px-4 py-3.5 sm:px-5 sm:py-4 hover:bg-muted/30 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-foreground">
                {label}
              </span>
              {fieldSettings.enabled && fieldSettings.required ? (
                <span className="px-2 py-0.5 text-[10px] bg-destructive/10 text-destructive rounded-md font-semibold">
                  {t("storeCheckout.required")}
                </span>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>

          <div className="flex items-center gap-4 sm:gap-5 shrink-0">
            <ToggleSetting
              label={t("storeCheckout.enable")}
              value={fieldSettings.enabled ?? false}
              onChange={(value) =>
                handleQuickOrderFieldToggle(fieldKey, "enabled", value)
              }
              disabled={loading}
            />

            {fieldSettings.enabled ? (
              <>
                <div className="w-px h-5 bg-border/70" />
                <ToggleSetting
                  label={t("storeCheckout.mandatory")}
                  value={fieldSettings.required ?? false}
                  onChange={(value) =>
                    handleQuickOrderFieldToggle(fieldKey, "required", value)
                  }
                  disabled={loading}
                />
              </>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  const SettingRow = ({
    label,
    showKey,
    requireKey,
    description,
  }: {
    label: string;
    showKey: keyof CheckoutFormSettings;
    requireKey?: keyof CheckoutFormSettings;
    description: string;
  }) => (
    <div className="px-4 py-3.5 sm:px-5 sm:py-4 hover:bg-muted/30 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-foreground">{label}</span>
            {settings[showKey] && settings[requireKey!] && (
              <span className="px-2 py-0.5 text-[10px] bg-destructive/10 text-destructive rounded-md font-semibold">
                {t("storeCheckout.required")}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>

        <div className="flex items-center gap-4 sm:gap-5 shrink-0">
          <ToggleSetting
            label={t("storeCheckout.enable")}
            value={settings[showKey] as boolean}
            onChange={(val) => handleToggle(showKey, val)}
          />

          {requireKey && settings[showKey] && (
            <>
              <div className="w-px h-5 bg-border/70" />
              <ToggleSetting
                label={t("storeCheckout.mandatory")}
                value={settings[requireKey] as boolean}
                onChange={(val) => handleToggle(requireKey, val)}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6" dir={getDirection()}>
      {typeof productPageCheckoutEnabled === "boolean" &&
      onProductPageCheckoutToggle ? (
        <AnnotatedSection
          icon={SparklesIcon}
          title={t("storeCheckout.integrationTitle")}
          description={t("storeCheckout.integrationDesc")}
        >
          <div className="px-4 py-3.5 sm:px-5 sm:py-4 hover:bg-muted/30 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground">
                  {t("storeCheckout.enableCheckoutFormLabel")}
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("storeCheckout.enableCheckoutFormHelp")}
                </p>
              </div>

              <div className="shrink-0">
                <ToggleSetting
                  label={t("storeCheckout.enable")}
                  value={productPageCheckoutEnabled}
                  onChange={onProductPageCheckoutToggle}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        </AnnotatedSection>
      ) : null}

      {pdpQuickOrderSettings && onPdpQuickOrderSettingsChange ? (
        <>
          <AnnotatedSection
            icon={Squares2X2Icon}
            title={t("storeCheckout.formOrderTitle")}
            description={t("storeCheckout.formOrderDesc")}
          >
            <div className="grid gap-4 sm:grid-cols-2 px-4 py-4 sm:px-5">
              <div>
                <SelectSetting
                  label={t("storeCheckout.formOrderPlacement")}
                  value={pdpQuickOrderSettings.placement}
                  onChange={(value) =>
                    onPdpQuickOrderSettingsChange({
                      ...pdpQuickOrderSettings,
                      placement:
                        value === "before-description"
                          ? "before-description"
                          : "after-description",
                    })
                  }
                  options={PDP_QUICK_ORDER_PLACEMENT_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                  disabled={loading}
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {t("storeCheckout.formOrderPlacementDesc")}
                </p>
              </div>

              <div>
                <SelectSetting
                  label={t("storeCheckout.formOrderSurfaceMode")}
                  value={pdpQuickOrderSettings.surfaceMode}
                  onChange={(value) =>
                    onPdpQuickOrderSettingsChange({
                      ...pdpQuickOrderSettings,
                      surfaceMode:
                        value === "merged-buybox"
                          ? "merged-buybox"
                          : "standalone",
                    })
                  }
                  options={PDP_QUICK_ORDER_SURFACE_MODE_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                  disabled={loading}
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {t("storeCheckout.formOrderSurfaceModeDesc")}
                </p>
              </div>
            </div>

            <div className="px-4 py-3 sm:px-5 sm:py-3.5 space-y-2">
              <ToggleSetting
                label={t("storeCheckout.showQuantity")}
                value={pdpQuickOrderSettings.showQuantity ?? true}
                onChange={(value) =>
                  onPdpQuickOrderSettingsChange({
                    ...pdpQuickOrderSettings,
                    showQuantity: value,
                  })
                }
                disabled={loading}
              />
              <ToggleSetting
                label={t("storeCheckout.showOrderSummary")}
                value={pdpQuickOrderSettings.showOrderSummary ?? true}
                onChange={(value) =>
                  onPdpQuickOrderSettingsChange({
                    ...pdpQuickOrderSettings,
                    showOrderSummary: value,
                  })
                }
                disabled={loading}
              />
              <ToggleSetting
                label={t("storeCheckout.autoSelectVariants")}
                value={pdpQuickOrderSettings.autoSelectVariants ?? true}
                onChange={(value) =>
                  onPdpQuickOrderSettingsChange({
                    ...pdpQuickOrderSettings,
                    autoSelectVariants: value,
                  })
                }
                disabled={loading}
              />
            </div>
          </AnnotatedSection>

          <AnnotatedSection
            icon={SparklesIcon}
            title={t("storeCheckout.formFieldsTitle")}
            description={t("storeCheckout.formFieldsDesc")}
          >
            <QuickOrderSettingRow
              label={t("storeCheckout.pdpFullName")}
              fieldKey="fullName"
              description={t("storeCheckout.pdpFullNameDesc")}
            />
            <QuickOrderSettingRow
              label={t("storeCheckout.pdpPhone")}
              fieldKey="phone"
              description={t("storeCheckout.pdpPhoneDesc")}
            />
            <QuickOrderSettingRow
              label={t("storeCheckout.pdpGovernorate")}
              fieldKey="governorate"
              description={t("storeCheckout.pdpGovernorateDesc")}
            />
            <QuickOrderSettingRow
              label={t("storeCheckout.pdpAddress")}
              fieldKey="address"
              description={t("storeCheckout.pdpAddressDesc")}
            />
            <QuickOrderSettingRow
              label={t("storeCheckout.pdpAlternatePhone")}
              fieldKey="alternatePhone"
              description={t("storeCheckout.pdpAlternatePhoneDesc")}
            />

            <div className="px-4 py-3.5 sm:px-5 sm:py-4 hover:bg-muted/30 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">
                      {pdpQuickOrderSettings?.customField?.label ||
                        "حقل مخصص عام (مثل: نوع وموديل السيارة)"}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] bg-primary/10 text-primary rounded-md font-semibold">
                      على مستوى المتجر
                    </span>
                    {pdpQuickOrderSettings?.customField?.enabled &&
                    pdpQuickOrderSettings?.customField?.required ? (
                      <span className="px-2 py-0.5 text-[10px] bg-destructive/10 text-destructive rounded-md font-semibold">
                        {t("storeCheckout.required")}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    حقل مخصص إضافي يظهر في نموذج الطلب السريع لجمع مواصفات إضافية من العميل (مثل موديل وسنة صنع السيارة).
                  </p>
                </div>

                <div className="flex items-center gap-4 sm:gap-5 shrink-0">
                  <ToggleSetting
                    label={t("storeCheckout.enable")}
                    value={pdpQuickOrderSettings?.customField?.enabled ?? false}
                    onChange={(value) =>
                      handleQuickOrderCustomFieldChange("enabled", value)
                    }
                    disabled={loading}
                  />

                  {pdpQuickOrderSettings?.customField?.enabled ? (
                    <>
                      <div className="w-px h-5 bg-border/70" />
                      <ToggleSetting
                        label={t("storeCheckout.mandatory")}
                        value={
                          pdpQuickOrderSettings?.customField?.required ?? false
                        }
                        onChange={(value) =>
                          handleQuickOrderCustomFieldChange("required", value)
                        }
                        disabled={loading}
                      />
                    </>
                  ) : null}
                </div>
              </div>

              {pdpQuickOrderSettings?.customField?.enabled && (
                <div className="mt-3.5 pt-3.5 border-t border-border/70 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      تسمية الحقل (عنوان الحقل الظاهر للعميل)
                    </label>
                    <input
                      type="text"
                      value={pdpQuickOrderSettings?.customField?.label ?? ""}
                      onChange={(e) =>
                        handleQuickOrderCustomFieldChange("label", e.target.value)
                      }
                      placeholder="مثال: نوع وموديل وسنة صنع السيارة"
                      className="w-full text-xs rounded-lg border border-border/70 bg-background px-3 py-2 text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      نص توضيحي داخل الحقل (Placeholder)
                    </label>
                    <input
                      type="text"
                      value={
                        pdpQuickOrderSettings?.customField?.placeholder ?? ""
                      }
                      onChange={(e) =>
                        handleQuickOrderCustomFieldChange(
                          "placeholder",
                          e.target.value,
                        )
                      }
                      placeholder="مثال: اكتب موديل وسنة صنع السيارة..."
                      className="w-full text-xs rounded-lg border border-border/70 bg-background px-3 py-2 text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      disabled={loading}
                    />
                  </div>
                </div>
              )}
            </div>
          </AnnotatedSection>
        </>
      ) : null}

      {/* Customer Info Section */}
      <AnnotatedSection
        icon={UserIcon}
        title={t("storeCheckout.checkoutFullFieldsTitle")}
        description={t("storeCheckout.checkoutFullFieldsDesc")}
      >
        <SettingRow
          label={t("storeCheckout.fullName")}
          showKey="showGuestName"
          requireKey="requireGuestName"
          description={t("storeCheckout.fullNameDesc")}
        />
        <SettingRow
          label={t("storeCheckout.phoneNumber")}
          showKey="showGuestPhone"
          requireKey="requireGuestPhone"
          description={t("storeCheckout.phoneNumberDesc")}
        />
        <SettingRow
          label={t("storeCheckout.email")}
          showKey="showGuestEmail"
          requireKey="requireGuestEmail"
          description={t("storeCheckout.emailDesc")}
        />
      </AnnotatedSection>

      {/* Shipping Address Section */}
      <AnnotatedSection
        icon={MapPinIcon}
        title={t("storeCheckout.shippingTitle")}
        description={t("storeCheckout.shippingDesc")}
      >
        <SettingRow
          label={t("storeCheckout.city")}
          showKey="showCity"
          requireKey="requireCity"
          description={t("storeCheckout.cityDesc")}
        />
        <SettingRow
          label={t("storeCheckout.address")}
          showKey="showShippingAddress"
          requireKey="requireShippingAddress"
          description={t("storeCheckout.addressDesc")}
        />
      </AnnotatedSection>

      {locationCaptureSettings && onLocationCaptureSettingsChange ? (
        <LocationCaptureSettingsCard
          settings={locationCaptureSettings}
          onChange={onLocationCaptureSettingsChange}
          disabled={loading}
        />
      ) : null}

      {/* Additional Fields Section */}
      <AnnotatedSection
        icon={PlusIcon}
        title={t("storeCheckout.additionalTitle")}
        description={t("storeCheckout.additionalDesc")}
      >
        <SettingRow
          label={t("storeCheckout.paymentMethod")}
          showKey="showPaymentMethod"
          description={t("storeCheckout.paymentMethodDesc")}
        />
        <SettingRow
          label={t("storeCheckout.notes")}
          showKey="showNotes"
          description={t("storeCheckout.notesDesc")}
        />
      </AnnotatedSection>

      {showLocalSave && (
        <div className="sticky bottom-3 z-20 bg-card border border-border/70 rounded-xl shadow-sm px-4 py-3 sm:px-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-7 w-7 bg-primary/10 text-primary rounded-lg flex items-center justify-center shrink-0">
              <CheckBadgeIcon className="h-4 w-4" />
            </div>
            <p className="text-xs font-medium text-muted-foreground">
              {t("storeCheckout.simplicityTip")}
            </p>
          </div>
          <div className="flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onReset}
              disabled={loading}
              className="px-3.5 py-2 rounded-lg border border-border/70 bg-card text-foreground text-xs font-semibold hover:bg-muted/60 transition active:scale-[0.97] disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
            >
              {t("storeCheckout.reset")}
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={loading}
              className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:opacity-95 transition active:scale-[0.97] disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
            >
              {loading ? t("storeCheckout.saving") : t("storeCheckout.save")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
