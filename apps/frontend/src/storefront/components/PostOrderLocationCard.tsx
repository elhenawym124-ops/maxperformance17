import React, { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Crosshair,
  ExternalLink,
  Loader2,
  MapPin,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { storefrontApi } from "../../utils/storefrontApi";
import {
  buildGoogleMapsUrl,
  type CustomerLocationData,
  type LocationCaptureSettings,
} from "../utils/locationCaptureSettings";
import {
  CustomerLocationPicker,
  type LocationPickerThemeClasses,
} from "./CustomerLocationPicker";

export interface PostOrderLocationThemeClasses {
  cardSurface?: string;
  modalSurface?: string;
  primaryButton?: string;
  secondaryButton?: string;
  saveButton?: string;
  input?: string;
  iconBadge?: string;
  accentText?: string;
  pickerClasses?: LocationPickerThemeClasses;
}

export interface PostOrderLocationCardProps {
  orderNumber: string;
  customerPhone: string;
  settings: LocationCaptureSettings;
  prefersArabic?: boolean;
  initialLocation?: CustomerLocationData | null;
  showPopup?: boolean;
  themeClasses?: PostOrderLocationThemeClasses;
}

const getDismissKey = (orderNumber: string) =>
  `sf_thankyou_location_popup_dismissed:${orderNumber}`;

export const PostOrderLocationCard: React.FC<PostOrderLocationCardProps> = ({
  orderNumber,
  customerPhone,
  settings,
  prefersArabic = true,
  initialLocation = null,
  showPopup = false,
  themeClasses,
}) => {
  const [selectedLocation, setSelectedLocation] =
    useState<CustomerLocationData | null>(initialLocation);
  const [saving, setSaving] = useState(false);
  const [gpsPopupLoading, setGpsPopupLoading] = useState(false);
  const [savedLocation, setSavedLocation] =
    useState<CustomerLocationData | null>(initialLocation);
  const [phoneInput, setPhoneInput] = useState(customerPhone || "");
  const [popupOpen, setPopupOpen] = useState(false);

  useEffect(() => {
    if (!showPopup || savedLocation || !orderNumber) {
      setPopupOpen(false);
      return;
    }
    try {
      const dismissed =
        typeof window !== "undefined" &&
        window.sessionStorage?.getItem(getDismissKey(orderNumber)) === "1";
      if (!dismissed) {
        setPopupOpen(true);
      }
    } catch {
      setPopupOpen(true);
    }
  }, [orderNumber, savedLocation, showPopup]);

  const dismissPopup = useCallback(() => {
    setPopupOpen(false);
    try {
      if (typeof window !== "undefined" && orderNumber) {
        window.sessionStorage?.setItem(getDismissKey(orderNumber), "1");
      }
    } catch {
      // ignore restricted storage
    }
  }, [orderNumber]);

  const effectivePhone = (customerPhone || phoneInput).trim();

  const persistLocationToOrder = useCallback(
    async (locationToSave: CustomerLocationData): Promise<boolean> => {
      if (!effectivePhone) {
        toast.error(
          prefersArabic
            ? "يرجى إدخال رقم الهاتف المستخدم في الطلب لتأكيد حفظ الموقع."
            : "Please enter the order phone number to save your location.",
        );
        return false;
      }

      setSaving(true);
      try {
        const response = await storefrontApi.updateOrderLocation(orderNumber, {
          phone: effectivePhone,
          lat: locationToSave.lat,
          lng: locationToSave.lng,
          accuracy: locationToSave.accuracy,
          label: locationToSave.label,
          googleMapsUrl: locationToSave.googleMapsUrl,
          source: "post_order",
        });

        if (response?.success) {
          const persisted = response.data?.location || locationToSave;
          setSavedLocation(persisted);
          setPopupOpen(false);
          toast.success(
            prefersArabic
              ? "تم حفظ موقعك وربطه بالطلب لتسريع التوصيل."
              : "Location saved and linked to your order.",
          );
          return true;
        } else {
          toast.error(
            response?.error ||
              (prefersArabic
                ? "تعذر حفظ الموقع الآن. تأكد من رقم الهاتف."
                : "Could not save location right now."),
          );
          return false;
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : prefersArabic
              ? "تعذر حفظ الموقع الآن."
              : "Could not save location right now.";
        toast.error(message);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [effectivePhone, orderNumber, prefersArabic],
  );

  const handlePopupOneClickGps = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error(
        prefersArabic
          ? "متصفحك لا يدعم تحديد الموقع التلقائي. يمكنك التحديد من الخريطة بالأسفل."
          : "Geolocation is not supported. Pick on the map below.",
      );
      return;
    }

    setGpsPopupLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsPopupLoading(false);
        const rLat = Math.round(position.coords.latitude * 1e6) / 1e6;
        const rLng = Math.round(position.coords.longitude * 1e6) / 1e6;
        const nextLoc: CustomerLocationData = {
          lat: rLat,
          lng: rLng,
          accuracy: Math.round(position.coords.accuracy),
          googleMapsUrl: buildGoogleMapsUrl(rLat, rLng),
          source: "post_order",
          capturedAt: new Date().toISOString(),
        };
        setSelectedLocation(nextLoc);
        void persistLocationToOrder(nextLoc);
      },
      (err) => {
        setGpsPopupLoading(false);
        toast.error(
          err.code === err.PERMISSION_DENIED
            ? prefersArabic
              ? "تم رفض إذن الموقع — يمكنك الاختيار من الخريطة أو لصق رابط Google Maps بالأسفل."
              : "Location permission denied — pick on the map or paste a Maps link below."
            : prefersArabic
              ? "تعذر تحديد الموقع الآن. يمكنك التحديد من الخريطة بالأسفل."
              : "Could not detect GPS location. Try the map below.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, [persistLocationToOrder, prefersArabic]);

  if (settings.mode === "disabled" || !orderNumber) {
    return null;
  }

  return (
    <>
      {/* Thank-You Page Location Prompt Pop-up (only when order has no location yet) */}
      {popupOpen && !savedLocation ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-xs sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={
            prefersArabic
              ? "تحديد موقع التوصيل لتسريع وصول طلبك"
              : "Pin delivery location to speed up delivery"
          }
        >
          <div
            className={
              themeClasses?.modalSurface ||
              "w-full max-w-md rounded-t-2xl border border-border bg-card p-5 text-foreground shadow-2xl sm:rounded-2xl space-y-4 text-start"
            }
            style={{
              backgroundColor: "var(--color-card, var(--color-background, #ffffff))",
              color: "var(--color-foreground, #111827)",
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={
                    themeClasses?.iconBadge ||
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
                  }
                >
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {prefersArabic
                      ? "فعّل موقعك ليصل المندوب أسرع"
                      : "Share your location for faster delivery"}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {prefersArabic
                      ? `طلبك #${orderNumber} تم تأكيده! مشاركة اللوكيشن تمنع المكالمات وتوصل المندوب لباب بيتك بدقة.`
                      : `Order #${orderNumber} is confirmed! Sharing your pin helps the courier reach your doorstep faster.`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={dismissPopup}
                aria-label={prefersArabic ? "إغلاق" : "Close"}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted/40 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {!customerPhone ? (
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder={
                  prefersArabic
                    ? "أدخل رقم الهاتف المستخدم في الطلب"
                    : "Enter order phone number"
                }
                dir="ltr"
                className={
                  themeClasses?.input ||
                  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                }
              />
            ) : null}

            <button
              type="button"
              onClick={handlePopupOneClickGps}
              disabled={gpsPopupLoading || saving}
              className={
                themeClasses?.primaryButton ||
                "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60"
              }
            >
              {gpsPopupLoading || saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Crosshair className="h-4 w-4" />
              )}
              <span>
                {gpsPopupLoading
                  ? prefersArabic
                    ? "جارٍ سحب موقعك الحالي..."
                    : "Detecting your location..."
                  : saving
                    ? prefersArabic
                      ? "جارٍ ربط الموقع بالطلب..."
                      : "Linking location to order..."
                    : prefersArabic
                      ? "تفعيل وأخذ موقعي الحالي (GPS)"
                      : "Enable & use my current location"}
              </span>
            </button>

            <CustomerLocationPicker
              settings={{ ...settings, mode: "optional" }}
              forceStyle="map_modal"
              value={selectedLocation}
              onChange={(loc) => {
                setSelectedLocation(loc);
              }}
              prefersArabic={prefersArabic}
              compact
              id="thankyou-popup-location-picker"
              themeClasses={themeClasses?.pickerClasses}
            />

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={dismissPopup}
                className={
                  themeClasses?.secondaryButton ||
                  "rounded-xl border border-border/70 bg-card px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition"
                }
              >
                {prefersArabic ? "تخطي الآن" : "Skip for now"}
              </button>
              {selectedLocation ? (
                <button
                  type="button"
                  onClick={() => void persistLocationToOrder(selectedLocation)}
                  disabled={saving}
                  className={
                    themeClasses?.saveButton ||
                    "rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-60"
                  }
                >
                  {saving
                    ? prefersArabic
                      ? "جارٍ الحفظ..."
                      : "Saving..."
                    : prefersArabic
                      ? "حفظ الموقع على الطلب"
                      : "Save location"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Inline Card on Thank-You Page */}
      <div
        className={
          themeClasses?.cardSurface ||
          "rounded-2xl border border-border/70 bg-card p-4 sm:p-5 text-start shadow-xs space-y-3"
        }
        style={{
          backgroundColor: "var(--color-card, var(--color-background, #ffffff))",
          color: "var(--color-foreground, #111827)",
        }}
      >
        <div className="flex items-start gap-2.5">
          <div
            className={
              themeClasses?.iconBadge ||
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
            }
          >
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
              themeClasses={themeClasses?.pickerClasses}
            />

            {selectedLocation ? (
              <button
                type="button"
                onClick={() => void persistLocationToOrder(selectedLocation)}
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
    </>
  );
};

export default PostOrderLocationCard;
