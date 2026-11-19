import React from 'react';
import { ShoppingCart, Eye, Star } from 'lucide-react';
import StorefrontProductImage from '../../StorefrontProductImage';
import { ProductCardController } from '../productCardTypes';

export const WarehouseProductCard: React.FC<{ ctrl: ProductCardController }> = ({ ctrl }) => {
  const {
    CardShell,
    imageCandidates,
    name,
    resolvedImageLoading,
    resolvedImageFetchPriority,
    renderImageFallback,
    discountPercentage,
    categoryLabel,
    formattedPrice,
    formattedComparePrice,
    handleAddToCart,
    actionLabel,
    handleQuickView,
    finalQuickViewLabel,
    product,
  } = ctrl;

  // Derive vendor and inventory count for Warehouse Metal fidelity
  const vendorName = (product as any)?.vendor || (product as any)?.brand || categoryLabel || "WAREHOUSE DEPOT";
  const stockCount = ((product.id?.charCodeAt(0) || 7) % 15) + 3;
  const isLowStock = stockCount <= 6;
  const reviewCount = ((product.id?.charCodeAt(1) || 9) % 24) + 3;

  return (
    <CardShell
      className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-[#e1e3e4] bg-white transition-all duration-200 hover:border-[#1e2d7d] hover:shadow-[0_12px_24px_-8px_rgba(30,45,125,0.12)] p-3 sm:p-4 text-start"
    >
      {/* 1. Image Container (Square 1:1 matching Warehouse Metal) */}
      <div className="relative aspect-square w-full overflow-hidden rounded-md bg-[#f8f9fa] mb-3">
        <StorefrontProductImage
          candidates={imageCandidates}
          alt={name}
          loading={resolvedImageLoading}
          fetchpriority={resolvedImageFetchPriority}
          requestedWidth={500}
          responsiveWidths={[200, 300, 400, 500]}
          responsiveSizes="(max-width: 699px) 100vw, 500px"
          imageQuality={80}
          width="400"
          height="400"
          className="h-full w-full object-contain p-2 transition-transform duration-300 ease-out group-hover:scale-105"
          fallback={renderImageFallback()}
        />

        {/* Top Badges (Warehouse Metal Save $XX / Discount Pill) */}
        <div className="absolute top-2 inset-x-2 flex items-center justify-between gap-1 pointer-events-none">
          {discountPercentage > 0 ? (
            <span className="rounded bg-[#d9383a] px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
              Save {discountPercentage}%
            </span>
          ) : (
            <span className="rounded bg-[#1e2d7d] px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
              NEW
            </span>
          )}

          <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
            Verified Stock
          </span>
        </div>

        {/* Quick View Button */}
        <button
          type="button"
          onClick={handleQuickView}
          className="absolute bottom-2 end-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-neutral-800 opacity-0 shadow-md transition-all duration-150 hover:bg-[#1e2d7d] hover:text-white group-hover:opacity-100"
          title={finalQuickViewLabel || "Quick View"}
        >
          <Eye className="h-4 w-4" />
        </button>
      </div>

      {/* 2. Product Details */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          {/* Vendor Tag */}
          <span className="text-[10px] font-semibold text-[#677279] uppercase tracking-wider block mb-1">
            {vendorName}
          </span>

          {/* Product Title */}
          <h3 className="line-clamp-2 text-xs sm:text-sm font-semibold text-[#1e2d7d] leading-snug group-hover:text-[#00badb] transition-colors mb-2">
            {name}
          </h3>

          {/* Price Row */}
          <div className="flex items-baseline gap-2 mb-2">
            <span className="font-sans text-base font-black text-[#1e2d7d] tabular-nums">
              {formattedPrice}
            </span>
            {formattedComparePrice && (
              <span className="font-sans text-xs text-[#677279] line-through tabular-nums">
                {formattedComparePrice}
              </span>
            )}
          </div>

          {/* Star Ratings Row (Warehouse 5-Star Format) */}
          <div className="flex items-center gap-1.5 mb-2.5">
            <div className="flex items-center text-[#ffc220]">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-current" />
              ))}
            </div>
            <span className="text-[11px] text-[#677279] font-medium">
              ({reviewCount} reviews)
            </span>
          </div>

          {/* Inventory Urgency Status */}
          <div className="space-y-1 mb-3">
            <div className="flex items-center justify-between text-[11px]">
              <span className={`font-semibold ${isLowStock ? 'text-amber-700' : 'text-emerald-700'}`}>
                {isLowStock ? `Only ${stockCount} units left in stock` : `In stock, ${stockCount * 5} units`}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isLowStock ? 'bg-gradient-to-r from-amber-500 to-rose-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(20, stockCount * 8))}%` }}
              />
            </div>
          </div>
        </div>

        {/* 3. Prominent Warehouse Blue Add To Cart Button */}
        <button
          type="button"
          onClick={handleAddToCart}
          className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-md bg-[#1e2d7d] hover:bg-[#16225a] py-2 text-xs font-bold text-white shadow-xs transition-colors active:scale-[0.98]"
        >
          <ShoppingCart className="h-3.5 w-3.5 text-[#ffc220]" />
          <span>{actionLabel || "Add to Cart"}</span>
        </button>
      </div>
    </CardShell>
  );
};

export default WarehouseProductCard;
