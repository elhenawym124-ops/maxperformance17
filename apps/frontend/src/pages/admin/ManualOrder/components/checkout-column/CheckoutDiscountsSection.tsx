import React from "react";
import { TicketIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { CouponInfo } from "./types";

interface CheckoutDiscountsSectionProps {
  couponCode: string;
  setCouponCode: (val: string) => void;
  appliedCoupon: CouponInfo | null;
  loadingCoupon: boolean;
  manualDiscount: number;
  setManualDiscount: (val: number) => void;
  onApplyCoupon: () => void;
  onRemoveCoupon: () => void;
  t: (key: string) => string;
}

export const CheckoutDiscountsSection: React.FC<CheckoutDiscountsSectionProps> = ({
  couponCode,
  setCouponCode,
  appliedCoupon,
  loadingCoupon,
  manualDiscount,
  setManualDiscount,
  onApplyCoupon,
  onRemoveCoupon,
  t,
}) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
        <TicketIcon className="w-5 h-5 text-muted-foreground" />
        {t("manualOrder.k_105")}
      </h3>

      {/* Coupon Input */}
      {!appliedCoupon ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder={t("manualOrder.k_9")}
            className="flex-1 border-border rounded-md focus:ring-primary focus:border-primary text-sm dark:bg-muted dark:text-muted-foreground dark:placeholder-muted"
            onKeyDown={(e) => e.key === "Enter" && onApplyCoupon()}
          />
          <button
            onClick={onApplyCoupon}
            disabled={loadingCoupon || !couponCode.trim()}
            className="px-3 py-2 bg-primary dark:bg-primary text-white rounded-md text-sm hover:bg-primary dark:hover:bg-primary disabled:bg-muted dark:disabled:bg-muted disabled:cursor-not-allowed"
          >
            {loadingCoupon ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              t("manualOrder.k_71")
            )}
          </button>
        </div>
      ) : (
        <div className="bg-blue-50 dark:bg-primary/20 border border-primary dark:border-primary rounded-lg p-3">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm font-medium text-primary dark:text-primary">
                {appliedCoupon.code}
              </span>
              <span className="text-xs text-primary dark:text-primary me-2">
                ({appliedCoupon.name})
              </span>
            </div>
            <button
              onClick={onRemoveCoupon}
              className="text-red-500 dark:text-destructive hover:text-destructive dark:hover:text-destructive"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
          <div className="text-sm text-primary dark:text-primary mt-1">
            {t("manualOrder.k_106")}{appliedCoupon.discountAmount.toLocaleString()} {t("manualOrder.k_75")}
          </div>
        </div>
      )}

      {/* Manual Discount */}
      <div>
        <label className="block text-xs text-muted-foreground mb-1">
          {t("manualOrder.k_107")}
        </label>
        <input
          type="number"
          value={manualDiscount || ""}
          onChange={(e) => setManualDiscount(parseFloat(e.target.value) || 0)}
          className="w-full border-border rounded-md focus:ring-primary focus:border-primary text-sm dark:bg-muted dark:text-muted-foreground"
          placeholder="0"
          min="0"
        />
      </div>
    </div>
  );
};
