import React from "react";
import { Tag, ArrowUpRight } from "lucide-react";

interface StudioQuickStrategyTriggersProps {
  productName: string;
  cost: number;
  stock: number;
  onRequestAction?: (actionPrompt: string) => void;
}

export const StudioQuickStrategyTriggers: React.FC<StudioQuickStrategyTriggersProps> = ({
  productName,
  cost,
  stock,
  onRequestAction,
}) => {
  return (
    <div className="space-y-2 pt-2">
      <h4 className="text-[11px] font-black text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
        أدوات التحليل والضبط السريع
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() =>
            onRequestAction?.(
              `افحص هامش الربح لمنتج "${productName}" وقارنه بالتكلفة ${cost} ج.م واقترح أفضل تسعير.`
            )
          }
          className="p-2.5 rounded-xl border border-border dark:border-border bg-white dark:bg-muted hover:border-primary hover:bg-primary/30 dark:hover:bg-primary/20 active:scale-[0.98] transition text-right cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-foreground dark:text-white group-hover:text-primary dark:group-hover:text-primary">
              مراجعة الهامش والتسعير
            </span>
            <Tag className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition" />
          </div>
          <p className="text-[10px] text-muted-foreground dark:text-muted-foreground">
            حساب صافي الربح واقتراح سعر بيع متوازن
          </p>
        </button>

        <button
          type="button"
          onClick={() =>
            onRequestAction?.(
              `تحقق من حركة مبيعات ورصيد منتج "${productName}" (${stock} قطعة) وتوقع معدل الاستهلاك.`
            )
          }
          className="p-2.5 rounded-xl border border-border dark:border-border bg-white dark:bg-muted hover:border-primary hover:bg-primary/30 dark:hover:bg-primary/20 active:scale-[0.98] transition text-right cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-foreground dark:text-white group-hover:text-primary dark:group-hover:text-primary">
              توقع نفاذ المخزون
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition" />
          </div>
          <p className="text-[10px] text-muted-foreground dark:text-muted-foreground">
            تقدير الأيام المتبقية وحساب حد إعادة الطلب
          </p>
        </button>
      </div>
    </div>
  );
};
