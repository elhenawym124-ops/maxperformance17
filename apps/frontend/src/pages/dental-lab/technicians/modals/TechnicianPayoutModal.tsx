import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Loader2, Wallet, X as XMarkIcon } from "lucide-react";
import {
  createTechnicianPayout,
  fmtMoney,
  MODAL_CONTENT_CLS,
  MODAL_INPUT_CLS,
  type TechnicianPayoutType,
} from "../../shared";
import type { PayoutModalProps } from "../types/technicianTypes";
import { DateInput } from '../../../../components/ui/DateInput';

export function TechnicianPayoutModal({ tech, onClose, onSaved }: PayoutModalProps) {
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TechnicianPayoutType>("PAYOUT");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [paidAt, setPaidAt] = useState(() => new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      toast.error("يرجى إدخال مبلغ صحيح أكبر من الصفر");
      return;
    }
    setSaving(true);
    try {
      await createTechnicianPayout(tech.id, {
        amount: val,
        type,
        paymentMethod,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
        paidAt: paidAt ? new Date(paidAt).toISOString() : undefined,
      });
      toast.success("تم تسجيل السند المالي بنجاح");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ أثناء حفظ السند");
    } finally {
      setSaving(false);
    }
  };

  const typeConfig: Record<
    TechnicianPayoutType,
    { label: string; desc: string; color: string }
  > = {
    PAYOUT: {
      label: "صرف مستحقات إنتاج",
      desc: "دفع أجر المراحل المكتملة",
      color:
        "bg-emerald-50 text-success border-success dark:bg-success/40 dark:text-success dark:border-success",
    },
    ADVANCE: {
      label: "سلفة نقدية على الحساب",
      desc: "سلفة تخصم لاحقاً من الأرباح",
      color:
        "bg-amber-50 text-warning border-warning dark:bg-warning/40 dark:text-warning dark:border-warning",
    },
    BONUS: {
      label: "مكافأة أداء / حافز",
      desc: "إضافة مالية تضاف للمستحقات",
      color:
        "bg-blue-50 text-primary border-primary dark:bg-primary/40 dark:text-primary dark:border-primary",
    },
    DEDUCTION: {
      label: "خصم (تالف / إعادة شغل)",
      desc: "خصم يقلل المستحق للفني",
      color:
        "bg-red-50 text-destructive border-destructive dark:bg-destructive/40 dark:text-destructive dark:border-destructive",
    },
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3"
      onClick={onClose}
    >
      <div
        className={`${MODAL_CONTENT_CLS} max-w-lg max-h-[92vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b dark:border-border">
          <div>
            <h3 className="text-lg font-bold">تسجيل حركة مالية / سند صرف</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              الفني: {tech.name} (المتبقي الحالي:{" "}
              <span className="font-mono tabular-nums">
                {fmtMoney(tech.balanceDue ?? 0)} ج.م
              </span>
              )
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-lg"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-2">
              نوع الحركة المالية *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(typeConfig) as TechnicianPayoutType[]).map((tKey) => {
                const cfg = typeConfig[tKey];
                const isSelected = type === tKey;
                return (
                  <button
                    key={tKey}
                    type="button"
                    onClick={() => setType(tKey)}
                    className={`p-2.5 rounded-lg border text-right transition-all text-xs ${
                      isSelected
                        ? `${cfg.color} ring-2 ring-primary font-bold shadow-sm`
                        : "border-gray-200 dark:border-border hover:bg-muted dark:hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    <div>{cfg.label}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 font-normal">
                      {cfg.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                المبلغ (ج.م) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={`${MODAL_INPUT_CLS} text-sm font-bold font-mono tabular-nums`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                طريقة الصرف *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className={`${MODAL_INPUT_CLS} text-sm`}
              >
                <option value="CASH">نقدي (كاش الخزينة)</option>
                <option value="BANK_TRANSFER">تحويل بنكي</option>
                <option value="WALLET">محفظة إلكترونية / فودافون كاش / إنستاباي</option>
                <option value="CHECK">شيك بنكي</option>
                <option value="OTHER">أخرى</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                تاريخ الصرف
              </label>
              <DateInput
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                className={`${MODAL_INPUT_CLS} text-sm font-mono`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                الرقم المرجعي / رقم الإيصال
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="مثال: رقم الحوالة أو سند الصرف"
                className={`${MODAL_INPUT_CLS} text-sm font-mono`}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              البيان / الملاحظات
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: صرف دفعة مستحقات عن الأسبوع الأول من الشهر..."
              className={`${MODAL_INPUT_CLS} text-sm`}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t dark:border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm text-muted-foreground border dark:border-border rounded-lg hover:bg-muted dark:hover:bg-muted"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving || !amount}
              className="px-5 py-2 text-sm bg-success text-white rounded-lg hover:bg-success disabled:opacity-50 font-semibold shadow-sm flex items-center gap-1.5"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wallet className="w-4 h-4" />
              )}
              حفظ وتأكيد السند
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TechnicianPayoutModal;
