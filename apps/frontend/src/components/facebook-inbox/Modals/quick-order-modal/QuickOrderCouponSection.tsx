import React from "react";
import { TicketIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { CouponInfo } from "./types";
import { headingStyle, mutedStyle } from "./styles";

interface QuickOrderCouponSectionProps {
  appliedCoupon: CouponInfo | null;
  couponCode: string;
  setCouponCode: (code: string) => void;
  loadingCoupon: boolean;
  handleApplyCoupon: () => void;
  handleRemoveCoupon: () => void;
  manualDiscount: number;
  setManualDiscount: (discount: number) => void;
  subtotal: number;
}

export const QuickOrderCouponSection: React.FC<
  QuickOrderCouponSectionProps
> = ({
  appliedCoupon,
  couponCode,
  setCouponCode,
  loadingCoupon,
  handleApplyCoupon,
  handleRemoveCoupon,
  manualDiscount,
  setManualDiscount,
  subtotal,
}) => {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-4">
      <h3 className="mb-3 flex items-center gap-2 font-semibold text-sm sm:text-base text-foreground">
        <TicketIcon className="h-4 w-4 text-muted-foreground" />
        الكوبونات والخصم
      </h3>

      <div className="space-y-3">
        {/* Coupon Input or Applied Chip */}
        {!appliedCoupon ? (
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              كود الكوبون
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="أدخل كود الكوبون..."
                className="h-9 flex-1 rounded-lg border border-border/70 bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={loadingCoupon || !couponCode.trim() || subtotal <= 0}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-xs sm:text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.97] transition-all cursor-pointer"
              >
                {loadingCoupon ? "جاري الفحص..." : "تطبيق"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-2.5 rounded-xl border border-primary/30 bg-primary/10 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <TicketIcon className="h-4 w-4 text-primary dark:text-primary" />
              <span className="font-bold text-primary dark:text-primary font-mono">
                {appliedCoupon.code}
              </span>
              <span className="text-muted-foreground">
                (خصم <span className="font-mono tabular-nums">{appliedCoupon.discountAmount.toLocaleString()}</span> ج.م)
              </span>
            </div>
            <button
              type="button"
              onClick={handleRemoveCoupon}
              className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors cursor-pointer"
              title="إزالة الكوبون"
              aria-label="إزالة الكوبون"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Manual Discount */}
        <div>
          <label className="mb-1 block text-xs" style={mutedStyle}>
            خصم يدوي مباشر (ج.م)
          </label>
          <input
            type="number"
            value={manualDiscount || ""}
            onChange={(e) =>
              setManualDiscount(Math.max(0, parseFloat(e.target.value) || 0))
            }
            placeholder="0"
            min="0"
            className="business-control-input w-full text-sm font-mono tabular-nums"
          />
        </div>
      </div>
    </div>
  );
};
