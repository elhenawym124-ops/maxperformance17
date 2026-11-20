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

  return (
    <div
      key={group.groupId}
      className="p-6 bg-warning/70 dark:bg-warning/10"
    >
      <div className="rounded-xl border border-warning bg-white/80 p-5 shadow-sm dark:border-warning/40 dark:dark:bg-muted">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2 text-right">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-warning bg-warning/10 px-2.5 py-1 text-sm font-semibold text-warning dark:border-warning/40 dark:bg-warning/20 dark:text-warning">
                عرض كميات
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2.5 py-1 text-sm font-medium text-foreground dark:dark:border-border dark:dark:bg-muted dark:dark:text-muted-foreground">
                {group.offerLabel}
              </span>
              {group.freeShipping ? (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-success bg-success/10 px-2.5 py-1 text-sm font-semibold text-success dark:border-success/40 dark:bg-success/20 dark:text-success">
                  شحن مجاني
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium font-mono tabular-nums">
                {group.selectedPieces}/{group.offerQuantity || group.selectedPieces} قطع مختارة
              </span>
              <span>•</span>
              <span>
                إجمالي العرض:{" "}
                <span className="font-bold text-warning dark:text-warning font-mono tabular-nums">
                  {formatPrice(group.total)}
                </span>
              </span>
            </div>
          </div>
          <div className="rounded-xl border border-warning bg-warning/10 px-4 py-3 text-center dark:border-warning/40 dark:bg-warning/20">
            <div className="text-xs font-medium text-warning dark:text-warning">
              عدد القطع
            </div>
            <div className="mt-1 text-2xl font-black text-warning dark:text-warning font-mono tabular-nums">
              {group.offerQuantity || group.selectedPieces}
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {group.items.map(({ item, index, slotIndex }, itemPosition) => {
            const itemMetadata = getOrderItemMetadata(item);
            const productImage = getProductImage(item);
            const lineTotal =
              Number(item.price || 0) * Number(item.quantity || 1);

            return (
              <div
                key={`${group.groupId}-${item.id || item.productId || index}-${slotIndex || index}`}
                className="rounded-xl border border-border bg-white px-4 py-3 shadow-sm dark:dark:border-border dark:dark:bg-muted"
              >
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted border border-border">
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
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold text-foreground">
                            {item.productName}
                          </h4>
                          {item.productSku && (
                            <span className="inline-flex items-center gap-1 rounded bg-primary/10 dark:bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold font-mono text-primary dark:text-primary">
                              {item.productSku}
                            </span>
                          )}
                          <span className="inline-flex items-center rounded-md border border-warning bg-warning/10 px-2 py-0.5 text-xs font-semibold text-warning dark:border-warning/40 dark:bg-warning/20 dark:text-warning">
                            القطعة {slotIndex || itemPosition + 1}
                          </span>
                        </div>
                        <div className="mt-2">
                          {renderVariantBadges(item, itemMetadata)}
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="text-xs text-muted-foreground">
                          الإجمالي
                        </div>
                        <div className="text-sm font-bold text-primary dark:text-primary font-mono tabular-nums">
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
