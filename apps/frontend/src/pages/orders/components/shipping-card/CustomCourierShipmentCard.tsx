/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { TruckIcon, CheckBadgeIcon } from "@heroicons/react/24/outline";
import { ShippingCompany } from "./shippingCardTypes";
import { useCurrency } from "../../../../hooks/useCurrency";

export interface CustomCourierShipmentCardProps {
  customCompanies?: ShippingCompany[];
  selectedCompany?: ShippingCompany;
  selectedCompanyId: string;
  setSelectedCompanyId?: (id: string) => void;
  loading: boolean;
  onCreateShipment: () => void;
  orderTotal?: number;
}

export const CustomCourierShipmentCard: React.FC<CustomCourierShipmentCardProps> = React.memo(
  ({
    customCompanies = [],
    selectedCompany,
    selectedCompanyId,
    setSelectedCompanyId,
    loading,
    onCreateShipment,
    orderTotal,
  }) => {
    const { formatPrice } = useCurrency();
    const effectiveCompany =
      selectedCompany ||
      customCompanies.find((c) => c.id === selectedCompanyId) ||
      (customCompanies.length > 0 ? customCompanies[0] : undefined);

    // If we have an active company targeted
    if (effectiveCompany) {
      const isApi = effectiveCompany.integrationMode === "API" || Boolean(effectiveCompany.providerKey && effectiveCompany.providerKey !== "MANUAL");

      return (
        <div className="space-y-3.5 bg-muted/40 dark:bg-muted/20 border border-border/70 rounded-xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <TruckIcon className="h-4 w-4" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-foreground dark:text-white">
                {effectiveCompany.name}
              </span>
            </div>
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                isApi
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                  : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
              }`}
            >
              <CheckBadgeIcon className="h-3 w-3" />
              {isApi ? "ربط تلقائي API" : "ربط مخصص"}
            </span>
          </div>

          {orderTotal !== undefined && (
            <div className="flex items-center justify-between text-xs py-1.5 px-3 bg-background dark:bg-muted rounded-lg border border-border/50">
              <span className="text-muted-foreground">مبلغ التحصيل (COD):</span>
              <span className="font-bold text-foreground dark:text-white font-mono tabular-nums">
                {formatPrice(orderTotal)}
              </span>
            </div>
          )}

          <div className="pt-1">
            <button
              type="button"
              onClick={onCreateShipment}
              disabled={loading || !selectedCompanyId}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition shadow-xs flex items-center justify-center gap-2 active:scale-97"
            >
              <TruckIcon className="h-4 w-4" />
              <span>
                {loading
                  ? "جاري إنشاء الشحنة..."
                  : `شحن الطلب بواسطة ${effectiveCompany.name}`}
              </span>
            </button>
          </div>
        </div>
      );
    }

    // Fallback if no specific company is selected yet
    return (
      <div className="space-y-3">
        {customCompanies.length > 0 && setSelectedCompanyId && (
          <div>
            <label className="block text-xs font-medium text-foreground dark:text-muted-foreground mb-1">
              اختر شركة الشحن
            </label>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-border dark:border-border rounded-lg bg-white dark:bg-muted text-foreground dark:text-white focus:ring-2 focus:ring-primary"
            >
              {customCompanies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.integrationMode ? `(${c.integrationMode})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="pt-1">
          <button
            type="button"
            onClick={onCreateShipment}
            disabled={loading || !selectedCompanyId}
            className="w-full sm:w-auto px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-primary text-white hover:bg-primary disabled:opacity-50 transition shadow-xs flex items-center justify-center gap-2 active:scale-97"
          >
            <TruckIcon className="h-4 w-4" />
            <span>
              {loading ? "جاري إنشاء الشحنة..." : "إنشاء الشحنة وتسليم للشركة"}
            </span>
          </button>
        </div>
      </div>
    );
  }
);

CustomCourierShipmentCard.displayName = "CustomCourierShipmentCard";
