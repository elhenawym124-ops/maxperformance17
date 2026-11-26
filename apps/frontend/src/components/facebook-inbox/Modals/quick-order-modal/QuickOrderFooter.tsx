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
    <div className="flex items-center justify-between gap-3 border-t border-border/70 bg-card px-4 py-3">
      <button
        type="button"
        onClick={step === "checkout" ? () => setStep("products") : onClose}
        className="inline-flex h-9 items-center justify-center rounded-lg border border-border/70 bg-background px-4 text-xs sm:text-sm font-medium text-foreground hover:bg-muted/60 active:scale-[0.97] transition-all cursor-pointer"
      >
        {step === "checkout" ? "رجوع" : "إلغاء"}
      </button>

      {step === "products" && (
        <div className="flex items-center gap-2">
          {cartCount === 0 ? (
            <span className="hidden sm:inline text-xs text-muted-foreground">
              أضف منتجاً واحداً على الأقل للمتابعة
            </span>
          ) : (
            <button
              type="button"
              onClick={() => {
                setShowMobileCart(false);
                setStep("checkout");
              }}
              className="md:hidden inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-bold text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all cursor-pointer shadow-xs"
            >
              <span>متابعة الطلب</span>
              <span className="opacity-90 font-mono tabular-nums">
                ({grandTotal.toLocaleString()} ج.م)
              </span>
            </button>
          )}
        </div>
      )}

      {step === "checkout" && (
        <button
          type="button"
          onClick={handleCreateOrder}
          disabled={isSubmitDisabled}
          className={`inline-flex h-9 items-center gap-2 rounded-lg px-4 sm:px-6 text-xs sm:text-sm font-semibold transition-all active:scale-[0.97] ${
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
