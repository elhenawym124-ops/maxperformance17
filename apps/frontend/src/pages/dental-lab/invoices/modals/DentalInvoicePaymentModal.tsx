import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Banknote, Loader2, X as XMarkIcon } from "lucide-react";
import type { InvoicePaymentModalProps } from "../types/dentalInvoicesTypes";
import {
  addInvoicePayment,
  fmtMoney,
  MODAL_CONTENT_CLS,
  MODAL_INPUT_CLS,
} from "../../shared";

export function DentalInvoicePaymentModal({
  invoice,
  onClose,
  onSaved,
}: InvoicePaymentModalProps) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [amount, setAmount] = useState(invoice.remaining > 0 ? invoice.remaining : 0);
  const [method, setMethod] = useState("CASH");
  const [note, setNote] = useState("");

  const save = async () => {
    if (saving) return;
    if (!(Number(amount) > 0)) {
      toast.error(t("dentalLab.detail.paymentAmount"));
      return;
    }
    setSaving(true);
    try {
      await addInvoicePayment(invoice.id, {
        amount: Number(amount),
        method,
        note: note.trim() || undefined,
      });
      toast.success(t("dentalLab.detail.paymentAdded"));
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("dentalLab.common.noData"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4"
      onClick={() => !saving && onClose()}
    >
      <div className={`${MODAL_CONTENT_CLS} max-w-md`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-3 border-b dark:border-border mb-4">
          <div className="flex items-center gap-2">
            <Banknote className="w-5 h-5 text-success" />
            <h3 className="text-base sm:text-lg font-bold">
              {t("dentalLab.invoices.paymentTitle")}
            </h3>
          </div>
          <button
            onClick={() => !saving && onClose()}
            className="p-1 hover:bg-muted dark:hover:bg-muted rounded-lg dark:text-muted-foreground"
            aria-label="Close"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 bg-muted dark:bg-muted rounded-lg text-xs space-y-1 mb-4 border dark:border-border">
          <p className="flex justify-between text-muted-foreground">
            <span>رقم الفاتورة:</span>{" "}
            <span className="font-bold text-foreground font-mono tabular-nums">
              {invoice.invoiceNumber || invoice.id.slice(0, 8)}
            </span>
          </p>
          <p className="flex justify-between text-muted-foreground">
            <span>الطبيب:</span>{" "}
            <span className="font-semibold text-foreground">
              {invoice.doctorName || "—"}
            </span>
          </p>
          <p className="flex justify-between text-muted-foreground">
            <span>المتبقي المستحق:</span>{" "}
            <span className="font-bold text-destructive font-mono tabular-nums">
              {fmtMoney(invoice.remaining)} ج.م
            </span>
          </p>
        </div>

        <div className="space-y-3.5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-foreground">
                {t("dentalLab.detail.paymentAmount")} *
              </label>
              {invoice.remaining > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(invoice.remaining)}
                  className="text-xs text-primary dark:text-primary hover:underline font-mono tabular-nums"
                >
                  سداد كامل المتبقي ({fmtMoney(invoice.remaining)})
                </button>
              )}
            </div>
            <input
              className={MODAL_INPUT_CLS}
              type="number"
              min="0.01"
              step="any"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              {t("dentalLab.detail.paymentMethod")}
            </label>
            <select
              className={MODAL_INPUT_CLS}
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option value="CASH">نقدي (كاش)</option>
              <option value="BANK">تحويل بنكي</option>
              <option value="VODAFONE_CASH">فودافون كاش / محفظة</option>
              <option value="CARD">فيزا / بطاقة</option>
              <option value="OTHER">أخرى</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              {t("dentalLab.detail.paymentNote")}
            </label>
            <input
              className={MODAL_INPUT_CLS}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="رقم الإيصال أو ملاحظة..."
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t dark:border-border mt-4">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm text-foreground border dark:border-border rounded-lg hover:bg-muted dark:hover:bg-muted disabled:opacity-50"
          >
            {t("dentalLab.common.cancel")}
          </button>
          <button
            onClick={save}
            disabled={saving || !(Number(amount) > 0)}
            className="px-5 py-2 text-sm bg-success text-white rounded-lg hover:bg-success disabled:opacity-50 flex items-center gap-2 font-medium"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? t("dentalLab.common.saving") : "تسجيل الدفعة"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DentalInvoicePaymentModal;

