import React, { useMemo, useState } from "react";
import {
  Percent,
  Plus,
  Trash2,
  Pencil,
  Tag,
  Users,
  Banknote,
  X,
  Check,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Switch } from "../../../components/ui/switch";
import type { EducationCustomDiscount } from "./types";
import { INPUT_CLS, MODAL_CLS } from "./types";

export interface EducationDiscountsSectionProps {
  discounts: EducationCustomDiscount[];
  onAdd: (disc: Omit<EducationCustomDiscount, "id">) => Promise<void>;
  onUpdate: (id: string, patch: Partial<EducationCustomDiscount>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onToggle: (id: string, active?: boolean) => Promise<void>;
  saving?: boolean;
  isEn?: boolean;
}

interface DiscountFormData {
  nameAr: string;
  nameEn: string;
  type: "PERCENTAGE" | "FIXED";
  value: number | "";
  code: string;
  isSiblingDiscount: boolean;
  minSiblings: number;
  description: string;
  isActive: boolean;
}

const INITIAL_FORM: DiscountFormData = {
  nameAr: "",
  nameEn: "",
  type: "PERCENTAGE",
  value: 10,
  code: "",
  isSiblingDiscount: false,
  minSiblings: 2,
  description: "",
  isActive: true,
};

export const EducationDiscountsSection: React.FC<EducationDiscountsSectionProps> = ({
  discounts,
  onAdd,
  onUpdate,
  onDelete,
  onToggle,
  saving = false,
  isEn = false,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DiscountFormData>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const activeCount = useMemo(
    () => (Array.isArray(discounts) ? discounts.filter((d) => d.isActive).length : 0),
    [discounts],
  );

  const openCreateModal = () => {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setModalOpen(true);
  };

  const openEditModal = (d: EducationCustomDiscount) => {
    setEditingId(d.id);
    setForm({
      nameAr: d.nameAr || "",
      nameEn: d.nameEn || "",
      type: d.type || "PERCENTAGE",
      value: d.value ?? 0,
      code: d.code || "",
      isSiblingDiscount: Boolean(d.minSiblings && d.minSiblings > 1),
      minSiblings: d.minSiblings && d.minSiblings > 1 ? d.minSiblings : 2,
      description: d.description || "",
      isActive: d.isActive !== false,
    });
    setModalOpen(true);
  };

  const handleSaveDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nameAr.trim()) return;

    setSubmitting(true);
    try {
      const payload: Omit<EducationCustomDiscount, "id"> = {
        nameAr: form.nameAr.trim(),
        nameEn: form.nameEn.trim() || undefined,
        type: form.type,
        value: typeof form.value === "number" ? Math.max(0, form.value) : 0,
        code: form.code.trim().toUpperCase() || undefined,
        minSiblings: form.isSiblingDiscount ? Math.max(2, Number(form.minSiblings) || 2) : undefined,
        description: form.description.trim() || undefined,
        isActive: form.isActive,
      };

      if (editingId) {
        await onUpdate(editingId, payload);
      } else {
        await onAdd(payload);
      }
      setModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSubmitting(true);
    try {
      await onDelete(id);
      setDeleteConfirmId(null);
    } finally {
      setSubmitting(false);
    }
  };

  // Live simulation on a 1,000 EGP sample package
  const sampleCalc = useMemo(() => {
    const samplePrice = 1000;
    const val = typeof form.value === "number" ? form.value : 0;
    let discAmount = 0;
    if (form.type === "PERCENTAGE") {
      discAmount = Math.round(samplePrice * (Math.min(100, Math.max(0, val)) / 100));
    } else {
      discAmount = Math.min(samplePrice, Math.max(0, val));
    }
    return {
      discount: discAmount,
      final: Math.max(0, samplePrice - discAmount),
    };
  }, [form.type, form.value]);

  return (
    <section className="p-4 sm:p-5 border-b border-border/60 space-y-3.5">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <Tag className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-foreground truncate">
                {isEn ? "Dynamic Custom Discounts & Offers" : "نظام الخصومات والعروض المخصصة"}
              </h4>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 tabular-nums shrink-0">
                {isEn ? `${activeCount}/${discounts.length} Active` : `${activeCount}/${discounts.length} مفعل`}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              {isEn
                ? "Configure custom discounts (percentage % or fixed EGP, sibling rules, promo codes)"
                : "حدد وأنشئ سياسات الخصم الخاصة بمركزك (نسبة مئوية % أو مبلغ ثابت، خصومات الأخوات، والأكواد الترويجية)"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 shrink-0 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{isEn ? "Add Custom Discount" : "إضافة خصم مخصص"}</span>
        </button>
      </div>

      {/* Discounts List */}
      <div className="space-y-2 pt-1">
        {(!discounts || discounts.length === 0) ? (
          <div className="p-4 text-center rounded-xl border border-dashed border-border text-xs text-muted-foreground">
            {isEn
              ? "No custom discounts yet. Click 'Add Custom Discount' to define rules for your center."
              : "لا توجد خصومات مخصصة بعد. اضغط على 'إضافة خصم مخصص' لإنشاء أول سياسة خصم لمركزك."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {discounts.map((discount) => {
              const isPercentage = discount.type === "PERCENTAGE";
              return (
                <div
                  key={discount.id}
                  className={`flex items-start justify-between gap-2.5 p-3 rounded-xl border transition-all ${
                    discount.isActive
                      ? "bg-card border-border/80 shadow-xs"
                      : "bg-muted/30 border-border/40 opacity-70"
                  }`}
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-foreground truncate">
                        {isEn ? discount.nameEn || discount.nameAr : discount.nameAr}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                          isPercentage
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        }`}
                      >
                        {isPercentage ? <Percent className="w-2.5 h-2.5" /> : <Banknote className="w-2.5 h-2.5" />}
                        {discount.value} {isPercentage ? "%" : isEn ? "EGP" : "ج.م"}
                      </span>
                      {discount.code && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                          {isEn ? "Code: " : "كود: "}
                          {discount.code}
                        </span>
                      )}
                      {discount.minSiblings && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <Users className="w-2.5 h-2.5" />
                          {isEn ? `Siblings (${discount.minSiblings}+)` : `للأخوة (${discount.minSiblings}+)`}
                        </span>
                      )}
                    </div>

                    {discount.description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {discount.description}
                      </p>
                    )}
                  </div>

                  {/* Actions & Toggle */}
                  <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(discount)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title={isEn ? "Edit discount" : "تعديل الخصم"}
                      aria-label={isEn ? "Edit discount" : "تعديل الخصم"}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(discount.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-500/10 transition-colors"
                      title={isEn ? "Delete discount" : "حذف الخصم"}
                      aria-label={isEn ? "Delete discount" : "حذف الخصم"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="h-4 w-px bg-border/70 mx-0.5" />
                    <Switch
                      checked={discount.isActive}
                      disabled={saving}
                      onCheckedChange={(val) => onToggle(discount.id, Boolean(val))}
                      aria-label={isEn ? "Toggle discount status" : "تبديل تفعيل الخصم"}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Inline Popover / Dialog */}
      {deleteConfirmId && (
        <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{isEn ? "Are you sure you want to delete this discount?" : "هل أنت متأكد من حذف قاعدة الخصم هذه؟"}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setDeleteConfirmId(null)}
              className="px-2.5 py-1 text-xs rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              {isEn ? "Cancel" : "إلغاء"}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleDelete(deleteConfirmId)}
              className="px-2.5 py-1 text-xs rounded-lg bg-red-600 text-white hover:bg-red-700 font-semibold transition-all active:scale-[0.98]"
            >
              {submitting ? "..." : isEn ? "Delete" : "تأكيد الحذف"}
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Discount Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className={MODAL_CLS + " max-h-[92vh] overflow-y-auto w-full max-w-lg"}
            onClick={(e) => e.stopPropagation()}
            dir={isEn ? "ltr" : "rtl"}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border/80">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary shrink-0" />
                <h3 className="text-sm font-bold text-foreground">
                  {editingId
                    ? isEn
                      ? "Edit Custom Discount"
                      : "تعديل الخصم المخصص"
                    : isEn
                    ? "Add New Custom Discount"
                    : "إضافة خصم مخصص جديد"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label={isEn ? "Close" : "إغلاق"}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveDiscount} className="space-y-3.5 pt-2">
              {/* Discount Name AR & EN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground block">
                    {isEn ? "Discount Name (Arabic)" : "اسم الخصم (بالعربية)"} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.nameAr}
                    onChange={(e) => setForm((prev) => ({ ...prev, nameAr: e.target.value }))}
                    placeholder={isEn ? "e.g. خصم المتفوقين" : "مثال: خصم الأخوات أو خصم المتفوقين"}
                    className={INPUT_CLS}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground block">
                    {isEn ? "Discount Name (English)" : "اسم الخصم (بالإنجليزية - اختياري)"}
                  </label>
                  <input
                    type="text"
                    value={form.nameEn}
                    onChange={(e) => setForm((prev) => ({ ...prev, nameEn: e.target.value }))}
                    placeholder="e.g. Sibling Discount"
                    dir="ltr"
                    className={INPUT_CLS}
                  />
                </div>
              </div>

              {/* Type and Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-xl bg-muted/30 border border-border/60">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground block">
                    {isEn ? "Discount Calculation Type" : "نوع حساب الخصم"}
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, type: "PERCENTAGE" }))}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        form.type === "PERCENTAGE"
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "bg-background border border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Percent className="w-3.5 h-3.5" />
                      <span>{isEn ? "Percentage %" : "نسبة مئوية %"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, type: "FIXED" }))}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        form.type === "FIXED"
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "bg-background border border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Banknote className="w-3.5 h-3.5" />
                      <span>{isEn ? "Fixed Amount" : "مبلغ ثابت ج.م"}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground block">
                    {form.type === "PERCENTAGE"
                      ? isEn
                        ? "Discount Percentage (%)"
                        : "نسبة الخصم (%)"
                      : isEn
                      ? "Discount Amount (EGP)"
                      : "قيمة الخصم (ج.م)"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={form.type === "PERCENTAGE" ? 100 : 100000}
                    step={form.type === "PERCENTAGE" ? 1 : 5}
                    required
                    value={form.value}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        value: e.target.value === "" ? "" : Number(e.target.value),
                      }))
                    }
                    placeholder="0"
                    className={INPUT_CLS + " font-mono font-bold"}
                  />
                </div>
              </div>

              {/* Promo Code & Siblings Rule */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground block">
                    {isEn ? "Promo Code (Optional)" : "كود الخصم الترويجي (اختياري)"}
                  </label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g. EARLY10"
                    dir="ltr"
                    className={INPUT_CLS + " font-mono font-semibold uppercase"}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-foreground block">
                    {isEn ? "Family / Siblings Rule" : "شرط الأخوة والعائلة"}
                  </label>
                  <div className="flex items-center gap-2 pt-1.5">
                    <input
                      type="checkbox"
                      id="isSiblingDiscount"
                      checked={form.isSiblingDiscount}
                      onChange={(e) => setForm((prev) => ({ ...prev, isSiblingDiscount: e.target.checked }))}
                      className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="isSiblingDiscount" className="text-xs text-foreground cursor-pointer select-none">
                      {isEn ? "Applies to siblings (2+ students)" : "تطبيق تلقائي عند تسجيل الأخوة (2+ طلاب)"}
                    </label>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-foreground block">
                  {isEn ? "Description or Terms (Optional)" : "ملاحظات أو شروط الخصم (اختياري)"}
                </label>
                <input
                  type="text"
                  maxLength={160}
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder={
                    isEn
                      ? "e.g. Applies when paid in full before term starts"
                      : "مثال: يطبق عند سداد كامل الاشتراك قبل بداية الترم"
                  }
                  className={INPUT_CLS}
                />
              </div>

              {/* Status Switch */}
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-muted/20">
                <span className="text-xs font-semibold text-foreground">
                  {isEn ? "Activate discount immediately" : "تفعيل الخصم في النظام فوراً"}
                </span>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(val) => setForm((prev) => ({ ...prev, isActive: Boolean(val) }))}
                  aria-label={isEn ? "Active status" : "حالة التفعيل"}
                />
              </div>

              {/* Real-time Simulator Preview */}
              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{isEn ? "Live Calculation Preview" : "معاينة حية للحساب"}</span>
                </div>
                <p className="text-muted-foreground text-[11px]">
                  {isEn
                    ? `For a 1,000 EGP bundle: Discount is ${sampleCalc.discount.toLocaleString()} EGP, Final Price is ${sampleCalc.final.toLocaleString()} EGP.`
                    : `لباقة تدريبية بقيمة 1,000 ج.م: قيمة الخصم ستكون ${sampleCalc.discount.toLocaleString()} ج.م، والسعر النهائي للمشترك ${sampleCalc.final.toLocaleString()} ج.م.`}
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/80">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  {isEn ? "Cancel" : "إلغاء"}
                </button>
                <button
                  type="submit"
                  disabled={submitting || !form.nameAr.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>{editingId ? (isEn ? "Save Changes" : "حفظ التعديل") : isEn ? "Add Discount" : "إضافة الخصم"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default EducationDiscountsSection;
