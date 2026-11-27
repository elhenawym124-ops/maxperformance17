import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  MapPinIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { apiClient } from "../../../../services/apiClient";
import { GovernorateAreaSearch } from "../../../../components/ui/GovernorateAreaSearch";
import { OrderDetailsType, Government } from "../types";

const GENERIC_CITY_NAMES = new Set([
  "", "cairo", "giza", "alexandria", "alex", "qalyubia", "sharqia", "dakahlia",
  "gharbia", "monufia", "beheira", "kafr el-sheikh", "damietta", "port said",
  "ismailia", "suez", "fayoum", "beni suef", "minya", "asyut", "sohag", "qena",
  "luxor", "aswan", "red sea", "new valley", "matrouh", "north sinai", "south sinai",
  "القاهرة", "الجيزة", "الاسكندرية", "الإسكندرية", "غير محدد", "غير معروف",
]);

function parseTurboAreaMeta(rawMetadata: unknown): any {
  if (!rawMetadata) return null;
  try {
    const parsed = typeof rawMetadata === "string" ? JSON.parse(rawMetadata) : rawMetadata;
    return parsed?.turboAreaResolution || null;
  } catch {
    return null;
  }
}

interface ParsedCustomerLocation {
  lat: number;
  lng: number;
  googleMapsUrl: string;
  label?: string;
  source?: string;
}

function parseCustomerLocation(order: OrderDetailsType): ParsedCustomerLocation | null {
  const tryExtract = (raw: unknown): ParsedCustomerLocation | null => {
    if (!raw) return null;
    let obj: Record<string, unknown> | null = null;
    if (typeof raw === "string" && raw.trim().startsWith("{")) {
      try {
        obj = JSON.parse(raw);
      } catch {
        obj = null;
      }
    } else if (typeof raw === "object" && !Array.isArray(raw)) {
      obj = raw as Record<string, unknown>;
    }
    if (!obj) return null;

    const candidate =
      (obj.customerLocation && typeof obj.customerLocation === "object"
        ? (obj.customerLocation as Record<string, unknown>)
        : null) ||
      (obj.location && typeof obj.location === "object"
        ? (obj.location as Record<string, unknown>)
        : null) ||
      (obj.lat !== undefined && obj.lng !== undefined ? obj : null);

    if (!candidate) return null;
    const lat = Number(candidate.lat);
    const lng = Number(candidate.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) {
      return null;
    }
    return {
      lat,
      lng,
      googleMapsUrl:
        typeof candidate.googleMapsUrl === "string" && candidate.googleMapsUrl.trim()
          ? candidate.googleMapsUrl.trim()
          : `https://www.google.com/maps?q=${lat},${lng}`,
      label: typeof candidate.label === "string" ? candidate.label.trim() : undefined,
      source: typeof candidate.source === "string" ? candidate.source.trim() : undefined,
    };
  };

  return (
    tryExtract((order as any)?.metadata) ||
    tryExtract(order.shippingAddress) ||
    tryExtract(order.customerAddress)
  );
}

interface CustomerAddressSectionProps {
  order: OrderDetailsType;
  isEditing: boolean;
  editForm: any;
  setEditForm: (form: any) => void;
  governments: Government[];
}

