import React from "react";
import { CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { CartItem } from "../types";

interface CheckoutOrderSummaryProps {
  cartItems: CartItem[];
  subtotal: number;
  totalDiscount: number;
  shippingCost: number;
  grandTotal: number;
  loading: boolean;
  loadingShipping: boolean;
  governorate: string;
  blockPreventsOrder: boolean;
  previousOrderMissing: boolean;
  explicitOrderLinkMissing: boolean;
  previousOrderPreventsOrder: boolean;
  stockWarnings: CartItem[];
  onCreateOrder: () => void;
  t: (key: string) => string;
}

export const CheckoutOrderSummary: React.FC<CheckoutOrderSummaryProps> = ({
  cartItems,
  subtotal,
  totalDiscount,
  shippingCost,
  grandTotal,
  loading,
  loadingShipping,
  governorate,
  blockPreventsOrder,
  previousOrderMissing,
  explicitOrderLinkMissing,
  previousOrderPreventsOrder,
  stockWarnings,
  onCreateOrder,
  t,
}) => {
  const isDisabled =
    loading ||
    cartItems.length === 0 ||
    (Boolean(governorate) && loadingShipping) ||
    blockPreventsOrder ||
    previousOrderPreventsOrder;

  return (
    <>
      {/* Stock Warnings */}
      {stockWarnings.length > 0 && (
        <div className="px-4 py-2 bg-destructive/10 dark:bg-destructive/20 border-t border-destructive dark:border-destructive">
          <div className="flex items-center gap-2 text-destructive dark:text-destructive text-sm">
            <ExclamationTriangleIcon className="w-4 h-4" />
            <span>{t("manualOrder.k_22")}</span>
          </div>
        </div>
      )}

      {/* Order Summary Bottom Bar */}
      <div className="p-4 bg-muted dark:bg-muted border-t border-border dark:border-border space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-muted-foreground">
            {t("manualOrder.k_118")}
            {cartItems.reduce((acc, item) => acc + item.quantity, 0)}{" "}
            {t("manualOrder.k_119")}
          </span>
          <span className="font-medium text-foreground tabular-nums">
            {subtotal.toLocaleString()} {t("manualOrder.k_75")}
          </span>
        </div>

        {totalDiscount > 0 && (
          <div className="flex justify-between text-sm text-success dark:text-success">
            <span>{t("manualOrder.k_23")}</span>
            <span className="tabular-nums">
              -{totalDiscount.toLocaleString()}
              {t("manualOrder.k_75")}
            </span>
          </div>
        )}

        {shippingCost > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-muted-foreground">
              {t("manualOrder.k_24")}
            </span>
            <span className="font-medium text-foreground tabular-nums">
              +{shippingCost.toLocaleString()} {t("manualOrder.k_75")}
            </span>
          </div>
        )}

        <div className="flex justify-between text-lg font-bold pt-2 border-t border-border dark:border-border">
          <span className="text-foreground">
            {t("manualOrder.k_120")}
          </span>
          <span className="text-blue-600 dark:text-blue-400 tabular-nums">
            {grandTotal.toLocaleString()} {t("manualOrder.k_75")}
          </span>
        </div>

        <button
          onClick={onCreateOrder}
          disabled={isDisabled}
          title={
            previousOrderMissing
              ? "لا يمكن المتابعة: سياسة المتجر تشترط وجود طلب سابق مؤهل لهذا العميل"
              : explicitOrderLinkMissing
              ? "يرجى تحديد الطلب السابق المرتبط أولاً"
              : undefined
          }
          className={`w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-white font-bold transition-all mt-3 active:scale-[0.98] ${
            isDisabled
              ? "bg-gray-400 dark:bg-muted cursor-not-allowed"
              : "bg-green-600 dark:bg-success hover:bg-success dark:hover:bg-success shadow-lg hover:shadow-xl"
          }`}
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <CheckCircleIcon className="w-6 h-6" />
              <span>
                {t("manualOrder.k_82")}
                {grandTotal.toLocaleString()}
                {t("manualOrder.k_83")}
              </span>
            </>
          )}
        </button>
      </div>
    </>
  );
};
