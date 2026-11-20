import { SlidersHorizontal } from "lucide-react";

export interface ConversionToolsStudioEmptyStateProps {
  onResetFilters: () => void;
}

export function ConversionToolsStudioEmptyState({
  onResetFilters,
}: ConversionToolsStudioEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center dark:border-border">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground">
        <SlidersHorizontal className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-extrabold text-foreground dark:text-white">
        لم نجد أدوات مطابقة لبحثك
      </h3>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground dark:text-muted-foreground">
        جرّب تغيير كلمات البحث أو إعادة ضبط فلاتر الحالة والفئات لعرض الأدوات المتاحة.
      </p>
      <button
        type="button"
        onClick={onResetFilters}
        className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary"
      >
        <span>عرض كل الأدوات</span>
      </button>
    </div>
  );
}
