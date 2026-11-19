import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight } from 'lucide-react';
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
  const title = (cfg.title as string) || "Our collections";

  // Fetch real categories from the merchant's database
  const { data: storeCategories, isLoading } = useCategories();

  // Fallback demo collections
  const fallbackCollections = useMemo(() => [
    {
      id: "c-01",
      title: "Audio & Hi-Fi",
      count: "24 products",
      image: "https://warehouse-theme-metal.myshopify.com/cdn/shop/files/headphones-600.jpg?width=300",
      link: "/shop?category=audio"
    },
    {
      id: "c-02",
      title: "Earbuds & In-Ear",
      count: "18 products",
      image: "https://warehouse-theme-metal.myshopify.com/cdn/shop/files/earbuds-600_abcad8d1-f772-47be-8de5-7b6e1dd45f03.jpg?width=300",
      link: "/shop?category=earbuds"
    },
    {
      id: "c-03",
      title: "Portable Speakers",
      count: "32 products",
      image: "https://warehouse-theme-metal.myshopify.com/cdn/shop/files/speakers-600_490fc860-32d7-4226-bb15-b319dfcad104.jpg?width=300",
      link: "/shop?category=speakers"
    },
    {
      id: "c-04",
      title: "Smart OLED TVs",
      count: "12 products",
      image: "https://warehouse-theme-metal.myshopify.com/cdn/shop/files/oled-tvs-600_1f8be815-fc56-40ee-81d4-a813eba17df2.jpg?width=300",
      link: "/shop?category=tvs"
    },
    {
      id: "c-05",
      title: "Turntables & Vinyl",
      count: "9 products",
      image: "https://warehouse-theme-metal.myshopify.com/cdn/shop/files/turntables-600.jpg?width=300",
      link: "/shop?category=turntables"
    },
    {
      id: "c-06",
      title: "Subwoofers & Bass",
      count: "14 products",
      image: "https://warehouse-theme-metal.myshopify.com/cdn/shop/files/subwoofers-600.jpg?width=300",
      link: "/shop?category=subwoofers"
    }
  ], []);

  // Adapt real store categories or fallback
  const collections = useMemo(() => {
    if (storeCategories && storeCategories.length > 0) {
      return storeCategories.slice(0, 6).map((cat: Category, idx: number) => ({
        id: cat.id || `real-cat-${idx}`,
        title: cat.name || cat.nameEn || "Category",
        count: "Browse items",
        image: cat.image || fallbackCollections[idx % fallbackCollections.length].image,
        link: `/shop?category=${cat.slug || cat.id}`
      }));
    }
    return fallbackCollections;
  }, [storeCategories, fallbackCollections]);

  return (
    <section id="categories" className="py-10 bg-white border-b border-[#e1e3e4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#e1e3e4]">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#1e2d7d] tracking-tight">{title}</h2>
          </div>
          <Link
            to="/collections"
            className="text-xs font-bold text-[#1e2d7d] hover:text-[#00badb] flex items-center gap-1 transition-colors"
          >
            <span>View all collections</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 6 Circular Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {collections.map((col) => (
            <Link
              key={col.id}
              to={col.link}
              className="flex flex-col items-center bg-[#f8f9fa] border border-[#e1e3e4] rounded-lg p-4 text-center hover:border-[#1e2d7d] hover:shadow-xs transition-all cursor-pointer group"
            >
              <div className="w-20 h-20 rounded-full overflow-hidden mb-3 border-2 border-white shadow-2xs group-hover:scale-105 transition-transform bg-white flex items-center justify-center">
                <img
                  src={col.image}
                  alt={col.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <h3 className="text-xs font-bold text-[#1e2d7d] line-clamp-1">{col.title}</h3>
              <span className="text-[10px] text-neutral-500 font-medium">{col.count}</span>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
};

export default WarehouseCollectionList;
