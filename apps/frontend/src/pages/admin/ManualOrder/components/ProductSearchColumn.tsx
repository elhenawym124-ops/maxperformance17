import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ArchiveBoxIcon,
  XMarkIcon,
  ChevronRightIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { authService } from "../../../../services/authService";
import { apiClient } from "../../../../services/apiClient";
import { config } from "../../../../config";
import { toast } from "sonner";
import { getPrimaryImageUrl, buildOptimizedUploadImageUrl } from "../../../../utils/imageUrl";
import { parseVariantAttributes } from "../utils/variantAttributes";

interface ProductVariant {
  id: string;
  sku: string;
  price: number | string;
  stock: number;
  name: string;
  type?: string;
  color?: string;
  size?: string;
  image?: string;
  metadata?: string;
  attributeValues?: Record<string, string>;
  trackInventory?: boolean;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  stock: number;
  sku: string;
  trackInventory?: boolean;
  isActive?: boolean;
  variants: ProductVariant[];
}

interface ApiProductVariant extends Partial<ProductVariant> {
  id: string;
  availableStock?: unknown;
  fulfillableStock?: unknown;
  images?: unknown;
}

interface ApiProduct {
  id: string;
  name?: unknown;
  price?: unknown;
  mainImage?: unknown;
  image?: unknown;
  images?: unknown;
  stock?: unknown;
  availableStock?: unknown;
  fulfillableStock?: unknown;
  trackInventory?: boolean;
  isActive?: boolean;
  sku?: unknown;
  variants?: ApiProductVariant[];
  productVariants?: ApiProductVariant[];
}

/** Returns true if the item is considered in-stock (either tracking is off, or stock > 0) */
const isInStock = (item: { stock: number; trackInventory?: boolean }): boolean => {
  if (item.trackInventory === false) return true;
  return item.stock > 0;
};

const resolveStock = (...values: unknown[]): number => {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }
  return 0;
};

interface ProductSearchColumnProps {
  onAddToCart: (product: Product, variant?: ProductVariant) => void;
  mode?: "admin" | "affiliate";
  wholesaleCustomerId?: string | null;
}

// Helper function to extract unique attributes from variants
const extractAttributes = (
  variants: ProductVariant[],
): { name: string; values: string[] }[] => {
  const attributeMap: Record<string, Set<string>> = {};

  variants.forEach((variant) => {
    const attrs = parseVariantAttributes(variant);
    Object.entries(attrs).forEach(([key, value]) => {
      if (!attributeMap[key]) attributeMap[key] = new Set();
      if (value) attributeMap[key].add(value);
    });
  });

  // Sort attributes to ensure consistent order
  return Object.entries(attributeMap)
    .filter(([_, values]) => values.size > 0)
    .map(([name, values]) => ({
      name,
      values: Array.from(values).sort(),
    }));
};

interface WholesalePriceEntry {
  wholesalePrice: number;
  regularPrice: number;
  priceListName?: string;
}

