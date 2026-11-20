import React from "react";
import { PhotoIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

interface VariantsSavedImagesSyncBannerProps {
  syncableSavedCount: number;
  variantsCount: number;
  onApplyAllSavedColorImages: () => void;
}

export const VariantsSavedImagesSyncBanner: React.FC<VariantsSavedImagesSyncBannerProps> = ({
  syncableSavedCount,
  variantsCount,
  onApplyAllSavedColorImages,
}) => {
  if (syncableSavedCount <= 0) return null;

  return (
    <div className="bg-gradient-to-r from-success to-primary dark:from-success/30 dark:to-primary/30 border border-success/80 dark:border-success/60 rounded-xl p-3.5 sm:p-4 mb-4 flex items-center justify-between flex-wrap gap-3 shadow-sm animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-success dark:bg-success/60 flex items-center justify-center text-success dark:text-success flex-shrink-0">
          <PhotoIcon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs sm:text-sm font-bold text-foreground">
            تم العثور على {syncableSavedCount} صور ألوان محفوظة مسبقاً لهذا المنتج!
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            يمكنك تطبيقها فوراً على جميع المقاسات والمتغيرات ({variantsCount} مقاس) بنقرة واحدة دون الحاجة لإعادة الرفع.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onApplyAllSavedColorImages}
        className="inline-flex items-center gap-1.5 px-4 py-2 bg-success hover:bg-success active:scale-[0.98] text-white text-xs font-semibold rounded-lg shadow-sm transition whitespace-nowrap"
      >
        <ArrowPathIcon className="w-3.5 h-3.5" />
        تطبيق صور الألوان على كل المقاسات الآن
      </button>
    </div>
  );
};
