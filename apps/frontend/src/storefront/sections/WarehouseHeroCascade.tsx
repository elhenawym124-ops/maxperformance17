import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, ShieldCheck, Truck, RotateCcw, Headphones, Flame } from 'lucide-react';
import { useStorefrontTheme } from '../engine/ThemeProvider';
import { useProducts, type Product } from '../hooks/useProducts';

export interface WarehouseHeroCascadeProps {
  section?: {
    id?: string;
    type?: string;
    settings?: {
      badge?: string;
      title?: string;
      subtitle?: string;
      primaryButtonText?: string;
      primaryButtonLink?: string;
      secondaryButtonText?: string;
      secondaryButtonLink?: string;
      flashDealTitle?: string;
      flashDealSubtitle?: string;
      flashDealPrice?: string;
      flashDealOriginalPrice?: string;
      flashDealStock?: number;
      flashDealTotal?: number;
      flashDealImage?: string;
      flashDealLink?: string;
      [key: string]: unknown;
    };
  };
  settings?: Record<string, unknown>;
}

export const WarehouseHeroCascade: React.FC<WarehouseHeroCascadeProps> = ({ section, settings: propSettings }) => {
  const { theme } = useStorefrontTheme();
  const cfg = { ...section?.settings, ...propSettings };

  const badge = (cfg.badge as string) || "FLAGSHIP RELEASE 2026";
  const title = (cfg.title as string) || "Introducing: the Headphones Collection";
  const subtitle = (cfg.subtitle as string) || "Discover our curated selection of the best studio-grade and noise-canceling headphones of the year.";
  const primaryButtonText = (cfg.primaryButtonText as string) || "Explore Collection";
  const primaryButtonLink = (cfg.primaryButtonLink as string) || "/shop";
  const secondaryButtonText = (cfg.secondaryButtonText as string) || "View All Deals";
  const secondaryButtonLink = (cfg.secondaryButtonLink as string) || "/shop?filter=deals";

  // Fetch real products to pick real deal of the day
  const { products: storeProducts } = useProducts({ limit: 6 });

  // Pick top discounted product or fallback
  const flashDeal = useMemo(() => {
    if (storeProducts && storeProducts.length > 0) {
      const discounted = storeProducts.find((p: Product) => p.comparePrice && p.comparePrice > p.price);
      const target = discounted || storeProducts[0];
      const hasDiscount = target.comparePrice && target.comparePrice > target.price;
      const saveAmount = hasDiscount ? target.comparePrice! - target.price : 0;

      return {
        title: target.name,
        subtitle: target.category?.name || "Verified Store Selection",
        price: `${target.price?.toLocaleString()} EGP`,
        originalPrice: hasDiscount ? `${target.comparePrice?.toLocaleString()} EGP` : undefined,
        saveBadge: hasDiscount ? `Save ${saveAmount.toLocaleString()} EGP` : undefined,
        stock: target.inventory || 4,
        total: (target.inventory || 4) + 16,
        image: target.images?.[0] || "https://warehouse-theme-metal.myshopify.com/cdn/shop/products/sonyxbr55front_f72cc8ff-fcd6-4141-b9cc-e1320f867785.jpg?width=600",
        link: target.slug ? `/product/${target.slug}` : `/shop`
      };
    }

    return {
      title: (cfg.flashDealTitle as string) || "Sony XBR-65X950G 65\" BRAVIA 4K HDR Ultra HD TV",
      subtitle: (cfg.flashDealSubtitle as string) || "Full Array LED with 4K Ultimate Processor",
      price: (cfg.flashDealPrice as string) || "1,398.00 EGP",
      originalPrice: (cfg.flashDealOriginalPrice as string) || "2,198.00 EGP",
      saveBadge: "Save 800.00 EGP",
      stock: Number(cfg.flashDealStock) || 4,
      total: Number(cfg.flashDealTotal) || 20,
      image: (cfg.flashDealImage as string) || "https://warehouse-theme-metal.myshopify.com/cdn/shop/products/sonyxbr55front_f72cc8ff-fcd6-4141-b9cc-e1320f867785.jpg?width=600",
      link: (cfg.flashDealLink as string) || "/shop"
    };
  }, [storeProducts, cfg]);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({ hours: 11, minutes: 42, seconds: 19 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (n: number) => n.toString().padStart(2, '0');
  const stockPercentage = Math.round((flashDeal.stock / flashDeal.total) * 100);

  return (
    <section className="bg-[#f3f5f6] py-6 sm:py-8 border-b border-[#e1e3e4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          {/* Billboard Banner (8 Cols) */}
          <div className="lg:col-span-8 relative rounded-xl bg-[#1e2d7d] text-white p-8 sm:p-12 flex flex-col justify-between min-h-[460px] overflow-hidden shadow-xs">
            <div className="absolute inset-0 bg-gradient-to-r from-[#16225a] via-[#1e2d7d]/90 to-transparent z-10 pointer-events-none"></div>
            <div 
              className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-40 scale-105"
              style={{ backgroundImage: "url('https://warehouse-theme-metal.myshopify.com/cdn/shop/files/slide-1-headphones.jpg?width=1800')" }}
            ></div>
            
            <div className="relative z-20 max-w-lg">
              <span className="bg-[#00badb] text-[#16225a] font-extrabold text-xs px-2.5 py-0.5 rounded-xs uppercase tracking-wider inline-block mb-3 shadow-2xs">
                {badge}
              </span>
              <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight mb-3 tracking-tight">
                {title}
              </h1>
              <p className="text-sm sm:text-base text-[#a3afef] leading-relaxed mb-6">
                {subtitle}
              </p>
            </div>

            <div className="relative z-20 flex flex-wrap items-center gap-3 pt-4 border-t border-white/15">
              <Link
                to={primaryButtonLink}
                className="bg-[#00badb] hover:bg-[#00a0bd] text-[#16225a] font-black text-xs sm:text-sm px-6 py-3 rounded-md shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>{primaryButtonText}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to={secondaryButtonLink}
                className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-md border border-white/20 transition-all cursor-pointer"
              >
                {secondaryButtonText}
              </Link>
              <span className="text-xs text-[#a3afef] ml-auto hidden sm:inline">Official Store Catalog Protection</span>
            </div>
          </div>

          {/* Deal of the Day Card (4 Cols) */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-[#e1e3e4] p-5 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-3">
                <span className="text-red-600 font-bold text-xs uppercase flex items-center gap-1">
                  <Flame className="w-4 h-4 fill-red-600" />
                  DEAL OF THE DAY
                </span>
                <span className="font-mono text-xs font-bold text-[#1e2d7d] bg-neutral-100 px-2 py-0.5 rounded">
                  {formatTimer(timeLeft.hours)}:{formatTimer(timeLeft.minutes)}:{formatTimer(timeLeft.seconds)}
                </span>
              </div>

              <div className="relative aspect-video rounded-lg overflow-hidden bg-neutral-100 mb-3 flex items-center justify-center p-2">
                <img 
                  src={flashDeal.image} 
                  alt={flashDeal.title}
                  className="max-h-full object-contain"
                />
                {flashDeal.saveBadge && (
                  <span className="absolute top-2 left-2 bg-red-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded shadow-xs">
                    {flashDeal.saveBadge}
                  </span>
                )}
              </div>

              <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
                FEATURED SELECTION
              </span>
              <h3 className="text-sm font-bold text-[#1e2d7d] line-clamp-1 mb-1">
                {flashDeal.title}
              </h3>
              <p className="text-xs text-neutral-500 mb-2.5 line-clamp-1">
                {flashDeal.subtitle}
              </p>

              <div className="flex items-baseline gap-2 mb-3">
                <span className="font-black text-xl text-[#1e2d7d] tabular-nums">{flashDeal.price}</span>
                {flashDeal.originalPrice && (
                  <span className="text-xs text-neutral-400 line-through tabular-nums">{flashDeal.originalPrice}</span>
                )}
              </div>

              <div className="space-y-1 mb-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-amber-700">Only {flashDeal.stock} units left in stock</span>
                  <span className="text-neutral-400 font-mono">{stockPercentage}%</span>
                </div>
                <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-amber-500 to-red-600 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${stockPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <Link
              to={flashDeal.link}
              className="w-full bg-[#1e2d7d] hover:bg-[#16225a] text-white text-xs font-bold py-2.5 rounded-md transition-colors text-center block shadow-2xs"
            >
              Claim Deal Now
            </Link>
          </div>

        </div>

        {/* Trust Pillars Bar */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 pt-5 border-t border-[#e1e3e4] text-[#1e2d7d]">
          <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-[#e1e3e4] shadow-2xs">
            <div className="w-10 h-10 rounded-md bg-[#1e2d7d]/5 flex items-center justify-center text-[#1e2d7d] shrink-0 font-bold">
              <Truck className="w-5 h-5 text-[#00badb]" />
            </div>
            <div>
              <p className="text-xs font-bold">Fast & Free Shipping</p>
              <p className="text-[11px] text-neutral-500">Orders over $80</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-[#e1e3e4] shadow-2xs">
            <div className="w-10 h-10 rounded-md bg-[#1e2d7d]/5 flex items-center justify-center text-[#1e2d7d] shrink-0 font-bold">
              <ShieldCheck className="w-5 h-5 text-[#00badb]" />
            </div>
            <div>
              <p className="text-xs font-bold">100% Genuine</p>
              <p className="text-[11px] text-neutral-500">Authorized suppliers</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-[#e1e3e4] shadow-2xs">
            <div className="w-10 h-10 rounded-md bg-[#1e2d7d]/5 flex items-center justify-center text-[#1e2d7d] shrink-0 font-bold">
              <RotateCcw className="w-5 h-5 text-[#00badb]" />
            </div>
            <div>
              <p className="text-xs font-bold">14-Day Free Returns</p>
              <p className="text-[11px] text-neutral-500">Hassle-free return</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-[#e1e3e4] shadow-2xs">
            <div className="w-10 h-10 rounded-md bg-[#1e2d7d]/5 flex items-center justify-center text-[#1e2d7d] shrink-0 font-bold">
              <Headphones className="w-5 h-5 text-[#00badb]" />
            </div>
            <div>
              <p className="text-xs font-bold">24/7 Dedicated Support</p>
              <p className="text-[11px] text-neutral-500">Call 1-800-663-4040</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default WarehouseHeroCascade;
