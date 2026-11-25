import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  MapPinIcon,
  ClipboardDocumentIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { GovernorateAreaSearch } from "../../../../components/ui/GovernorateAreaSearch";
import { OrderDetailsType, Government } from "../types";

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

  const resolvedGov = (() => {
    const val = order.governorate || (order.shippingAddress as any)?.governorate;
    if (!val) return "";
    const govId = parseInt(String(val));
    if (!isNaN(govId) && governments) {
      const found = governments.find((g) => g.id === govId);
      if (found) return found.name;
    }
    return String(val).replace(/^\d+:/, "").trim();
  })();

  const resolvedCity = order.city
    ? String(order.city).replace(/^\d+:/, "").trim()
    : "";

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
    <div className="flex items-start justify-between gap-2 pt-1.5 border-t border-border/50">
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
  );
};
