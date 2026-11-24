import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, RefreshCw, Ticket, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { createCoupon, deleteCoupon, fetchCoupons, fetchDiscountReport, toggleCoupon } from "./api";
import type { Coupon, DiscountReport } from "./types";

const money = (value: number) =>
  (Math.round((Number(value) || 0) * 100) / 100).toLocaleString("en-EG", { maximumFractionDigits: 2 });

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const CouponsTab: React.FC<{ isEn: boolean; reloadKey?: number; onChanged?: () => void }> = ({
  isEn,
  reloadKey,
  onChanged,
}) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [report, setReport] = useState<DiscountReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: "",
    type: "PERCENT",
    value: 10,
    maxUses: "",
    perStudentLimit: 1,
    validUntil: "",
  });

  const load = useCallback(() => {
    let alive = true;
    setLoading(true);
    setError("");
    fetchCoupons()
      .then((rows) => alive && setCoupons(rows))
      .catch((err) => alive && setError(err.message || "فشل جلب أكواد الخصم"))
      .finally(() => alive && setLoading(false));
    fetchDiscountReport(6)
      .then((data) => alive && setReport(data))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load, reloadKey]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) {
      toast.error(isEn ? "Code is required" : "كود الخصم مطلوب");
      return;
    }
    setSaving(true);
    try {
      await createCoupon({
        code: form.code.trim(),
        type: form.type,
        value: Number(form.value),
        maxUses: form.maxUses === "" ? null : Number(form.maxUses),
        perStudentLimit: Number(form.perStudentLimit) || 1,
        validUntil: form.validUntil || null,
      });
      toast.success(isEn ? "Coupon created" : "تم إنشاء كود الخصم");
      setOpen(false);
      setForm({ code: "", type: "PERCENT", value: 10, maxUses: "", perStudentLimit: 1, validUntil: "" });
      load();
      onChanged?.();
    } catch (err: any) {
      toast.error(err.message || "فشل إنشاء كود الخصم");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (coupon: Coupon) => {
    try {
      await toggleCoupon(coupon.id, !coupon.isActive);
      load();
    } catch (err: any) {
      toast.error(err.message || "فشل تعديل حالة الكود");
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    if (!window.confirm(isEn ? `Delete ${coupon.code}?` : `حذف ${coupon.code}؟`)) return;
    try {
      await deleteCoupon(coupon.id);
      toast.success(isEn ? "Coupon deleted" : "تم حذف الكود");
      load();
    } catch (err: any) {
      toast.error(err.message || "فشل حذف الكود");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Ticket className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">{isEn ? "Discount codes" : "أكواد الخصم"}</h3>
          <span className="text-[10px] text-muted-foreground font-mono">{coupons.length}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={load}
            className="p-1.5 rounded-lg border border-border/70 text-muted-foreground hover:bg-muted"
            aria-label={isEn ? "Refresh" : "تحديث"}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            {isEn ? "New coupon" : "كود جديد"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">{error}</div>
      ) : null}

      {report ? (
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {[
              { label: isEn ? "Coupon discounts" : "خصومات الكوبونات", value: `${money(report.summary.couponDiscounts)} ${isEn ? "EGP" : "ج.م"}`, tone: "text-foreground" },
              { label: isEn ? "Coupon uses" : "مرات الاستخدام", value: String(report.summary.couponUses), tone: "text-foreground" },
              { label: isEn ? "Active waivers" : "إعفاءات قائمة", value: `${money(report.summary.waiversValue)} ${isEn ? "EGP" : "ج.م"}`, tone: "text-warning" },
              { label: isEn ? "Total revenue impact" : "إجمالي أثر الإيراد", value: `${money(report.summary.totalImpact)} ${isEn ? "EGP" : "ج.م"}`, tone: "text-destructive" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-border/70 bg-card p-3">
                <span className="text-[10px] text-muted-foreground">{item.label}</span>
                <p className={`text-sm font-bold font-mono tabular-nums mt-1 ${item.tone}`}>{item.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border/70 bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border/70 flex items-center justify-between">
              <h4 className="text-xs font-semibold text-foreground">
                {isEn ? "Recent discounts (6 months)" : "آخر الخصومات (6 شهور)"}
              </h4>
              <span className="text-[10px] text-muted-foreground font-mono">{report.items.length}</span>
            </div>
            {report.items.length === 0 ? (
              <p className="p-4 text-[11px] text-muted-foreground">
                {isEn ? "No discounts recorded yet" : "لا توجد خصومات مسجلة بعد"}
              </p>
            ) : (
              <div className="divide-y divide-border/60">
                {report.items.slice(0, 8).map((item) => (
                  <div key={`${item.kind}-${item.id}`} className="px-4 py-2 flex items-center justify-between gap-2 text-[11px]">
                    <div className="min-w-0 flex items-center gap-2 flex-wrap">
                      <span className="px-1.5 py-0.5 rounded border border-border/70 text-[10px] text-muted-foreground font-mono">
                        {item.kind === "COUPON" ? (item.code || "COUPON") : (isEn ? "WAIVER" : "إعفاء")}
                      </span>
                      <span className="font-semibold text-foreground truncate">{item.studentName || "—"}</span>
                      {item.groupName ? <span className="text-muted-foreground">{item.groupName}</span> : null}
                    </div>
                    <div className="flex items-center gap-3 shrink-0 font-mono tabular-nums">
                      <span className="text-destructive">−{money(item.discount)}</span>
                      <span className="text-muted-foreground">{formatDate(item.date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border border-border/70 bg-card overflow-hidden">
        {loading ? (
          <div className="p-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            {isEn ? "Loading..." : "جارٍ التحميل..."}
          </div>
        ) : coupons.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">
            {isEn ? "No discount codes yet" : "لا توجد أكواد خصم بعد"}
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {coupons.map((coupon) => {
              const exhausted =
                coupon.maxUses !== null && coupon.maxUses !== undefined && coupon.usedCount >= coupon.maxUses;
              return (
                <div key={coupon.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold font-mono text-foreground tracking-wide">{coupon.code}</span>
                      <span className="px-1.5 py-0.5 rounded border border-border/70 text-[10px] text-muted-foreground">
                        {coupon.type === "PERCENT" ? `${coupon.value}%` : `${money(coupon.value)} ج.م`}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] border ${
                          !coupon.isActive
                            ? "bg-muted text-muted-foreground border-border/70"
                            : exhausted
                              ? "bg-destructive/10 text-destructive border-destructive/20"
                              : "bg-success/10 text-success border-success/20"
                        }`}
                      >
                        {!coupon.isActive
                          ? (isEn ? "Disabled" : "موقوف")
                          : exhausted
                            ? (isEn ? "Exhausted" : "مستهلك")
                            : (isEn ? "Active" : "فعّال")}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 font-mono tabular-nums">
                      {coupon.usedCount}/{coupon.maxUses ?? "∞"} {isEn ? "uses" : "استخدام"}
                      {coupon.perStudentLimit ? ` · ${coupon.perStudentLimit}/${isEn ? "student" : "طالب"}` : ""}
                      {coupon.validUntil ? ` · ${isEn ? "until" : "حتى"} ${formatDate(coupon.validUntil)}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggle(coupon)}
                      className="px-2.5 py-1 rounded-lg border border-border/70 text-[11px] text-foreground hover:bg-muted"
                    >
                      {coupon.isActive ? (isEn ? "Disable" : "إيقاف") : (isEn ? "Enable" : "تفعيل")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(coupon)}
                      className="p-1.5 rounded-lg border border-border/70 text-destructive hover:bg-destructive/10"
                      aria-label={isEn ? "Delete" : "حذف"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <form onSubmit={handleCreate} className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-border/70 bg-card shadow-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">{isEn ? "New discount code" : "كود خصم جديد"}</h3>
              <button type="button" onClick={() => setOpen(false)} aria-label={isEn ? "Close" : "إغلاق"}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <label className="block text-[11px] text-muted-foreground">
              {isEn ? "Code" : "الكود"}
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="EID25"
                className="mt-1 w-full rounded-lg border border-border/70 bg-background px-2.5 py-1.5 text-xs text-foreground font-mono uppercase"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-[11px] text-muted-foreground">
                {isEn ? "Type" : "النوع"}
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border/70 bg-background px-2.5 py-1.5 text-xs text-foreground"
                >
                  <option value="PERCENT">{isEn ? "Percent" : "نسبة %"}</option>
                  <option value="AMOUNT">{isEn ? "Fixed amount" : "مبلغ ثابت"}</option>
                </select>
              </label>
              <label className="block text-[11px] text-muted-foreground">
                {isEn ? "Value" : "القيمة"}
                <input
                  type="number"
                  min={1}
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-border/70 bg-background px-2.5 py-1.5 text-xs text-foreground font-mono"
                />
              </label>
              <label className="block text-[11px] text-muted-foreground">
                {isEn ? "Max uses" : "أقصى استخدام"}
                <input
                  type="number"
                  min={1}
                  value={form.maxUses}
                  onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                  placeholder="∞"
                  className="mt-1 w-full rounded-lg border border-border/70 bg-background px-2.5 py-1.5 text-xs text-foreground font-mono"
                />
              </label>
              <label className="block text-[11px] text-muted-foreground">
                {isEn ? "Per student" : "لكل طالب"}
                <input
                  type="number"
                  min={1}
                  value={form.perStudentLimit}
                  onChange={(e) => setForm({ ...form, perStudentLimit: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-border/70 bg-background px-2.5 py-1.5 text-xs text-foreground font-mono"
                />
              </label>
            </div>
            <label className="block text-[11px] text-muted-foreground">
              {isEn ? "Valid until" : "صالح حتى"}
              <input
                type="date"
                value={form.validUntil}
                onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border/70 bg-background px-2.5 py-1.5 text-xs text-foreground font-mono"
              />
            </label>
            <button
              type="submit"
              disabled={saving}
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {isEn ? "Create" : "إنشاء"}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
};

export default CouponsTab;
