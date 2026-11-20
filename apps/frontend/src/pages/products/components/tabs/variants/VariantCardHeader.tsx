import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ProductVariant } from "./types";

interface VariantCardHeaderProps {
  idx: number;
  variant: ProductVariant;
  isExpanded: boolean;
  displayCurrency: string;
  onToggle: () => void;
  onRemove: () => void;
}

export const VariantCardHeader: React.FC<VariantCardHeaderProps> = ({
  idx,
  variant,
  isExpanded,
  displayCurrency,
  onToggle,
  onRemove,
}) => {
  return (
    <div
      className="px-5 py-4 flex flex-wrap gap-4 items-center justify-between cursor-pointer transition-colors select-none group"
      onClick={onToggle}
    >
      <div className="flex items-center gap-4">
        {/* Number Handle */}
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-md text-sm font-semibold transition-colors tabular-nums ${
            isExpanded
              ? "bg-indigo-100 dark:bg-primary/50 text-primary dark:text-primary"
              : "bg-gray-200 dark:bg-muted text-foreground"
          }`}
        >
          {idx + 1}
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h4
              className={`font-semibold text-base transition-colors ${
                isExpanded
                  ? "text-indigo-900 dark:text-primary"
                  : "text-foreground"
              }`}
            >
              {variant.name || "متغير جديد"}
            </h4>
            {variant.type && (
              <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                {variant.type === "color"
                  ? "لون"
                  : variant.type === "size"
                    ? "حجم"
                    : variant.type}
              </span>
            )}
          </div>
          {variant.sku && (
            <span className="text-xs text-muted-foreground/80 font-medium mt-0.5 font-mono tracking-wide">
              {variant.sku}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {variant.price ? (
          <div className="text-right hidden sm:block">
            <p className="text-xs text-muted-foreground/80 mb-0.5">
              السعر
            </p>
            <span className="text-sm font-bold text-foreground tabular-nums">
              {variant.price}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                {displayCurrency}
              </span>
            </span>
          </div>
        ) : null}

        {variant.trackInventory && variant.stock !== undefined ? (
          <div className="text-right hidden sm:block">
            <p className="text-xs text-muted-foreground/80 mb-0.5">
              المخزون
            </p>
            <span
              className={`text-sm font-bold tabular-nums ${variant.stock > 0 ? "text-foreground" : "text-red-600 dark:text-destructive"}`}
            >
              {variant.stock}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                قطعة
              </span>
            </span>
          </div>
        ) : null}

        <span
          className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
            variant.isActive
              ? "bg-green-50 text-success border-success dark:bg-success/20 dark:text-success dark:border-success/50"
              : "bg-gray-50 text-foreground border-border dark:bg-muted dark:text-muted-foreground dark:border-border"
          }`}
        >
          {variant.isActive ? "نشط" : "معطل"}
        </span>

        <div className="h-8 w-px bg-muted dark:bg-muted mx-1 hidden sm:block"></div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="text-muted-foreground/80 hover:text-destructive dark:hover:text-destructive p-2 rounded-md hover:bg-destructive/10 dark:hover:bg-destructive/20 transition-all focus:outline-none focus:ring-2 focus:ring-destructive/20"
          title="حذف المتغير"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        <div
          className={`p-1.5 rounded-full transition-colors ${
            isExpanded
              ? "bg-indigo-50 dark:bg-primary/30 text-primary"
              : "bg-transparent text-muted-foreground group-hover:text-foreground dark:group-hover:text-muted-foreground"
          }`}
        >
          <svg
            className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
