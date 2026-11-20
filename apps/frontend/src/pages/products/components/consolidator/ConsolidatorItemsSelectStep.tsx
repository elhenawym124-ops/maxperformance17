import React from "react";
import { getImageUrl } from "../../../../utils/imageUrl";
import type { DuplicateGroup } from "./types";

interface ConsolidatorItemsSelectStepProps {
  activeGroup: DuplicateGroup;
  selectedCount: number;
  selectedItems: Record<string, boolean>;
  onSelectAll: () => void;
  onToggleItem: (id: string) => void;
}

export const ConsolidatorItemsSelectStep: React.FC<ConsolidatorItemsSelectStepProps> = ({
  activeGroup,
  selectedCount,
  selectedItems,
  onSelectAll,
  onToggleItem,
}) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-foreground">
          2. اختر المنتجات المطلوب دمجها ({selectedCount}/{activeGroup.items.length})
        </h2>
        <button
          type="button"
          onClick={onSelectAll}
          className="text-xs text-primary hover:underline cursor-pointer"
        >
          تحديد الكل
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {activeGroup.items.map((item) => (
          <div
            key={item.id}
            className={`border rounded-lg p-3 cursor-pointer transition-colors ${
              selectedItems[item.id]
                ? "border-indigo-500 bg-primary/10 dark:bg-primary/20"
                : "border-gray-200 dark:border-border bg-card hover:border-border"
            }`}
            onClick={() => onToggleItem(item.id)}
          >
            <div className="flex items-start gap-3">
              {item.images?.[0] ? (
                <img
                  src={getImageUrl(item.images[0], "thumbnail") || ""}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="w-14 h-14 object-cover rounded-lg"
                />
              ) : (
                <div className="w-14 h-14 bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-xs">
                  لا توجد صورة
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {item.name}
                </p>
                <p className="text-xs text-muted-foreground font-mono tabular-nums">
                  SKU: {item.sku || "—"}
                </p>
                <p className="text-xs text-muted-foreground font-mono tabular-nums">
                  {item.price} ج.م
                </p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(selectedItems[item.id])}
                onChange={() => onToggleItem(item.id)}
                onClick={(e) => e.stopPropagation()}
                className="mt-1 accent-primary cursor-pointer"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
