import React, { useMemo } from 'react';
import { Star, ShoppingCart, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCartStore } from '../cart/cartStore';
import { useProducts, type Product } from '../hooks/useProducts';

export const WarehouseTopRated: React.FC = () => {
  const { addItem, setIsOpen } = useCartStore();
  const { products: storeProducts } = useProducts({ limit: 8 });

  const fallbackItems = useMemo(
    () => [
      {
        id: 'top-rated-01',
        vendor: 'ATELIER COUTURE',
        title: 'عباية صالونا كريب كلوش مع شيلة ليزر متناسقة',
        price: 2100,
        originalPrice: 2650,
        badge: 'وفر 550 ج.م',
        reviews: '28 تقييم',
        img: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80',
        slug: 'abaya-salona-crepe-cloche',
      },
      {
        id: 'top-rated-02',
        vendor: 'DAR AL-HAYA',
        title: 'فستان بليسيه راقي بلون زيتي هادئ مع بطانة داخلية كاملة',
        price: 1680,
        originalPrice: null,
        badge: 'الأعلى تقييماً',
        reviews: '42 تقييم',
        img: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=600&auto=format&fit=crop&q=80',
        slug: 'dress-pleated-olive-modest',
      },
      {
        id: 'top-rated-03',
        vendor: 'MODEST LUXE',
        title: 'عباية مخمل شتوية أسود ملكي مطرزة بخيوط الحرير على الأكمام',
        price: 2450,
        originalPrice: 3100,
        badge: 'وفر 650 ج.م',
        reviews: '19 تقييم',
        img: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80',
        slug: 'abaya-velvet-winter-black',
      },
      {
        id: 'top-rated-04',
        vendor: 'ATELIER NOUR',
        title: 'طقم عباية بشت بيج واسع مع فستان داخلي وطرحة متطابقة',
        price: 1980,
        originalPrice: null,
        badge: 'طقم كامل 3 قطع',
        reviews: '35 تقييم',
        img: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&auto=format&fit=crop&q=80',
        slug: 'set-bisht-abaya-dress-beige',
      },
    ],
    []
  );

  const displayItems = useMemo(() => {
    if (storeProducts && storeProducts.length >= 4) {
      return storeProducts.slice(0, 4).map((p: Product, idx: number) => {
        const hasDiscount = p.comparePrice && p.comparePrice > p.price;
        const diff = hasDiscount ? p.comparePrice! - p.price : 0;
        return {
          id: p.id || `tr-${idx}`,
          vendor: p.category?.name || 'ATELIER SELECTION',
          title: p.name,
          price: p.price,
          originalPrice: hasDiscount ? p.comparePrice : null,
          badge: hasDiscount ? `وفر ${diff.toLocaleString()} ج.م` : 'أعلى تقييم',
          reviews: `${p.reviewsCount || idx * 11 + 18} تقييم`,
          img: p.images?.[0] || fallbackItems[idx % fallbackItems.length].img,
          slug: p.slug || p.id,
        };
      });
    }
    return fallbackItems;
  }, [storeProducts, fallbackItems]);

  const handleAddToCart = (item: (typeof fallbackItems)[0]) => {
    addItem({
      productId: item.id,
      name: item.title,
      price: item.price,
      quantity: 1,
      image: item.img,
      metadata: {
        vendor: item.vendor,
        slug: item.slug,
      },
    });
    setIsOpen(true);
  };

  return (
    <section className="py-12 bg-white border-b border-[#e1e3e4]" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#e1e3e4]">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#1e2d7d] tracking-tight">
              القطع الأعلى تقييماً من عميلاتنا
            </h2>
            <span className="text-xs text-neutral-500">
              تقييمات موثقة لعميلات أتيلييه العبايات والأزياء المحتشمة
            </span>
          </div>
          <Link
            to="/shop?sort=rating"
            className="text-xs font-bold text-[#1e2d7d] hover:text-[#00badb] flex items-center gap-1"
          >
            <span>عرض كل التقييمات</span>
            <span className="rtl:rotate-180">←</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {displayItems.map((item) => (
            <div
              key={item.id}
              className="border border-[#e1e3e4] rounded-lg p-4 bg-white flex flex-col justify-between hover:border-[#1e2d7d] hover:shadow-md transition-all text-start group"
            >
              <div>
                <div className="relative aspect-square rounded-md overflow-hidden bg-[#f8f9fa] mb-3 flex items-center justify-center p-3">
                  <img
                    src={item.img}
                    alt={item.title}
                    className="max-h-full max-w-full object-cover rounded group-hover:scale-105 transition-transform duration-300"
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
                  {item.vendor}
                </span>
                <Link
                  to={item.slug ? `/product/${item.slug}` : `/shop`}
                  className="text-xs font-semibold text-[#1e2d7d] line-clamp-2 mb-2 hover:text-[#00badb] transition-colors leading-snug"
                >
                  {item.title}
                </Link>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-sm font-black text-[#1e2d7d] tabular-nums">
                    {item.price.toLocaleString()} ج.م
                  </span>
                  {item.originalPrice && (
                    <span className="text-xs text-neutral-400 line-through tabular-nums">
                      {item.originalPrice.toLocaleString()} ج.م
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[#ffc220] text-xs mb-3">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-[#ffc220]" />
                    ))}
                  </div>
                  <span className="text-[11px] text-neutral-500 font-medium">({item.reviews})</span>
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
    </section>
  );
};

export default WarehouseTopRated;
