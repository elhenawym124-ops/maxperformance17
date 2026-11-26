import React from "react";
import {
  ShoppingCartIcon,
  ChevronUpIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { CartItem } from "./types";
import { headingStyle, mutedStyle } from "./styles";
import { QuickOrderCartItem } from "./QuickOrderCartItem";

interface QuickOrderCartSidebarProps {
  cartItems: CartItem[];
  subtotal: number;
  showMobileCart: boolean;
  setShowMobileCart: (show: boolean) => void;
  onProceedToCheckout: () => void;
  updateQuantity: (
    productId: string,
    variantId: string | undefined,
    delta: number,
  ) => void;
  updateItemPrice: (
    productId: string,
    variantId: string | undefined,
    newPrice: number,
  ) => void;
  restoreItemPrice: (
    productId: string,
    variantId: string | undefined,
  ) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
}

export const QuickOrderCartSidebar: React.FC<QuickOrderCartSidebarProps> = ({
  cartItems,
  subtotal,
  showMobileCart,
  setShowMobileCart,
  onProceedToCheckout,
  updateQuantity,
  updateItemPrice,
  restoreItemPrice,
  removeFromCart,
}) => {
  const totalItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <>
      {/* Mobile Bottom Cart Bar (visible only on mobile < md when cart has items) */}
      {cartItems.length > 0 && (
        <div
          className="md:hidden flex items-center justify-between gap-2 p-2.5 sm:p-3 border-t bg-[var(--business-surface-strong)] flex-shrink-0 shadow-lg"
          style={{ borderColor: "var(--business-muted-line)" }}
        >
          <button
            type="button"
            onClick={() => setShowMobileCart(true)}
            className="flex items-center gap-2 text-start min-w-0 flex-1 hover:opacity-85 transition-opacity"
          >
            <div className="relative flex-shrink-0">
              <div className="p-2 rounded-xl bg-primary/15 text-primary dark:bg-primary/25">
                <ShoppingCartIcon className="h-5 w-5" />
              </div>
              <span className="absolute -top-1 -end-1 bg-primary text-primary-foreground text-[10px] font-bold font-mono tabular-nums rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {totalItemCount}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs sm:text-sm font-bold font-mono tabular-nums truncate" style={headingStyle}>
                {subtotal.toLocaleString()} ج.م
              </div>
              <div className="text-[10px] sm:text-xs text-primary font-medium flex items-center gap-0.5">
                <span>عرض وتعديل السلة</span>
                <ChevronUpIcon className="h-3 w-3" />
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setShowMobileCart(true)}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-xs sm:text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all flex-shrink-0 shadow-xs cursor-pointer"
          >
            متابعة الطلب
          </button>
        </div>
      )}

      {/* Mobile Cart Overlay/Drawer */}
      {showMobileCart && (
        <div
          className="md:hidden absolute inset-0 z-30 flex flex-col bg-[var(--business-surface-panel)] animate-in fade-in slide-in-from-bottom-5 duration-200"
          style={{
            background: "var(--business-surface-panel)",
          }}
        >
          <div
            className="business-side-panel-header flex items-center justify-between p-3.5"
            style={{ borderBottom: "1px solid var(--business-muted-line)" }}
          >
            <h3
              className="flex items-center gap-2 font-bold text-sm"
              style={headingStyle}
            >
              <ShoppingCartIcon className="h-5 w-5 text-primary" />
              السلة ({totalItemCount} قطعة)
            </h3>
            <button
              type="button"
              onClick={() => setShowMobileCart(false)}
              className="business-icon-button business-icon-button--sm"
              aria-label="إغلاق السلة"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {cartItems.length === 0 ? (
              <div className="business-inbox-empty py-12 text-center">
                <ShoppingCartIcon
                  className="mx-auto h-12 w-12 opacity-30"
                  style={mutedStyle}
                />
                <p className="mt-2 text-sm" style={mutedStyle}>
                  السلة فارغة
                </p>
              </div>
            ) : (
              cartItems.map((item) => (
                <QuickOrderCartItem
                  key={`${item.productId}-${item.variantId || ""}`}
                  item={item}
                  updateQuantity={updateQuantity}
                  updateItemPrice={updateItemPrice}
                  restoreItemPrice={restoreItemPrice}
                  removeFromCart={removeFromCart}
                />
              ))
            )}
          </div>

          {cartItems.length > 0 && (
            <div className="business-footer-bar p-3.5 flex flex-col gap-2.5">
              <div className="flex justify-between items-center text-sm">
                <span style={mutedStyle}>المجموع</span>
                <span className="font-bold text-base font-mono tabular-nums" style={headingStyle}>
                  {subtotal.toLocaleString()} ج.م
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowMobileCart(false)}
                  className="business-chip-button flex-1 py-2 text-xs font-medium"
                >
                  إضافة المزيد
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMobileCart(false);
                    onProceedToCheckout();
                  }}
                  className="business-chip-button flex-1 py-2 text-xs font-bold"
                  data-active="true"
                >
                  متابعة الطلب
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Desktop Cart Sidebar (hidden on mobile, visible on md+) */}
      <div className="hidden md:flex md:w-80 md:flex-col border-s border-border/70 bg-muted/15 flex-shrink-0">
        <div className="flex items-center justify-between border-b border-border/70 bg-card px-4 py-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ShoppingCartIcon className="h-4 w-4 text-muted-foreground" />
            <span>السلة ({cartItems.length})</span>
          </h3>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {cartItems.length === 0 ? (
            <div className="flex h-full min-h-[180px] flex-col items-center justify-center gap-2 text-center text-muted-foreground">
              <ShoppingCartIcon className="h-9 w-9 opacity-30" />
              <p className="text-xs font-medium">السلة فارغة</p>
            </div>
          ) : (
            cartItems.map((item) => (
              <QuickOrderCartItem
                key={`${item.productId}-${item.variantId || ""}`}
                item={item}
                updateQuantity={updateQuantity}
                updateItemPrice={updateItemPrice}
                restoreItemPrice={restoreItemPrice}
                removeFromCart={removeFromCart}
              />
            ))
          )}
        </div>

        {/* Cart Total */}
        {cartItems.length > 0 && (
          <div className="border-t border-border/70 bg-card p-3.5">
            <div className="mb-2.5 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">المجموع</span>
              <span className="font-bold text-foreground font-mono tabular-nums">
                {subtotal.toLocaleString()} ج.م
              </span>
            </div>
            <button
              type="button"
              onClick={onProceedToCheckout}
              className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-primary text-xs sm:text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all cursor-pointer shadow-xs"
            >
              متابعة الطلب
            </button>
          </div>
        )}
      </div>
    </>
  );
};
