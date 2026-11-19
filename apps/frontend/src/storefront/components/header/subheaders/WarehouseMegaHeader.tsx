import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Search, ShoppingCart, User, PhoneCall, ChevronDown, Sparkles, Tag } from "lucide-react";
import { StorefrontHomeLink } from "../storefrontHeaderHelpers";
import { StorefrontSearchOverlay } from "./StorefrontSearchOverlay";
import type { StorefrontHeaderController } from "../storefrontHeaderTypes";

interface WarehouseMegaHeaderProps {
  controller: StorefrontHeaderController;
}

export const WarehouseMegaHeader: React.FC<WarehouseMegaHeaderProps> = ({ controller }) => {
  const {
    theme,
    handlePcHubSearchSubmit,
    query,
    setQuery,
    brandHomeLinkProps,
    displayStoreName,
    showCart,
    setIsOpen,
    totalItems,
    mobileMenuOpen,
    setMobileMenuOpen,
    showSearch,
    setSearchOpen,
    navLinks,
    isActive,
    searchOpen,
    closeSearchOverlay,
    results,
    isLoading,
    moreResultsPath,
    settings,
  } = controller;

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const currency = settings?.storefront?.settings?.currency || "EGP";

  // Warehouse Categories matching high-density mega search
  const warehouseCategories = [
    { id: "all", label: "All Categories / جميع الأقسام" },
    { id: "featured", label: "Best Sellers / الأكثر مبيعاً" },
    { id: "new", label: "New Arrivals / وصل حديثاً" },
    { id: "deals", label: "Deals & Clearance / العروض والتصفيات" },
    { id: "wholesale", label: "Bulk & Wholesale / باقات الجملة" },
  ];

  return (
    <>
      <header
        dir={theme.direction}
        className="sticky top-0 z-50 w-full shadow-md"
      >
        {/* 1. Top Announcement Bar (Darker Navy / Accent) */}
        <div className="bg-[#16225a] px-4 py-1.5 text-xs font-medium text-white border-b border-white/10">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-xs bg-[#ffc220] px-1.5 py-0.2 text-[10px] font-bold text-[#16225a]">
                FLASH DEALS
              </span>
              <span className="text-[#a3afef]">
                Free shipping on orders over 500 EGP · 14-day return guarantee · Verified authentic stock
              </span>
            </div>
            <div className="hidden items-center gap-4 sm:flex text-[11px] text-[#a3afef]">
              <span className="flex items-center gap-1">
                <PhoneCall className="w-3 h-3 text-[#ffc220]" />
                <span>Support: 19000</span>
              </span>
              <span className="opacity-30">|</span>
              <Link to="/contact" className="hover:text-white transition-colors">
                Order Tracking
              </Link>
            </div>
          </div>
        </div>

        {/* 2. Main High-Density Header Row (Signature Warehouse Navy #1e2d7d) */}
        <div className="bg-[#1e2d7d] px-4 py-3 sm:px-6">
          <div className="mx-auto max-w-7xl flex items-center justify-between gap-4 lg:gap-8">
            
            {/* Mobile Trigger & Logo */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex h-10 w-10 items-center justify-center rounded-md border border-white/20 text-white lg:hidden hover:bg-white/10"
                aria-label="Toggle menu"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>

              <StorefrontHomeLink
                {...brandHomeLinkProps}
                className="group flex flex-col justify-center select-none"
              >
                <span className="font-sans text-2xl font-black tracking-wider text-white uppercase drop-shadow-xs">
                  {displayStoreName || "WAREHOUSE"}
                </span>
                <span className="text-[9px] font-bold tracking-widest text-[#a3afef] -mt-1 uppercase">
                  DIRECT DEPOT & OUTLET
                </span>
              </StorefrontHomeLink>
            </div>

            {/* Central Mega Search Bar with Category Select & Yellow Action Button */}
            {showSearch && (
              <form
                onSubmit={handlePcHubSearchSubmit}
                className="hidden md:flex flex-1 max-w-2xl items-center rounded-lg bg-white overflow-hidden shadow-inner border border-white/20"
              >
                {/* Category Dropdown */}
                <div className="relative border-e border-neutral-200 bg-neutral-50/90 text-neutral-700">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="h-10 pe-7 ps-3 text-xs font-semibold bg-transparent border-0 outline-none cursor-pointer text-ellipsis overflow-hidden max-w-[150px]"
                  >
                    {warehouseCategories.map((cat) => (
                      <option key={cat.id} value={cat.id} className="text-neutral-900 bg-white">
                        {cat.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute end-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                </div>

                {/* Input */}
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="I'm shopping for... / ابحث عن منتج، كود، أو ماركة"
                  className="flex-1 h-10 px-3.5 text-xs text-neutral-900 placeholder-neutral-400 outline-none"
                />

                {/* Warehouse Signature Yellow Search Button (#ffc220) */}
                <button
                  type="submit"
                  className="flex h-10 items-center justify-center gap-1.5 bg-[#ffc220] hover:bg-[#f0b518] px-5 text-xs font-bold text-[#16225a] transition-colors duration-150 active:scale-[0.98]"
                  title="Search"
                >
                  <Search className="h-4 w-4" />
                  <span className="hidden sm:inline">Search</span>
                </button>
              </form>
            )}

            {/* Right Action Icons (Account & Cart) */}
            <div className="flex items-center gap-3 sm:gap-5 text-white">
              <Link
                to="/account"
                className="hidden sm:flex items-center gap-2 text-xs font-medium text-white hover:text-[#ffc220] transition-colors"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 border border-white/15">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex flex-col text-start leading-tight">
                  <span className="text-[10px] text-[#a3afef]">Sign In</span>
                  <span className="font-bold">My Account</span>
                </div>
              </Link>

              {showCart && (
                <button
                  type="button"
                  onClick={() => setIsOpen(true)}
                  className="relative flex items-center gap-2.5 rounded-lg bg-white/10 hover:bg-white/15 px-3 py-2 border border-white/15 transition-all duration-150 active:scale-[0.98]"
                  aria-label="View Shopping Cart"
                >
                  <div className="relative">
                    <ShoppingCart className="h-5 w-5 text-[#ffc220]" />
                    {totalItems > 0 && (
                      <span className="absolute -top-2 -end-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#ffc220] px-1 text-[10px] font-black text-[#16225a] shadow-xs">
                        {totalItems}
                      </span>
                    )}
                  </div>
                  <div className="hidden lg:flex flex-col text-start leading-tight">
                    <span className="text-[10px] text-[#a3afef]">Cart Total</span>
                    <span className="font-bold text-xs text-white">
                      {totalItems > 0 ? `${totalItems} items` : "0.00 " + currency}
                    </span>
                  </div>
                </button>
              )}
            </div>

          </div>
        </div>

        {/* 3. Secondary Navigation Bar (White Surface with Category Tabs & Deals) */}
        <div className="hidden lg:block bg-white border-b border-[#e1e3e4] px-4 py-2 sm:px-6">
          <div className="mx-auto max-w-7xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-6 font-semibold text-[#16225a]">
              
              {/* All Categories Pill */}
              <Link
                to="/collections"
                className="flex items-center gap-1.5 rounded-md bg-[#1e2d7d] hover:bg-[#16225a] px-3.5 py-1.5 text-xs font-bold text-white transition-colors"
              >
                <span>SHOP BY DEPARTMENT</span>
                <ChevronDown className="h-3.5 w-3.5 text-[#ffc220]" />
              </Link>

              {/* Navigation Links */}
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`transition-colors py-1 hover:text-[#1e2d7d] ${
                    isActive(link.to)
                      ? "text-[#1e2d7d] font-bold border-b-2 border-[#1e2d7d]"
                      : "text-neutral-700"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {/* Deals Highlight */}
              <Link
                to="/shop?filter=deals"
                className="flex items-center gap-1 text-[#d9383a] font-bold hover:underline"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>DAILY DEALS / عروض اليوم</span>
                <span className="rounded-xs bg-[#d9383a] px-1.5 py-0.2 text-[9px] font-bold text-white">
                  HOT
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-3 text-neutral-500 text-[11px]">
              <span>Need help buying in bulk?</span>
              <Link to="/contact" className="font-bold text-[#1e2d7d] hover:underline">
                Wholesale Inquiry
              </Link>
            </div>
          </div>
        </div>

      </header>

      {/* Search Overlay for fast live results */}
      {searchOpen && (
        <StorefrontSearchOverlay
          theme={theme}
          query={query}
          setQuery={setQuery}
          closeSearchOverlay={closeSearchOverlay}
          results={results}
          isLoading={isLoading}
          moreResultsPath={moreResultsPath}
        />
      )}
    </>
  );
};

export default WarehouseMegaHeader;
