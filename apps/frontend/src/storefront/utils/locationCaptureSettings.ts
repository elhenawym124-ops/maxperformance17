import { EGYPT_GOVERNORATES } from "../../constants/egyptGovernorates";

export type LocationCaptureMode = "disabled" | "optional" | "required";

export type LocationDisplayStyle =
  | "gps_button"
  | "map_modal"
  | "inline_map"
  | "post_order";

export type CustomerLocationSource =
  | "gps"
  | "map_pin"
  | "maps_link"
  | "post_order"
  | "search";

export interface CustomerLocationData {
  lat: number;
  lng: number;
  accuracy?: number;
  googleMapsUrl: string;
  label?: string;
  source: CustomerLocationSource;
  capturedAt?: string;
}

export interface LocationCaptureSettings {
  mode: LocationCaptureMode;
  displayStyle: LocationDisplayStyle;
  allowMapsLinkPaste: boolean;
  autoFillAddressFromLocation: boolean;
  applyToQuickOrder: boolean;
  thankYouPopupEnabled: boolean;
}

export const DEFAULT_LOCATION_CAPTURE_SETTINGS: LocationCaptureSettings = {
  mode: "optional",
  displayStyle: "gps_button",
  allowMapsLinkPaste: true,
  autoFillAddressFromLocation: true,
  applyToQuickOrder: true,
  thankYouPopupEnabled: true,
};

export const LOCATION_CAPTURE_MODE_OPTIONS = [
  { value: "disabled", label: "معطّل" },
  { value: "optional", label: "اختياري (مُوصى به)" },
  { value: "required", label: "إجباري" },
] as const;

