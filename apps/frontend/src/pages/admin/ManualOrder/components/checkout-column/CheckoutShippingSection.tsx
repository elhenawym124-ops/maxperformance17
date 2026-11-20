import React from "react";
import { TruckIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { ShippingInfo } from "./types";

interface CheckoutShippingSectionProps {
  loadingShipping: boolean;
  shippingInfo: ShippingInfo | null;
  governorate: string;
  t: (key: string) => string;
}

export const CheckoutShippingSection: React.FC<CheckoutShippingSectionProps> = ({
  loadingShipping,
  shippingInfo,
  governorate,
  t,
}) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
        <TruckIcon className="w-5 h-5 text-muted-foreground" />
        {t("manualOrder.k_24")}
      </h3>

      {loadingShipping ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-4 h-4 border-2 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
          {t("manualOrder.k_100")}
        </div>
      ) : shippingInfo?.zoneId ? (
        <div className="bg-green-50 dark:bg-success/20 border border-success dark:border-success rounded-lg p-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-success dark:text-success">
              {t("manualOrder.k_101")}{shippingInfo.governorate})
            </span>
            <span className="font-bold text-success dark:text-success">
              {shippingInfo.price.toLocaleString()} {t("manualOrder.k_75")}
            </span>
          </div>
          <div className="text-xs text-success dark:text-success mt-1">
            {t("manualOrder.k_102")} {shippingInfo.deliveryTime}
          </div>
        </div>
      ) : governorate ? (
        <div className="bg-yellow-50 dark:bg-warning/20 border border-warning dark:border-warning rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm text-warning dark:text-warning">
            <ExclamationTriangleIcon className="w-4 h-4" />
            {t("manualOrder.k_103")}
          </div>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground/80">
          {t("manualOrder.k_104")}
        </div>
      )}
    </div>
  );
};
