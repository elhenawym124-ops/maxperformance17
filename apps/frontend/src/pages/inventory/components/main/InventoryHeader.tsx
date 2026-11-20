import React from "react";
import { PlusIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

interface InventoryHeaderProps {
  isMerchant: boolean;
  canEditAnyStock: boolean;
  onDownloadCsv: () => void;
  onCreateProduct: () => void;
  onOpenStockUpdate: () => void;
}

export const InventoryHeader: React.FC<InventoryHeaderProps> = ({
  isMerchant,
  canEditAnyStock,
  onDownloadCsv,
  onCreateProduct,
  onOpenStockUpdate,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground dark:text-white sm:text-2xl">
          {isMerchant ? "مخزوني" : "إدارة المخزون"}
        </h1>
        <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
          {isMerchant
            ? "متابعة المنتجات المسندة لك والأرصدة المتاحة في مخازنك أو مخازن الشركة"
            : "متابعة وإدارة مستويات المخزون والتنبيهات لجميع منتجات الشركة"}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={onDownloadCsv}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border dark:border-border rounded-lg text-xs font-medium text-foreground hover:bg-muted/50/80 shadow-2xs active:scale-[0.98] transition-all cursor-pointer"
        >
          تصدير CSV
        </button>
        <button
          type="button"
          onClick={onCreateProduct}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-muted hover:bg-muted dark:bg-white dark:text-foreground dark:hover:bg-muted shadow-2xs active:scale-[0.98] transition-all cursor-pointer"
          title="إنشاء طلب سريع / إضافة منتج"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          إضافة منتج
        </button>
        {canEditAnyStock && (
          <button
            type="button"
            onClick={onOpenStockUpdate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border dark:border-border bg-card rounded-lg text-xs font-medium text-foreground hover:bg-muted/50/80 shadow-2xs active:scale-[0.98] transition-all cursor-pointer"
          >
            <ArrowPathIcon className="h-3.5 w-3.5" />
            تحديث المخزون
          </button>
        )}
      </div>
    </div>
  );
};
