import React from "react";
import { CubeIcon } from "@heroicons/react/24/outline";
import {
  Badge,
  EmptyState,
  formatInteger,
  MerchantInventorySummary,
  MerchantProduct,
  MerchantProfileStats,
  statusTone,
  toNumber,
} from "./types";

interface MerchantInventoryProductsSectionProps {
  stats: MerchantProfileStats;
  products: MerchantProduct[];
  inventorySummary?: MerchantInventorySummary | null;
  formatPrice: (amount: number) => string;
}

export const MerchantInventoryProductsSection: React.FC<MerchantInventoryProductsSectionProps> = ({
  stats,
  products,
  inventorySummary,
  formatPrice,
}) => {
  return (
    <section className="rounded-xl border border-border bg-white p-5 shadow-sm dark:border-border dark:bg-muted">
      <div className="flex items-center gap-2">
        <CubeIcon className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-bold">المخزون والمنتجات</h2>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl bg-muted p-3 dark:bg-muted">
          <p className="text-slate-500">المتاح للبيع</p>
          <p className="mt-1 font-bold tabular-nums">{formatInteger(stats.availableForSale)}</p>
        </div>
        <div className="rounded-xl bg-muted p-3 dark:bg-muted">
          <p className="text-slate-500">المحجوز</p>
          <p className="mt-1 font-bold tabular-nums">{formatInteger(stats.reservedQuantity)}</p>
        </div>
        <div className="rounded-xl bg-muted p-3 dark:bg-muted">
          <p className="text-slate-500">فعلي</p>
          <p className="mt-1 font-bold tabular-nums">{formatInteger(stats.physicalQuantity)}</p>
        </div>
        <div className="rounded-xl bg-muted p-3 dark:bg-muted">
          <p className="text-slate-500">منتجات مربوطة</p>
          <p className="mt-1 font-bold tabular-nums">{formatInteger(stats.linkedProducts)}</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {products.slice(0, 6).map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-border p-3 dark:border-border"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">
                  {item.product?.name || "منتج غير محدد"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground font-mono">
                  SKU: {item.merchantSku || item.product?.sku || "غير محدد"}
                </p>
              </div>
              <Badge
                label={item.isActive ? "نشط" : "موقوف"}
                tone={statusTone(item.isActive ? "ACTIVE" : "INACTIVE")}
              />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <span className="rounded-lg bg-muted px-2 py-2 dark:bg-muted tabular-nums">
                بيع: {formatPrice(toNumber(item.merchantPrice))}
              </span>
              <span className="rounded-lg bg-muted px-2 py-2 dark:bg-muted tabular-nums">
                متاح: {formatInteger(item.inventorySnapshot?.availableForSale)}
              </span>
              <span className="rounded-lg bg-muted px-2 py-2 dark:bg-muted">
                مصدر:{" "}
                {item.inventorySnapshot?.stockLocationLabel ||
                  inventorySummary?.stockLocationLabel ||
                  "غير محدد"}
              </span>
            </div>
          </div>
        ))}
        {!products.length ? (
          <EmptyState text="لا توجد منتجات مربوطة بهذا التاجر." />
        ) : null}
      </div>
    </section>
  );
};
