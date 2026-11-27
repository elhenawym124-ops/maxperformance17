import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Crosshair,
  ExternalLink,
  Link2,
  Loader2,
  MapPin,
  Map as MapIcon,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { storefrontApi } from "../../utils/storefrontApi";
import {
  buildGoogleMapsUrl,
  parseLocationLinkClient,
  reverseGeocodeNominatim,
  type CustomerLocationData,
  type CustomerLocationSource,
  type LocationCaptureSettings,
} from "../utils/locationCaptureSettings";
import { InteractiveOsmMap } from "./InteractiveOsmMap";

export interface AutoFillAddressPatch {
  address?: string;
  city?: string;
  governorate?: string;
}

export interface CustomerLocationPickerProps {
  settings: LocationCaptureSettings;
  value?: CustomerLocationData | null;
  onChange: (location: CustomerLocationData | null) => void;
  onAddressAutoFill?: (patch: AutoFillAddressPatch) => void;
  prefersArabic?: boolean;
  compact?: boolean;
  forceStyle?: "gps_button" | "map_modal" | "inline_map";
  id?: string;
}

export const CustomerLocationPicker: React.FC<CustomerLocationPickerProps> = ({
  settings,
  value,
  onChange,
  onAddressAutoFill,
  prefersArabic = true,
  compact = false,
  forceStyle,
  id = "checkout-customer-location",
}) => {
  const effectiveStyle = forceStyle || settings.displayStyle;
  const [gpsLoading, setGpsLoading] = useState(false);
  const [linkInput, setLinkInput] = useState("");
  const [linkResolving, setLinkResolving] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [inlineMapReady, setInlineMapReady] = useState(false);
  const [draftCoords, setDraftCoords] = useState<{
    lat: number;
    lng: number;
    source: CustomerLocationSource;
  } | null>(
    value ? { lat: value.lat, lng: value.lng, source: value.source } : null,
  );
  const containerRef = useRef<HTMLDivElement | null>(null);
  const silentAutoAttemptedRef = useRef(false);

  // Lazy-mount inline map when scrolled into view
  useEffect(() => {
    if (effectiveStyle !== "inline_map") return;
    if (inlineMapReady) return;
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setInlineMapReady(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInlineMapReady(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [effectiveStyle, inlineMapReady]);

  const commitLocation = useCallback(
    async (
      lat: number,
      lng: number,
      source: CustomerLocationSource,
      accuracy?: number,
    ) => {
      const rLat = Math.round(lat * 1e6) / 1e6;
      const rLng = Math.round(lng * 1e6) / 1e6;
      const baseLocation: CustomerLocationData = {
        lat: rLat,
        lng: rLng,
        ...(accuracy !== undefined ? { accuracy: Math.round(accuracy) } : {}),
        googleMapsUrl: buildGoogleMapsUrl(rLat, rLng),
        source,
        capturedAt: new Date().toISOString(),
      };
      onChange(baseLocation);

      if (settings.autoFillAddressFromLocation) {
        const geo = await reverseGeocodeNominatim(
          rLat,
          rLng,
          prefersArabic ? "ar" : "en",
        );
        if (geo) {
          onChange({
            ...baseLocation,
            label:
              geo.formattedAddress ||
              [geo.city, geo.governorateAr].filter(Boolean).join("، ") ||
              undefined,
          });
          onAddressAutoFill?.({
            address: geo.formattedAddress || undefined,
            city: geo.city || undefined,
            governorate: geo.governorate || undefined,
          });
        }
      }
    },
    [onAddressAutoFill, onChange, prefersArabic, settings.autoFillAddressFromLocation],
  );

  // Silent auto-capture ONLY when the browser already has 'granted' geolocation permission
  useEffect(() => {
    if (silentAutoAttemptedRef.current) return;
    if (value) return;
    if (settings.mode === "disabled" || effectiveStyle === "post_order") return;
    if (typeof navigator === "undefined" || !navigator.geolocation || !navigator.permissions?.query) {
      return;
    }

    silentAutoAttemptedRef.current = true;
    let cancelled = false;
    navigator.permissions
      .query({ name: "geolocation" })
      .then((status) => {
        if (cancelled || status.state !== "granted") return;
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (cancelled) return;
            const { latitude, longitude, accuracy } = position.coords;
            setDraftCoords({ lat: latitude, lng: longitude, source: "gps" });
            void commitLocation(latitude, longitude, "gps", accuracy);
          },
          () => {
            // Silent failure — customer still sees the normal picker controls
          },
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 120000 },
        );
      })
      .catch(() => {
        // Permissions API unsupported — keep manual controls
      });

    return () => {
      cancelled = true;
    };
  }, [commitLocation, effectiveStyle, settings.mode, value]);

  const handleRequestGps = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error(
        prefersArabic
          ? "متصفحك لا يدعم تحديد الموقع تلقائياً. يمكنك الاختيار من الخريطة أو لصق رابط Google Maps."
          : "Geolocation is not supported in this browser.",
      );
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLoading(false);
        const { latitude, longitude, accuracy } = position.coords;
        setDraftCoords({ lat: latitude, lng: longitude, source: "gps" });
        void commitLocation(latitude, longitude, "gps", accuracy);
        toast.success(
          prefersArabic ? "تم تحديد موقعك بنجاح" : "Location captured successfully",
        );
      },
      (err) => {
        setGpsLoading(false);
        const msg =
          err.code === err.PERMISSION_DENIED
            ? prefersArabic
              ? "تم رفض إذن الموقع. يمكنك التحديد من الخريطة أو لصق رابط Google Maps."
              : "Location permission denied. Pick on map or paste a Maps link."
            : prefersArabic
              ? "تعذر تحديد الموقع الآن. حاول مرة أخرى أو اختر من الخريطة."
              : "Could not get GPS position. Try again or pick on map.";
        toast.error(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, [commitLocation, prefersArabic]);

  const handleResolveMapsLink = useCallback(async () => {
    const raw = linkInput.trim();
    if (!raw) return;

    const direct = parseLocationLinkClient(raw);
    if (direct) {
      setDraftCoords({ lat: direct.lat, lng: direct.lng, source: "maps_link" });
      await commitLocation(direct.lat, direct.lng, "maps_link");
      setLinkInput("");
      setShowLinkInput(false);
      toast.success(
        prefersArabic ? "تم استخراج الموقع من الرابط بنجاح" : "Location extracted from link",
      );
      return;
    }

    setLinkResolving(true);
    try {
      const response = await storefrontApi.resolveLocationLink(raw);
      if (response?.success && response?.data?.lat && response?.data?.lng) {
        const lat = Number(response.data.lat);
        const lng = Number(response.data.lng);
        setDraftCoords({ lat, lng, source: "maps_link" });
        await commitLocation(lat, lng, "maps_link");
        setLinkInput("");
        setShowLinkInput(false);
        toast.success(
          prefersArabic ? "تم استخراج الموقع من الرابط بنجاح" : "Location extracted from link",
        );
      } else {
        toast.error(
          prefersArabic
            ? "لم نتمكن من قراءة الإحداثيات من هذا الرابط. تأكد أنه رابط Google Maps صحيح."
            : "Could not extract coordinates from that link.",
        );
      }
    } catch {
      toast.error(
        prefersArabic
          ? "تعذر فك الرابط الآن. جرّب تحديد موقعك من الخريطة."
          : "Could not resolve the Maps link right now.",
      );
    } finally {
      setLinkResolving(false);
    }
  }, [commitLocation, linkInput, prefersArabic]);

  if (settings.mode === "disabled" || effectiveStyle === "post_order") {
    return null;
  }

  const isRequired = settings.mode === "required";

  return (
    <div
      id={id}
      ref={containerRef}
      tabIndex={-1}
      className={`space-y-2.5 rounded-xl border border-border/70 bg-muted/20 ${
        compact ? "p-3" : "p-3.5"
      }`}
    >
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
          <MapPin className="h-4 w-4 text-primary shrink-0" />
          <span>
            {prefersArabic ? "موقع التوصيل على الخريطة" : "Delivery Map Location"}
          </span>
          {isRequired ? (
            <span className="text-destructive font-bold">*</span>
          ) : (
            <span className="text-[11px] font-normal text-muted-foreground">
              {prefersArabic ? "(اختياري)" : "(Optional)"}
            </span>
          )}
        </div>

        {value ? (
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setDraftCoords(null);
            }}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-destructive transition"
          >
            <X className="h-3.5 w-3.5" />
            <span>{prefersArabic ? "إزالة" : "Remove"}</span>
          </button>
        ) : null}
      </div>

      {/* Captured Location Summary Pill */}
      {value ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2">
          <div className="flex items-start gap-2 min-w-0 flex-1">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">
                {value.label ||
                  (prefersArabic ? "تم تحديد الموقع بنجاح" : "Location pinned")}
              </p>
              <p className="text-[11px] font-mono tabular-nums text-muted-foreground">
                {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
              </p>
            </div>
          </div>
          <a
            href={value.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-card px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-muted transition shrink-0"
          >
            <ExternalLink className="h-3 w-3" />
            <span>{prefersArabic ? "معاينة" : "Preview"}</span>
          </a>
        </div>
      ) : null}

      {/* Mode 1: One-Click GPS Button */}
      {effectiveStyle === "gps_button" ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRequestGps}
            disabled={gpsLoading}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-xs transition hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60"
          >
            {gpsLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Crosshair className="h-3.5 w-3.5" />
            )}
            <span>
              {gpsLoading
                ? prefersArabic
                  ? "جارٍ تحديد موقعك..."
                  : "Locating..."
                : value
                  ? prefersArabic
                    ? "تحديث موقعي الحالي"
                    : "Refresh GPS location"
                  : prefersArabic
                    ? "استخدم موقعي الحالي"
                    : "Use my current location"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMapModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border/70 bg-card px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted active:scale-[0.98]"
          >
            <MapIcon className="h-3.5 w-3.5 text-primary" />
            <span>{prefersArabic ? "تعديل على الخريطة" : "Adjust on map"}</span>
          </button>
        </div>
      ) : null}

      {/* Mode 2: Button Opening Interactive Map Modal */}
      {effectiveStyle === "map_modal" ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setMapModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-xs transition hover:bg-primary/90 active:scale-[0.98]"
          >
            <MapIcon className="h-3.5 w-3.5" />
            <span>
              {value
                ? prefersArabic
                  ? "تغيير الموقع على الخريطة"
                  : "Change pin on map"
                : prefersArabic
                  ? "تحديد الموقع على الخريطة"
                  : "Pick location on map"}
            </span>
          </button>

          <button
            type="button"
            onClick={handleRequestGps}
            disabled={gpsLoading}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border/70 bg-card px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted active:scale-[0.98] disabled:opacity-60"
          >
            {gpsLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Crosshair className="h-3.5 w-3.5 text-primary" />
            )}
            <span>{prefersArabic ? "موقعي الحالي" : "Current GPS"}</span>
          </button>
        </div>
      ) : null}

      {/* Mode 3: Ready Inline Map */}
      {effectiveStyle === "inline_map" ? (
        inlineMapReady ? (
          <InteractiveOsmMap
            lat={value?.lat ?? draftCoords?.lat}
            lng={value?.lng ?? draftCoords?.lng}
            onRequestGps={handleRequestGps}
            gpsLoading={gpsLoading}
            prefersArabic={prefersArabic}
            heightClassName={compact ? "h-48" : "h-56 sm:h-64"}
            onSelect={(coords) => {
              setDraftCoords(coords);
              void commitLocation(coords.lat, coords.lng, coords.source);
            }}
          />
        ) : (
          <div className="h-48 w-full animate-pulse rounded-xl bg-muted/60" />
        )
      ) : null}

      {/* Optional Google Maps Link Paste */}
      {settings.allowMapsLinkPaste ? (
        <div className="pt-0.5">
          {!showLinkInput ? (
            <button
              type="button"
              onClick={() => setShowLinkInput(true)}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:underline"
            >
              <Link2 className="h-3.5 w-3.5" />
              <span>
                {prefersArabic
                  ? "أو الصق رابط الموقع من Google Maps"
                  : "Or paste a Google Maps link"}
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <input
                type="url"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleResolveMapsLink();
                  }
                }}
                dir="ltr"
                placeholder="https://maps.app.goo.gl/..."
                className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={() => void handleResolveMapsLink()}
                disabled={linkResolving || !linkInput.trim()}
                className="inline-flex h-8 shrink-0 items-center justify-center rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
              >
                {linkResolving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : prefersArabic ? (
                  "اعتماد"
                ) : (
                  "Apply"
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLinkInput(false);
                  setLinkInput("");
                }}
                aria-label={prefersArabic ? "إغلاق" : "Close"}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      ) : null}

      {/* Map Modal / Bottom Sheet */}
      {mapModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={prefersArabic ? "تحديد الموقع على الخريطة" : "Pick location on map"}
        >
          <div className="w-full max-w-lg rounded-t-2xl border border-border bg-card p-4 shadow-2xl sm:rounded-2xl space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2.5">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span>
                  {prefersArabic ? "حدد موقعك على الخريطة" : "Pin your location"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMapModalOpen(false)}
                aria-label={prefersArabic ? "إغلاق" : "Close"}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 bg-muted/40 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <InteractiveOsmMap
              lat={draftCoords?.lat ?? value?.lat}
              lng={draftCoords?.lng ?? value?.lng}
              onRequestGps={handleRequestGps}
              gpsLoading={gpsLoading}
              prefersArabic={prefersArabic}
              heightClassName="h-64 sm:h-72"
              onSelect={(coords) => {
                setDraftCoords(coords);
              }}
            />

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setMapModalOpen(false)}
                className="rounded-xl border border-border/70 bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition"
              >
                {prefersArabic ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = draftCoords || (value ? { lat: value.lat, lng: value.lng, source: value.source } : { lat: 30.0444, lng: 31.2357, source: "map_pin" as const });
                  void commitLocation(target.lat, target.lng, target.source);
                  setMapModalOpen(false);
                }}
                className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition active:scale-[0.98]"
              >
                {prefersArabic ? "تأكيد الموقع" : "Confirm location"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default CustomerLocationPicker;
