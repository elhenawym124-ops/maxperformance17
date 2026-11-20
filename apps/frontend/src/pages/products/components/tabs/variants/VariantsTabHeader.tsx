import React from "react";
import { PhotoIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

interface VariantsTabHeaderProps {
  variantsCount: number;
  colorGroupsCount: number;
  showVariants: boolean;
  setShowVariants: React.Dispatch<React.SetStateAction<boolean>>;
  defaultPricing?: {
    price?: number;
    comparePrice?: number;
    cost?: number;
  };
  displayCurrency: string;
  onOpenColorModal: () => void;
  onSyncPricing?: () => void;
  t: (key: string) => string;
}

export const VariantsTabHeader: React.FC<VariantsTabHeaderProps> = ({
  variantsCount,
  colorGroupsCount,
  showVariants,
  setShowVariants,
  defaultPricing,
  displayCurrency,
  onOpenColorModal,
  onSyncPricing,
  t,
}) => {
  return (
    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
      <div className="flex items-center gap-3 flex-wrap">
        <h3 className="text-lg font-medium text-foreground">
          {t("products.variants.title")} ({variantsCount})
        </h3>
        {variantsCount > 0 && (
          <button
            type="button"
            onClick={onOpenColorModal}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-success dark:text-success bg-success/10 dark:bg-success/40 hover:bg-success dark:hover:bg-success/40 border border-success dark:border-success/60 rounded-lg transition-colors shadow-sm active:scale-[0.98]"
            title="تعيين ورفع الصور لكل لون وتطبيقها على كافة مقاساته دفعة واحدة"
          >
            <PhotoIcon className="h-3.5 w-3.5" />
            تعيين الصور حسب اللون ({colorGroupsCount} ألوان)
          </button>
        )}
        {variantsCount > 0 &&
          defaultPricing?.price !== undefined &&
          Number(defaultPricing.price) > 0 && (
            <button
              type="button"
              onClick={onSyncPricing}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-primary dark:text-primary bg-primary/10 dark:bg-primary/30 hover:bg-primary dark:hover:bg-primary/50 border border-primary dark:border-primary/50 rounded-lg transition-colors shadow-sm"
              title="تطبيق سعر وسعر شراء المنتج الأساسي على جميع المتغيرات"
            >
              <ArrowPathIcon className="h-3.5 w-3.5" />
              مزامنة تسعير الكل مع المنتج الأساسي ({defaultPricing.price}{" "}
              {displayCurrency})
            </button>
          )}
      </div>
      <button
        type="button"
        onClick={() => setShowVariants(!showVariants)}
        className="px-3 py-1 text-sm bg-primary dark:bg-primary/30 text-primary dark:text-primary rounded-md hover:bg-primary dark:hover:bg-primary/50"
      >
        {showVariants ? "إخفاء" : "إظهار"}
      </button>
    </div>
  );
};
