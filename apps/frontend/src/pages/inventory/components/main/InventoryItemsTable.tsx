import React from "react";
import {
  CubeIcon,
  EyeIcon,
  ArrowPathIcon,
  PlusIcon,
  MinusIcon,
} from "@heroicons/react/24/outline";
import { useDateFormat } from "../../../../hooks/useDateFormat";
import { useCurrency } from "../../../../hooks/useCurrency";
import type { InventoryItem } from "./types";

interface InventoryItemsTableProps {
  inventory: InventoryItem[];
  onViewDetails: (item: InventoryItem) => void;
  onOpenTransfer: (item: InventoryItem) => void;
  onOpenSupply: (item: InventoryItem) => void;
  onOpenDispense: (item: InventoryItem) => void;
}

export const InventoryItemsTable: React.FC<InventoryItemsTableProps> = ({
  inventory,
  onViewDetails,
  onOpenTransfer,
  onOpenSupply,
  onOpenDispense,
}) => {
  const { formatDate } = useDateFormat();
  const { formatPrice } = useCurrency();

  const getStockStatus = (item: InventoryItem) => {
    if (item.available === 0) {
      return {
        status: "نفد المخزون",
        color:
          "text-rose-700 bg-destructive/10 border border-destructive/80 dark:bg-destructive/30 dark:border-destructive/50 dark:text-destructive",
        dot: "bg-rose-500",
      };
    }

    if (item.available <= (item.reorderPoint || 0)) {
      return {
        status: "مخزون منخفض",
        color:
          "text-amber-700 bg-warning/10 border border-warning/80 dark:bg-warning/30 dark:border-warning/50 dark:text-warning",
        dot: "bg-amber-500",
      };
    }

    return {
      status: "متوفر",
      color:
        "text-emerald-700 bg-success/10 border border-success/80 dark:bg-success/30 dark:border-success/50 dark:text-success",
      dot: "bg-emerald-500",
    };
  };

  return (
    <div className="bg-white dark:bg-muted shadow-2xs rounded-xl overflow-hidden border border-border dark:border-border">
      {/* Mobile View (< sm:) */}
      <div className="block sm:hidden divide-y divide-border dark:divide-border p-3 space-y-3">
        {inventory.map((item) => {
          const stockStatus = getStockStatus(item);
          return (
            <div
              key={item.id}
              className="bg-card/90 rounded-xl p-3.5 border border-border dark:border-border space-y-2.5 shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-foreground line-clamp-1">
                    {item.productName}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                    {item.sku && (
                      <span dir="ltr" className="font-mono text-[11px] tabular-nums">
                        {item.sku}
                      </span>
                    )}
                    <span>•</span>
                    <span>{item.warehouseName}</span>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${stockStatus.color}`}
                >
                  {stockStatus.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-muted dark:bg-muted p-2.5 rounded-lg text-center">
                <div>
                  <span className="block text-[11px] text-muted-foreground">الإجمالي</span>
                  <span className="text-sm font-bold text-foreground tabular-nums font-mono">
                    {item.quantity}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] text-muted-foreground">المتاح</span>
                  <span className="text-sm font-bold text-success dark:text-success tabular-nums font-mono">
                    {item.available}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] text-muted-foreground">السعر</span>
                  <span className="text-sm font-bold text-primary tabular-nums font-mono">
                    {formatPrice(item.price)}
                  </span>
                  {item.cost !== undefined && item.cost !== null && item.cost > 0 ? (
                    <span className="block text-[10px] text-muted-foreground/80 tabular-nums font-mono">
                      تكلفة: {formatPrice(item.cost)}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-muted-foreground/80 text-[11px] tabular-nums font-mono">
                  {item.batchNumber ? `دفعة: ${item.batchNumber}` : "بدون دفعة"}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onViewDetails(item)}
                    className="p-1.5 rounded-lg text-primary hover:bg-primary/10 dark:hover:bg-primary/30 cursor-pointer"
                    title="تفاصيل"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  {item.canEditStock !== false && (
                    <>
                      <button
                        type="button"
                        onClick={() => onOpenTransfer(item)}
                        className="p-1.5 rounded-lg text-warning dark:text-warning hover:bg-warning/10 dark:hover:bg-warning/30 cursor-pointer"
                        title="نقل"
                      >
                        <ArrowPathIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenSupply(item)}
                        className="p-1.5 rounded-lg text-success dark:text-success hover:bg-success/10 dark:hover:bg-success/30 cursor-pointer"
                        title="توريد"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenDispense(item)}
                        className="p-1.5 rounded-lg text-destructive dark:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/30 cursor-pointer"
                        title="صرف"
                      >
                        <MinusIcon className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table (sm: and above) */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full divide-y divide-border dark:divide-border">
          <thead className="bg-gray-50/80 dark:bg-muted">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                المنتج / SKU
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                المستودع
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                الدفعة / الصلاحية
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                الكمية
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                المتاح
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                الحالة
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                السعر
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white/60 dark:bg-muted divide-y divide-border dark:divide-border">
            {inventory.map((item) => {
              const stockStatus = getStockStatus(item);

              return (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50/70 dark:hover:bg-muted transition-colors border-b border-border dark:border-border last:border-0"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-xs sm:text-sm font-semibold text-foreground">
                      {item.productName}
                    </div>
                    <div className="text-[11px] text-muted-foreground/80 font-mono tabular-nums">
                      {item.sku}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs sm:text-sm text-foreground dark:text-muted-foreground">
                    <div>{item.warehouseName}</div>
                    {item.stockLocationLabel && (
                      <div className="text-[11px] text-muted-foreground/80">
                        {item.stockLocationLabel}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground font-mono tabular-nums">
                    <div>{item.batchNumber || "---"}</div>
                    {item.expiryDate && (
                      <div className="text-[10px] text-destructive">
                        {formatDate(item.expiryDate)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs sm:text-sm text-foreground font-mono tabular-nums font-bold">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs sm:text-sm text-success dark:text-success font-mono tabular-nums font-semibold">
                    {item.available}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${stockStatus.color}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${stockStatus.dot}`} />
                      {stockStatus.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs sm:text-sm text-foreground font-mono tabular-nums font-semibold">
                    <div>{formatPrice(item.price)}</div>
                    {item.cost !== undefined && item.cost !== null && item.cost > 0 ? (
                      <div className="text-[11px] text-muted-foreground/80 font-normal">
                        تكلفة: {formatPrice(item.cost)}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs font-medium">
                    <div className="flex items-center space-x-1.5 space-x-reverse">
                      <button
                        type="button"
                        onClick={() => onViewDetails(item)}
                        className="p-1 text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-muted rounded-md transition-colors cursor-pointer"
                        title="عرض التفاصيل"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      {item.canEditStock !== false && (
                        <>
                          <button
                            type="button"
                            onClick={() => onOpenTransfer(item)}
                            className="p-1.5 text-warning dark:text-warning hover:text-warning dark:hover:text-warning hover:bg-muted rounded-lg transition-colors cursor-pointer"
                            title="نقل مخزن"
                          >
                            <ArrowPathIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenSupply(item)}
                            className="p-1.5 text-success dark:text-success hover:text-success dark:hover:text-success hover:bg-muted rounded-lg transition-colors cursor-pointer"
                            title="توريد"
                          >
                            <PlusIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenDispense(item)}
                            className="p-1.5 text-destructive dark:text-destructive hover:text-destructive dark:hover:text-destructive hover:bg-muted rounded-lg transition-colors cursor-pointer"
                            title="صرف"
                          >
                            <MinusIcon className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {inventory.length === 0 && (
        <div className="text-center py-16">
          <CubeIcon className="mx-auto h-12 w-12 text-muted-foreground/80" />
          <h3 className="mt-2 text-base font-bold text-foreground">
            لا توجد بيانات مخزون حالياً
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            ابدأ بإضافة منتجاتك أو سجل كميات المخزون المتاحة.
          </p>
        </div>
      )}
    </div>
  );
};
