import React from "react";
import { DocumentTextIcon } from "@heroicons/react/24/outline";
import { ProductVariant } from "./types";

interface VariantCardBasicInfoProps {
  idx: number;
  variant: ProductVariant;
  updateVariant: (idx: number, field: keyof ProductVariant, value: any) => void;
}

export const VariantCardBasicInfo: React.FC<VariantCardBasicInfoProps> = ({
  idx,
  variant,
  updateVariant,
}) => {
  return (
    <div className="border-b border-border pb-4">
      <h5 className="text-sm font-semibold text-foreground mb-3 flex items-center">
        <DocumentTextIcon className="h-4 w-4 ms-1" />
        المعلومات الأساسية
      </h5>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            اسم المتغير *
          </label>
          <input
            type="text"
            value={variant.name}
            onChange={(e) => updateVariant(idx, "name", e.target.value)}
            placeholder="مثل: أبيض، كبير"
            className="block w-full border-border dark:bg-muted dark:text-white rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            نوع المتغير
          </label>
          <select
            value={variant.type}
            onChange={(e) => updateVariant(idx, "type", e.target.value)}
            className="block w-full border-border bg-card text-foreground rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm"
          >
            <option value="color">لون</option>
            <option value="size">حجم</option>
            <option value="material">مادة</option>
            <option value="style">نمط</option>
            <option value="other">أخرى</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            SKU
          </label>
          <input
            type="text"
            value={variant.sku || ""}
            onChange={(e) => updateVariant(idx, "sku", e.target.value)}
            placeholder="PROD-VAR-001"
            className="block w-full border-border dark:bg-muted dark:text-white rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm font-mono"
          />
        </div>
      </div>
      {/* Description */}
      <div className="mt-3">
        <label className="block text-sm font-medium text-foreground mb-1">
          وصف المتغير
        </label>
        <textarea
          value={variant.description || ""}
          onChange={(e) => updateVariant(idx, "description", e.target.value)}
          rows={2}
          placeholder="وصف مختصر لهذا المتغير (اختياري)"
          className="block w-full border-border dark:bg-muted dark:text-white rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm"
        />
      </div>
    </div>
  );
};
