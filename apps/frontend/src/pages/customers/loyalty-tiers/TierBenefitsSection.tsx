import React from "react";
import { SlidersHorizontal, Zap, Truck } from "lucide-react";
import { type CustomerLoyaltyTier } from "./types";

interface TierBenefitsSectionProps {
  editingTier: Partial<CustomerLoyaltyTier>;
  setEditingTier: React.Dispatch<
    React.SetStateAction<Partial<CustomerLoyaltyTier> | null>
  >;
}

export const TierBenefitsSection: React.FC<TierBenefitsSectionProps> = ({
  editingTier,
  setEditingTier,
}) => {
  return (
    <>
      {/* ⚙️ شروط مركبة إضافية للتأهل (Compound Conditions) */}
      <div className="p-4 bg-warning/50 dark:bg-warning/20 rounded-xl border border-warning dark:border-warning/40 space-y-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-warning" />
          <label className="text-sm font-bold text-foreground dark:text-muted-foreground">
            شروط مركبة إضافية للتأهل للمستوى (اختياري)
          </label>
        </div>
        <p className="text-xs text-muted-foreground">
          يمكنك اشتراط عدد طلبات محدد أو حد أدنى للإنفاق بجانب الشرط الرئيسي للترقية للمستوى.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              الحد الأدنى لعدد الطلبات المكتملة
            </label>
            <input
              type="number"
              min={0}
              placeholder="مثلاً: 3 طلبات"
              value={editingTier.conditions?.minOrders ?? ""}
              onChange={(e) =>
                setEditingTier({
                  ...editingTier,
                  conditions: {
                    ...editingTier.conditions,
                    minOrders: e.target.value ? Number(e.target.value) : undefined,
                  },
                })
              }
              className="w-full px-3 py-1.5 rounded-lg border border-border dark:border-border bg-white dark:bg-muted text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              الحد الأدنى لإجمالي الإنفاق (ج.م)
            </label>
            <input
              type="number"
              min={0}
              placeholder="مثلاً: 2000 ج.م"
              value={editingTier.conditions?.minSpent ?? ""}
              onChange={(e) =>
                setEditingTier({
                  ...editingTier,
                  conditions: {
                    ...editingTier.conditions,
                    minSpent: e.target.value ? Number(e.target.value) : undefined,
                  },
                })
              }
              className="w-full px-3 py-1.5 rounded-lg border border-border dark:border-border bg-white dark:bg-muted text-sm"
            />
          </div>
        </div>
      </div>

      {/* 🎁 مميزات ومكافآت المستوى المطبقة فعلياً */}
      <div className="space-y-4 p-4 bg-primary/40 dark:bg-primary/20 rounded-xl border border-primary dark:border-primary/40">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary dark:text-primary" />
          <label className="text-sm font-bold text-foreground">
            مميزات ومكافآت المستوى (تُطبق تلقائياً على طلبات عملاء هذا المستوى)
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ميزة الخصم مع القيمة المتغيرة */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>خصم على الطلبات (%)</span>
              <span className="text-[11px] text-muted-foreground font-normal">0 = بدون خصم</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={editingTier.discountPercent ?? 0}
                onChange={(e) => {
                  const val = e.target.value === "" ? 0 : Number(e.target.value);
                  setEditingTier({ ...editingTier, discountPercent: val });
                }}
                placeholder="مثال: 10"
                className="w-full ps-9 pe-4 py-2 rounded-lg border border-border dark:border-border bg-white dark:bg-muted text-sm font-medium focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground select-none">
                %
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              نسبة الخصم التي يتم تطبيقها تلقائياً على إجمالي مشتريات العميل عند الطلب.
            </p>
          </div>

          {/* ميزة شحن مجاني */}
          <div className="space-y-1.5 flex flex-col justify-between">
            <label className="text-xs font-semibold text-foreground">
              شحن مجاني
            </label>
            <div
              role="button"
              tabIndex={0}
              onClick={() =>
                setEditingTier({
                  ...editingTier,
                  freeShipping: !editingTier.freeShipping,
                })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setEditingTier({
                    ...editingTier,
                    freeShipping: !editingTier.freeShipping,
                  });
                }
              }}
              className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer select-none transition-all ${
                editingTier.freeShipping
                  ? "bg-purple-100/60 dark:bg-primary/40 border-primary dark:border-primary shadow-sm"
                  : "bg-white dark:bg-muted border-border dark:border-border hover:border-border"
              }`}
            >
              <div className="flex items-center gap-2">
                <Truck
                  className={`w-4 h-4 ${
                    editingTier.freeShipping
                      ? "text-purple-600 dark:text-primary"
                      : "text-gray-400"
                  }`}
                />
                <span className="text-sm font-medium text-foreground dark:text-muted-foreground">
                  تفعيل الشحن المجاني
                </span>
              </div>
              <div
                className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                  editingTier.freeShipping
                    ? "bg-purple-600 justify-end"
                    : "bg-gray-300 dark:bg-muted justify-start"
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              إعفاء العميل في هذا المستوى من رسوم الشحن تلقائياً عند الدفع.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