export const CustomerAddressSection: React.FC<CustomerAddressSectionProps> = ({
  order,
  isEditing,
  editForm,
  setEditForm,
  governments,
}) => {
  const { t } = useTranslation();
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [copiedLocationUrl, setCopiedLocationUrl] = useState(false);
  const [resolvingAi, setResolvingAi] = useState(false);
  const [aiOverride, setAiOverride] = useState<{
    governorate?: string | null;
    city?: string | null;
    needsDetails?: boolean;
    message?: string;
  } | null>(null);

  const turboAreaMeta = parseTurboAreaMeta((order as any)?.metadata);
  const customerLocation = parseCustomerLocation(order);

  const resolvedGov = (() => {
    if (aiOverride?.governorate) return aiOverride.governorate;
    const val = order.governorate || (order.shippingAddress as any)?.governorate;
    if (!val) return "";
    const govId = parseInt(String(val));
    if (!isNaN(govId) && governments) {
      const found = governments.find((g) => g.id === govId);
      if (found) return found.name;
    }
    return String(val).replace(/^\d+:/, "").trim();
  })();

  const resolvedCity = aiOverride?.city
    ? String(aiOverride.city).replace(/^\d+:/, "").trim()
    : order.city
      ? String(order.city).replace(/^\d+:/, "").trim()
      : "";

  const isGenericOrMissingCity = GENERIC_CITY_NAMES.has(resolvedCity.toLowerCase());
  const needsAddressDetails =
    aiOverride?.needsDetails ?? (turboAreaMeta?.status === "needs_details" || (!order.turboTrackingNumber && isGenericOrMissingCity));
  const showAiResolveButton = !order.turboTrackingNumber && (needsAddressDetails || isGenericOrMissingCity);

  const handleResolveAreaWithAi = async () => {
    const targetId = order.id || order.orderNumber;
    if (!targetId || resolvingAi) return;
    setResolvingAi(true);
    try {
      const response = await apiClient.post(`/turbo/orders/${encodeURIComponent(targetId)}/resolve-area`);
      const payload = response.data;
      if (payload?.resolved && payload?.data) {
        setAiOverride({
          governorate: payload.data.governorate,
          city: payload.data.area,
          needsDetails: false,
        });
        toast.success(payload.data.message || "تم تحديد المنطقة بالذكاء الاصطناعي");
      } else {
        setAiOverride({
          needsDetails: true,
          message: payload?.data?.message || "العنوان غير واضح أو يحتاج تفاصيل أكثر",
        });
        toast.warning(payload?.data?.message || "العنوان غير واضح أو يحتاج تفاصيل أكثر لتحديد منطقة تربو");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "تعذر تحديد المنطقة بالذكاء الاصطناعي");
    } finally {
      setResolvingAi(false);
    }
  };

  const resolvedDetailedAddress = (() => {
    if (!order.customerAddress) return "";
    let rawAddr = order.customerAddress;
    if (typeof rawAddr === "string" && rawAddr.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(rawAddr);
        const parts = [];
        if (parsed.street) parts.push(parsed.street);
        if (parsed.building) parts.push(`${t("orderDetails.building")}: ${parsed.building}`);
        if (parsed.floor) parts.push(`${t("orderDetails.floor")}: ${parsed.floor}`);
        if (parsed.apartment) parts.push(`${t("orderDetails.apartment")}: ${parsed.apartment}`);
        if (parsed.city && parsed.city !== parsed.governorate) parts.push(parsed.city);
        if (parsed.governorate) parts.push(parsed.governorate);
        rawAddr = parts.length > 0 ? parts.join(", ") : rawAddr;
      } catch {
        rawAddr = order.customerAddress;
      }
    }
    const cleaned = String(rawAddr)
      .replace(/,\s*\d+:[^,]+,\s*\d+/g, "")
      .replace(/\b\d+:[^,]+,\s*\d+\b/g, "")
      .replace(/\b\d+:[^\s,]+/g, "")
      .replace(/,\s*\d+\s*$/g, "")
      .replace(/^[,\s\-\:\.\t،\-–\/]+|[,\s\-\:\.\t،\-–\/]+$/g, "")
      .replace(/[،\s]*,[،\s]*,/g, ",")
      .replace(/\s+/g, " ")
      .trim();
    return cleaned || String(rawAddr);
  })();

  const handleCopyAddress = () => {
    const full = [resolvedGov, resolvedCity, resolvedDetailedAddress]
      .filter(Boolean)
      .join(" — ");
    if (!full) return;
    navigator.clipboard?.writeText(full);
    setCopiedAddr(true);
    toast.success("تم نسخ العنوان");
    setTimeout(() => setCopiedAddr(false), 1800);
  };

  if (isEditing) {
    return (
      <>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">
            {t("orderDetails.governorate")}
          </label>
          <GovernorateAreaSearch
            value={{
              governorate: editForm.governorate || "",
              area: editForm.city || "",
            }}
            onChange={(next) => {
              setEditForm({
                ...editForm,
                governorate: next.governorate,
                city: next.area,
              });
            }}
            placeholder={t("orderDetails.selectGovernorate") as string}
            searchPlaceholder={t("orderDetails.searchArea") as string}
            emptyText={t("orderDetails.noAreasAvailable") as string}
            loadingText={t("orderDetails.loading") as string}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">
            {t("orderDetails.areaCity")}
          </label>
          <p className="text-sm text-foreground">
            {editForm.city
              ? String(editForm.city).replace(/^\d+:/, "").trim()
              : t("orders.notSpecified")}
          </p>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">
            {t("orderDetails.detailedAddress", "العنوان التفصيلي")}
          </label>
          <textarea
            value={editForm.customerAddress}
            onChange={(e) =>
              setEditForm({ ...editForm, customerAddress: e.target.value })
            }
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-base sm:text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
            rows={3}
            placeholder={t("orderDetails.addressPlaceholder", "أدخل العنوان التفصيلي...").toString()}
          />
        </div>
      </>
    );
  }

  const locationSummary = [resolvedGov, resolvedCity].filter(Boolean).join(" · ");

  return (
    <div className="space-y-2 pt-1.5 border-t border-border/50">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <MapPinIcon className="w-4 h-4 text-muted-foreground/80 shrink-0 mt-0.5" />
          <div className="min-w-0 space-y-0.5">
            <p className="text-xs sm:text-sm font-medium text-foreground break-words">
              {locationSummary || t("orders.notSpecified")}
            </p>
            {resolvedDetailedAddress && (
              <p className="text-xs sm:text-sm text-muted-foreground break-words leading-relaxed">
                {resolvedDetailedAddress}
              </p>
            )}
          </div>
        </div>
        {(locationSummary || resolvedDetailedAddress) && (
          <button
            type="button"
            onClick={handleCopyAddress}
            aria-label="نسخ العنوان"
            title="نسخ العنوان كاملاً"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted transition active:scale-95 shrink-0"
          >
            {copiedAddr ? (
              <CheckIcon className="w-3.5 h-3.5 text-success" />
            ) : (
              <ClipboardDocumentIcon className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>

      {customerLocation && (
        <div className="flex flex-wrap items-center justify-between gap-2 ps-6">
          <a
            href={customerLocation.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary/15 transition active:scale-[0.98]"
            title={`${customerLocation.lat.toFixed(5)}, ${customerLocation.lng.toFixed(5)}`}
          >
            <MapPinIcon className="w-3.5 h-3.5 shrink-0" />
            <span>فتح موقع العميل (Google Maps)</span>
            <ArrowTopRightOnSquareIcon className="w-3 h-3 shrink-0" />
          </a>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(customerLocation.googleMapsUrl);
              setCopiedLocationUrl(true);
              toast.success("تم نسخ رابط اللوكيشن");
              setTimeout(() => setCopiedLocationUrl(false), 1800);
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-muted/40 px-2 py-1 text-[11px] font-mono tabular-nums text-muted-foreground hover:text-foreground hover:bg-muted transition active:scale-95"
            title="نسخ رابط Google Maps"
          >
            {copiedLocationUrl ? (
              <CheckIcon className="w-3 h-3 text-success shrink-0" />
            ) : (
              <ClipboardDocumentIcon className="w-3 h-3 shrink-0" />
            )}
            <span>
              {customerLocation.lat.toFixed(4)}, {customerLocation.lng.toFixed(4)}
            </span>
          </button>
        </div>
      )}

      {(needsAddressDetails || showAiResolveButton) && (
        <div className="flex flex-wrap items-center justify-between gap-2 ps-6">
          {needsAddressDetails && (
            <span
              className="inline-flex items-center gap-1 rounded-md border border-warning/30 bg-warning/10 px-2 py-0.5 text-[11px] font-medium text-warning"
              title={aiOverride?.message || turboAreaMeta?.message || "العنوان غير واضح أو غير مطابق لمنطقة تربو"}
            >
              <ExclamationTriangleIcon className="w-3.5 h-3.5 shrink-0" />
              <span>العنوان غير واضح — يحتاج تفاصيل أكثر</span>
            </span>
          )}
          {showAiResolveButton && (
            <button
              type="button"
              onClick={handleResolveAreaWithAi}
              disabled={resolvingAi}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary/15 disabled:opacity-50 transition active:scale-[0.98]"
            >
              <SparklesIcon className={`w-3.5 h-3.5 shrink-0 ${resolvingAi ? "animate-pulse" : ""}`} />
              <span>{resolvingAi ? "جاري التحديد…" : "تحديد المنطقة بالذكاء الاصطناعي"}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
