import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingCart, Eye, Flame, ArrowRight } from 'lucide-react';
import { useStorefrontTheme } from '../engine/ThemeProvider';
import { useProducts, type Product } from '../hooks/useProducts';

export interface WarehouseProductTabsProps {
  section?: {
    id?: string;
    type?: string;
    settings?: {
      title?: string;
      [key: string]: unknown;
    };
  };
  settings?: Record<string, unknown>;
}

export const WarehouseProductTabs: React.FC<WarehouseProductTabsProps> = ({ section, settings: propSettings }) => {
  const { theme } = useStorefrontTheme();
  const cfg = { ...section?.settings, ...propSettings };
  const title = (cfg.title as string) || "Featured Collection";

  const [activeTab, setActiveTab] = useState<'bestsellers' | 'featured' | 'onsale' | 'trending'>('bestsellers');

  // Fetch real store products dynamically from the merchant's database
  const { products: storeProducts, isLoading } = useProducts({ limit: 16 });

  // Fallback demo electronics if the store has no products or during initial seed
  const fallbackElectronics = useMemo(() => [
    {
      id: "w-01",
      vendor: "SONY",
      title: "Sony XBR-65X950G 65\" BRAVIA 4K HDR Ultra HD TV",
      price: "1,398.00 EGP",
      comparePrice: "2,198.00 EGP",
      saveBadge: "Save 36%",
      rating: 5,
      reviewCount: 38,
      stockText: "In stock, 42 units",
      stockPercentage: 70,
      image: "https://warehouse-theme-metal.myshopify.com/cdn/shop/products/sonyxbr55front_f72cc8ff-fcd6-4141-b9cc-e1320f867785.jpg?width=600"
    },
    {
      id: "w-02",
      vendor: "JBL",
      title: "JBL Flip 4 Waterproof Portable Bluetooth Speaker - Camo",
      price: "1,299.00 EGP",
      comparePrice: "1,650.00 EGP",
      saveBadge: "Save 21%",
      rating: 5,
      reviewCount: 94,
      stockText: "In stock, 76 units",
      stockPercentage: 85,
      image: "https://warehouse-theme-metal.myshopify.com/cdn/shop/products/13549_790__2_73a2a189-b3d5-4ec8-a4c3-b506e1beab70.jpg?width=600"
    },
    {
      id: "w-03",
      vendor: "BOSE",
      title: "Sony PS-HX500 Hi-Res USB Turntable with Audio Precision",
      price: "4,890.00 EGP",
      comparePrice: "5,990.00 EGP",
      saveBadge: "Save 18%",
      rating: 5,
      reviewCount: 62,
      stockText: "Only 4 units left",
      stockPercentage: 25,
      image: "https://warehouse-theme-metal.myshopify.com/cdn/shop/products/11910_163__1_d6abac00-2eb0-4f32-ab5b-40a3b1be2c70.jpg?width=600"
    },
    {
      id: "w-04",
      vendor: "AUDIO-TECHNICA",
      title: "Audio-Technica ATH-M50x Professional Studio Headphones",
      price: "6,499.00 EGP",
      comparePrice: "7,800.00 EGP",
      saveBadge: "Save 16%",
      rating: 5,
      reviewCount: 112,
      stockText: "In stock, 19 units",
      stockPercentage: 60,
      image: "https://warehouse-theme-metal.myshopify.com/cdn/shop/products/12678_869__1_1500x_b9a505f9-8986-45bf-a73b-5950c9008349.jpg?width=600"
    }
  ], []);

  // Adapt real store products into Warehouse card schema
  const displayProducts = useMemo(() => {
    if (storeProducts && storeProducts.length > 0) {
      return storeProducts.map((p: Product, idx: number) => {
        const hasDiscount = p.comparePrice && p.comparePrice > p.price;
        const discountPercent = hasDiscount
          ? Math.round(((p.comparePrice! - p.price) / p.comparePrice!) * 100)
          : 0;

        return {
          id: p.id || `real-p-${idx}`,
          vendor: p.category?.name || p.brand || (theme.brandName || "STORE"),
          title: p.name || p.title || "Product",
          price: `${p.price?.toLocaleString()} EGP`,
          comparePrice: hasDiscount ? `${p.comparePrice?.toLocaleString()} EGP` : undefined,
          saveBadge: hasDiscount ? `Save ${discountPercent}%` : undefined,
          rating: p.rating || 5,
          reviewCount: p.reviewsCount || (idx * 7 + 12),
          stockText: p.inventory ? `In stock, ${p.inventory} units` : "In stock, verified units",
          stockPercentage: Math.min(100, Math.max(20, (p.inventory || 50) * 2)),
          image: p.images?.[0] || p.mainImage || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop",
          slug: p.slug || p.id
        };
      });
    }

    return fallbackElectronics;
  }, [storeProducts, fallbackElectronics, theme.brandName]);

  // Distribute into tabs
  const tabSlices = useMemo(() => {
    const list = displayProducts;
    return {
      bestsellers: list.slice(0, 4),
      featured: list.slice(4, 8).length ? list.slice(4, 8) : list.slice(0, 4),
      onsale: list.filter((p: any) => p.comparePrice).length ? list.filter((p: any) => p.comparePrice).slice(0, 4) : list.slice(0, 4),
      trending: list.slice().reverse().slice(0, 4)
    };
  }, [displayProducts]);

  const currentList = tabSlices[activeTab] || tabSlices.bestsellers;

  return (
    <section className="py-12 bg-white border-b border-[#e1e3e4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header & Tabs Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-6 border-b border-[#e1e3e4] gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#1e2d7d] tracking-tight">{title}</h2>
            <span className="text-xs text-neutral-500">Official catalog items with verified store warranties</span>
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab('bestsellers')}
              className={`text-xs font-bold px-4 py-2 rounded-md transition-all cursor-pointer ${
                activeTab === 'bestsellers'
                  ? 'bg-[#1e2d7d] text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Best Sellers
            </button>
            <button
              onClick={() => setActiveTab('featured')}
              className={`text-xs font-bold px-4 py-2 rounded-md transition-all cursor-pointer ${
                activeTab === 'featured'
                  ? 'bg-[#1e2d7d] text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Featured
            </button>
            <button
              onClick={() => setActiveTab('onsale')}
              className={`text-xs font-bold px-4 py-2 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                activeTab === 'onsale'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-neutral-100 text-red-600 hover:bg-neutral-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>On Sale</span>
            </button>
            <button
              onClick={() => setActiveTab('trending')}
              className={`text-xs font-bold px-4 py-2 rounded-md transition-all cursor-pointer ${
                activeTab === 'trending'
                  ? 'bg-[#1e2d7d] text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Trending
            </button>
          </div>
        </div>

        {/* 4-Column Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {currentList.map((product: any) => (
            <div
              key={product.id}
              className="group border border-[#e1e3e4] rounded-lg p-4 bg-white flex flex-col justify-between hover:border-[#1e2d7d] hover:shadow-md transition-all duration-300"
            >
              <div>
                {/* 1:1 Aspect Image with Zoom & Badge */}
                <div className="relative aspect-square rounded-md overflow-hidden bg-[#f8f9fa] mb-3 flex items-center justify-center p-3">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {product.saveBadge && (
                    <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-xs">
                      {product.saveBadge}
                    </span>
                  )}
                </div>

                {/* Vendor / Category */}
                <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
                  {product.vendor}
                </span>

                {/* Product Title */}
                <h3 className="text-xs sm:text-sm font-semibold text-[#1e2d7d] line-clamp-2 mb-2 leading-snug">
                  {product.title}
                </h3>

                {/* Price Display with Tabular Nums */}
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-base font-black text-[#1e2d7d] tabular-nums">
                    {product.price}
                  </span>
                  {product.comparePrice && (
                    <span className="text-xs text-neutral-400 line-through tabular-nums">
                      {product.comparePrice}
                    </span>
                  )}
                </div>

                {/* Review Stars */}
                <div className="flex items-center gap-1.5 text-[#ffc220] text-xs mb-2">
                  <div className="flex">
                    {[...Array(product.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-[#ffc220]" />
                    ))}
                  </div>
                  <span className="text-[11px] text-neutral-500 font-medium">({product.reviewCount})</span>
                </div>

                {/* Stock Indicator Dot & Bar */}
                <div className="space-y-1 mb-3">
                  <div className="flex items-center justify-between text-[11px] font-semibold">
                    <span className="text-emerald-700 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                      {product.stockText}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${product.stockPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Add to Cart CTA */}
              <Link
                to={product.slug ? `/product/${product.slug}` : `/shop`}
                className="w-full bg-[#1e2d7d] hover:bg-[#16225a] text-white text-xs font-bold py-2.5 rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <ShoppingCart className="w-3.5 h-3.5 text-[#00badb]" />
                <span>View Product</span>
              </Link>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default WarehouseProductTabs;
