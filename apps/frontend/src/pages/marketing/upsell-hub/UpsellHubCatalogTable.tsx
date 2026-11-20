import React from "react";
import {
  Search,
  X,
  Loader2,
  Package,
  TrendingUp,
  ShoppingCart,
  Tag,
  Link2,
} from "lucide-react";
import { CatalogProduct } from "./types";

interface UpsellHubCatalogTableProps {
  catalogLoading: boolean;
  filteredCatalog: CatalogProduct[];
  searchQuery: string;
  filterType: "all" | "with_offers" | "without_offers";
  categoryFilter: string;
  categories: string[];
  stats: {
    total: number;
    withOffers: number;
  };
  setSearchQuery: (query: string) => void;
  setFilterType: (type: "all" | "with_offers" | "without_offers") => void;
  setCategoryFilter: (category: string) => void;
  openEditModal: (product: CatalogProduct) => void;
}

export const UpsellHubCatalogTable: React.FC<UpsellHubCatalogTableProps> = ({
  catalogLoading,
  filteredCatalog,
  searchQuery,
  filterType,
  categoryFilter,
  categories,
  stats,
  setSearchQuery,
  setFilterType,
  setCategoryFilter,
  openEditModal,
}) => {
  return (
    <div className="space-y-4 rounded-xl border border-border bg-white p-4 shadow-sm sm:p-6 dark:border-border dark:bg-muted">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-base font-black text-foreground sm:text-lg dark:text-white">
            إدارة عروض الكتالوج والمنتجات
          </h2>
          <p className="text-xs text-muted-foreground">
            اختر المنتج لربط بدائل الترقية والمكملات التلقائية أو المخصصة.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground tabular-nums">
            {filteredCatalog.length} منتج
          </span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث بالاسم، SKU أو الفئة..."
            className="w-full rounded-xl border border-border bg-muted py-2.5 ps-3 pe-9 text-xs text-foreground placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-border dark:bg-muted dark:text-white dark:placeholder:text-gray-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="مسح البحث"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold transition ${
              filterType === "all"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-100 text-foreground hover:bg-muted dark:bg-muted dark:text-muted-foreground"
            }`}
          >
            الكل
          </button>
          <button
            type="button"
            onClick={() => setFilterType("with_offers")}
            className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold transition ${
              filterType === "with_offers"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-100 text-foreground hover:bg-muted dark:bg-muted dark:text-muted-foreground"
            }`}
          >
            به عروض (<span className="tabular-nums">{stats.withOffers}</span>)
          </button>
          <button
            type="button"
            onClick={() => setFilterType("without_offers")}
            className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold transition ${
              filterType === "without_offers"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-100 text-foreground hover:bg-muted dark:bg-muted dark:text-muted-foreground"
            }`}
          >
            بدون عروض (
            <span className="tabular-nums">
              {stats.total - stats.withOffers}
            </span>
            )
          </button>

          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="shrink-0 rounded-xl border border-border bg-muted px-3 py-2 text-xs font-bold text-foreground focus:outline-none dark:border-border dark:bg-muted dark:text-muted-foreground"
            >
              <option value="all">كل الفئات</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Catalog Table */}
      {catalogLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-3 text-xs font-bold text-muted-foreground">
            جاري تحميل كتالوج المنتجات...
          </p>
        </div>
      ) : filteredCatalog.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center dark:border-border">
          <Package className="h-10 w-10 text-muted-foreground dark:text-foreground" />
          <p className="mt-3 text-sm font-bold text-foreground">
            لا توجد منتجات مطابقة لخيارات البحث
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            جرّب تغيير كلمة البحث أو إعادة تعيين الفلتر.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-xl border border-border dark:divide-border dark:border-border">
          {filteredCatalog.map((product) => {
            const upsellCount = product.relations.upsell.length;
            const crossSellCount = product.relations.crossSell.length;
            const relatedCount = product.relations.related.length;
            const hasAny =
              upsellCount > 0 || crossSellCount > 0 || relatedCount > 0;

            return (
              <div
                key={product.id}
                className="flex flex-col justify-between gap-3 p-3 transition hover:bg-muted sm:flex-row sm:items-center sm:p-4 dark:hover:bg-muted"
              >
                {/* Product Info */}
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border bg-muted dark:border-border dark:bg-muted">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <Package className="h-5 w-5" />
                      </div>
                    )}
                  </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-foreground">
                          {product.name}
                        </h4>
                        {product.categoryName && (
                          <span className="hidden rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-foreground sm:inline-block dark:bg-muted dark:text-muted-foreground">
                            {product.categoryName}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {product.price !== null && (
                          <span className="font-bold text-foreground dark:text-muted-foreground tabular-nums">
                            {product.price.toLocaleString("en-US")} ج.م
                          </span>
                        )}
                        {product.sku && (
                          <span className="text-[11px] text-muted-foreground">
                            SKU: {product.sku}
                          </span>
                        )}
                      </div>
                    </div>
                </div>

                {/* Relations Badges & CTA */}
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {upsellCount > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-black text-success dark:bg-success/40 dark:text-success">
                        <TrendingUp className="h-3 w-3" />
                        <span className="tabular-nums">{upsellCount}</span> ترقية
                      </span>
                    ) : null}

                    {crossSellCount > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        <ShoppingCart className="h-3 w-3" />
                        <span className="tabular-nums">{crossSellCount}</span> مكملات
                      </span>
                    ) : null}

                    {relatedCount > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-black text-primary dark:bg-primary/40 dark:text-primary">
                        <Tag className="h-3 w-3" />
                        <span className="tabular-nums">{relatedCount}</span> مشابه
                      </span>
                    ) : null}

                    {!hasAny && (
                      <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold text-muted-foreground dark:bg-muted dark:text-muted-foreground">
                        لا توجد عروض مخصصة (تلقائي)
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => openEditModal(product)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-muted px-3.5 py-2 text-xs font-bold text-foreground transition hover:bg-blue-600 hover:text-white dark:bg-muted dark:text-white dark:hover:bg-blue-600 cursor-pointer"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    تخصيص العروض
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
