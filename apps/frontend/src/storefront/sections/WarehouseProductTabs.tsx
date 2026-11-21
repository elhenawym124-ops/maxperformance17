import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingCart, Eye, Flame } from 'lucide-react';
import { useStorefrontTheme } from '../engine/ThemeProvider';
import { useProducts, type Product } from '../hooks/useProducts';
import { useCartStore } from '../cart/cartStore';

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
  const { addItem, setIsOpen } = useCartStore();
  const cfg = { ...section?.settings, ...propSettings };
  const title = (cfg.title as string) || "تشكيلة الأتيلييه المختارة";

  const [activeTab, setActiveTab] = useState<'bestsellers' | 'featured' | 'onsale' | 'trending'>('bestsellers');

  // Fetch real store products dynamically from the merchant's database
  const { products: storeProducts } = useProducts({ limit: 16 });

  // Fallback demo modest fashion items if store products are empty
  const fallbackItems = useMemo(
    () => [
      {
        id: "tab-item-01",
        vendor: "ATELIER COUTURE",
        title: "عباية كريب رويال سوداء مطرزة بتطريز يدوي على الأكمام والصدر",
        rawPrice: 1850,
        price: "1,850 ج.م",
        comparePrice: "2,400 ج.م",
        saveBadge: "وفر 23%",
        rating: 5,
        reviewCount: 38,
        stockText: "متوفر، 42 قطعة",
        stockPercentage: 70,
        image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80",
        slug: "abaya-crepe-royal-black"
      },
      {
        id: "tab-item-02",
        vendor: "MODEST STUDIO",
        title: "فستان كتان طبيعي بيج مبطن للمحجبات مع حزام قماشي",
        rawPrice: 1450,
        price: "1,450 ج.م",
        comparePrice: "1,900 ج.م",
        saveBadge: "وفر 24%",
        rating: 5,
        reviewCount: 94,
        stockText: "متوفر، 76 قطعة",
        stockPercentage: 85,
        image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80",
        slug: "dress-linen-natural-beige"
      },
      {
        id: "tab-item-03",
        vendor: "DAR AL-HAYA",
        title: "عباية حرير كريب كحلي بقصة كلوش واسعة وشيلة متناسقة",
        rawPrice: 2150,
        price: "2,150 ج.م",
        comparePrice: "2,750 ج.م",
        saveBadge: "وفر 22%",
        rating: 5,
        reviewCount: 29,
        stockText: "متوفر، 18 قطعة",
        stockPercentage: 45,
        image: "https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=600&auto=format&fit=crop&q=80",
        slug: "abaya-silk-navy-cloche"
      },
      {
        id: "tab-item-04",
        vendor: "ATELIER NOUR",
        title: "طقم عباية بشت بيج واسع 3 قطع مع فستان داخلي وطرحة",
        rawPrice: 1980,
        price: "1,980 ج.م",
        comparePrice: "2,450 ج.م",
        saveBadge: "وفر 19%",
        rating: 5,
        reviewCount: 47,
        stockText: "متوفر، 23 قطعة",
        stockPercentage: 55,
        image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&auto=format&fit=crop&q=80",
        slug: "set-bisht-abaya-dress-beige"
      },
      {
        id: "tab-item-05",
        vendor: "ATELIER COUTURE",
        title: "عباية مخمل شتوية فاخرة بتطريز خيوط الحرير الذهبية",
        rawPrice: 2450,
        price: "2,450 ج.م",
        comparePrice: "3,100 ج.م",
        saveBadge: "وفر 21%",
        rating: 5,
        reviewCount: 16,
        stockText: "متبقي 6 قطع فقط",
        stockPercentage: 30,
        image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80",
        slug: "abaya-velvet-winter-gold"
      },
      {
        id: "tab-item-06",
        vendor: "MODEST LUXE",
        title: "شيلة حرير ليزر ياباني ثابتة باللون الأسود الملكي",
        rawPrice: 450,
        price: "450 ج.م",
        comparePrice: "600 ج.م",
        saveBadge: "وفر 25%",
        rating: 5,
        reviewCount: 112,
        stockText: "متوفر، 95 قطعة",
        stockPercentage: 90,
        image: "https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=600&auto=format&fit=crop&q=80",
        slug: "sheila-laser-silk-black"
      },
      {
        id: "tab-item-07",
        vendor: "DAR AL-HAYA",
        title: "فستان بليسيه راقي بلون زيتي هادئ مع بطانة كاملة",
        rawPrice: 1680,
        price: "1,680 ج.م",
        comparePrice: null,
        saveBadge: undefined,
        rating: 5,
        reviewCount: 42,
        stockText: "متوفر، 34 قطعة",
        stockPercentage: 65,
        image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80",
        slug: "dress-pleated-olive-modest"
      },
      {
        id: "tab-item-08",
        vendor: "ATELIER SELECTION",
        title: "عباية صالونا كريب كلوش مطرزة على الأطراف خياطة يدوية",
        rawPrice: 2100,
        price: "2,100 ج.م",
        comparePrice: "2,650 ج.م",
        saveBadge: "وفر 20%",
        rating: 5,
        reviewCount: 28,
        stockText: "متوفر، 15 قطعة",
        stockPercentage: 40,
        image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80",
        slug: "abaya-salona-crepe-cloche"
      }
    ],
    []
  );

  // Map store products or fallback
  const displayProducts = useMemo(() => {
    if (storeProducts && storeProducts.length > 0) {
      return storeProducts.map((p: Product, idx: number) => {
        const hasDiscount = p.comparePrice && p.comparePrice > p.price;
        const discountPercent = hasDiscount
          ? Math.round(((p.comparePrice! - p.price) / p.comparePrice!) * 100)
          : null;

        return {
          id: p.id || `sp-${idx}`,
          vendor: p.category?.name || "ATELIER COUTURE",
          title: p.name,
          rawPrice: p.price,
          price: `${p.price?.toLocaleString()} ج.م`,
          comparePrice: hasDiscount ? `${p.comparePrice?.toLocaleString()} ج.م` : undefined,
          saveBadge: hasDiscount ? `وفر ${discountPercent}%` : undefined,
          rating: p.rating || 5,
          reviewCount: p.reviewsCount || (idx * 7 + 12),
          stockText: p.inventory ? `متوفر، ${p.inventory} قطعة` : "متوفر وجاهز للشحن",
          stockPercentage: Math.min(100, Math.max(20, (p.inventory || 50) * 2)),
          image: p.images?.[0] || fallbackItems[idx % fallbackItems.length].image,
          slug: p.slug || p.id
        };
      });
    }

    return fallbackItems;
  }, [storeProducts, fallbackItems]);

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

  const handleAddToCart = (product: any) => {
    addItem({
      productId: product.id,
      name: product.title,
      price: product.rawPrice || 1500,
      quantity: 1,
      image: product.image,
      metadata: {
        vendor: product.vendor,
        slug: product.slug,
      },
    });
    setIsOpen(true);
  };

  return (
    <section className="py-12 bg-white border-b border-[#e1e3e4]" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-start">
        
        {/* Header & Tabs Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-6 border-b border-[#e1e3e4] gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#1e2d7d] tracking-tight">{title}</h2>
            <span className="text-xs text-neutral-500">
              تصاميم راقية وخامات أصلية معتمدة من كبرى دور النسيج والأتيلييهات
            </span>
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
              الأكثر طلباً
            </button>
            <button
              onClick={() => setActiveTab('featured')}
              className={`text-xs font-bold px-4 py-2 rounded-md transition-all cursor-pointer ${
                activeTab === 'featured'
                  ? 'bg-[#1e2d7d] text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              المميز والمختار
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
              <span>تخفيضات الأتيلييه</span>
            </button>
            <button
              onClick={() => setActiveTab('trending')}
              className={`text-xs font-bold px-4 py-2 rounded-md transition-all cursor-pointer ${
                activeTab === 'trending'
                  ? 'bg-[#1e2d7d] text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              الرائج الآن
            </button>
          </div>
        </div>

        {/* 4-Column Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {currentList.map((product: any) => (
            <div
              key={product.id}
              className="group border border-[#e1e3e4] rounded-lg p-4 bg-white flex flex-col justify-between hover:border-[#1e2d7d] hover:shadow-md transition-all duration-300 text-start"
            >
              <div>
                {/* 1:1 Aspect Image with Zoom & Badge */}
                <div className="relative aspect-square rounded-md overflow-hidden bg-[#f8f9fa] mb-3 flex items-center justify-center p-3">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="max-h-full max-w-full object-cover group-hover:scale-105 transition-transform duration-300 rounded"
                    loading="lazy"
                  />
                  {product.saveBadge && (
                    <span className="absolute top-2 start-2 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-xs">
                      {product.saveBadge}
                    </span>
                  )}
                  <Link
                    to={product.slug ? `/product/${product.slug}` : `/shop`}
                    className="absolute bottom-2 end-2 bg-white/90 hover:bg-[#1e2d7d] hover:text-white text-[#1e2d7d] p-1.5 rounded-full shadow-md transition-colors opacity-0 group-hover:opacity-100"
                    title="معاينة وتفاصيل"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Vendor / Category */}
                <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
                  {product.vendor}
                </span>

                {/* Product Title */}
                <Link
                  to={product.slug ? `/product/${product.slug}` : `/shop`}
                  className="text-xs sm:text-sm font-semibold text-[#1e2d7d] line-clamp-2 mb-2 leading-snug hover:text-[#00badb] transition-colors"
                >
                  {product.title}
                </Link>

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
              <button
                type="button"
                onClick={() => handleAddToCart(product)}
                className="w-full bg-[#1e2d7d] hover:bg-[#16225a] text-white text-xs font-bold py-2.5 rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
              >
                <ShoppingCart className="w-3.5 h-3.5 text-[#ffc220]" />
                <span>أضف إلى السلة</span>
              </button>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default WarehouseProductTabs;
