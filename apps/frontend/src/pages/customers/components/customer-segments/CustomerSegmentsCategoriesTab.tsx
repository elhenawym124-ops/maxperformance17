import React from "react";
import {
  PlusIcon, PencilIcon, TrashIcon, SparklesIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "../../../../components/LoadingSpinner";
import { LeadCategory, Flow, COLOR_PRESETS } from "./types";

interface CustomerSegmentsCategoriesTabProps {
  categories: LeadCategory[];
  catLoading: boolean;
  catError: string;
  showCatForm: boolean;
  onOpenCreate: () => void;
  onCloseForm: () => void;
  editingCat: LeadCategory | null;
  catName: string;
  onCatNameChange: (v: string) => void;
  catColor: string;
  onCatColorChange: (v: string) => void;
  catAutoFollowUp: boolean;
  onCatAutoFollowUpChange: (v: boolean) => void;
  catTriggerFlowId: string;
  onCatTriggerFlowIdChange: (v: string) => void;
  catSaving: boolean;
  flows: Flow[];
  onSaveCategory: () => void;
  onEditCategory: (cat: LeadCategory) => void;
  onDeleteCategory: (id: string) => void;
}

export const CustomerSegmentsCategoriesTab: React.FC<CustomerSegmentsCategoriesTabProps> = ({
  categories,
  catLoading,
  catError,
  showCatForm,
  onOpenCreate,
  onCloseForm,
  editingCat,
  catName,
  onCatNameChange,
  catColor,
  onCatColorChange,
  catAutoFollowUp,
  onCatAutoFollowUpChange,
  catTriggerFlowId,
  onCatTriggerFlowIdChange,
  catSaving,
  flows,
  onSaveCategory,
  onEditCategory,
  onDeleteCategory,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onOpenCreate}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 cursor-pointer"
        >
          <PlusIcon className="h-4 w-4 ms-2" /> إضافة تصنيف
        </button>
      </div>

      {showCatForm && (
        <div className="bg-card p-4 rounded-lg shadow dark:shadow-md border border-primary dark:border-primary">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">الاسم</label>
              <input
                type="text"
                value={catName}
                onChange={(e) => onCatNameChange(e.target.value)}
                placeholder="اسم التصنيف"
                className="block w-full px-3 py-2 border border-border rounded-md bg-card text-foreground text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">اللون</label>
              <div className="flex gap-1.5 flex-wrap">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onCatColorChange(c)}
                    className={`w-7 h-7 rounded-full border-2 cursor-pointer ${
                      catColor === c ? "border-gray-900 dark:border-white scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">متابعة تلقائية</label>
              <label className="flex items-center gap-2 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={catAutoFollowUp}
                  onChange={(e) => onCatAutoFollowUpChange(e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                />
                <span className="text-sm text-foreground">تفعيل</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">رحلة رسائل تلقائية</label>
              <select
                value={catTriggerFlowId}
                onChange={(e) => onCatTriggerFlowIdChange(e.target.value)}
                className="block w-full px-3 py-2 border border-border rounded-md bg-card text-foreground text-sm focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="">بدون رحلة</option>
                {flows
                  .filter((f) => f.isEnabled)
                  .map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
              </select>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                عند اختيار تصنيف للعميل، بتتسجل تلقائيًا في الرحلة دي
              </p>
            </div>
            <div className="flex items-end gap-2 justify-end md:col-span-4">
              <button
                type="button"
                onClick={onCloseForm}
                className="px-3 py-2 text-sm border border-border rounded-md text-foreground hover:bg-muted/50 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={onSaveCategory}
                disabled={catSaving || !catName.trim()}
                className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary disabled:opacity-50 cursor-pointer"
              >
                {catSaving ? "جاري الحفظ..." : editingCat ? "تحديث" : "إضافة"}
              </button>
            </div>
          </div>
        </div>
      )}

      {catLoading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {catError && (
        <div className="bg-red-50 dark:bg-destructive/20 border border-destructive dark:border-destructive text-destructive dark:text-destructive px-4 py-3 rounded-md">
          {catError}
        </div>
      )}

      {!catLoading && !catError && (
        <div className="bg-card shadow dark:shadow-md overflow-hidden sm:rounded-md">
          {categories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">لا توجد تصنيفات بعد</div>
          ) : (
            <table className="min-w-full divide-y divide-border dark:divide-border">
              <thead className="bg-gray-50 dark:bg-muted">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground">التصنيف</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground">جهات الاتصال</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground">في الرحلة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground">متابعة تلقائية</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground">الترتيب</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-border">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full inline-block" style={{ backgroundColor: cat.color }} />
                        <span className="text-sm font-medium text-foreground">{cat.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground dark:text-muted-foreground font-mono tabular-nums" dir="ltr">
                      {cat.contactCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {cat.triggerFlow ? (
                        <div className="flex items-center gap-1">
                          <SparklesIcon className="h-3.5 w-3.5 text-warning" />
                          <span className="text-xs text-foreground">{cat.triggerFlow.name}</span>
                          {cat.activeJourneyCount > 0 && (
                            <span className="text-[10px] text-muted-foreground font-mono tabular-nums">
                              ({cat.activeJourneyCount})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {cat.autoFollowUp ? (
                        <span className="text-green-600 dark:text-success text-sm">مفعلة</span>
                      ) : (
                        <span className="text-gray-400 text-sm">غير مفعلة</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground dark:text-muted-foreground font-mono tabular-nums" dir="ltr">
                      {cat.sortOrder}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => onEditCategory(cat)}
                          className="text-indigo-600 hover:text-primary cursor-pointer"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteCategory(cat.id)}
                          className="text-red-500 hover:text-destructive cursor-pointer"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};
