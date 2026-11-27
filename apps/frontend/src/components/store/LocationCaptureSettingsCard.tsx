import React from "react";
import { MapPinIcon } from "@heroicons/react/24/outline";
import { ToggleSetting } from "../settings/SettingControls";
import {
  DEFAULT_LOCATION_CAPTURE_SETTINGS,
  LOCATION_CAPTURE_MODE_OPTIONS,
  LOCATION_DISPLAY_STYLE_OPTIONS,
  type LocationCaptureMode,
  type LocationCaptureSettings,
  type LocationDisplayStyle,
} from "../../storefront/utils/locationCaptureSettings";

export interface LocationCaptureSettingsCardProps {
  settings: LocationCaptureSettings;
  onChange: (next: LocationCaptureSettings) => void;
  disabled?: boolean;
}

export const LocationCaptureSettingsCard: React.FC<
  LocationCaptureSettingsCardProps
> = ({ settings, onChange, disabled = false }) => {
  const current = { ...DEFAULT_LOCATION_CAPTURE_SETTINGS, ...settings };
  const isEnabled = current.mode !== "disabled";

  const update = (patch: Partial<LocationCaptureSettings>) => {
    onChange({ ...current, ...patch });
  };

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
      <div className="lg:col-span-4 flex items-start gap-3 pt-1">
        <div className="h-8 w-8 rounded-lg bg-card border border-border/70 shadow-2xs flex items-center justify-center shrink-0">
          <MapPinIcon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-foreground leading-snug">
            تحديد موقع العميل على الخريطة (GPS & Maps)
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            إتاحة إرسال اللوكيشن كمكمل للعنوان النصي لتسريع المندوب وتقليل المرتجعات
          </p>
        </div>
      </div>

      <div className="lg:col-span-8 bg-card border border-border/70 rounded-xl shadow-2xs divide-y divide-border/70 overflow-hidden">
        {/* Status Selector */}
        <div className="px-4 py-3.5 sm:px-5 sm:py-4 space-y-2.5">
          <label className="block text-xs font-semibold text-foreground">
            حالة ميزة اللوكيشن
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {LOCATION_CAPTURE_MODE_OPTIONS.map((opt) => {
              const active = current.mode === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    update({ mode: opt.value as LocationCaptureMode })
                  }
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition text-start active:scale-[0.97] disabled:opacity-50 ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/70 bg-card text-foreground hover:bg-muted/60"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Display Style Cards */}
        {isEnabled ? (
          <>
            <div className="px-4 py-3.5 sm:px-5 sm:py-4 space-y-2.5">
              <label className="block text-xs font-semibold text-foreground">
                طريقة عرض اللوكيشن للعميل
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {LOCATION_DISPLAY_STYLE_OPTIONS.map((opt) => {
                  const active = current.displayStyle === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={disabled}
                      onClick={() =>
                        update({
                          displayStyle: opt.value as LocationDisplayStyle,
                        })
                      }
                      className={`rounded-lg border p-3 text-start transition active:scale-[0.97] disabled:opacity-50 ${
                        active
                          ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                          : "border-border/70 bg-card hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-xs font-semibold ${
                            active ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {opt.label}
                        </span>
                        <span
                          className={`h-3.5 w-3.5 rounded-full border-2 shrink-0 ${
                            active
                              ? "border-primary bg-primary"
                              : "border-border bg-background"
                          }`}
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                        {opt.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Helper Toggles */}
            <div className="px-4 py-3 sm:px-5 sm:py-3.5 space-y-2">
              <ToggleSetting
                label="السماح بلصق رابط Google Maps"
                value={current.allowMapsLinkPaste}
                onChange={(value) => update({ allowMapsLinkPaste: value })}
                disabled={disabled}
              />
              <ToggleSetting
                label="ملء العنوان والمحافظة تلقائياً من الموقع (Reverse Geocoding)"
                value={current.autoFillAddressFromLocation}
                onChange={(value) =>
                  update({ autoFillAddressFromLocation: value })
                }
                disabled={disabled}
              />
              {current.displayStyle !== "post_order" ? (
                <ToggleSetting
                  label="إظهار اللوكيشن داخل نموذج الطلب السريع بصفحة المنتج"
                  value={current.applyToQuickOrder}
                  onChange={(value) => update({ applyToQuickOrder: value })}
                  disabled={disabled}
                />
              ) : null}
              <ToggleSetting
                label="إظهار نافذة تلقائية في صفحة الشكر إذا لم يُرسل العميل موقعه"
                value={current.thankYouPopupEnabled}
                onChange={(value) => update({ thankYouPopupEnabled: value })}
                disabled={disabled}
              />
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
};

export default LocationCaptureSettingsCard;