export const LOCATION_DISPLAY_STYLE_OPTIONS = [
  {
    value: "gps_button",
    label: "زر سحب فوري (GPS)",
    description: "زر خفيف يسحب الموقع الحالي بضغطة واحدة بدون زحمة في الفورم.",
  },
  {
    value: "map_modal",
    label: "زر يفتح خريطة (Popup / Bottom Sheet)",
    description: "الشيك أوت يظل سريعاً، وتفتح خريطة تفاعلية بدبوس قابل للسحب عند الطلب.",
  },
  {
    value: "inline_map",
    label: "خريطة جاهزة داخل الفورم (Inline Map)",
    description: "خريطة مدمجة مباشرة في قسم العنوان (مثالي للتوصيل الفوري والمطاعم).",
  },
  {
    value: "post_order",
    label: "في صفحة الشكر بعد الطلب (Post-Order)",
    description: "أعلى معدل تحويل: يتم إتمام الطلب أولاً ثم يعرض تحديد الموقع لتسريع المندوب.",
  },
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export const normalizeLocationCaptureSettings = (
  value: unknown,
): LocationCaptureSettings => {
  const candidate = isRecord(value) ? value : {};
  const rawMode = candidate["mode"];
  const mode: LocationCaptureMode =
    rawMode === "optional" || rawMode === "required" || rawMode === "disabled"
      ? rawMode
      : DEFAULT_LOCATION_CAPTURE_SETTINGS.mode;

  const rawStyle = candidate["displayStyle"];
  const displayStyle: LocationDisplayStyle =
    rawStyle === "gps_button" ||
    rawStyle === "map_modal" ||
    rawStyle === "inline_map" ||
    rawStyle === "post_order"
      ? rawStyle
      : DEFAULT_LOCATION_CAPTURE_SETTINGS.displayStyle;

  return {
    mode,
    displayStyle,
    allowMapsLinkPaste:
      typeof candidate["allowMapsLinkPaste"] === "boolean"
        ? candidate["allowMapsLinkPaste"]
        : DEFAULT_LOCATION_CAPTURE_SETTINGS.allowMapsLinkPaste,
    autoFillAddressFromLocation:
      typeof candidate["autoFillAddressFromLocation"] === "boolean"
        ? candidate["autoFillAddressFromLocation"]
        : DEFAULT_LOCATION_CAPTURE_SETTINGS.autoFillAddressFromLocation,
    applyToQuickOrder:
      typeof candidate["applyToQuickOrder"] === "boolean"
        ? candidate["applyToQuickOrder"]
        : DEFAULT_LOCATION_CAPTURE_SETTINGS.applyToQuickOrder,
    thankYouPopupEnabled:
      typeof candidate["thankYouPopupEnabled"] === "boolean"
        ? candidate["thankYouPopupEnabled"]
        : DEFAULT_LOCATION_CAPTURE_SETTINGS.thankYouPopupEnabled,
  };
};

export const getLocationCaptureSettingsFromDesignTokens = (
  designTokens: unknown,
): LocationCaptureSettings => {
  if (!isRecord(designTokens)) {
    return DEFAULT_LOCATION_CAPTURE_SETTINGS;
  }
  return normalizeLocationCaptureSettings(designTokens["locationCapture"]);
};

export const resolveLocationCaptureSettingsFromStorefront = (
  storefrontSettings: unknown,
): LocationCaptureSettings => {
  if (!isRecord(storefrontSettings)) {
    return DEFAULT_LOCATION_CAPTURE_SETTINGS;
  }

  const nestedStorefrontSettings = isRecord(storefrontSettings["storefrontSettings"])
    ? storefrontSettings["storefrontSettings"]
    : null;
  const nestedStorefront = isRecord(storefrontSettings["storefront"])
    ? storefrontSettings["storefront"]
    : null;
  const nestedStorefrontInner =
    nestedStorefront && isRecord(nestedStorefront["settings"])
      ? nestedStorefront["settings"]
      : null;

  const tokenSources = [
    nestedStorefrontSettings?.["designTokens"],
    nestedStorefront?.["designTokens"],
    nestedStorefrontInner?.["designTokens"],
    storefrontSettings["designTokens"],
  ];

  for (const tokens of tokenSources) {
    if (isRecord(tokens) && isRecord(tokens["locationCapture"])) {
      return normalizeLocationCaptureSettings(tokens["locationCapture"]);
    }
  }

  return DEFAULT_LOCATION_CAPTURE_SETTINGS;
};

export const upsertLocationCaptureSettingsInDesignTokens = (
  designTokens: unknown,
  settings: unknown,
): Record<string, unknown> => {
  const nextDesignTokens = isRecord(designTokens) ? { ...designTokens } : {};
  return {
    ...nextDesignTokens,
    locationCapture: normalizeLocationCaptureSettings(settings),
  };
};

export const buildGoogleMapsUrl = (lat: number, lng: number): string => {
  const rLat = Math.round(lat * 1e6) / 1e6;
  const rLng = Math.round(lng * 1e6) / 1e6;
  return `https://www.google.com/maps?q=${rLat},${rLng}`;
};

export const isValidCoordinatePair = (lat: number, lng: number): boolean =>
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  lat >= -90 &&
  lat <= 90 &&
  lng >= -180 &&
  lng <= 180 &&
  !(lat === 0 && lng === 0);

/**
 * Client-side extraction of lat/lng from full Google Maps URLs or "lat, lng" text.
 * Shortened links (maps.app.goo.gl / goo.gl) are sent to backend `/orders/resolve-location-link`.
 */
export const parseLocationLinkClient = (
  rawInput: string,
): { lat: number; lng: number; googleMapsUrl: string } | null => {
  if (!rawInput || typeof rawInput !== "string") return null;
  const trimmed = rawInput.trim();
  if (!trimmed) return null;

  const decoded = (() => {
    try {
      return decodeURIComponent(trimmed);
    } catch {
      return trimmed;
    }
  })();

  const patterns = [
    /!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/i,
    /@(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/,
    /[?&](?:q|query|ll|center|daddr|saddr)=(?:loc:)?(-?\d{1,2}\.\d+)\s*[,+\s]\s*(-?\d{1,3}\.\d+)/i,
    /\/maps\/(?:place|search|dir)\/(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/i,
    /^\s*(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)\s*$/,
  ];

  for (const pattern of patterns) {
    const match = decoded.match(pattern);
    if (match) {
      const lat = Number(match[1]);
      const lng = Number(match[2]);
      if (isValidCoordinatePair(lat, lng)) {
        const rLat = Math.round(lat * 1e6) / 1e6;
        const rLng = Math.round(lng * 1e6) / 1e6;
        return {
          lat: rLat,
          lng: rLng,
          googleMapsUrl: buildGoogleMapsUrl(rLat, rLng),
        };
      }
    }
  }

  return null;
};

export interface ReverseGeocodeResult {
  formattedAddress: string;
  city: string;
  governorate: string;
  governorateAr: string;
}

const normalizeArabicText = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/محافظة|governorate/gi, "")
    .replace(/\s+/g, " ")
    .trim();

export const matchEgyptGovernorate = (
  ...candidates: Array<string | undefined | null>
): { nameEn: string; nameAr: string } | null => {
  const normalizedCandidates = candidates
    .map((c) => (c ? normalizeArabicText(c) : ""))
    .filter(Boolean);

  for (const text of normalizedCandidates) {
    for (const gov of EGYPT_GOVERNORATES) {
      const arNorm = normalizeArabicText(gov.nameAr);
      const enNorm = gov.nameEn.toLowerCase();
      if (
        text.includes(arNorm) ||
        arNorm.includes(text) ||
        text.includes(enNorm) ||
        enNorm.includes(text)
      ) {
        return { nameEn: gov.nameEn, nameAr: gov.nameAr };
      }
    }
  }
  return null;
};

export const reverseGeocodeNominatim = async (
  lat: number,
  lng: number,
  lang: "ar" | "en" = "ar",
): Promise<ReverseGeocodeResult | null> => {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
      String(lat),
    )}&lon=${encodeURIComponent(String(lng))}&accept-language=${lang}`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    const addr = isRecord(data?.address) ? data.address : {};

    const road = String(addr["road"] || addr["pedestrian"] || addr["street"] || "").trim();
    const houseNumber = String(addr["house_number"] || "").trim();
    const neighbourhood = String(
      addr["neighbourhood"] || addr["suburb"] || addr["quarter"] || addr["residential"] || "",
    ).trim();
    const city = String(
      addr["city_district"] ||
        addr["city"] ||
        addr["town"] ||
        addr["village"] ||
        addr["county"] ||
        neighbourhood,
    ).trim();
    const state = String(addr["state"] || addr["region"] || "").trim();

    const matchedGov = matchEgyptGovernorate(state, city, neighbourhood);
    const streetParts = [houseNumber, road, neighbourhood].filter(Boolean);
    const formattedAddress =
      streetParts.length > 0
        ? streetParts.join("، ")
        : typeof data?.display_name === "string"
          ? data.display_name.split(",").slice(0, 3).join("، ").trim()
          : "";

    return {
      formattedAddress,
      city,
      governorate: matchedGov?.nameEn || "",
      governorateAr: matchedGov?.nameAr || state,
    };
  } catch {
    return null;
  }
};

export const searchOsmPlaces = async (
  query: string,
  lang: "ar" | "en" = "ar",
): Promise<Array<{ lat: number; lng: number; label: string }>> => {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
      trimmed,
    )}&countrycodes=eg&limit=5&accept-language=${lang}`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timer);
    if (!res.ok) return [];
    const rows = await res.json();
    if (!Array.isArray(rows)) return [];
    return rows
      .map((row: Record<string, unknown>) => ({
        lat: Number(row["lat"]),
        lng: Number(row["lon"]),
        label: String(row["display_name"] || "").trim(),
      }))
      .filter((item) => isValidCoordinatePair(item.lat, item.lng) && Boolean(item.label));
  } catch {
    return [];
  }
};
