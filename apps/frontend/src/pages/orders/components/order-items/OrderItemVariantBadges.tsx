import React from "react";
import type { OrderItem } from "../types";
import type { OrderItemMetadata } from "./orderItemsTypes";
import { normalizeVariantBadges } from "./orderItemsHelpers";

export interface OrderItemVariantBadgesProps {
  item: OrderItem;
  itemMetadata: OrderItemMetadata;
  index: number;
  isEditing: boolean;
  onItemChange: (index: number, field: string, value: unknown) => void;
}

export const OrderItemVariantBadges: React.FC<OrderItemVariantBadgesProps> = ({
  item,
  itemMetadata,
  index,
  isEditing,
  onItemChange,
}) => {
  const variantValues = normalizeVariantBadges(item, itemMetadata);

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 flex-wrap mt-2">
        <div className="flex items-center gap-1.5 bg-primary/80 dark:bg-primary/20 px-2 py-1 rounded-lg border border-primary dark:border-primary">
          <span className="text-xs font-semibold text-primary dark:text-primary">اللون:</span>
          <input
            type="text"
            value={item.productColor ?? variantValues.color ?? ""}
            onChange={(e) => onItemChange(index, "productColor", e.target.value)}
            placeholder="اللون..."
            className="w-24 sm:w-28 px-1.5 py-0.5 text-xs font-semibold bg-card text-foreground border border-primary dark:border-primary rounded focus:ring-1 focus:ring-primary focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-1.5 bg-primary/80 dark:bg-primary/20 px-2 py-1 rounded-lg border border-primary dark:border-primary">
          <span className="text-xs font-semibold text-primary dark:text-primary">المقاس:</span>
          <input
            type="text"
            value={item.productSize != null ? String(item.productSize) : (variantValues.size ?? "")}
            onChange={(e) => onItemChange(index, "productSize", e.target.value)}
            placeholder="المقاس..."
            className="w-20 sm:w-24 px-1.5 py-0.5 text-xs font-semibold bg-card text-foreground border border-primary dark:border-primary rounded focus:ring-1 focus:ring-primary focus:outline-none"
          />
        </div>
      </div>
    );
  }

  return variantValues.color || variantValues.size ? (
    <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
      {variantValues.color && (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 bg-primary/10 dark:bg-primary/30 text-primary dark:text-primary rounded-md text-xs sm:text-sm font-semibold border border-primary dark:border-primary">
          اللون: {variantValues.color}
        </span>
      )}
      {variantValues.size && (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 bg-primary/10 dark:bg-primary/30 text-primary dark:text-primary rounded-md text-xs sm:text-sm font-semibold border border-primary dark:border-primary">
          المقاس: {variantValues.size}
        </span>
      )}
    </div>
  ) : null;
};
