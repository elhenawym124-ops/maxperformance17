import React from "react";
import { X } from "lucide-react";
import { type CustomerLoyaltyTier, type LoyaltyProgram } from "./types";
import { TierGovernoratesPicker } from "./TierGovernoratesPicker";
import { TierBenefitsSection } from "./TierBenefitsSection";

interface TierModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTier: Partial<CustomerLoyaltyTier> | null;
  setEditingTier: React.Dispatch<
    React.SetStateAction<Partial<CustomerLoyaltyTier> | null>
  >;
  programs: LoyaltyProgram[];
  onSave: (e: React.FormEvent) => void;
  isSaving: boolean;
}

export const TierModal: React.FC<TierModalProps> = ({
  isOpen,
  onClose,
  editingTier,
  setEditingTier,
  programs,
  onSave,
  isSaving,
}) => {
  if (!isOpen || !editingTier) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden shadow-2xl">
        <div className="sticky top-0 bg-card px-6 py-4 border-b border-border dark:border-border flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-foreground">
            {editingTier.id ? "تعديل المستوى" : "إنشاء مستوى جديد"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={onSave} className="p-6 space-y-6">
          {!editingTier.id && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                برنامج الولاء
              </label>
              <select
                value={editingTier.programId || ""}
                onChange={(e) =>
                  setEditingTier({ ...editingTier, programId: e.target.value })
                }
                required
                className="w-full px-4 py-2 rounded-lg border border-border dark:border-border bg-white dark:bg-muted"
              >
                <option value="">اختر برنامج الولاء</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nameAr || p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                الاسم (بالأجنبية)
              </label>
              <input
                type="text"
                required
                value={editingTier.name || ""}
                onChange={(e) =>
                  setEditingTier({ ...editingTier, name: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg border border-border dark:border-border bg-white dark:bg-muted"
                placeholder="e.g. VIP"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                الاسم (بالعربية)
              </label>
              <input
                type="text"
                required
                value={editingTier.nameAr || ""}
                onChange={(e) =>
                  setEditingTier({ ...editingTier, nameAr: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg border border-border dark:border-border bg-white dark:bg-muted text-right"
                placeholder="مثلاً: كبار الشخصيات"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                الحد الأدنى للنقاط
              </label>
              <input
                type="number"
                required
                min={0}
                value={editingTier.minPoints || 0}
                onChange={(e) =>
                  setEditingTier({
                    ...editingTier,
                    minPoints: Number(e.target.value),
                  })
                }
                className="w-full px-4 py-2 rounded-lg border border-border dark:border-border bg-white dark:bg-muted"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                الحد الأقصى للنقاط (اختياري)
              </label>
              <input
                type="number"
                min={0}
                value={editingTier.maxPoints || ""}
                onChange={(e) =>
                  setEditingTier({
                    ...editingTier,
                    maxPoints: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="w-full px-4 py-2 rounded-lg border border-border dark:border-border bg-white dark:bg-muted"
              />
            </div>
          </div>

          {/* 🌍 النطاق الجغرافي للمستوى */}
          <TierGovernoratesPicker
            targetGovernorates={editingTier.targetGovernorates}
            onChange={(targetGovernorates) =>
              setEditingTier({ ...editingTier, targetGovernorates })
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                لون المستوى
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={editingTier.color || "#6366f1"}
                  onChange={(e) =>
                    setEditingTier({ ...editingTier, color: e.target.value })
                  }
                  className="w-12 h-10 p-1 rounded border border-border cursor-pointer"
                />
                <div className="flex-1 text-sm text-muted-foreground">
                  اختر لوناً يعبر عن المستوى
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                الأيقونة
              </label>
              <select
                value={editingTier.icon || "crown"}
                onChange={(e) =>
                  setEditingTier({ ...editingTier, icon: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg border border-border dark:border-border bg-white dark:bg-muted"
              >
                <option value="crown">تاج (Crown)</option>
                <option value="medal">ميدالية (Medal)</option>
                <option value="gem">جوهرة (Gem)</option>
                <option value="trophy">كأس (Trophy)</option>
                <option value="award">جائزة (Award)</option>
              </select>
            </div>
          </div>

          {/* 🎁 مميزات ومكافآت وشروط المستوى */}
          <TierBenefitsSection
            editingTier={editingTier}
            setEditingTier={setEditingTier}
          />

          <div className="flex gap-3 pt-4 border-t border-border dark:border-border sticky bottom-0 bg-card pb-2">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white py-2 rounded-lg font-bold transition-all shadow-lg shadow-primary dark:shadow-none"
            >
              {isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted dark:hover:bg-muted"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
