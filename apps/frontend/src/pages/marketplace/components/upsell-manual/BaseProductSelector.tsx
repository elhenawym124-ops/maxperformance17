import React from "react";
import { ExternalLink, Loader2, Package, Search, ShoppingCart, Mail, X } from "lucide-react";
import { RelationBadge } from "./RelationBadge";
import {
  formatPrice,
  RELATION_ORDER,
  RELATION_CONFIG_DATA,
  type ManagedProduct,
  type ManagedRelationType,
  type RelationBuckets,
} from "../../types/upsellManualTypes";

interface BaseProductSelectorProps {
  productQuery: string;
  setProductQuery: (query: string) => void;
  catalogLoading: boolean;
  catalogError: string;
  selectedProduct: ManagedProduct | null;
  filteredProducts: ManagedProduct[];
  relationBuckets: RelationBuckets;
  loadProductRelations: (productId: string) => Promise<void>;
  resetSelectedProduct: () => void;
  onNavigateToProductEdit: (productId: string) => void;
}

const getRelationIcon = (type: ManagedRelationType) => {
  switch (type) {
    case "related":
      return <Package size={16} />;
    case "crossSell":
      return <ShoppingCart size={16} />;
    case "upsell":
      return <Mail size={16} />;
  }
};

export function BaseProductSelector({
  productQuery,
  setProductQuery,
  catalogLoading,
  catalogError,
  selectedProduct,
  filteredProducts,
  relationBuckets,
  loadProductRelations,
  resetSelectedProduct,
  onNavigateToProductEdit,
}: BaseProductSelectorProps) {
  return (
    <div className="rounded-[24px] border border-border bg-muted p-5 dark:border-border dark:bg-muted">
      <label className="block space-y-2">
        <span className="text-sm font-semibold text-foreground">
          ابحث عن المنتج الأساسي
        </span>
        <div className="relative">
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={productQuery}
            onChange={(event) => setProductQuery(event.target.value)}
            placeholder="ابحث بالاسم أو SKU أو الفئة"
            autoComplete="off"
            className="w-full rounded-xl border border-border bg-white py-3 ps-11 pe-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 dark:border-border dark:bg-muted dark:text-white dark:focus-visible:ring-blue-900/40"
          />
        </div>
      </label>

      {catalogError ? (
        <div className="mt-4 rounded-xl border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive dark:border-destructive/30 dark:bg-destructive/20 dark:text-destructive">
          {catalogError}
        </div>
      ) : null}

      {catalogLoading ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-foreground dark:text-muted-foreground">
          <Loader2 size={16} className="animate-spin" />
          جارٍ تحميل المنتجات...
        </div>
      ) : null}

      {!selectedProduct ? (
        <div className="mt-4 space-y-3">
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
            منتجات جاهزة للاختيار
          </div>
          <div className="grid gap-3">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => void loadProductRelations(product.id)}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3 text-left transition-colors hover:border-primary hover:bg-primary/50 dark:border-border dark:bg-muted dark:hover:border-primary/50 dark:hover:bg-primary/20"
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
                <RelationBadge
                  label={product.isActive ? "Active" : "Hidden"}
                  tone={product.isActive ? "green" : "neutral"}
                />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-[24px] border border-primary bg-primary/80 p-5 dark:border-primary/40 dark:bg-primary/20">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <RelationBadge label="Base product" />
                <RelationBadge
                  label={selectedProduct.isActive ? "Published" : "Hidden"}
                  tone={selectedProduct.isActive ? "green" : "neutral"}
                />
              </div>
              <h3 className="mt-3 text-xl font-black text-foreground">
                {selectedProduct.name}
              </h3>
              <p className="mt-2 text-sm leading-7 text-foreground dark:text-muted-foreground">
                {selectedProduct.sku
                  ? `SKU: ${selectedProduct.sku}`
                  : `ID: ${selectedProduct.id}`}
                {selectedProduct.categoryName
                  ? ` · الفئة: ${selectedProduct.categoryName}`
                  : ""}
                {` · السعر: ${formatPrice(selectedProduct.price)}`}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onNavigateToProductEdit(selectedProduct.id)}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-border hover:text-foreground dark:border-border dark:bg-muted dark:text-muted-foreground dark:hover:border-border dark:hover:text-white"
              >
                <ExternalLink size={16} />
                فتح صفحة المنتج
              </button>
              <button
                type="button"
                onClick={resetSelectedProduct}
                className="inline-flex items-center gap-2 rounded-full border border-transparent bg-white/70 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-white dark:bg-primary/40 dark:text-primary dark:hover:bg-primary/60"
              >
                <X size={16} />
                تغيير المنتج
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {RELATION_ORDER.map((relationType) => (
              <div
                key={relationType}
                className="rounded-xl border border-white/70 bg-white/80 p-4 dark:border-border dark:bg-muted"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 text-sm font-bold text-foreground">
                    {getRelationIcon(relationType)}
                    {RELATION_CONFIG_DATA[relationType].title}
                  </div>
                  <RelationBadge
                    label={`${relationBuckets[relationType].length}`}
                    tone={relationType === "upsell" ? "amber" : "blue"}
                  />
                </div>
                <p className="mt-2 text-xs leading-6 text-foreground dark:text-muted-foreground">
                  {RELATION_CONFIG_DATA[relationType].placementNote}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
