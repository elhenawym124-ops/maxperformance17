import React from "react";
import { useTranslation } from "react-i18next";
import { MapPinIcon } from "@heroicons/react/24/outline";
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

  return (
    <>
      <div>
        <label className="text-sm font-medium text-muted-foreground block mb-1">
          {t("orderDetails.governorate")}
        </label>
        {isEditing ? (
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
        ) : (
          <p className="text-foreground">
            {(() => {
              const val =
                order.governorate ||
                (order.shippingAddress as any)?.governorate;
              if (!val) return t("orders.notSpecified");

              // Check if it's a numeric ID
              const govId = parseInt(String(val));
              if (!isNaN(govId) && governments) {
                const found = governments.find((g) => g.id === govId);
                if (found) return found.name;
              }

              // Clean numeric prefix if exists
              return String(val).replace(/^\d+:/, "").trim();
            })()}
          </p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium text-muted-foreground block mb-1">
          {t("orderDetails.areaCity")}
        </label>
        {isEditing ? (
          <p className="text-foreground">
            {editForm.city
              ? String(editForm.city).replace(/^\d+:/, "").trim()
              : t("orders.notSpecified")}
          </p>
        ) : (
          <p className="text-foreground">
            {order.city
              ? String(order.city).replace(/^\d+:/, "").trim()
              : t("orders.notSpecified")}
          </p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium text-muted-foreground block mb-1">
          {t("orderDetails.detailedAddress", "العنوان التفصيلي")}
        </label>
        {isEditing ? (
          <div className="space-y-2">
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
        ) : (
          <div className="flex items-start gap-2 text-foreground">
            <MapPinIcon className="w-4 h-4 text-muted-foreground/80 shrink-0 mt-1" />
            <span className="min-w-0 break-words leading-relaxed">
              {(() => {
                if (!order.customerAddress) return t("orders.notSpecified");
                let rawAddr = order.customerAddress;
                if (
                  typeof rawAddr === "string" &&
                  rawAddr.trim().startsWith("{")
                ) {
                  try {
                    const parsed = JSON.parse(rawAddr);
                    const parts = [];
                    if (parsed.street) parts.push(parsed.street);
                    if (parsed.building)
                      parts.push(`${t("orderDetails.building")}: ${parsed.building}`);
                    if (parsed.floor)
                      parts.push(`${t("orderDetails.floor")}: ${parsed.floor}`);
                    if (parsed.apartment)
                      parts.push(`${t("orderDetails.apartment")}: ${parsed.apartment}`);
                    if (parsed.city && parsed.city !== parsed.governorate)
                      parts.push(parsed.city);
                    if (parsed.governorate) parts.push(parsed.governorate);
                    rawAddr = parts.length > 0 ? parts.join(", ") : rawAddr;
                  } catch (e) {
                    rawAddr = order.customerAddress;
                  }
                }
                const cleaned = String(rawAddr)
                  .replace(/,\s*\d+:[^,]+,\s*\d+/g, '')
                  .replace(/\b\d+:[^,]+,\s*\d+\b/g, '')
                  .replace(/\b\d+:[^\s,]+/g, '')
                  .replace(/,\s*\d+\s*$/g, '')
                  .replace(/^[,\s\-\:\.\t،\-–\/]+|[,\s\-\:\.\t،\-–\/]+$/g, '')
                  .replace(/[،\s]*,[،\s]*,/g, ',')
                  .replace(/\s+/g, ' ')
                  .trim();
                return cleaned || rawAddr;
              })()}
            </span>
          </div>
        )}
      </div>
    </>
  );
};
