import React from "react";
import { PhotoIcon } from "@heroicons/react/24/outline";
import { useCurrency } from "../../../../hooks/useCurrency";
import { OrderItem } from "../types";
import {
  QuantityOfferGroup,
  OrderItemMetadata,
} from "./orderItemsTypes";
import {
  getOrderItemMetadata,
  getProductImage,
  normalizeVariantBadges,
} from "./orderItemsHelpers";

interface OrderItemBundleRowProps {
  group: QuantityOfferGroup;
}

export const OrderItemBundleRow: React.FC<OrderItemBundleRowProps> = ({
  group,
}) => {
  const { formatPrice } = useCurrency();

  const renderVariantBadges = (
    item: OrderItem,
    itemMetadata: OrderItemMetadata,
  ) => {
    const variantValues = normalizeVariantBadges(item, itemMetadata);

    return variantValues.color || variantValues.size ? (
      <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
        {variantValues.color && (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 bg-primary/10 dark:bg-primary/15 text-foreground rounded-md text-xs sm:text-sm font-semibold border border-primary/25">
            اللون: {variantValues.color}
          </span>
        )}
        {variantValues.size && (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 bg-primary/10 dark:bg-primary/15 text-foreground rounded-md text-xs sm:text-sm font-semibold border border-primary/25">
            المقاس: {variantValues.size}
          </span>
        )}
      </div>
    ) : null;
  };

  return (
    <div
      key={group.groupId}
      className="p-3.5 sm:p-5 bg-warning/5 sm:bg-warning/10"
    >
      <div className="sm:rounded-xl sm:border sm:border-warning/35 sm:bg-card sm:p-5 sm:shadow-xs">
        <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2 text-start">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-warning/35 bg-warning/10 px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs sm:text-sm font-semibold text-warning">
                عرض كميات
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-muted/50 px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs sm:text-sm font-medium text-foreground">
                {group.offerLabel}
              </span>
              {group.freeShipping ? (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-success/35 bg-success/10 px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs sm:text-sm font-semibold text-success">
                  شحن مجاني
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <span className="font-medium font-mono tabular-nums">
                {group.selectedPieces}/{group.offerQuantity || group.selectedPieces} قطع مختارة
              </span>
              <span>•</span>
              <span>
                إجمالي العرض:{" "}
                <span className="font-bold text-warning font-mono tabular-nums">
                  {formatPrice(group.total)}
                </span>
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between sm:block rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 sm:px-4 sm:py-3 text-center">
            <div className="text-xs font-medium text-warning">
              عدد القطع
            </div>
            <div className="sm:mt-1 text-lg sm:text-2xl font-black text-warning font-mono tabular-nums">
              {group.offerQuantity || group.selectedPieces}
            </div>
          </div>
        </div>

        <div className="mt-3 sm:mt-4 divide-y divide-border/60 sm:divide-y-0 sm:space-y-3 border-t border-border/60 sm:border-t-0 pt-2 sm:pt-0">
          {group.items.map(({ item, index, slotIndex }, itemPosition) => {
            const itemMetadata = getOrderItemMetadata(item);
            const productImage = getProductImage(item);
            const lineTotal =
              Number(item.price || 0) * Number(item.quantity || 1);

            return (
              <div
                key={`${group.groupId}-${item.id || item.productId || index}-${slotIndex || index}`}
                className="py-2.5 sm:rounded-xl sm:border sm:border-border/70 sm:bg-card sm:px-4 sm:py-3 sm:shadow-xs"
              >
                <div className="flex gap-3 sm:gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-muted border border-border/70">
                      {productImage ? (
                        <img
                          src={productImage}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <PhotoIcon className="w-6 h-6 text-muted-foreground/80" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <h4 className="text-sm font-bold text-foreground">
                            {item.productName}
                          </h4>
                          {item.productSku && (
                            <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold font-mono text-primary">
                              {item.productSku}
                            </span>
                          )}
                          <span className="inline-flex items-center rounded-md border border-warning/35 bg-warning/10 px-2 py-0.5 text-xs font-semibold text-warning">
                            القطعة {slotIndex || itemPosition + 1}
                          </span>
                        </div>
                        <div className="mt-1.5 sm:mt-2">
                          {renderVariantBadges(item, itemMetadata)}
                        </div>
                      </div>
                      <div className="text-end shrink-0">
                        <div className="text-xs text-muted-foreground">
                          الإجمالي
                        </div>
                        <div className="text-sm font-bold text-primary font-mono tabular-nums">
                          {formatPrice(lineTotal)}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground font-mono tabular-nums">
                          الكمية: {item.quantity || 1}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
