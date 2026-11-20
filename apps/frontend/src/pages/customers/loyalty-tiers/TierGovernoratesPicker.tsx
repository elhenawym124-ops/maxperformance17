import React from "react";
import { MapPin } from "lucide-react";
import { EGYPT_GOVERNORATES } from "./types";

interface TierGovernoratesPickerProps {
  targetGovernorates?: string[];
  onChange: (governorates: string[]) => void;
}

export const TierGovernoratesPicker: React.FC<TierGovernoratesPickerProps> = ({
  targetGovernorates = [],
  onChange,
}) => {
  return (
    <div className="space-y-3 p-4 bg-muted dark:bg-muted rounded-xl border border-border dark:border-border">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <label className="text-sm font-bold text-foreground dark:text-muted-foreground flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          النطاق الجغرافي للمستوى (المحافظات المؤهلة)
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs text-primary dark:text-primary hover:underline"
          >
            تحديد كعام (لكل المحافظات)
          </button>
          <span className="text-gray-300">|</span>
          <button
            type="button"
            onClick={() => onChange([...EGYPT_GOVERNORATES])}
            className="text-xs text-primary dark:text-primary hover:underline"
          >
            اختيار الكل
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        اتركها فارغة لتطبيق المستوى على جميع المحافظات، أو اختر محافظات معينة
        (مثل القاهرة والجيزة) ليكون مستوى مخصصاً لمنطقتهم فقط.
      </p>

      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-card rounded-lg border border-border dark:border-border">
        {EGYPT_GOVERNORATES.map((gov) => {
          const isSelected =
            Array.isArray(targetGovernorates) &&
            targetGovernorates.includes(gov);
          return (
            <button
              key={gov}
              type="button"
              onClick={() => {
                const current = Array.isArray(targetGovernorates)
                  ? targetGovernorates
                  : [];
                const updated = isSelected
                  ? current.filter((g) => g !== gov)
                  : [...current, gov];
                onChange(updated);
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                isSelected
                  ? "bg-purple-600 text-white shadow-sm"
                  : "bg-muted text-foreground hover:bg-muted dark:hover:bg-muted"
              }`}
            >
              {isSelected ? "✓ " : ""}
              {gov}
            </button>
          );
        })}
      </div>
    </div>
  );
};
