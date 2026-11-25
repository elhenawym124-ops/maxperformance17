import React from "react";
import { CheckCircleIcon } from "@heroicons/react/24/outline";

interface QuickOrderFooterProps {
  createdOrder: boolean;
  step: "products" | "checkout";
  setStep: (step: "products" | "checkout") => void;
  onClose: () => void;
  cartCount: number;
  grandTotal: number;
  setShowMobileCart: (show: boolean) => void;
  handleCreateOrder: () => void;
  loading: boolean;
  phone: string;
  customerName: string;
  blockPreventsOrder: boolean;
  previousOrderPreventsOrder: boolean;
  isScheduledOrder: boolean;
  scheduledDeliveryDate: string;
  city: string;
  loadingShipping: boolean;
}

export const QuickOrderFooter: React.FC<QuickOrderFooterProps> = ({
  createdOrder,
  step,
  setStep,
  onClose,
  cartCount,
  grandTotal,
  setShowMobileCart,
  handleCreateOrder,
  loading,
  phone,
  customerName,
  blockPreventsOrder,
  previousOrderPreventsOrder,
  isScheduledOrder,
  scheduledDeliveryDate,
  city,
  loadingShipping,
}) => {
  if (createdOrder) return null;

  const isSubmitDisabled =
    loading ||
    cartCount === 0 ||
    !phone ||
    !customerName ||
    blockPreventsOrder ||
    previousOrderPreventsOrder ||
    (isScheduledOrder && !scheduledDeliveryDate) ||
    (Boolean(city) && loadingShipping);

  return (
    <div className="business-footer-bar flex items-center justify-between p-3 sm:p-4">
      <button
        type="button"
        onClick={step === "checkout" ? () => setStep("products") : onClose}
        className="business-chip-button px-4 py-2 text-xs sm:text-sm"
      >
        {step === "checkout" ? "رجوع" : "إلغاء"}
      </button>

      {step === "products" && cartCount > 0 && (
        <button
          type="button"
          onClick={() => {
            setShowMobileCart(false);
            setStep("checkout");
          }}
          className="business-chip-button md:hidden flex items-center gap-1.5 px-4 py-2 text-xs font-bold"
          data-active="true"
        >
          <span>متابعة الطلب</span>
          <span className="opacity-90 font-mono tabular-nums">
            ({grandTotal.toLocaleString()} ج.م)
          </span>
        </button>
      )}

      {step === "checkout" && (
        <button
          type="button"
          onClick={handleCreateOrder}
          disabled={isSubmitDisabled}
          className={`inline-flex items-center gap-2 rounded-lg px-4 sm:px-6 py-2 text-xs sm:text-sm font-semibold transition-all active:scale-[0.97] ${
            isSubmitDisabled
              ? "cursor-not-allowed opacity-50 bg-muted text-muted-foreground border border-border/70"
              : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer"
          }`}
        >
          {loading ? (
            <div
              className="h-4 w-4 sm:h-5 sm:w-5 animate-spin rounded-full border-2 border-t-transparent"
              style={{
                borderColor: "currentColor",
                borderTopColor: "transparent",
              }}
            />
          ) : (
            <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
          <span>إنشاء الطلب</span>
          <span className="font-mono tabular-nums">
            ({grandTotal.toLocaleString()} ج.م)
          </span>
        </button>
      )}
    </div>
  );
};
