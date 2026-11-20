import React from "react";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { RelationBadge } from "./RelationBadge";
import { formatPrice, type ManagedProduct } from "../../types/upsellManualTypes";

interface LinkedProductsReorderListProps {
  currentRelationProducts: ManagedProduct[];
  activeRelation: string;
  moveProduct: (productId: string, direction: "up" | "down") => void;
  removeProductFromRelation: (productId: string) => void;
}

export function LinkedProductsReorderList({
  currentRelationProducts,
  activeRelation,
  moveProduct,
  removeProductFromRelation,
}: LinkedProductsReorderListProps) {
  return (
    <div className="rounded-[24px] border border-border bg-white p-5 dark:border-border dark:bg-muted">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="text-lg font-black text-foreground">
            ترتيب المنتجات المرتبطة
          </h4>
          <p className="mt-1 text-sm leading-7 text-foreground dark:text-muted-foreground">
            الترتيب هنا مهم لأنه يحدد من سيظهر أولًا عند وجود أكثر من اقتراح.
          </p>
        </div>
        <RelationBadge
          label={`${currentRelationProducts.length} items`}
          tone={currentRelationProducts.length > 0 ? "green" : "neutral"}
        />
      </div>

      {currentRelationProducts.length > 0 ? (
        <div className="mt-4 space-y-3">
          {currentRelationProducts.map((product, index) => (
            <div
              key={`${activeRelation}-${product.id}-selected`}
              className="rounded-xl border border-border bg-muted p-4 dark:border-border dark:bg-muted"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <RelationBadge label={`#${index + 1}`} tone="neutral" />
                    {product.categoryName ? (
                      <RelationBadge label={product.categoryName} tone="blue" />
                    ) : null}
                  </div>
                  <div className="mt-3 truncate font-bold text-foreground">
                    {product.name}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {product.sku ? `SKU: ${product.sku}` : `ID: ${product.id}`}
                    {` · السعر: ${formatPrice(product.price)}`}
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => moveProduct(product.id, "up")}
                    disabled={index === 0}
                    className="rounded-full border border-border p-2 text-foreground transition-colors hover:border-border hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 dark:border-border dark:text-muted-foreground dark:hover:border-border dark:hover:text-white"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveProduct(product.id, "down")}
                    disabled={index === currentRelationProducts.length - 1}
                    className="rounded-full border border-border p-2 text-foreground transition-colors hover:border-border hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 dark:border-border dark:text-muted-foreground dark:hover:border-border dark:hover:text-white"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeProductFromRelation(product.id)}
                    className="rounded-full border border-destructive p-2 text-destructive transition-colors hover:bg-destructive/10 dark:border-destructive/40 dark:text-destructive dark:hover:bg-destructive/20"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-border px-4 py-6 text-sm leading-7 text-foreground dark:border-border dark:text-muted-foreground">
          لا توجد منتجات مرتبطة في هذا التبويب بعد. أضف أول منتج من القائمة على
          اليسار.
        </div>
      )}
    </div>
  );
}
