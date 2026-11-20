import React from "react";
import type { DuplicateGroupItem, SelectedVariant } from "./types";

interface ConsolidatorVariantsStepProps {
  selectedItemsList: DuplicateGroupItem[];
  variantEdits: Record<string, Partial<SelectedVariant>>;
  onSetVariantEdit: (id: string, patch: Partial<SelectedVariant>) => void;
}

export const ConsolidatorVariantsStep: React.FC<ConsolidatorVariantsStepProps> = ({
  selectedItemsList,
  variantEdits,
  onSetVariantEdit,
}) => {
  if (selectedItemsList.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-foreground mb-2">
        4. تفاصيل المتغيرات (لكل منتج SKU مستقل)
      </h2>
      <div className="space-y-3">
        {selectedItemsList.map((item) => {
          const edit = variantEdits[item.id] || {};
          return (
            <div
              key={item.id}
              className="border border-border dark:border-border rounded-lg p-3 bg-muted dark:bg-muted"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">اسم المتغير</label>
                  <input
                    type="text"
                    value={edit.name ?? item.name}
                    onChange={(e) => onSetVariantEdit(item.id, { name: e.target.value })}
                    className="w-full border-border bg-card text-foreground rounded-md text-sm p-1.5"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">SKU</label>
                  <input
                    type="text"
                    value={edit.sku ?? item.sku ?? ""}
                    onChange={(e) => onSetVariantEdit(item.id, { sku: e.target.value })}
                    className="w-full border-border bg-card text-foreground rounded-md text-sm p-1.5 font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">السعر</label>
                  <input
                    type="number"
                    value={edit.price !== undefined ? edit.price : item.price}
                    onChange={(e) =>
                      onSetVariantEdit(item.id, {
                        price: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    className="w-full border-border bg-card text-foreground rounded-md text-sm p-1.5 font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">المخزون (اختياري)</label>
                  <input
                    type="number"
                    value={edit.stock !== undefined && edit.stock !== null ? edit.stock : ""}
                    onChange={(e) =>
                      onSetVariantEdit(item.id, {
                        stock: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    placeholder="يُورث من المنتج الأصلي"
                    className="w-full border-border bg-card text-foreground rounded-md text-sm p-1.5 font-mono tabular-nums"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
