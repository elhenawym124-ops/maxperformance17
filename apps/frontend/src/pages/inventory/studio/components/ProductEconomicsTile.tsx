import React from "react";
import { Package } from "lucide-react";
import type { StudioEntity } from "../../../components/agent-studio/types";

interface ProductEconomicsTileProps {
  product: StudioEntity;
  price: number;
  cost: number;
  stock: number;
  isLowStock: boolean;
}

export const ProductEconomicsTile: React.FC<ProductEconomicsTileProps> = ({
  product,
  price,
  cost,
  stock,
  isLowStock,
}) => {
  return (
    <div className="p-3.5 rounded-xl border border-border dark:border-border bg-white dark:bg-muted shadow-2xs">
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-xl bg-muted dark:bg-muted overflow-hidden border border-border dark:border-border shrink-0 flex items-center justify-center">
          {product.mainImage ? (
            <img
              src={product.mainImage}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <Package className="w-7 h-7 text-muted-foreground" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs sm:text-sm font-bold text-foreground dark:text-white truncate">
              {product.name}
            </h3>
            {product.category && (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted dark:bg-muted text-foreground dark:text-muted-foreground font-medium shrink-0">
                {product.category}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-foreground dark:text-muted-foreground">
            <span className="tabular-nums font-mono">
              سعر البيع:{" "}
              <strong className="text-slate-900 dark:text-white font-black">
                {price} ج.م
              </strong>
            </span>
            {cost > 0 && (
              <span className="tabular-nums font-mono">
                التكلفة:{" "}
                <strong className="text-slate-700 dark:text-muted-foreground font-bold">
                  {cost} ج.م
                </strong>
              </span>
            )}
            <span className="tabular-nums font-mono">
              الرصيد:{" "}
              <strong
                className={`font-black ${
                  isLowStock ? "text-amber-600 dark:text-warning" : "text-emerald-600 dark:text-success"
                }`}
              >
                {stock} قطعة
              </strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
