import React from 'react';
import { ShoppingCart, Eye, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCartStore } from '../cart/cartStore';
import { useProducts, type Product } from '../hooks/useProducts';

export const WarehouseNewTVs: React.FC = () => {
  const { addItem, setIsOpen } = useCartStore();
  const { products: storeProducts } = useProducts({ limit: 6 });

  // Authentic fallback modest fashion atelier items
  const fallbackItems = [
    {
      id: 'atelier-tv-01',
      title: 'عباية كريب رويال سوداء مطرزة بتطريز يدوي فاخر',
      brand: 'ATELIER COUTURE',
      price: 1850,
      comparePrice: 2400,
      badge: 'وفر 550 ج.م',
      image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80',
      slug: 'abaya-crepe-royal-embroidered',
    },
    {
      id: 'atelier-tv-02',
      title: 'عباية حرير كريب كحلي بقصة كلوش ملكية واسعة',
      brand: 'ATELIER NOUR',
      price: 2150,
      comparePrice: 2750,
      badge: 'إصدار محدود',
      image: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=600&auto=format&fit=crop&q=80',
      slug: 'abaya-silk-navy-cloche',
    },
    {
      id: 'atelier-tv-03',
      title: 'فستان كتان طبيعي بيج مبطن للمحجبات مع حزام قماشي',
      brand: 'MODEST STUDIO',
      price: 1450,
      comparePrice: 1900,
      badge: 'الأكثر طلباً',
      image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80',
      slug: 'dress-linen-natural-beige',
    },
  ];

  const displayItems = React.useMemo(() => {
    if (storeProducts && storeProducts.length >= 3) {
      return storeProducts.slice(0, 3).map((p: Product, idx: number) => {
        const hasDiscount = p.comparePrice && p.comparePrice > p.price;
        const diff = hasDiscount ? p.comparePrice! - p.price : 0;
        return {
          id: p.id || `sp-${idx}`,
          title: p.name,
          brand: p.category?.name || 'ATELIER SELECTION',
          price: p.price,
          comparePrice: hasDiscount ? p.comparePrice : undefined,
          badge: hasDiscount ? `وفر ${diff.toLocaleString()} ج.م` : 'حصري',
          image: p.images?.[0] || fallbackItems[idx % fallbackItems.length].image,
          slug: p.slug || p.id,
        };
      });
    }
    return fallbackItems;
  }, [storeProducts]);

  const handleAddToCart = (item: typeof fallbackItems[0]) => {
    addItem({
      productId: item.id,
      name: item.title,
      price: item.price,
      quantity: 1,
      image: item.image,
      metadata: {
        brand: item.brand,
        slug: item.slug,
      },
    });
    setIsOpen(true);
  };

  return (
    <section className="py-12 bg-white border-b border-[#e1e3e4]" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Editorial Promo Card (4 Cols) */}
          <div className="lg:col-span-4 bg-[#1e2d7d] text-white rounded-xl p-8 flex flex-col justify-between shadow-xs relative overflow-hidden text-start">
            <div className="absolute -left-8 -bottom-8 w-48 h-48 bg-[#00badb]/15 rounded-full blur-2xl" />
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <span className="bg-[#00badb] text-[#16225a] font-black text-xs px-2.5 py-0.5 rounded-xs uppercase tracking-wider inline-flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  اختيار خبير الأتيلييه
                </span>
              </div>
              <h2 className="text-3xl font-black text-white mb-3 tracking-tight">
                أحدث موديلات الموسم
              </h2>
              <p className="text-sm text-[#a3afef] leading-relaxed mb-6">
                مجموعة منتقاة بعناية فائقة من أرقى أقمشة الكريب والحرير والكتان الطبيعي، مفصلة بمعايير راقية تناسب إطلالتك المحتشمة اليومية والمناسبات الخاصة.
              </p>
            </div>
            <Link
              to="/shop?category=abayas"
              className="bg-[#00badb] hover:bg-[#00a0bd] text-[#16225a] font-extrabold text-xs px-6 py-3 rounded-md text-center shadow-xs transition-all self-start flex items-center gap-1.5 active:scale-95"
            >
              <span>تسوق كل التصاميم الجديدة</span>
              <span className="rtl:rotate-180">←</span>
            </Link>
          </div>

          {/* Right 3 Product Cards (8 Cols) */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-5">
            {displayItems.map((item) => (
              <div
                key={item.id}
                className="border border-[#e1e3e4] rounded-lg p-4 bg-white flex flex-col justify-between hover:border-[#1e2d7d] hover:shadow-md transition-all text-start group"
              >
                <div>
                  <div className="relative aspect-square rounded-md overflow-hidden bg-[#f8f9fa] mb-3 flex items-center justify-center p-2">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="max-h-full max-w-full object-cover group-hover:scale-105 transition-transform duration-300 rounded"
                    />
                    {item.badge && (
                      <span className="absolute top-2 start-2 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-xs">
                        {item.badge}
                      </span>
                    )}
                    <Link
                      to={item.slug ? `/product/${item.slug}` : `/shop`}
                      className="absolute bottom-2 end-2 bg-white/90 hover:bg-[#1e2d7d] hover:text-white text-[#1e2d7d] p-1.5 rounded-full shadow-md transition-colors opacity-0 group-hover:opacity-100"
                      title="عرض التفاصيل"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                  <span className="text-[10px] font-semibold text-neutral-500 uppercase block mb-1">
                    {item.brand}
                  </span>
                  <Link
                    to={item.slug ? `/product/${item.slug}` : `/shop`}
                    className="text-xs font-semibold text-[#1e2d7d] line-clamp-2 mb-2 hover:text-[#00badb] transition-colors"
                  >
                    {item.title}
                  </Link>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-sm font-black text-[#1e2d7d] tabular-nums">
                      {item.price.toLocaleString()} ج.م
                    </span>
                    {item.comparePrice && (
                      <span className="text-[11px] text-neutral-400 line-through tabular-nums">
                        {item.comparePrice.toLocaleString()} ج.م
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleAddToCart(item)}
                  className="w-full bg-[#1e2d7d] hover:bg-[#16225a] text-white text-xs font-bold py-2 rounded-md transition-colors flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-xs"
                >
                  <ShoppingCart className="w-3.5 h-3.5 text-[#ffc220]" />
                  <span>أضف إلى السلة</span>
                </button>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};

export default WarehouseNewTVs;
