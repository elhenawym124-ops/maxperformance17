import React from "react";
import { Search } from "lucide-react";
import { RelationBadge } from "./RelationBadge";
import type { ManagedProduct, RelationConfigItem } from "../../types/upsellManualTypes";

interface CandidateProductPickerProps {
  selectedProduct: ManagedProduct | null;
  candidateQuery: string;
  setCandidateQuery: (query: string) => void;
  candidateProducts: ManagedProduct[];
  activeRelation: string;
  currentRelationConfig: RelationConfigItem;
  addProductToRelation: (productId: string) => void;
}

export function CandidateProductPicker({
  selectedProduct,
  candidateQuery,
  setCandidateQuery,
  candidateProducts,
  activeRelation,
  currentRelationConfig,
  addProductToRelation,
}: CandidateProductPickerProps) {
  return (
    <div className="rounded-[24px] border border-border bg-muted p-5 dark:border-border dark:bg-muted">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="text-lg font-black text-foreground">
            إضافة منتجات إلى {currentRelationConfig.title}
          </h4>
          <p className="mt-1 text-sm leading-7 text-foreground dark:text-muted-foreground">
            {currentRelationConfig.help}
          </p>
        </div>
        <RelationBadge label={currentRelationConfig.placementLabel} tone="blue" />
      </div>

      {!selectedProduct ? (
        <div className="mt-4 rounded-xl border border-dashed border-border px-4 py-6 text-sm leading-7 text-foreground dark:border-border dark:text-muted-foreground">
          اختر المنتج الأساسي أولًا من الجزء العلوي، ثم ابدأ في ربط المنتجات له.
        </div>
      ) : (
        <>
          <label className="mt-5 block space-y-2">
            <span className="text-sm font-semibold text-foreground">
              ابحث عن منتج لإضافته
            </span>
            <div className="relative">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                value={candidateQuery}
                onChange={(event) => setCandidateQuery(event.target.value)}
                placeholder="ابحث بالاسم أو SKU أو الفئة"
                autoComplete="off"
                className="w-full rounded-xl border border-border bg-white py-3 ps-11 pe-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 dark:border-border dark:bg-muted dark:text-white dark:focus-visible:ring-blue-900/40"
              />
            </div>
          </label>

          <div className="mt-4 grid gap-3">
            {candidateProducts.length > 0 ? (
              candidateProducts.map((product) => (
                <div
                  key={`${activeRelation}-${product.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3 dark:border-border dark:bg-muted"
                >
                  <div className="min-w-0">
                    <div className="truncate font-bold text-foreground">
                      {product.name}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {product.sku ? `SKU: ${product.sku}` : `ID: ${product.id}`}
                      {product.categoryName ? ` · ${product.categoryName}` : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => addProductToRelation(product.id)}
                    className="rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-primary"
                  >
                    إضافة
                  </button>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-border px-4 py-6 text-sm leading-7 text-foreground dark:border-border dark:text-muted-foreground">
                لا توجد منتجات مناسبة للبحث الحالي. جرّب كلمة أخرى أو ابدأ بدون بحث.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
