import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Zap, CheckCircle2, Star } from 'lucide-react';
import { useProducts, type Product } from '../hooks/useProducts';
import { useCartStore } from '../store/useCartStore';

const FALLBACK_COLORS = [
  { name: 'أسود ملكي', hex: '#111827' },
  { name: 'كحلي ليلي', hex: '#1e2d7d' },
  { name: 'بيج نود', hex: '#d6c4a5' },
  { name: 'زيتي زمردي', hex: '#2d4a3e' },
  { name: 'نبيتي دافئ', hex: '#7f1d1d' },
  { name: 'رمادي حجري', hex: '#6b7280' },
];

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80',
];

export const WarehouseFeaturedProduct: React.FC = () => {
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);
  const setIsOpen = useCartStore((s) => s.setIsOpen);

  const { products: storeProducts } = useProducts({ limit: 4 });

  const activeProduct = useMemo(() => {
    if (storeProducts && storeProducts.length > 0) {
      // Pick second or first store product
      const p: Product = storeProducts[1] || storeProducts[0];
      const hasDiscount = p.comparePrice && p.comparePrice > p.price;
      const saveAmount = hasDiscount ? p.comparePrice! - p.price : 0;
      const images = p.images?.length ? p.images : FALLBACK_IMAGES;

      return {
        id: p.id,
        title: p.name,
        category: p.category?.name || 'أزياء وعبايات أتيلييه',
        sku: p.sku || `ATL-${p.id.slice(0, 6).toUpperCase()}`,
        priceNum: p.price,
        comparePriceNum: p.comparePrice,
        priceText: `${p.price?.toLocaleString()} ج.م`,
        originalPriceText: hasDiscount ? `${p.comparePrice?.toLocaleString()} ج.م` : undefined,
        saveBadge: hasDiscount ? `وفر ${saveAmount.toLocaleString()} ج.م` : undefined,
        savePercent: hasDiscount ? `خصم ${Math.round((saveAmount / p.comparePrice!) * 100)}%` : undefined,
        images,
        link: p.slug ? `/product/${p.slug}` : `/shop`,
        stock: p.inventory || 34,
      };
    }

    return {
      id: 'featured-atelier-abaya-01',
      title: 'عباية كريب رويال مطرزة بتفصيل أتيلييه يدوي فاخر',
      category: 'عبايات ومحجبات فاخرة',
      sku: 'ATL-ROYAL-CR26',
      priceNum: 650,
      comparePriceNum: 890,
      priceText: '650 ج.م',
      originalPriceText: '890 ج.م',
      saveBadge: 'وفر 240 ج.م',
      savePercent: 'خصم 27%',
      images: FALLBACK_IMAGES,
      link: '/shop',
      stock: 28,
    };
  }, [storeProducts]);

  const [activeImg, setActiveImg] = useState<string>(activeProduct.images[0]);
  const [selectedColor, setSelectedColor] = useState<string>(FALLBACK_COLORS[0].name);
  const [qty, setQty] = useState<number>(1);

  // Sync activeImg when product changes
  React.useEffect(() => {
    if (activeProduct.images?.length) {
      setActiveImg(activeProduct.images[0]);
    }
  }, [activeProduct]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      productId: activeProduct.id,
      name: activeProduct.title,
      price: activeProduct.priceNum,
      comparePrice: activeProduct.comparePriceNum,
      quantity: qty,
      imageUrl: activeImg,
      attributes: { Color: selectedColor },
    });
    setIsOpen(true);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      productId: activeProduct.id,
      name: activeProduct.title,
      price: activeProduct.priceNum,
      comparePrice: activeProduct.comparePriceNum,
      quantity: qty,
      imageUrl: activeImg,
      attributes: { Color: selectedColor },
    });
    navigate('/checkout');
  };

  return (
    <section className="py-12 sm:py-16 bg-[#f8f9fa] border-b border-[#e1e3e4]" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between pb-3 mb-6 border-b border-[#e1e3e4]">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#00badb] block mb-0.5">
              ATELIER SPOTLIGHT
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#1e2d7d] tracking-tight">
              الموديل المختار في الأتيلييه
            </h2>
          </div>
          <Link to={activeProduct.link} className="text-xs font-bold text-[#1e2d7d] hover:text-[#00badb] flex items-center gap-1 transition-colors">
            <span>عرض تفاصيل الموديل</span>
            <span>←</span>
          </Link>
        </div>

        <div className="bg-white border border-[#e1e3e4] rounded-2xl p-6 sm:p-10 shadow-2xs grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Image Gallery (6 Cols) */}
          <div className="lg:col-span-6 flex flex-col sm:flex-row-reverse gap-4">
            <div className="flex-1 aspect-square rounded-xl bg-[#f8f9fa] border border-[#e1e3e4] overflow-hidden flex items-center justify-center p-4 relative group">
              <img
                src={activeImg}
                alt={activeProduct.title}
                className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
              />
              {activeProduct.saveBadge && (
                <span className="absolute top-3 start-3 bg-[#d9383a] text-white text-xs font-extrabold px-2.5 py-1 rounded shadow-xs">
                  {activeProduct.saveBadge}
                </span>
              )}
            </div>

            <div className="flex sm:flex-col gap-2 shrink-0">
              {activeProduct.images.slice(0, 4).map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImg(img)}
                  className={`w-16 h-16 rounded-lg p-1 flex items-center justify-center cursor-pointer transition-all overflow-hidden ${
                    activeImg === img
                      ? 'border-2 border-[#1e2d7d] bg-white ring-2 ring-[#1e2d7d]/20'
                      : 'border border-[#e1e3e4] bg-[#f8f9fa] hover:border-[#1e2d7d]'
                  }`}
                  aria-label={`عرض الصورة ${idx + 1}`}
                >
                  <img src={img} alt={`thumb-${idx}`} className="max-h-full max-w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Right: Purchasing Panel (6 Cols) */}
          <div className="lg:col-span-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2 text-xs">
                <span className="font-extrabold text-[#1e2d7d]">{activeProduct.category}</span>
                <span className="text-neutral-300">·</span>
                <span className="text-neutral-500 font-mono text-[11px]">{activeProduct.sku}</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-[#1e2d7d] leading-snug mb-3 tracking-tight">
                {activeProduct.title}
              </h1>

              <div className="flex items-center gap-2 text-[#ffc220] text-xs mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-[#ffc220] text-[#ffc220]" />
                  ))}
                </div>
                <span className="text-neutral-600 font-bold">5.0 (38 مراجعة موثقة)</span>
                <span className="text-neutral-300">|</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>خامة أصلية مضمونة</span>
                </span>
              </div>

              <div className="flex items-baseline gap-3 mb-4 pb-4 border-b border-[#e1e3e4]">
                <span className="text-2xl sm:text-3xl font-black text-[#1e2d7d] tabular-nums">
                  {activeProduct.priceText}
                </span>
                {activeProduct.originalPriceText && (
                  <span className="text-sm text-neutral-400 line-through tabular-nums">
                    {activeProduct.originalPriceText}
                  </span>
                )}
                {activeProduct.savePercent && (
                  <span className="bg-red-50 text-red-700 text-xs font-black px-2 py-0.5 rounded border border-red-200">
                    {activeProduct.savePercent}
                  </span>
                )}
              </div>

              {/* Color Swatch Selector */}
              <div className="mb-5">
                <div className="flex items-center justify-between text-xs font-bold text-neutral-700 mb-2">
                  <span>
                    اللون المختار: <span className="text-[#1e2d7d] font-black">{selectedColor}</span>
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {FALLBACK_COLORS.map((col) => (
                    <button
                      key={col.name}
                      onClick={() => setSelectedColor(col.name)}
                      className={`h-7 px-3 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        selectedColor === col.name
                          ? 'border-2 border-[#1e2d7d] bg-[#1e2d7d] text-white shadow-xs'
                          : 'border border-[#e1e3e4] bg-[#f8f9fa] text-neutral-700 hover:border-neutral-400'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full border border-black/20" style={{ backgroundColor: col.hex }} />
                      <span>{col.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Inventory Indicator */}
              <div className="space-y-1.5 mb-5 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    متوفر في المخزون، {activeProduct.stock} قطعة متبقية
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-700">جاهز للشحن الفوري</span>
                </div>
                <div className="w-full bg-emerald-200/50 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: '65%' }} />
                </div>
              </div>

              {/* Quantity & Dual CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
                <div className="flex items-center border border-[#e1e3e4] rounded-lg bg-neutral-50 px-2 py-1 shrink-0 justify-between sm:justify-start">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 flex items-center justify-center font-black text-neutral-600 hover:text-black cursor-pointer text-base"
                    aria-label="تقليل الكمية"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-xs font-black tabular-nums">{qty}</span>
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    className="w-8 h-8 flex items-center justify-center font-black text-neutral-600 hover:text-black cursor-pointer text-base"
                    aria-label="زيادة الكمية"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex-1 bg-[#1e2d7d] hover:bg-[#16225a] text-white text-xs font-extrabold py-3.5 px-6 rounded-lg shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <ShoppingCart className="w-4 h-4 text-[#00badb]" />
                  <span>أضف إلى السلة</span>
                </button>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="flex-1 bg-[#00badb] hover:bg-[#00a0bd] text-[#16225a] text-xs font-black py-3.5 px-6 rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
                >
                  <Zap className="w-4 h-4" />
                  <span>اشتري الآن بضغطة واحدة</span>
                </button>
              </div>
            </div>

            {/* Bottom Micro-Trust */}
            <div className="pt-4 border-t border-[#e1e3e4] flex flex-wrap items-center justify-between text-xs text-neutral-600 gap-2">
              <span className="flex items-center gap-1.5 font-bold text-emerald-800">
                <span className="text-emerald-600">✓</span>
                <span>شحن سريع لجميع المحافظات مع إمكانية المعاينة قبل الاستلام</span>
              </span>
              <div className="flex items-center gap-2 text-neutral-400 text-[11px]">
                <span>ضمان أتيلييه المعتمد 100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WarehouseFeaturedProduct;
