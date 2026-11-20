import React from "react";
import { ArrowPathIcon, TagIcon, TrashIcon } from "@heroicons/react/24/outline";
import { QuickProductAttribute, QuickGeneratedVariant } from "./types";

interface QuickAddVariantsMatrixProps {
  validAttributes: QuickProductAttribute[];
  potentialCombinationCount: number;
  onGenerateVariations: () => void;
  variants: QuickGeneratedVariant[];
  price: string;
  onApplyBasePriceToAll: () => void;
  bulkStockValue: string;
  setBulkStockValue: (val: string) => void;
  onApplyBulkStockToAll: () => void;
  onUpdateVariant: (id: string, field: "price" | "stock", value: string) => void;
  onRemoveVariant: (id: string) => void;
  fieldErrorOptions?: string;
}

export const QuickAddVariantsMatrix: React.FC<QuickAddVariantsMatrixProps> = ({
  validAttributes,
  potentialCombinationCount,
  onGenerateVariations,
  variants,
  price,
  onApplyBasePriceToAll,
  bulkStockValue,
  setBulkStockValue,
  onApplyBulkStockToAll,
  onUpdateVariant,
  onRemoveVariant,
  fieldErrorOptions,
}) => {
  return (
    <div className="space-y-4">
      {/* Generation Action Banner */}
      {validAttributes.length > 0 && (
        <div className="p-3.5 rounded-xl bg-success/70 dark:bg-success/30 border border-success dark:border-success/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ArrowPathIcon className="w-4 h-4 text-success dark:text-success" />
              <span className="text-xs sm:text-sm font-bold text-success dark:text-success">
                توليد التركيبات والمتغيرات ({potentialCombinationCount})
              </span>
            </div>
            <p className="text-xs text-success dark:text-success mt-0.5">
              سيتم دمج الخصائص:{" "}
              {validAttributes.map((a) => `${a.name} (${a.values.length})`).join(" × ")}
            </p>
          </div>

          <button
            type="button"
            onClick={onGenerateVariations}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-success hover:bg-success text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-97 shrink-0"
          >
            <ArrowPathIcon className="w-4 h-4" />
            <span>توليد المتغيرات ({potentialCombinationCount})</span>
          </button>
        </div>
      )}

      {/* Generated Variations Matrix / List */}
      {variants.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-primary/80 dark:border-primary/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-foreground dark:text-muted-foreground">
                قائمة المتغيرات المولدة ({variants.length})
              </span>
              <p className="text-[11px] text-muted-foreground dark:text-muted-foreground">
                حدد السعر والكمية لكل متغير أو طبّق قيمة موحدة
              </p>
            </div>

            {/* Bulk Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {price && (
                <button
                  type="button"
                  onClick={onApplyBasePriceToAll}
                  className="px-2.5 py-1 text-[11px] font-semibold text-primary dark:text-primary bg-primary/10 dark:bg-primary/30 hover:bg-primary rounded-lg border border-primary dark:border-primary/40 transition-colors"
                >
                  تطبيق السعر الأساسي ({price}) على الكل
                </button>
              )}
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  value={bulkStockValue}
                  onChange={(e) => setBulkStockValue(e.target.value)}
                  placeholder="كمية موحدة"
                  className="w-20 px-2 py-1 text-xs tabular-nums bg-white dark:bg-muted border border-border dark:border-border rounded-lg text-foreground dark:text-muted-foreground focus:outline-none"
                />
                <button
                  type="button"
                  onClick={onApplyBulkStockToAll}
                  disabled={!bulkStockValue.trim()}
                  className="px-2.5 py-1 text-[11px] font-semibold text-foreground dark:text-muted-foreground bg-muted dark:bg-muted hover:bg-muted rounded-lg border border-border dark:border-border disabled:opacity-50 transition-colors"
                >
                  تطبيق
                </button>
              </div>
            </div>
          </div>

          {/* Variations Scrollable List */}
          <div className="space-y-2 max-h-60 overflow-y-auto pe-0.5">
            {variants.map((v) => (
              <div
                key={v.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 rounded-xl bg-white dark:bg-muted border border-border dark:border-border shadow-2xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <TagIcon className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-xs font-bold text-foreground dark:text-muted-foreground truncate">
                    {v.name}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* Price */}
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-muted-foreground">السعر:</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={v.price}
                      onChange={(e) => onUpdateVariant(v.id, "price", e.target.value)}
                      placeholder={price || "0.00"}
                      className="w-20 px-2 py-1 text-xs tabular-nums bg-muted dark:bg-muted border border-border dark:border-border rounded-lg text-foreground dark:text-muted-foreground focus:outline-none"
                    />
                  </div>

                  {/* Stock */}
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-muted-foreground">الكمية:</span>
                    <input
                      type="number"
                      min="0"
                      value={v.stock}
                      onChange={(e) => onUpdateVariant(v.id, "stock", e.target.value)}
                      placeholder="10"
                      className="w-18 px-2 py-1 text-xs tabular-nums bg-muted dark:bg-muted border border-border dark:border-border rounded-lg text-foreground dark:text-muted-foreground focus:outline-none"
                    />
                  </div>

                  {/* Delete variant */}
                  <button
                    type="button"
                    onClick={() => onRemoveVariant(v.id)}
                    aria-label={`حذف متغير ${v.name}`}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {fieldErrorOptions && (
        <p className="text-xs text-destructive">{fieldErrorOptions}</p>
      )}
    </div>
  );
};
