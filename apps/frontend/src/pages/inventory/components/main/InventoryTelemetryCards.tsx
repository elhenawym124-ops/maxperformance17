import React from "react";
import { useCurrency } from "../../../../hooks/useCurrency";

interface InventoryTelemetryCardsProps {
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export const InventoryTelemetryCards: React.FC<InventoryTelemetryCardsProps> = ({
  totalItems,
  totalValue,
  lowStockCount,
  outOfStockCount,
}) => {
  const { formatPrice } = useCurrency();

  return (
    <div className="rounded-xl border border-border dark:border-border bg-white dark:bg-muted shadow-2xs overflow-hidden">
      <div className="grid grid-cols-2 divide-y divide-border dark:divide-border sm:grid-cols-4 sm:divide-y-0 sm:divide-x rtl:">
        <div className="p-3 sm:p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium mb-1">
            <span>إجمالي المنتجات</span>
            <span className="flex h-1.5 w-1.5 rounded-full bg-muted dark:bg-muted" />
          </div>
          <div className="text-lg sm:text-xl font-bold tracking-tight text-foreground dark:text-white font-mono tabular-nums">
            {totalItems.toLocaleString()}
          </div>
        </div>

        <div className="p-3 sm:p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium mb-1">
            <span>إجمالي قيمة المخزون</span>
            <span className="flex h-1.5 w-1.5 rounded-full bg-muted dark:bg-muted" />
          </div>
          <div className="text-lg sm:text-xl font-bold tracking-tight text-foreground dark:text-white font-mono tabular-nums">
            {formatPrice(totalValue)}
          </div>
        </div>

        <div className="p-3 sm:p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium mb-1">
            <span>مخزون منخفض</span>
            <span className="flex h-1.5 w-1.5 rounded-full bg-warning" />
          </div>
          <div className="text-lg sm:text-xl font-bold tracking-tight text-warning dark:text-warning font-mono tabular-nums">
            {lowStockCount}
          </div>
        </div>

        <div className="p-3 sm:p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium mb-1">
            <span>نفد من المخزون</span>
            <span className="flex h-1.5 w-1.5 rounded-full bg-destructive" />
          </div>
          <div className="text-lg sm:text-xl font-bold tracking-tight text-destructive dark:text-destructive font-mono tabular-nums">
            {outOfStockCount}
          </div>
        </div>
      </div>
    </div>
  );
};
