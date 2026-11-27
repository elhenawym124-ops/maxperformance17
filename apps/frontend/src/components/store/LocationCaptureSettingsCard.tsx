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
    <section className="space-y-4">
      <div className="flex items-center gap-3.5">
        <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 border border-primary/25">
          <MapPinIcon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h4 className="text-base font-bold text-foreground leading-tight">
            تحديد موقع العميل على الخريطة (GPS & Maps)
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            إتاحة إرسال اللوكيشن كمكمل للعنوان النصي لتسريع المندوب وتقليل المرتجعات
          </p>
        </div>
      </div>

      <div className="bg-card/50 rounded-xl p-5 border border-border space-y-5">
        {/* Status Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-foreground">
            حالة ميزة اللوكيشن
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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
                  className={`rounded-xl border px-3.5 py-2.5 text-xs font-bold transition text-start active:scale-[0.98] disabled:opacity-50 ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-foreground hover:bg-muted/60"
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
            <div className="space-y-2 pt-3 border-t border-border/60">
              <label className="block text-xs font-bold text-foreground">
                طريقة عرض اللوكيشن للعميل
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      className={`rounded-xl border p-3.5 text-start transition active:scale-[0.98] disabled:opacity-50 ${
                        active
                          ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                          : "border-border bg-card hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-xs font-bold ${
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
            <div className="space-y-3 pt-3 border-t border-border/60">
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
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
};

export default LocationCaptureSettingsCard;
