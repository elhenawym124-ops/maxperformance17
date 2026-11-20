import React from "react";

interface InventoryFilterPanelProps {
  filters: {
    warehouseId: string;
    lowStock: boolean;
    outOfStock: boolean;
  };
  warehouses: { id: string; name: string }[];
  onFilterChange: (filters: {
    warehouseId: string;
    lowStock: boolean;
    outOfStock: boolean;
  }) => void;
  onResetFilters: () => void;
}

export const InventoryFilterPanel: React.FC<InventoryFilterPanelProps> = ({
  filters,
  warehouses,
  onFilterChange,
  onResetFilters,
}) => {
  return (
    <div className="rounded-xl border border-border dark:border-border bg-white dark:bg-muted p-3 sm:p-4 shadow-2xs">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            بحث عن منتج
          </label>
          <input
            type="text"
            placeholder="ابحث باسم المنتج أو الـ SKU..."
            className="w-full px-3 py-1.5 text-xs sm:text-sm border border-border dark:border-border bg-card text-foreground rounded-lg focus:outline-none focus:ring-1 focus:ring-border transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            المستودع
          </label>
          <select
            value={filters.warehouseId}
            onChange={(e) =>
              onFilterChange({ ...filters, warehouseId: e.target.value })
            }
            className="w-full px-2.5 py-1.5 text-xs sm:text-sm border border-border dark:border-border bg-card text-foreground rounded-lg focus:outline-none focus:ring-1 focus:ring-border cursor-pointer transition-all"
          >
            <option value="">جميع المستودعات</option>
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={onResetFilters}
            className="w-full px-3 py-1.5 bg-muted hover:bg-muted dark:bg-muted dark:hover:bg-muted text-foreground text-xs font-medium rounded-lg active:scale-[0.98] transition-all cursor-pointer"
          >
            إعادة تعيين
          </button>
        </div>
      </div>

      <div className="mt-3 flex gap-4 pt-2 border-t border-border dark:border-border">
        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-foreground dark:text-muted-foreground">
          <input
            type="checkbox"
            checked={filters.lowStock}
            onChange={(e) =>
              onFilterChange({ ...filters, lowStock: e.target.checked })
            }
            className="rounded border-border text-foreground focus:ring-border dark:bg-muted"
          />
          <span>مخزون منخفض فقط</span>
        </label>

        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-foreground dark:text-muted-foreground">
          <input
            type="checkbox"
            checked={filters.outOfStock}
            onChange={(e) =>
              onFilterChange({ ...filters, outOfStock: e.target.checked })
            }
            className="rounded border-border text-foreground focus:ring-border dark:bg-muted"
          />
          <span>نفد المخزون فقط</span>
        </label>
      </div>
    </div>
  );
};
