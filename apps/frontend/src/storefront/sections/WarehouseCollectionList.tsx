import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useStorefrontTheme } from '../engine/ThemeProvider';
import { useCategories, type Category } from '../hooks/useCategories';

export interface WarehouseCollectionListProps {
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

export const WarehouseCollectionList: React.FC<WarehouseCollectionListProps> = ({ section, settings: propSettings }) => {
  const { theme } = useStorefrontTheme();
  const cfg = { ...section?.settings, ...propSettings };
  const title = (cfg.title as string) || "أقسام وتشكيلات الأتيلييه";

  // Fetch real categories from the merchant's database
  const { data: storeCategories } = useCategories();

  // Fallback demo collections
  const fallbackCollections = useMemo(() => [
    {
      id: "c-01",
      title: "عبايات سوداء ملكية",
      count: "24 تصميماً",
      image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&auto=format&fit=crop&q=80",
      link: "/shop?category=black-abayas"
    },
    {
      id: "c-02",
      title: "عبايات ملونة وكلوش",
      count: "18 تصميماً",
      image: "https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=400&auto=format&fit=crop&q=80",
      link: "/shop?category=colored-abayas"
    },
    {
      id: "c-03",
      title: "فساتين محجبات راقية",
      count: "32 تصميماً",
      image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&auto=format&fit=crop&q=80",
      link: "/shop?category=modest-dresses"
    },
    {
      id: "c-04",
      title: "شيلان وطرح حرير ليزر",
      count: "45 تصميماً",
      image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400&auto=format&fit=crop&q=80",
      link: "/shop?category=scarves"
    },
    {
      id: "c-05",
      title: "أطقم بشت رسمية",
      count: "14 تصميماً",
      image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&auto=format&fit=crop&q=80",
      link: "/shop?category=bisht-sets"
    },
    {
      id: "c-06",
      title: "باقات الجملة للمشاغل",
      count: "12 باقة",
      image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&auto=format&fit=crop&q=80",
      link: "/shop?filter=wholesale"
    }
  ], []);

  const collections = useMemo(() => {
    if (storeCategories && storeCategories.length > 0) {
      return storeCategories.map((c: Category, idx: number) => ({
        id: c.id,
        title: c.name,
        count: `${(idx + 1) * 8 + 4} منتجات`,
        image: c.image || fallbackCollections[idx % fallbackCollections.length].image,
        link: `/shop?category=${c.slug || c.id}`
      }));
    }
    return fallbackCollections;
  }, [storeCategories, fallbackCollections]);

  return (
    <section className="py-12 bg-white border-b border-[#e1e3e4]" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-start">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#e1e3e4]">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#1e2d7d] tracking-tight">{title}</h2>
            <span className="text-xs text-neutral-500">
              تصفحي حسب التصنيف وخامة القماش والقصة المفضلة
            </span>
          </div>
          <Link
            to="/collections"
            className="text-xs font-bold text-[#1e2d7d] hover:text-[#00badb] flex items-center gap-1"
          >
            <span>عرض كل الأقسام</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 6-Column Grid matching Warehouse Collections Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {collections.map((col) => (
            <Link
              key={col.id}
              to={col.link}
              className="group border border-[#e1e3e4] rounded-lg p-3 bg-white flex flex-col items-center text-center hover:border-[#1e2d7d] hover:shadow-md transition-all duration-200"
            >
              <div className="w-20 h-20 rounded-full overflow-hidden bg-[#f8f9fa] mb-3 flex items-center justify-center p-1 border border-neutral-100 group-hover:scale-105 transition-transform duration-300">
                <img
                  src={col.image}
                  alt={col.title}
                  className="w-full h-full object-cover rounded-full"
                  loading="lazy"
                />
              </div>
              <h3 className="text-xs font-bold text-[#1e2d7d] group-hover:text-[#00badb] transition-colors line-clamp-1 mb-0.5">
                {col.title}
              </h3>
              <span className="text-[10px] text-neutral-400 font-medium">
                {col.count}
              </span>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
};

export default WarehouseCollectionList;
