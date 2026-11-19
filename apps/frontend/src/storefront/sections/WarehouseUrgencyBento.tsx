import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, PackageCheck, Zap, ArrowRight, Tag, Flame } from 'lucide-react';
import { useStorefrontTheme } from '../engine/ThemeProvider';

export interface WarehouseUrgencyBentoProps {
  section?: {
    id?: string;
    type?: string;
    settings?: {
      title?: string;
      subtitle?: string;
      [key: string]: unknown;
    };
  };
  settings?: Record<string, unknown>;
}

export const WarehouseUrgencyBento: React.FC<WarehouseUrgencyBentoProps> = ({ section, settings: propSettings }) => {
  const { theme } = useStorefrontTheme();
  const cfg = { ...section?.settings, ...propSettings };

  const title = (cfg.title as string) || "Special Outlet Deals & Volume Discounts";
  const subtitle = (cfg.subtitle as string) || "Verified wholesale tiers, clearance inventory, and fast corporate procurement directly from the central hub.";

  return (
    <section
      dir={theme.direction}
      className="relative bg-white py-8 sm:py-12 border-b border-[#e1e3e4]"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#d9383a] uppercase mb-1.5">
              <Flame className="w-3.5 h-3.5" />
              <span>DEPOT SPECIAL PROMOTIONS</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#1e2d7d] tracking-tight">
              {title}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[#677279] max-w-xl">
              {subtitle}
            </p>
          </div>

          <Link
            to="/shop?filter=deals"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#1e2d7d] hover:text-[#00badb] transition-colors"
          >
            <span>View All Warehouse Deals</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </Link>
        </div>

        {/* Bento Grid (Warehouse Metal 3-Column Style) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          
          {/* Card 1: Volume Savings Tiers */}
          <div className="rounded-xl border border-[#e1e3e4] bg-[#f8f9fa] p-5 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1e2d7d] text-[#ffc220]">
                  <Layers className="h-5 w-5" />
                </span>
                <span className="rounded-xs bg-[#ffc220] px-2 py-0.5 text-[11px] font-black text-[#16225a]">
                  UP TO 25% OFF
                </span>
              </div>

              <h3 className="text-sm font-bold text-[#1e2d7d] mb-1.5">
                Bulk Order Savings Tiers
              </h3>
              <p className="text-xs text-[#677279] mb-3 leading-relaxed">
                Automatic quantity discounts applied instantly in your cart:
              </p>

              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-md bg-white p-2.5 text-xs border border-[#e1e3e4]">
                  <span className="font-semibold text-[#1e2d7d]">Buy 2 Units</span>
                  <span className="font-black text-[#d9383a]">Save 10% Instantly</span>
                </div>
                <div className="flex items-center justify-between rounded-md bg-white p-2.5 text-xs border border-[#e1e3e4]">
                  <span className="font-semibold text-[#1e2d7d]">Buy 3 to 5 Units</span>
                  <span className="font-black text-[#d9383a]">Save 18% + Free Shipping</span>
                </div>
                <div className="flex items-center justify-between rounded-md bg-white p-2.5 text-xs border border-[#e1e3e4]">
                  <span className="font-semibold text-[#1e2d7d]">6+ Units (Wholesale)</span>
                  <span className="font-black text-[#d9383a]">Save 25% Factory Direct</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#e1e3e4]">
              <Link
                to="/shop"
                className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-[#1e2d7d] hover:bg-[#16225a] py-2 text-xs font-bold text-white transition-colors"
              >
                <span>Shop Qualified Products</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </Link>
            </div>
          </div>

          {/* Card 2: Low Stock Urgency */}
          <div className="rounded-xl border border-[#e1e3e4] bg-white p-5 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#d9383a] text-white">
                  <PackageCheck className="h-5 w-5" />
                </span>
                <span className="rounded-xs bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                  Live Stock Feed
                </span>
              </div>

              <h3 className="text-sm font-bold text-[#1e2d7d] mb-1.5">
                Fast-Selling Overstock
              </h3>
              <p className="text-xs text-[#677279] mb-3 leading-relaxed">
                High-demand inventory with strictly limited quantities:
              </p>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-neutral-100">
                  <div>
                    <p className="font-bold text-[#1e2d7d]">Sony BRAVIA 65" 4K TV</p>
                    <p className="text-[10px] text-[#677279]">Direct Depot Stock</p>
                  </div>
                  <span className="rounded bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                    Only 4 Left
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pb-2 border-b border-neutral-100">
                  <div>
                    <p className="font-bold text-[#1e2d7d]">JBL Flip 4 Waterproof Speaker</p>
                    <p className="text-[10px] text-[#677279]">Camouflage Edition</p>
                  </div>
                  <span className="rounded bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                    Only 7 Left
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-[#1e2d7d]">Bose QuietComfort 35 II</p>
                    <p className="text-[10px] text-[#677279]">Triple Black</p>
                  </div>
                  <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    Only 9 Left
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#e1e3e4]">
              <Link
                to="/shop?filter=low-stock"
                className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-[#1e2d7d] text-[#1e2d7d] hover:bg-[#1e2d7d] hover:text-white py-2 text-xs font-bold transition-colors"
              >
                <span>View Clearance Queue</span>
              </Link>
            </div>
          </div>

          {/* Card 3: Corporate & Dedicated Procurement */}
          <div className="rounded-xl border border-[#e1e3e4] bg-[#f8f9fa] p-5 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#ffc220] text-[#16225a]">
                  <Zap className="h-5 w-5" />
                </span>
                <span className="rounded-xs bg-white px-2 py-0.5 text-[11px] font-bold text-[#16225a] border border-[#e1e3e4]">
                  B2B Portal
                </span>
              </div>

              <h3 className="text-sm font-bold text-[#1e2d7d] mb-1.5">
                Corporate & Reseller Accounts
              </h3>
              <p className="text-xs text-[#677279] mb-3 leading-relaxed">
                Need bulk hardware procurement for offices, retail stores, or institutions? Get custom tax invoices and dedicated account managers.
              </p>

              <div className="rounded-lg bg-white p-3 border border-[#e1e3e4] space-y-1.5 text-xs text-[#1e2d7d]">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#1e2d7d]" />
                  <span>Official Electronic Tax Invoices</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#1e2d7d]" />
                  <span>Credit terms for approved accounts</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#1e2d7d]" />
                  <span>Scheduled pallet & courier delivery</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#e1e3e4]">
              <Link
                to="/contact?topic=corporate"
                className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-[#ffc220] hover:bg-[#f0b518] py-2 text-xs font-black text-[#16225a] transition-colors"
              >
                <span>Request B2B Quotation</span>
              </Link>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default WarehouseUrgencyBento;