const ProductSearchColumn: React.FC<ProductSearchColumnProps> = ({
  onAddToCart,
  mode = "admin",
  wholesaleCustomerId,
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Wholesale Prices State
  const [wholesalePrices, setWholesalePrices] = useState<Map<string, WholesalePriceEntry>>(new Map());

  useEffect(() => {
    if (!wholesaleCustomerId) {
      setWholesalePrices(new Map());
      return;
    }
    let cancelled = false;
    apiClient
      .get(`/wholesale/customers/${wholesaleCustomerId}/prices`)
      .then((res) => {
        const raw = res?.data?.data;
        const list: any[] = Array.isArray(raw) ? raw : (raw?.items || []);
        if (!cancelled && list) {
          const map = new Map<string, WholesalePriceEntry>();
          list.forEach((item) => {
            const wholesalePrice = Number(item.wholesalePrice !== undefined ? item.wholesalePrice : item.price);
            const regularPrice = Number(item.regularPrice || 0);
            const priceListName = item.priceListName;
            if (item.variantId) {
              map.set(`v_${item.variantId}`, { wholesalePrice, regularPrice, priceListName });
            }
            if (item.productId && !item.variantId) {
              map.set(`p_${item.productId}`, { wholesalePrice, regularPrice, priceListName });
            }
          });
          setWholesalePrices(map);
        }
      })
      .catch((err) => {
        console.debug("Failed to load wholesale customer prices", err);
      });
    return () => {
      cancelled = true;
    };
  }, [wholesaleCustomerId]);

  const getProductDisplayWholesaleInfo = useCallback((product: Product): WholesalePriceEntry | undefined => {
    const direct = wholesalePrices.get(`p_${product.id}`);
    if (direct) return direct;
    if (product.variants && product.variants.length > 0) {
      for (const v of product.variants) {
        const vInfo = wholesalePrices.get(`v_${v.id}`);
        if (vInfo) return vInfo;
      }
    }
    return undefined;
  }, [wholesalePrices]);

  const getVariantWholesaleInfo = useCallback((productId?: string, variantId?: string): WholesalePriceEntry | undefined => {
    if (variantId && wholesalePrices.has(`v_${variantId}`)) {
      return wholesalePrices.get(`v_${variantId}`);
    }
    if (productId && wholesalePrices.has(`p_${productId}`)) {
      return wholesalePrices.get(`p_${productId}`);
    }
    return undefined;
  }, [wholesalePrices]);

  // Variant Selection State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Multi-level selection state
  const [selectedAttributes, setSelectedAttributes] = useState<
    Record<string, string>
  >({});

  // Debounce search could be better, but let's keep it simple for now
  const fetchProducts = useCallback(async (query: string = "") => {
    try {
      setLoading(true);
      const token = authService.getAccessToken();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      const params = new URLSearchParams({
        page: "1",
        limit: "200",
        manualOrder: "true", // ✅ Request all products for manual order
      });

      if (query.trim()) {
        params.set("search", query.trim());
      }

      const response = await fetch(
        `${config.apiUrl}/products?${params.toString()}`,
        { headers },
      );
      const data = await response.json();

      if (data.success && data.data) {
        const sourceProducts = Array.isArray(data.data)
          ? (data.data as ApiProduct[])
          : [];
        const mappedProducts: Product[] = sourceProducts.map((p) => {
          const productStock = resolveStock(
            p.availableStock,
            p.fulfillableStock,
            p.stock,
          );

          return {
            id: p.id,
            name: String(p.name || ""),
            price: Number(p.price || 0),
            stock: productStock,
            trackInventory: p.trackInventory,
            sku: String(p.sku || ""),
            isActive: p.isActive !== undefined ? Boolean(p.isActive) : true,
            image: getPrimaryImageUrl(p.mainImage, p.image, p.images),
            variants: (p.variants || p.productVariants || []).map((v) => ({
              ...v,
              sku: String(v.sku || ""),
              name: String(v.name || ""),
              price: v.price !== undefined && v.price !== null ? (v.price as number | string) : Number(p.price || 0),
              image: getPrimaryImageUrl(v.image, v.images),
              stock: resolveStock(
                v.availableStock,
                v.fulfillableStock,
                v.stock,
                productStock,
              ),
              trackInventory: v.trackInventory,
            })),
          };
        });

        const filtered = query
          ? mappedProducts.filter(
              (p) =>
                String(p.name || "")
                  .toLowerCase()
                  .includes(query.toLowerCase()) ||
                String(p.sku || "")
                  .toLowerCase()
                  .includes(query.toLowerCase()),
            )
          : mappedProducts;

        setProducts(filtered);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error(t('manualOrder.fetchFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const handleRefresh = async () => {
    await fetchProducts(searchQuery);
    toast.success(t('manualOrder.productsRefreshed'));
  };

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleProductClick = (product: Product) => {
    if (product.isActive === false) {
      const confirmed = window.confirm(
        t(
          'manualOrder.inactiveProductConfirm',
          'تنبيه: هذا المنتج غير نشط (موقوف). هل أنت متأكد من رغبتك في اختياره وإضافته؟'
        )
      );
      if (!confirmed) {
        return;
      }
    }

    if (product.variants && product.variants.length > 0) {
      setSelectedProduct(product);
      setSelectedAttributes({});
      setIsModalOpen(true);
    } else {
      const wsInfo = getProductDisplayWholesaleInfo(product);
      if (wsInfo) {
        onAddToCart({
          ...product,
          price: wsInfo.wholesalePrice,
        });
      } else {
        onAddToCart(product);
      }
    }
  };

  const handleVariantSelect = (variant: ProductVariant) => {
    if (selectedProduct) {
      if (selectedProduct.isActive === false) {
        const confirmed = window.confirm(
          t(
            'manualOrder.inactiveProductConfirm',
            'تنبيه: هذا المنتج غير نشط (موقوف). هل أنت متأكد من رغبتك في اختياره وإضافته؟'
          )
        );
        if (!confirmed) {
          return;
        }
      }

      const wsInfo = getVariantWholesaleInfo(selectedProduct.id, variant.id);
      if (wsInfo) {
        onAddToCart(selectedProduct, {
          ...variant,
          price: wsInfo.wholesalePrice,
        });
      } else {
        onAddToCart(selectedProduct, variant);
      }
      setIsModalOpen(false);
      setSelectedProduct(null);
      setSelectedAttributes({});
    }
  };

  const handleAttributeSelect = (attrName: string, value: string) => {
    setSelectedAttributes((prev) => ({
      ...prev,
      [attrName]: value,
    }));
  };

  // Extract attributes from selected product
  const productAttributes = useMemo(() => {
    if (!selectedProduct) return [];
    return extractAttributes(selectedProduct.variants);
  }, [selectedProduct]);

  // Filter variants based on selected attributes
  const filteredVariants = useMemo(() => {
    if (!selectedProduct) return [];

    return selectedProduct.variants.filter((variant) => {
      const variantAttrs = parseVariantAttributes(variant);
      return Object.entries(selectedAttributes).every(([key, value]) => {
        return variantAttrs[key] === value;
      });
    });
  }, [selectedProduct, selectedAttributes]);

  // Get available values for each attribute based on current selection
  const getAvailableValues = (attrName: string): string[] => {
    if (!selectedProduct) return [];

    // Filter variants based on all OTHER selected attributes (not this one)
    const otherSelections = { ...selectedAttributes };
    delete otherSelections[attrName];

    const availableVariants = selectedProduct.variants.filter((variant) => {
      const variantAttrs = parseVariantAttributes(variant);
      return Object.entries(otherSelections).every(([key, value]) => {
        return variantAttrs[key] === value;
      });
    });

    const values = new Set<string>();
    availableVariants.forEach((variant) => {
      const variantAttrs = parseVariantAttributes(variant);
      if (variantAttrs[attrName]) {
        values.add(variantAttrs[attrName]);
      }
    });

    return Array.from(values);
  };

  // Check if all attributes are selected
  const allAttributesSelected =
    productAttributes.length > 0 &&
    productAttributes.every((attr) => selectedAttributes[attr.name]);

  // Get the matching variant when all attributes are selected
  const matchedVariant = useMemo(() => {
    if (!allAttributesSelected || filteredVariants.length !== 1) return null;
    return filteredVariants[0];
  }, [allAttributesSelected, filteredVariants]);

  const isAffiliateMode = mode === "affiliate";

  return (
    <div
      className="flex flex-col bg-white dark:bg-muted rounded-xl shadow-2xs border border-border dark:border-border overflow-hidden relative"
      style={{ height: "100%", maxHeight: "100%" }}
    >
      {/* Search Header */}
      <div className="px-4 py-3 border-b border-border dark:border-border bg-muted dark:bg-muted">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-xs sm:text-sm font-semibold tracking-tight text-foreground">
            {isAffiliateMode ? t('manualOrder.affiliateProducts') : t('manualOrder.products')}
          </h2>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            title={t('manualOrder.refreshProducts')}
            className="p-1 text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-muted rounded-md transition-colors disabled:opacity-50 active:scale-[0.98]"
            aria-label={t('manualOrder.refreshProducts')}
          >
            <ArrowPathIcon className={`w-3.5 h-3.5 ${loading ? "animate-spin text-foreground dark:text-muted-foreground" : ""}`} />
          </button>
        </div>
        <div className="relative">
          <input
            id="manual-order-product-search"
            type="text"
            placeholder={t('manualOrder.searchPlaceholder')}
            className="w-full ps-3 pe-9 py-2 text-xs sm:text-sm border border-border dark:border-border rounded-lg focus:ring-1 focus:ring-border focus:border-border dark:bg-muted dark:text-muted-foreground dark:placeholder-muted outline-none transition-all"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") fetchProducts(searchQuery);
            }}
          />
          <MagnifyingGlassIcon className="w-4 h-4 text-muted-foreground/80 absolute right-3 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* Product List */}
      <div className="flex-1 overflow-y-auto min-h-0 p-2 manual-order-scroll manual-order-column">
        {loading ? (
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 p-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-card border border-border dark:border-border rounded-lg overflow-hidden animate-pulse"
              >
                <div className="aspect-square bg-muted dark:bg-muted" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-muted dark:bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted dark:bg-muted rounded w-1/2" />
                  <div className="flex justify-between items-center mt-2">
                    <div className="h-5 bg-muted dark:bg-muted rounded w-16" />
                    <div className="h-8 w-8 bg-muted dark:bg-muted rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground/80">
            <ArchiveBoxIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>
              {isAffiliateMode
                ? t('manualOrder.noAffiliateProducts')
                : t('manualOrder.noProducts')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 p-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex flex-col bg-card border border-border dark:border-border rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all group cursor-pointer overflow-hidden relative"
                onClick={() => handleProductClick(product)}
              >
                {/* Image - Now larger and on top */}
                <div className="aspect-square bg-muted relative">
                    {product.image ? (
                      <img
                        src={buildOptimizedUploadImageUrl(product.image, { width: 300 })}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground dark:text-foreground">
                      <ArchiveBoxIcon className="w-12 h-12" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 dark:group-hover:bg-black/10 transition-colors" />

                  {/* Stock Badge */}
                  {product.trackInventory !== false && product.stock <= 5 && (
                    <div className="absolute top-2 left-2 bg-white/90 dark:bg-muted backdrop-blur text-destructive dark:text-destructive text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm border border-destructive dark:border-destructive">
                      {t('manualOrder.k_135')} {product.stock}
                    </div>
                  )}

                  {/* Inactive Badge */}
                  {product.isActive === false && (
                    <div className="absolute top-2 right-2 bg-warning/95 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm border border-warning backdrop-blur z-10">
                      {t('manualOrder.inactiveBadge', 'غير نشط')}
                    </div>
                  )}

                  {/* Variant Badge */}
                  {product.variants.length > 0 && (
                    <div className="absolute bottom-2 right-2 bg-blue-600 dark:bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm">
                      {t('manualOrder.k_136')}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <div className="flex items-start gap-1.5 mb-1">
                    {product.isActive === false && (
                      <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-warning dark:bg-warning/40 text-warning dark:text-warning border border-warning dark:border-warning">
                        {t('manualOrder.inactiveBadge', 'غير نشط')}
                      </span>
                    )}
                    <h3
                      className="text-sm font-medium text-foreground line-clamp-2 h-10 leading-snug flex-1"
                      title={product.name}
                    >
                      {product.name}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    {(() => {
                      const wsInfo = getProductDisplayWholesaleInfo(product);
                      const regularPrice = wsInfo?.regularPrice && wsInfo.regularPrice > 0 ? wsInfo.regularPrice : product.price;
                      return (
                        <div className="flex flex-col">
                          <div className="flex items-baseline gap-1.5">
                            <span className={`text-base font-bold ${wsInfo ? "text-emerald-600 dark:text-success" : "text-blue-600 dark:text-blue-400"}`}>
                              {wsInfo ? wsInfo.wholesalePrice : product.price} {t('manualOrder.k_75')}
                            </span>
                            {wsInfo && regularPrice > wsInfo.wholesalePrice && (
                              <span className="text-xs text-muted-foreground/80 line-through">
                                {regularPrice}
                              </span>
                            )}
                          </div>
                          {wsInfo && (
                            <span
                              className="inline-flex items-center rounded-full bg-primary dark:bg-primary/40 border border-primary dark:border-primary px-1.5 py-0.5 text-[9px] font-bold text-primary dark:text-primary w-fit mt-0.5"
                              title={wsInfo.priceListName || 'سعر جملة'}
                            >
                              سعر جملة
                            </span>
                          )}
                        </div>
                      );
                    })()}

                    <button
                      className="p-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProductClick(product);
                      }}
                    >
                      <PlusIcon className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-[10px] text-muted-foreground/80 mt-1 truncate">
                    SKU: {product.sku || "N/A"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Variant Selection Modal */}
      {isModalOpen && selectedProduct && (
        <div className="absolute inset-0 z-50 bg-black/50 dark:bg-muted backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-border dark:border-border flex justify-between items-center bg-muted dark:bg-muted">
              <div className="flex items-center gap-2 truncate pe-4">
                <h3 className="font-bold text-foreground truncate">
                  {selectedProduct.name}
                </h3>
                {selectedProduct.isActive === false && (
                  <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded bg-warning dark:bg-warning/50 text-warning dark:text-warning border border-warning dark:border-warning">
                    {t('manualOrder.inactiveBadge', 'غير نشط')}
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedAttributes({});
                }}
                className="p-1 hover:bg-muted rounded-full text-muted-foreground"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {selectedProduct.isActive === false && (
                <div className="mb-4 p-2.5 bg-warning/10 dark:bg-warning/20 border border-warning dark:border-warning rounded-lg text-xs text-warning dark:text-warning flex items-center gap-2">
                  <span className="font-bold">⚠️ تنبيه:</span>
                  <span>{t('manualOrder.inactiveWarningNote', 'هذا المنتج غير نشط حالياً (موقوف).')}</span>
                </div>
              )}
              {/* Multi-level attribute selection */}
              {productAttributes.length > 0 ? (
                <div className="space-y-4">
                  {productAttributes.map((attr) => {
                    const availableValues = getAvailableValues(attr.name);
                    const isSelected = selectedAttributes[attr.name];

                    return (
                      <div key={attr.name} className="space-y-2">
                        <label className="block text-sm font-semibold text-foreground">
                          {attr.name}
                          {isSelected && (
                            <span className="text-blue-600 dark:text-blue-400 me-2">
                              : {isSelected}
                            </span>
                          )}
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {attr.values.map((value) => {
                            const isAvailable = availableValues.includes(value);
                            const isActive =
                              selectedAttributes[attr.name] === value;

                            return (
                              <button
                                key={value}
                                onClick={() =>
                                  handleAttributeSelect(attr.name, value)
                                }
                                disabled={!isAvailable}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all
                                    ${
                                      isActive
                                        ? "bg-blue-600 dark:bg-blue-500 text-white border-2 border-blue-600 dark:border-blue-500"
                                        : isAvailable
                                          ? "bg-card text-foreground border-2 border-border hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                          : "bg-gray-100 dark:bg-muted text-muted-foreground/80 border-2 border-border dark:border-border cursor-not-allowed line-through"
                                    }
                                `}
                              >
                                {value}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* Selected variant info & add button */}
                  {matchedVariant && (
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          {(() => {
                            const wsInfo = getVariantWholesaleInfo(selectedProduct.id, matchedVariant.id);
                            const regPrice = wsInfo?.regularPrice && wsInfo.regularPrice > 0 ? wsInfo.regularPrice : Number(matchedVariant.price || selectedProduct.price);
                            return (
                              <div className="flex flex-col">
                                <div className="flex items-baseline gap-2">
                                  <span className={`text-lg font-bold ${wsInfo ? "text-emerald-600 dark:text-success" : "text-blue-600 dark:text-blue-400"}`}>
                                    {wsInfo ? wsInfo.wholesalePrice : matchedVariant.price} {t('manualOrder.k_75')}
                                  </span>
                                  {wsInfo && regPrice > wsInfo.wholesalePrice && (
                                    <span className="text-xs text-muted-foreground/80 line-through">
                                      {regPrice}
                                    </span>
                                  )}
                                  {wsInfo && (
                                    <span
                                      className="inline-flex items-center rounded-full bg-primary dark:bg-primary/40 border border-primary dark:border-primary px-1.5 py-0.5 text-[9px] font-bold text-primary dark:text-primary"
                                      title={wsInfo.priceListName || 'سعر جملة'}
                                    >
                                      سعر جملة
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                          <div
                            className={`text-sm ${isInStock(matchedVariant) ? "text-green-600 dark:text-success" : "text-red-500 dark:text-destructive font-medium"}`}
                          >
                            {isInStock(matchedVariant)
                              ? matchedVariant.trackInventory === false
                                ? t('manualOrder.inStock')
                                : t('manualOrder.available_count', { count: matchedVariant.stock })
                              : t('manualOrder.outOfStock')}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          SKU: {matchedVariant.sku}
                        </div>
                      </div>
                      <button
                        onClick={() => handleVariantSelect(matchedVariant)}
                        disabled={!isInStock(matchedVariant)}
                        className={`w-full py-2.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-2
                                                    ${
                                                      isInStock(matchedVariant)
                                                        ? "bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600"
                                                        : "bg-gray-300 dark:bg-muted text-muted-foreground cursor-not-allowed"
                                                    }
                                                `}
                      >
                        <PlusIcon className="w-5 h-5" />
                        {t('manualOrder.k_137')}
                      </button>
                    </div>
                  )}

                  {/* Prompt to select remaining attributes */}
                  {!allAttributesSelected && (
                    <div className="mt-4 p-3 bg-muted dark:bg-muted rounded-lg text-center text-sm text-muted-foreground">
                      <ChevronRightIcon className="w-4 h-4 inline ms-1" />
                      {t('manualOrder.k_138')}{" "}
                      {productAttributes
                        .filter((a) => !selectedAttributes[a.name])
                        .map((a) => a.name)
                        .join(t('manualOrder.andSeparator'))}
                    </div>
                  )}
                </div>
              ) : (
                /* Fallback: Simple variant list if no attributes found */
                <div className="space-y-2">
                  {selectedProduct.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => handleVariantSelect(variant)}
                      disabled={!isInStock(variant)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border text-right transition-all
                                                ${
                                                  isInStock(variant)
                                                    ? "border-gray-200 dark:border-border hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer bg-card"
                                                    : "border-gray-100 dark:border-border bg-muted dark:bg-muted opacity-60 cursor-not-allowed"
                                                }
                                            `}
                    >
                      <div className="flex flex-col items-start">
                        <div className="font-medium text-foreground text-sm">
                          {variant.name || t('manualOrder.notSpecified')}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          SKU: {variant.sku}
                        </div>
                      </div>
                      <div className="text-left">
                        {(() => {
                          const wsInfo = getVariantWholesaleInfo(selectedProduct.id, variant.id);
                          const regPrice = wsInfo?.regularPrice && wsInfo.regularPrice > 0 ? wsInfo.regularPrice : Number(variant.price || selectedProduct.price);
                          return (
                            <div className="flex flex-col items-end">
                              <div className="flex items-baseline gap-1.5">
                                <span className={`font-bold text-sm ${wsInfo ? "text-emerald-600 dark:text-success" : "text-blue-600 dark:text-blue-400"}`}>
                                  {wsInfo ? wsInfo.wholesalePrice : variant.price} {t('manualOrder.k_75')}
                                </span>
                                {wsInfo && regPrice > wsInfo.wholesalePrice && (
                                  <span className="text-[10px] text-muted-foreground/80 line-through">
                                    {regPrice}
                                  </span>
                                )}
                              </div>
                              {wsInfo && (
                                <span
                                  className="inline-flex items-center rounded-full bg-primary dark:bg-primary/40 border border-primary dark:border-primary px-1.5 py-0.5 text-[8px] font-bold text-primary dark:text-primary mt-0.5"
                                  title={wsInfo.priceListName || 'سعر جملة'}
                                >
                                  سعر جملة
                                </span>
                              )}
                            </div>
                          );
                        })()}
                        <div
                          className={`text-xs mt-0.5 ${isInStock(variant) ? "text-green-600 dark:text-success" : "text-red-500 dark:text-destructive font-medium"}`}
                        >
                          {isInStock(variant)
                            ? variant.trackInventory === false
                              ? t('manualOrder.inStock')
                              : t('manualOrder.available_count', { count: variant.stock })
                            : t('manualOrder.outOfStock')}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductSearchColumn;
