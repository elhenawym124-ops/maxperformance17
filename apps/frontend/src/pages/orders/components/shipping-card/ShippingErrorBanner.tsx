import React from "react";
import { Link } from "react-router-dom";
import {
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { ShippingAutoError } from "./shippingCardTypes";

interface ShippingErrorBannerProps {
  shippingAutoError: ShippingAutoError | null;
  companiesCount: number;
  loadingCompanies: boolean;
}

export const ShippingErrorBanner: React.FC<ShippingErrorBannerProps> = ({
  shippingAutoError,
  companiesCount,
  loadingCompanies,
}) => {
  return (
    <>
      {shippingAutoError && (
        <div
          className={`p-3 rounded-xl border transition-all ${
            shippingAutoError.category === "DATA_ERROR"
              ? "border-warning/35 bg-warning/10 text-foreground"
              : "border-destructive/35 bg-destructive/10 text-foreground"
          }`}
        >
          <div className="flex items-start gap-2.5">
            <div
              className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                shippingAutoError.category === "DATA_ERROR"
                  ? "bg-warning/15 text-warning"
                  : "bg-destructive/15 text-destructive"
              }`}
            >
              {shippingAutoError.category === "DATA_ERROR" ? (
                <ExclamationTriangleIcon className="h-4 w-4" />
              ) : (
                <ExclamationCircleIcon className="h-4 w-4" />
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={`px-2 py-0.5 text-[11px] font-semibold rounded-md border ${
                    shippingAutoError.category === "DATA_ERROR"
                      ? "bg-warning/15 text-warning border-warning/30"
                      : "bg-destructive/15 text-destructive border-destructive/30"
                  }`}
                >
                  {shippingAutoError.category === "DATA_ERROR"
                    ? "تنبيه بيانات العميل"
                    : "تنبيه ربط الشحن"}
                </span>
                <span className="text-xs text-muted-foreground">
                  تعذر توليد البوليصة تلقائياً
                </span>
              </div>

              <p
                className={`text-xs sm:text-sm font-semibold ${
                  shippingAutoError.category === "DATA_ERROR"
                    ? "text-warning"
                    : "text-destructive"
                }`}
              >
                {shippingAutoError.message}
              </p>

              {shippingAutoError.actionHint && (
                <p className="text-xs text-muted-foreground">
                  {shippingAutoError.actionHint}
                </p>
              )}
            </div>

            {shippingAutoError.category === "SYSTEM_ERROR" && (
              <Link
                to="/shipping-companies"
                className="px-2.5 py-1.5 text-xs font-semibold bg-destructive text-destructive-foreground rounded-lg transition shrink-0 self-center active:scale-97"
              >
                الإعدادات
              </Link>
            )}
          </div>
        </div>
      )}

      {companiesCount === 0 && !loadingCompanies && (
        <div className="px-3 py-2.5 rounded-xl border border-warning/30 bg-warning/10 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <ExclamationTriangleIcon className="h-4 w-4 text-warning shrink-0" />
            <p className="text-xs font-semibold text-foreground truncate">
              لا توجد شركات شحن مفعلة حالياً
            </p>
          </div>
          <Link
            to="/shipping-companies"
            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-warning/40 bg-warning/15 text-warning hover:bg-warning hover:text-warning-foreground transition shrink-0 active:scale-97 whitespace-nowrap"
          >
            تفعيل الشحن
          </Link>
        </div>
      )}
    </>
  );
};

export default ShippingErrorBanner;
