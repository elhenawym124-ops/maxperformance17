import React from "react";
import { TagIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { useCurrency } from "../../../../hooks/useCurrency";

interface OrderItemsTotalsProps {
  isEditing: boolean;
  totals: {
    subtotal: number;
    shipping: number;
    tax: number;
    discount: number;
    total: number;
  };
  discountReason?: string | null;
  editDiscountReason?: string;
  onShippingChange?: (value: number) => void;
  onTaxChange?: (value: number) => void;
  onDiscountChange?: (value: number) => void;
  onDiscountReasonChange?: (value: string) => void;
}

export const OrderItemsTotals: React.FC<OrderItemsTotalsProps> = ({
  isEditing,
  totals,
  discountReason,
  editDiscountReason,
  onShippingChange,
  onTaxChange,
  onDiscountChange,
  onDiscountReasonChange,
}) => {
  const { formatPrice } = useCurrency();

  return (
    <div className="px-6 py-4 bg-muted dark:dark:bg-muted border-t border-border dark:dark:border-border">
      <div className="space-y-2 max-w-sm me-auto">
        <div className="flex justify-between text-sm">
          <span className="text-foreground dark:dark:text-muted-foreground">
            المجموع الفرعي:
          </span>
          <span className="font-semibold text-foreground font-mono tabular-nums">
            {formatPrice(totals.subtotal)}
          </span>
        </div>

        <div className="flex justify-between text-sm items-center">
          <span className="text-foreground dark:dark:text-muted-foreground">الشحن:</span>
          {isEditing && onShippingChange ? (
            <input
              type="number"
              value={isNaN(totals.shipping) ? 0 : totals.shipping}
              onChange={(e) =>
                onShippingChange(parseFloat(e.target.value) || 0)
              }
              className="w-24 px-2 py-1 text-right text-sm border border-border rounded bg-card text-foreground focus:ring-2 focus:ring-primary font-mono tabular-nums"
              min="0"
            />
          ) : (
            <span className="font-semibold text-foreground font-mono tabular-nums">
              {formatPrice(totals.shipping)}
            </span>
          )}
        </div>

        <div className="flex justify-between text-sm items-center">
          <span className="text-foreground dark:dark:text-muted-foreground">الضريبة:</span>
          {isEditing && onTaxChange ? (
            <input
              type="number"
              value={isNaN(totals.tax) ? 0 : totals.tax}
              onChange={(e) => onTaxChange(parseFloat(e.target.value) || 0)}
              className="w-24 px-2 py-1 text-right text-sm border border-border rounded bg-card text-foreground focus:ring-2 focus:ring-primary font-mono tabular-nums"
              min="0"
            />
          ) : (
            <span className="font-semibold text-foreground font-mono tabular-nums">
              {formatPrice(totals.tax)}
            </span>
          )}
        </div>

        {(isEditing || totals.discount > 0) && (
          <div className="space-y-1 text-sm">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-foreground dark:dark:text-muted-foreground">الخصم:</span>
                {!isEditing && discountReason && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-destructive/10 text-destructive dark:bg-destructive/40 dark:text-destructive border border-destructive dark:border-destructive">
                    <TagIcon className="w-3 h-3 flex-shrink-0" />
                    <span>{discountReason}</span>
                  </span>
                )}
              </div>
              {isEditing && onDiscountChange ? (
                <input
                  type="number"
                  value={isNaN(totals.discount) ? 0 : totals.discount}
                  onChange={(e) => onDiscountChange(parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 text-right text-sm border border-border rounded bg-card text-foreground focus:ring-2 focus:ring-primary font-mono tabular-nums"
                  min="0"
                  placeholder="قيمة الخصم"
                />
              ) : (
                <span className="font-semibold text-destructive dark:text-destructive font-mono tabular-nums">
                  -{formatPrice(totals.discount)}
                </span>
              )}
            </div>
            {isEditing && onDiscountReasonChange && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-muted-foreground whitespace-nowrap">سبب الخصم:</span>
                <input
                  type="text"
                  value={editDiscountReason ?? ""}
                  onChange={(e) => onDiscountReasonChange(e.target.value)}
                  placeholder="مثال: كود خصم، عميل مميز، ترقية..."
                  className="flex-1 px-2 py-1 text-xs border border-border rounded bg-card text-foreground focus:ring-2 focus:ring-primary"
                />
              </div>
            )}
          </div>
        )}

        <div className="pt-2 border-t border-border">
          <div className="flex justify-between">
            <span className="text-base font-bold text-foreground">
              الإجمالي:
            </span>
            <span className="text-xl font-bold text-primary dark:text-primary font-mono tabular-nums">
              {formatPrice(totals.total)}
            </span>
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="mt-3 flex items-center gap-2 text-xs text-warning dark:text-warning bg-warning/10 dark:bg-warning/20 px-3 py-2 rounded-lg">
          <ExclamationCircleIcon className="w-4 h-4 flex-shrink-0" />
          <span>
            الإجمالي يتم حسابه تلقائياً بناءً على المنتجات والشحن والضرائب والخصم
          </span>
        </div>
      )}
    </div>
  );
};
