import React, { useState } from "react";
import { CheckCircle2, ExternalLink, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { storefrontApi } from "../../utils/storefrontApi";
import type {
  CustomerLocationData,
  LocationCaptureSettings,
} from "../utils/locationCaptureSettings";
import { CustomerLocationPicker } from "./CustomerLocationPicker";

export interface PostOrderLocationCardProps {
  orderNumber: string;
  customerPhone: string;
  settings: LocationCaptureSettings;
  prefersArabic?: boolean;
  initialLocation?: CustomerLocationData | null;
}

export const PostOrderLocationCard: React.FC<PostOrderLocationCardProps> = ({
  orderNumber,
  customerPhone,
  settings,
  prefersArabic = true,
  initialLocation = null,
}) => {
  const [selectedLocation, setSelectedLocation] =
    useState<CustomerLocationData | null>(initialLocation);
  const [saving, setSaving] = useState(false);
  const [savedLocation, setSavedLocation] =
    useState<CustomerLocationData | null>(initialLocation);
  const [phoneInput, setPhoneInput] = useState(customerPhone || "");

  if (settings.mode === "disabled" || !orderNumber) {
    return null;
  }

  const effectivePhone = (customerPhone || phoneInput).trim();

  const handleSaveLocation = async () => {
    if (!selectedLocation) return;
    if (!effectivePhone) {
      toast.error(
        prefersArabic
          ? "يرجى إدخال رقم الهاتف المستخدم في الطلب لتأكيد حفظ الموقع."
          : "Please enter the order phone number to save your location.",
      );
      return;
    }

    setSaving(true);
    try {
      const response = await storefrontApi.updateOrderLocation(orderNumber, {
        phone: effectivePhone,
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        accuracy: selectedLocation.accuracy,
        label: selectedLocation.label,
        googleMapsUrl: selectedLocation.googleMapsUrl,
        source: "post_order",
      });

      if (response?.success) {
        const persisted = response.data?.location || selectedLocation;
        setSavedLocation(persisted);
        toast.success(
          prefersArabic
            ? "تم حفظ موقعك وربطه بالطلب لتسريع التوصيل."
            : "Location saved and linked to your order.",
        );
      } else {
        toast.error(
          response?.error ||
            (prefersArabic
              ? "تعذر حفظ الموقع الآن. تأكد من رقم الهاتف."
              : "Could not save location right now."),
        );
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : prefersArabic
            ? "تعذر حفظ الموقع الآن."
            : "Could not save location right now.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 text-start shadow-xs space-y-3">
      <div className="flex items-start gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <MapPin className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm sm:text-base font-bold text-foreground">
            {prefersArabic
              ? "سرّع وصول المندوب — حدد موقعك على الخريطة"
              : "Speed up delivery — pin your location"}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {prefersArabic
              ? "خطوة اختيارية تساعد المندوب يصل لعنوانك بدقة دون مكالمات إضافية."
              : "Optional step so the courier reaches your doorstep faster."}
          </p>
        </div>
      </div>

      {savedLocation ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/25 bg-primary/5 px-3.5 py-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground">
                {prefersArabic ? "تم ربط موقعك بالطلب بنجاح" : "Location linked to order"}
              </p>
              <p className="text-[11px] font-mono tabular-nums text-muted-foreground">
                {savedLocation.lat.toFixed(5)}, {savedLocation.lng.toFixed(5)}
              </p>
            </div>
          </div>
          <a
            href={savedLocation.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted transition"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>{prefersArabic ? "فتح في الخرائط" : "Open Maps"}</span>
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {!customerPhone ? (
            <input
              type="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder={
                prefersArabic
                  ? "أدخل رقم الهاتف المستخدم في الطلب"
                  : "Enter the phone number used in the order"
              }
              dir="ltr"
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          ) : null}

          <CustomerLocationPicker
            settings={{ ...settings, mode: "optional" }}
            forceStyle="map_modal"
            value={selectedLocation}
            onChange={setSelectedLocation}
            prefersArabic={prefersArabic}
            compact
            id="post-order-location-picker"
          />

          {selectedLocation ? (
            <button
              type="button"
              onClick={() => void handleSaveLocation()}
              disabled={saving}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs sm:text-sm font-bold text-primary-foreground transition hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MapPin className="h-4 w-4" />
              )}
              <span>
                {saving
                  ? prefersArabic
                    ? "جارٍ الحفظ..."
                    : "Saving..."
                  : prefersArabic
                    ? "حفظ الموقع على الطلب"
                    : "Save location to order"}
              </span>
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default PostOrderLocationCard;
