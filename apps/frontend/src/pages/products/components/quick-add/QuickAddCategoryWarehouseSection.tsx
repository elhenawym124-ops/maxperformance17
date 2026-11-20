import React from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { CategoryOption, WarehouseOption, QuickGeneratedVariant } from "./types";

interface QuickAddCategoryWarehouseSectionProps {
  categoryId: string;
  setCategoryId: (val: string) => void;
  categories: CategoryOption[];
  loadingCategories: boolean;
  isQuickAddingCategory: boolean;
  setIsQuickAddingCategory: (val: boolean) => void;
  newCategoryName: string;
  setNewCategoryName: (val: string) => void;
  addingCategoryLoading: boolean;
  handleQuickAddCategory: () => void;
  showWarehouseSelect: boolean;
  warehouseId: string;
  setWarehouseId: (val: string) => void;
  internalWarehouses: WarehouseOption[];
  loadingWarehouses: boolean;
  hasOptions: boolean;
  stock: string;
  setStock: (val: string) => void;
  variants: QuickGeneratedVariant[];
  fieldErrors: { [key: string]: string };
  setFieldErrors: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
}

export const QuickAddCategoryWarehouseSection: React.FC<QuickAddCategoryWarehouseSectionProps> = ({
  categoryId,
  setCategoryId,
  categories,
  loadingCategories,
  isQuickAddingCategory,
  setIsQuickAddingCategory,
  newCategoryName,
  setNewCategoryName,
  addingCategoryLoading,
  handleQuickAddCategory,
  showWarehouseSelect,
  warehouseId,
  setWarehouseId,
  internalWarehouses,
  loadingWarehouses,
  hasOptions,
  stock,
  setStock,
  variants,
  fieldErrors,
  setFieldErrors,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Category with inline quick add and select */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs sm:text-sm font-semibold text-foreground dark:text-muted-foreground">
            قسم المنتج <span className="text-rose-500">*</span>
          </label>
          {!isQuickAddingCategory && (
            <button
              type="button"
              onClick={() => setIsQuickAddingCategory(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary dark:text-primary dark:hover:text-primary transition-colors"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>إضافة قسم جديد</span>
            </button>
          )}
        </div>

        {isQuickAddingCategory ? (
          <div className="space-y-2 p-2 bg-primary/60 dark:bg-primary/30 border border-primary dark:border-primary/60 rounded-xl">
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                autoFocus
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleQuickAddCategory();
                  }
                }}
                placeholder="اكتب اسم القسم الجديد (مثال: ملابس)..."
                className="flex-1 px-3 py-1.5 text-xs sm:text-sm bg-white dark:bg-muted border border-primary dark:border-primary rounded-lg text-foreground dark:text-muted-foreground placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                disabled={addingCategoryLoading || !newCategoryName.trim()}
                onClick={handleQuickAddCategory}
                className="px-3 py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary/90 active:scale-95 disabled:opacity-50 rounded-lg transition-all shrink-0"
              >
                {addingCategoryLoading ? "جارٍ الحفظ..." : "حفظ القسم"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsQuickAddingCategory(false);
                  setNewCategoryName("");
                }}
                className="px-2.5 py-1.5 text-xs font-medium text-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-muted rounded-lg transition-colors shrink-0"
              >
                إلغاء
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                if (fieldErrors.category) setFieldErrors((p) => ({ ...p, category: "" }));
              }}
              disabled={loadingCategories}
              className={`flex-1 px-3.5 py-2.5 text-sm bg-white dark:bg-muted border rounded-xl text-foreground dark:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
                fieldErrors.category
                  ? "border-rose-400 dark:border-destructive"
                  : "border-slate-200 dark:border-border"
              }`}
            >
              <option value="">
                {loadingCategories
                  ? "جارٍ تحميل الأقسام..."
                  : categories.length === 0
                  ? "-- لا توجد أقسام (اضغط + لإضافة قسم) --"
                  : "-- اختر القسم --"}
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || c.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setIsQuickAddingCategory(true)}
              title="إضافة قسم جديد فوراً"
              aria-label="إضافة قسم جديد"
              className="inline-flex items-center gap-1 px-3 py-2 bg-primary/10 hover:bg-primary dark:bg-primary/40 dark:hover:bg-primary/50 text-primary dark:text-primary border border-primary dark:border-primary/40 rounded-xl text-xs font-bold transition-all transform active:scale-95 shrink-0"
            >
              <PlusIcon className="w-4 h-4" />
              <span className="hidden sm:inline">قسم جديد</span>
            </button>
          </div>
        )}
        {fieldErrors.category && (
          <p className="mt-1 text-xs text-destructive">{fieldErrors.category}</p>
        )}
      </div>

      {/* Warehouse Selector (shown when showWarehouseSelect is true) */}
      {showWarehouseSelect && (
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-foreground dark:text-muted-foreground mb-1.5">
            المخزن <span className="text-rose-500">*</span>
          </label>
          <select
            value={warehouseId}
            onChange={(e) => {
              setWarehouseId(e.target.value);
              if (fieldErrors.warehouse) setFieldErrors((p) => ({ ...p, warehouse: "" }));
            }}
            disabled={loadingWarehouses}
            className={`w-full px-3.5 py-2.5 text-sm bg-white dark:bg-muted border rounded-xl text-foreground dark:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
              fieldErrors.warehouse
                ? "border-rose-400 dark:border-destructive"
                : "border-slate-200 dark:border-border"
            }`}
          >
            <option value="">
              {loadingWarehouses
                ? "جارٍ تحميل المخازن..."
                : internalWarehouses.length === 0
                ? "-- لا توجد مخازن متاحة --"
                : "-- اختر المخزن --"}
            </option>
            {internalWarehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
          {fieldErrors.warehouse && (
            <p className="mt-1 text-xs text-destructive">{fieldErrors.warehouse}</p>
          )}
        </div>
      )}

      {/* Initial Stock (Only manually editable when no variants are enabled) */}
      <div className={showWarehouseSelect ? "sm:col-span-2" : ""}>
        <label className="block text-xs sm:text-sm font-semibold text-foreground dark:text-muted-foreground mb-1.5">
          الكمية المتوفرة بالمخزن
          {hasOptions && (
            <span className="text-[11px] font-normal text-primary me-1.5">
              (تُحسب تلقائياً من مجموع المتغيرات)
            </span>
          )}
        </label>
        <input
          type="number"
          min="0"
          disabled={hasOptions}
          value={
            hasOptions
              ? variants.reduce((sum, v) => sum + (parseInt(v.stock, 10) || 0), 0)
              : stock
          }
          onChange={(e) => setStock(e.target.value)}
          placeholder="10"
          className="w-full px-3.5 py-2.5 text-sm tabular-nums bg-white dark:bg-muted border border-border dark:border-border rounded-xl text-foreground dark:text-muted-foreground placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-muted dark:disabled:bg-muted disabled:text-muted-foreground transition-all"
        />
      </div>
    </div>
  );
};
