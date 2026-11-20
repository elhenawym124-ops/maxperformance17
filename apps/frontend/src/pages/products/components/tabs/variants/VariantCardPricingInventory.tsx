import React from "react";
import {
  CurrencyDollarIcon,
  CubeIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { ProductVariant } from "./types";

interface VariantCardPricingInventoryProps {
  idx: number;
  variant: ProductVariant;
  updateVariant: (idx: number, field: keyof ProductVariant, value: any) => void;
  displayCurrency: string;
  defaultPricing?: {
    price?: number;
    comparePrice?: number;
    cost?: number;
  };
  syncWithProductPricing?: (targetIdx?: number) => void;
}

export const VariantCardPricingInventory: React.FC<VariantCardPricingInventoryProps> = ({
  idx,
  variant,
  updateVariant,
  displayCurrency,
  defaultPricing,
  syncWithProductPricing,
}) => {
  return (
    <>
      {/* Pricing Section */}
      <div className="border-b border-border pb-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h5 className="text-sm font-semibold text-foreground flex items-center">
            <CurrencyDollarIcon className="h-4 w-4 ms-1" />
            التسعير
          </h5>
          {defaultPricing?.price !== undefined &&
            Number(defaultPricing.price) > 0 && (
              <button
                type="button"
                onClick={() => syncWithProductPricing?.(idx)}
                className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary dark:hover:text-primary hover:underline"
                title="استعادة تسعير المنتج الأساسي لهذا المتغير"
              >
                <ArrowPathIcon className="h-3 w-3" />
                استعادة تسعير المنتج الأساسي ({defaultPricing.price}{" "}
                {displayCurrency})
              </button>
            )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              السعر في الخصم ({displayCurrency})
            </label>
            <input
              type="number"
              value={
                variant.price !== undefined && variant.price !== null
                  ? variant.price
                  : ""
              }
              onChange={(e) =>
                updateVariant(
                  idx,
                  "price",
                  e.target.value !== "" ? parseFloat(e.target.value) : undefined,
                )
              }
              min="0"
              step="0.01"
              placeholder="السعر بعد الخصم"
              className="block w-full border-border dark:bg-muted dark:text-white rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm tabular-nums"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              السعر الأساسي ({displayCurrency})
            </label>
            <input
              type="number"
              value={
                variant.comparePrice !== undefined &&
                variant.comparePrice !== null
                  ? variant.comparePrice
                  : ""
              }
              onChange={(e) =>
                updateVariant(
                  idx,
                  "comparePrice",
                  e.target.value !== "" ? parseFloat(e.target.value) : undefined,
                )
              }
              min="0"
              step="0.01"
              placeholder="السعر قبل الخصم"
              className="block w-full border-border dark:bg-muted dark:text-white rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm tabular-nums"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              سعر الشراء ({displayCurrency})
            </label>
            <input
              type="number"
              value={
                variant.cost !== undefined && variant.cost !== null
                  ? variant.cost
                  : ""
              }
              onChange={(e) =>
                updateVariant(
                  idx,
                  "cost",
                  e.target.value !== "" ? parseFloat(e.target.value) : undefined,
                )
              }
              min="0"
              step="0.01"
              placeholder="تكلفة الشراء"
              className="block w-full border-border dark:bg-muted dark:text-white rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm tabular-nums"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          💡 يتم أخذ التسعير تلقائياً من إعدادات تسعير المنتج الأساسي، ويمكنك تخصيص أي قيمة بحرية لهذا المتغير.
        </p>
      </div>

      {/* Inventory Section */}
      <div className="border-b border-border pb-4">
        <h5 className="text-sm font-semibold text-foreground mb-3 flex items-center">
          <CubeIcon className="h-4 w-4 ms-1" />
          المخزون
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center justify-between bg-muted dark:bg-muted p-3 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-foreground">
                تتبع المخزون
              </label>
            </div>
            <input
              type="checkbox"
              checked={variant.trackInventory}
              onChange={(e) =>
                updateVariant(idx, "trackInventory", e.target.checked)
              }
              className="h-4 w-4 text-primary dark:text-primary focus:ring-primary border-border rounded"
            />
          </div>
          {variant.trackInventory && (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  الكمية
                </label>
                <input
                  type="number"
                  value={variant.stock || 0}
                  onChange={(e) =>
                    updateVariant(
                      idx,
                      "stock",
                      parseInt(e.target.value) || 0,
                    )
                  }
                  min="0"
                  className="block w-full border-border dark:bg-muted dark:text-white rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm tabular-nums"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  حد التنبيه
                </label>
                <input
                  type="number"
                  value={variant.lowStockThreshold || ""}
                  onChange={(e) =>
                    updateVariant(
                      idx,
                      "lowStockThreshold",
                      parseInt(e.target.value) || undefined,
                    )
                  }
                  min="0"
                  placeholder="5"
                  className="block w-full border-border dark:bg-muted dark:text-white rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm tabular-nums"
                />
              </div>
              <div className="flex items-center justify-between bg-muted dark:bg-muted p-3 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    طلبات مسبقة
                  </label>
                  <p className="text-xs text-muted-foreground">
                    السماح بالشراء عند نفاد المخزون
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={variant.allowBackorders || false}
                  onChange={(e) =>
                    updateVariant(idx, "allowBackorders", e.target.checked)
                  }
                  className="h-4 w-4 text-primary dark:text-primary focus:ring-primary border-border rounded"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};
