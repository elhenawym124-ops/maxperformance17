import React from "react";
import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import { CartItem } from "../types";
import { buildVariantSummary } from "./types";

interface CheckoutConfirmModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  firstName: string;
  lastName: string;
  phone: string;
  cartItems: CartItem[];
  grandTotal: number;
  t: (key: string) => string;
}

export const CheckoutConfirmModal: React.FC<CheckoutConfirmModalProps> = ({
  show,
  onClose,
  onConfirm,
  firstName,
  lastName,
  phone,
  cartItems,
  grandTotal,
  t,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 dark:bg-muted backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-primary dark:bg-primary/20 rounded-full">
            <ShoppingCartIcon className="w-8 h-8 text-primary dark:text-primary" />
          </div>
          <h3 className="text-xl font-bold text-center text-foreground mb-2">
            {t("manualOrder.k_121")}
          </h3>
          <p className="text-center text-foreground dark:text-muted-foreground mb-4">
            {t("manualOrder.k_122")}
          </p>

          {/* Order Summary in Modal */}
          <div className="bg-gray-50 dark:bg-muted rounded-lg p-4 mb-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-muted-foreground">
                {t("manualOrder.k_123")}
              </span>
              <span className="font-medium text-foreground">
                {firstName} {lastName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-muted-foreground">
                {t("manualOrder.k_124")}
              </span>
              <span
                className="font-medium text-foreground"
                dir="ltr"
              >
                {phone}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-muted-foreground">
                {t("manualOrder.k_125")}
              </span>
              <span className="font-medium text-foreground">
                {cartItems.length} {t("manualOrder.k_126")}
                {cartItems.reduce((acc, item) => acc + item.quantity, 0)}{" "}
                {t("manualOrder.k_119")}
              </span>
            </div>
            <div className="pt-2 border-t border-border">
              <div className="text-gray-600 dark:text-muted-foreground mb-2">
                {t("manualOrder.k_127")}
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {cartItems.map((item) => {
                  const variantSummary = buildVariantSummary(item);

                  return (
                    <div
                      key={`${item.productId}-${item.variantId || "default"}-confirm`}
                      className="rounded-md bg-white/70 dark:bg-muted px-3 py-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-foreground">
                            {item.name}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {item.color && (
                              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary dark:bg-primary/20 dark:text-primary">
                                {t("manualOrder.k_85")} {item.color}
                              </span>
                            )}
                            {item.size && (
                              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground dark:bg-muted dark:text-muted-foreground">
                                {t("manualOrder.k_86")} {item.size}
                              </span>
                            )}
                            {!item.color && !item.size && variantSummary && (
                              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground dark:bg-muted dark:text-muted-foreground">
                                {variantSummary}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-left shrink-0">
                          <div className="font-semibold text-primary dark:text-primary tabular-nums">
                            {item.price.toLocaleString()} {t("manualOrder.k_75")}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {t("manualOrder.k_128")} {item.quantity}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-between pt-2 border-t border-border font-bold">
              <span className="text-foreground">
                {t("manualOrder.k_77")}
              </span>
              <span className="text-blue-600 dark:text-primary tabular-nums">
                {grandTotal.toLocaleString()} {t("manualOrder.k_75")}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 border border-border rounded-lg text-foreground font-medium hover:bg-muted/50 transition-colors"
            >
              {t("manualOrder.k_129")}
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 px-4 bg-success dark:bg-success text-white rounded-lg font-medium hover:bg-success dark:hover:bg-success transition-colors"
            >
              {t("manualOrder.k_130")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
