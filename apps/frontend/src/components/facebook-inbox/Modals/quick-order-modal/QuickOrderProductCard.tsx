import React from "react";
import { ArchiveBoxIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Product } from "./types";
import { headingStyle, mutedStyle, primaryStyle } from "./styles";

interface QuickOrderProductCardProps {
  product: Product;
  viewMode: "grid" | "list";
  handleProductClick: (product: Product) => void;
}

export const QuickOrderProductCard: React.FC<QuickOrderProductCardProps> = ({
  product,
  viewMode,
  handleProductClick,
}) => {
  if (viewMode === "list") {
    return (
      <div
        key={product.id}
        onClick={() => handleProductClick(product)}
        className="business-product-card group cursor-pointer flex items-center gap-3 p-2.5 rounded-xl border border-border/70 bg-card transition-all duration-150 active:scale-[0.99] hover:border-primary/50 hover:shadow-xs"
      >
        <div className="relative h-16 w-16 sm:h-18 sm:w-18 flex-shrink-0 overflow-hidden rounded-lg border border-border/50 bg-muted/25">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <ArchiveBoxIcon className="h-7 w-7 opacity-40" />
            </div>
          )}
          {product.variants.length > 0 && (
            <div className="absolute bottom-1 end-1 rounded-md border border-border/70 bg-background/90 px-1.5 py-0.5 text-[9px] font-medium text-foreground shadow-2xs">
              خيارات
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
          <div>
            <h3
              className="line-clamp-2 text-xs sm:text-sm font-medium text-foreground leading-snug"
              title={product.name}
            >
              {product.name}
            </h3>
            {product.sku && (
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 font-mono truncate">
                {product.sku}
              </p>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-foreground font-mono tabular-nums">
              {product.price} ج.م
            </span>
            {product.variants.length > 0 && (
              <span className="text-[10px] text-muted-foreground bg-muted/60 border border-border/50 px-1.5 py-0.5 rounded-md font-medium">
                <span className="font-mono tabular-nums">{product.variants.length}</span> خيار
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          className="inline-flex h-8 items-center gap-1 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all flex-shrink-0 cursor-pointer shadow-2xs"
          onClick={(e) => {
            e.stopPropagation();
            handleProductClick(product);
          }}
          aria-label="إضافة للطلب"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">إضافة</span>
        </button>
      </div>
    );
  }

  return (
    <div
      key={product.id}
      onClick={() => handleProductClick(product)}
      className="business-product-card group cursor-pointer flex flex-col justify-between overflow-hidden rounded-xl border border-border/70 bg-card transition-all duration-150 hover:border-primary/50 hover:shadow-xs active:scale-[0.98] h-full"
    >
      <div className="relative aspect-square w-full overflow-hidden border-b border-border/50 bg-muted/25">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ArchiveBoxIcon className="h-10 w-10 opacity-40" />
          </div>
        )}
        {product.variants.length > 0 && (
          <div className="absolute bottom-2 end-2 rounded-md border border-border/70 bg-background/90 px-1.5 py-0.5 text-[10px] font-medium text-foreground shadow-2xs">
            خيارات
          </div>
        )}
      </div>
      <div className="p-2.5 flex flex-col justify-between flex-1 gap-2">
        <h3
          className="line-clamp-2 text-xs sm:text-sm font-medium text-foreground leading-snug"
          title={product.name}
        >
          {product.name}
        </h3>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs sm:text-sm font-bold text-foreground font-mono tabular-nums truncate">
            {product.price} ج.م
          </span>
          <button
            type="button"
            className="inline-flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted/40 text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary active:scale-[0.97] transition-all cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handleProductClick(product);
            }}
            aria-label="إضافة للطلب"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
