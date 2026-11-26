import React from "react";
import { ShoppingCartIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface QuickOrderHeaderProps {
  initialCustomerName?: string;
  convCustomerName?: string;
  convPageName?: string;
  createdOrder: boolean;
  step: "products" | "checkout";
  setStep: (step: "products" | "checkout") => void;
  cartCount: number;
  showMobileCart: boolean;
  setShowMobileCart: (show: boolean) => void;
  onClose: () => void;
}

export const QuickOrderHeader: React.FC<QuickOrderHeaderProps> = ({
  initialCustomerName,
  convCustomerName,
  convPageName,
  createdOrder,
  step,
  setStep,
  cartCount,
  showMobileCart,
  setShowMobileCart,
  onClose,
}) => {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-border/70 bg-card px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShoppingCartIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold text-foreground">طلب سريع</h2>
            <p className="business-workflow-subtitle truncate text-xs text-muted-foreground">
              {initialCustomerName || convCustomerName
                ? `${initialCustomerName || convCustomerName} - ${convPageName}`
                : convPageName}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground active:scale-[0.97] transition-all cursor-pointer"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Steps Indicator */}
      {!createdOrder && (
        <div className="flex items-center gap-1 border-b border-border/70 bg-muted/30 px-4">
          <button
            type="button"
            onClick={() => {
              setStep("products");
              setShowMobileCart(false);
            }}
            className={`relative flex-1 sm:flex-initial border-b-2 px-3 py-2.5 text-xs sm:text-sm transition-colors cursor-pointer ${
              step === "products" && !showMobileCart
                ? "border-primary font-semibold text-foreground"
                : "border-transparent font-medium text-muted-foreground hover:text-foreground"
            }`}
            data-active={step === "products" && !showMobileCart}
          >
            <span className="flex items-center justify-center gap-2">
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-md text-[11px] font-mono tabular-nums font-bold ${
                  step === "products" && !showMobileCart
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                1
              </span>
              <span>المنتجات</span>
              {cartCount > 0 && (
                <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-bold text-primary font-mono tabular-nums">
                  {cartCount}
                </span>
              )}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (cartCount > 0) {
                setStep("checkout");
                setShowMobileCart(false);
              }
            }}
            disabled={cartCount === 0}
            className={`relative flex-1 sm:flex-initial border-b-2 px-3 py-2.5 text-xs sm:text-sm transition-colors ${
              cartCount === 0
                ? "cursor-not-allowed border-transparent font-medium text-muted-foreground/50"
                : step === "checkout"
                  ? "cursor-pointer border-primary font-semibold text-foreground"
                  : "cursor-pointer border-transparent font-medium text-muted-foreground hover:text-foreground"
            }`}
            data-active={step === "checkout"}
            data-disabled={cartCount === 0}
          >
            <span className="flex items-center justify-center gap-2">
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-md text-[11px] font-mono tabular-nums font-bold ${
                  step === "checkout"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                2
              </span>
              <span>الدفع والتوصيل</span>
            </span>
          </button>
        </div>
      )}
    </>
  );
};
