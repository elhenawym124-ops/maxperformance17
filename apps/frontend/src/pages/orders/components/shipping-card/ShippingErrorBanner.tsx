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
          className={`p-4 rounded-xl border shadow-xs transition-all ${
            shippingAutoError.category === "DATA_ERROR"
              ? "border-warning bg-warning/90 dark:border-warning/60 dark:bg-warning/30 text-warning dark:text-warning"
              : "border-destructive bg-destructive/90 dark:border-destructive/60 dark:bg-destructive/30 text-destructive dark:text-destructive"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                shippingAutoError.category === "DATA_ERROR"
                  ? "bg-warning dark:bg-warning/60 text-warning dark:text-warning"
                  : "bg-destructive dark:bg-destructive/60 text-destructive dark:text-destructive"
              }`}
            >
              {shippingAutoError.category === "DATA_ERROR" ? (
                <ExclamationTriangleIcon className="h-5 w-5" />
              ) : (
                <ExclamationCircleIcon className="h-5 w-5" />
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-2 py-0.5 text-xs font-bold rounded-md ${
                    shippingAutoError.category === "DATA_ERROR"
                      ? "bg-warning text-warning dark:bg-warning dark:text-warning"
                      : "bg-destructive text-destructive dark:bg-destructive dark:text-destructive"
                  }`}
                >
                  {shippingAutoError.category === "DATA_ERROR"
                    ? "تنبيه بيانات العميل (Customer Data Issue)"
                    : "تنبيه نظام وربط الشحن (Carrier / Integration Issue)"}
                </span>
                <span
                  className={`text-xs font-medium ${
                    shippingAutoError.category === "DATA_ERROR"
                      ? "text-warning dark:text-warning"
                      : "text-destructive dark:text-destructive"
                  }`}
                >
                  تعذر توليد كود الشحن التلقائي
                </span>
              </div>

              <p
                className={`text-sm font-semibold ${
                  shippingAutoError.category === "DATA_ERROR"
                    ? "text-warning dark:text-warning"
                    : "text-destructive dark:text-destructive"
                }`}
              >
                {shippingAutoError.message}
              </p>

              {shippingAutoError.actionHint && (
                <p
                  className={`text-xs ${
                    shippingAutoError.category === "DATA_ERROR"
                      ? "text-warning dark:text-warning/90"
                      : "text-destructive dark:text-destructive/90"
                  }`}
                >
                  {shippingAutoError.actionHint}
                </p>
              )}
            </div>

            {shippingAutoError.category === "SYSTEM_ERROR" && (
              <Link
                to="/shipping-companies"
                className="px-2.5 py-1.5 text-xs font-semibold bg-destructive hover:bg-destructive text-white rounded-lg transition shrink-0 self-center shadow-xs active:scale-97"
              >
                إعدادات الشحن
              </Link>
            )}
          </div>
        </div>
      )}

      {companiesCount === 0 && !loadingCompanies && (
        <div className="p-3.5 rounded-xl border border-warning bg-warning/10 dark:border-warning/50 dark:bg-warning/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ExclamationTriangleIcon className="h-5 w-5 text-warning shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-semibold text-warning dark:text-warning">
                لا توجد شركات شحن مفعلة حالياً
              </p>
              <p className="text-xs text-warning dark:text-warning mt-0.5">
                يمكنك تفعيل شركات الشحن (تربو، كيو بي إكسبريس، بوستا) وإدخال بيانات الربط للبدء في الشحن الآلي.
              </p>
            </div>
          </div>
          <Link
            to="/shipping-companies"
            className="px-3 py-1.5 text-xs font-semibold bg-warning hover:bg-warning text-white rounded-lg transition shrink-0 active:scale-97"
          >
            تفعيل شركات الشحن
          </Link>
        </div>
      )}
    </>
  );
};

export default ShippingErrorBanner;
