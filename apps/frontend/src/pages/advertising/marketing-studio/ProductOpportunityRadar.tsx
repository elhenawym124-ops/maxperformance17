import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Package,
  Search,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  X,
} from "lucide-react";
import { apiClient } from "../../../services/apiClient";
import type { MarketingProduct } from "./types";

interface ProductOpportunityRadarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProduct: MarketingProduct | null;
  onSelectProduct: (product: MarketingProduct) => void;
}

export const ProductOpportunityRadar: React.FC<ProductOpportunityRadarProps> = ({
  isOpen,
  onClose,
  selectedProduct,
  onSelectProduct,
}) => {
  const [products, setProducts] = useState<MarketingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "TOP_MARGIN" | "READY" | "ALERT">("ALL");

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<{ success?: boolean; data?: any[] }>("/products", {
        params: { limit: 50 },
      });
      const rawData = res.data?.data;
      if (Array.isArray(rawData)) {
        const mapped: MarketingProduct[] = rawData.map((p) => {
          const price = Number(p.price) || 0;
          const cost = Number(p.cost || p.costPrice || 0);
          const stock = typeof p.inventory === "number" ? p.inventory : (Number(p.stock) || 25);
          const rawImages = Array.isArray(p.images) ? p.images : [];
          const mainImg = typeof p.mainImage === "string" ? p.mainImage : null;
          const allImages = Array.from(new Set([mainImg, ...rawImages].filter(Boolean) as string[]));

          const variants = Array.isArray(p.variants)
            ? p.variants.map((v: any) => ({
                id: v.id ? String(v.id) : undefined,
                name: v.name || v.color || "متغير",
                image: v.image || null,
                images: Array.isArray(v.images) ? v.images : null,
              }))
            : [];

          return {
            id: String(p.id),
            name: String(p.name || "منتج بدون اسم"),
            slug: typeof p.slug === "string" ? p.slug : undefined,
            price,
            cost,
            stock,
            mainImage: mainImg,
            images: allImages,
            variants,
            category: typeof p.category?.name === "string" ? p.category.name : undefined,
          };
        });
        setProducts(mapped);
        if (mapped.length > 0 && !selectedProduct) {
          onSelectProduct(mapped[0]);
        }
      }
    } catch (err) {
      console.warn("[ProductOpportunityRadar] Failed to load store products:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedProduct, onSelectProduct]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      const matchQuery = search.trim() === "" || p.name.toLowerCase().includes(search.toLowerCase());
      if (!matchQuery) return false;
      if (filterType === "READY") return (p.stock || 0) >= 10;
      if (filterType === "ALERT") return (p.stock || 0) < 10;
      return true;
    });

    if (filterType === "TOP_MARGIN") {
      result = [...result].sort((a, b) => {
        const marginA = a.cost && a.cost > 0 ? (a.price - a.cost) / a.price : 0;
        const marginB = b.cost && b.cost > 0 ? (b.price - b.cost) / b.price : 0;
        return marginB - marginA;
      });
    }

    return result;
  }, [products, search, filterType]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="flex-1 cursor-pointer" onClick={onClose} aria-hidden="true" />

      {/* Slide-over Drawer */}
      <aside
        aria-label="كتالوج رادار منتجات المتجر"
        className="w-full sm:w-[420px] max-w-full h-full bg-white dark:bg-muted border-r sm:border-r-0 sm:border-l border-border dark:border-border shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className="p-4 border-b border-border dark:border-border flex items-center justify-between bg-muted dark:bg-muted">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary text-white shadow-sm">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground dark:text-white flex items-center gap-2">
                اختر منتج الحملة
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary dark:bg-primary text-primary dark:text-primary">
                  {products.length} منتج
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={loadProducts}
              disabled={loading}
              className="p-1.5 text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground rounded-lg hover:bg-muted dark:hover:bg-muted transition"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-primary" : ""}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground rounded-lg hover:bg-muted dark:hover:bg-muted transition"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Smart Marketing Filters */}
        <div className="p-3 border-b border-border dark:border-border space-y-2 bg-white dark:bg-muted">
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم أو التصنيف..."
              className="w-full ps-3 pe-9 py-2 text-xs rounded-xl border border-border dark:border-border bg-muted dark:bg-muted text-foreground dark:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setFilterType("ALL")}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium whitespace-nowrap transition ${
                filterType === "ALL"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-foreground"
                  : "bg-slate-100 text-foreground dark:bg-muted dark:text-muted-foreground hover:bg-muted"
              }`}
            >
              الكل
            </button>

            <button
              type="button"
              onClick={() => setFilterType("TOP_MARGIN")}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium whitespace-nowrap flex items-center gap-1 transition ${
                filterType === "TOP_MARGIN"
                  ? "bg-blue-600 text-white"
                  : "bg-blue-50 text-primary dark:bg-primary/40 dark:text-primary"
              }`}
            >
              <TrendingUp className="w-3 h-3" /> الأعلى هامش ربح
            </button>

            <button
              type="button"
              onClick={() => setFilterType("READY")}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium whitespace-nowrap flex items-center gap-1 transition ${
                filterType === "READY"
                  ? "bg-emerald-600 text-white"
                  : "bg-emerald-50 text-success dark:bg-success/40 dark:text-success"
              }`}
            >
              <CheckCircle2 className="w-3 h-3" /> جاهز للحملة
            </button>

            <button
              type="button"
              onClick={() => setFilterType("ALERT")}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium whitespace-nowrap flex items-center gap-1 transition ${
                filterType === "ALERT"
                  ? "bg-amber-600 text-white"
                  : "bg-amber-50 text-warning dark:bg-warning/40 dark:text-warning"
              }`}
            >
              <AlertTriangle className="w-3 h-3" /> تنبيه مخزون
            </button>
          </div>
        </div>

        {/* Products List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-primary" />
              جاري فحص المنتجات ومعدلات الأرباح...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              لم يتم العثور على منتجات مطابقة للبحث.
            </div>
          ) : (
            filteredProducts.map((product) => {
              const isSelected = selectedProduct?.id === product.id;
              const hasStock = (product.stock || 0) > 10;
              const margin =
                product.cost && product.cost > 0
                  ? Math.round(((product.price - product.cost) / product.price) * 100)
                  : null;
              const breakEvenRoas =
                product.cost && product.cost > 0 && product.price > product.cost
                  ? (product.price / (product.price - product.cost)).toFixed(1)
                  : null;

              return (
                <div
                  key={product.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    onSelectProduct(product);
                    onClose();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectProduct(product);
                      onClose();
                    }
                  }}
                  className={`w-full text-right p-3 rounded-xl transition-all border flex items-center gap-3 cursor-pointer group ${
                    isSelected
                      ? "bg-blue-50 dark:bg-primary/40 border-primary dark:border-primary shadow-sm ring-1 ring-primary"
                      : "bg-white dark:bg-muted border-border dark:border-border hover:border-primary dark:hover:border-primary hover:bg-muted dark:hover:bg-muted"
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-lg bg-muted dark:bg-muted overflow-hidden flex-shrink-0 border border-border dark:border-border flex items-center justify-center">
                    {product.mainImage ? (
                      <img
                        src={product.mainImage}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <Package className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h3 className="text-xs font-bold text-foreground dark:text-muted-foreground truncate">
                        {product.name}
                      </h3>
                      {isSelected && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-white font-bold flex-shrink-0">
                          المحدد
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-black text-foreground dark:text-muted-foreground">
                        {product.price} ج.م
                      </span>
                      {margin !== null && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-success dark:bg-success/60 text-success dark:text-success font-bold">
                          ربح {margin}%
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            hasStock ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                        />
                        المخزون: {product.stock}
                      </span>
                      {breakEvenRoas && (
                        <span className="text-slate-400 font-mono">
                          B.E ROAS: {breakEvenRoas}x
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </div>
  );
};
