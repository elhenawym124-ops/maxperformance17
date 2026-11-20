import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Banknote, Loader2, X as XMarkIcon } from "lucide-react";
import {
  type DentalLabDoctor,
  recordDoctorBulkPayment,
  MODAL_CONTENT_CLS,
  MODAL_INPUT_CLS,
  fmtMoney,
} from "../../shared";

interface BulkPaymentModalProps {
  doctor: DentalLabDoctor;
  onClose: () => void;
  onSaved: () => void;
}

export function BulkPaymentModal({
  doctor,
  onClose,
  onSaved,
}: BulkPaymentModalProps) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState(String(doctor.outstanding ?? ""));
  const [method, setMethod] = useState("CASH");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const val = Number(amount);
    if (!Number.isFinite(val) || val <= 0) {
      setError("يرجى إدخال مبلغ صحيح");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await recordDoctorBulkPayment(doctor.id, {
        amount: val,
        method,
        note,
      });
      toast.success(
        `تم تسجيل دفعة بقيمة ${fmtMoney(res.totalPaid)} وتوزيعها على ${
          res.allocations.length
        } فاتورة`
      );
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("dentalLab.common.noData"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-3"
      onClick={() => !saving && onClose()}
    >
      <div className={MODAL_CONTENT_CLS} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Banknote className="w-5 h-5 text-success" />
            تحصيل دفعة على الحساب
          </h3>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1 hover:bg-muted rounded-lg dark:text-muted-foreground"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          الطبيب:{" "}
          <span className="font-semibold text-foreground dark:text-muted-foreground">
            {doctor.name}
          </span>{" "}
          — المتبقي الحالي:{" "}
          <span className="font-semibold text-destructive font-mono tabular-nums">
            {fmtMoney(doctor.outstanding ?? 0)}
          </span>
        </p>

        {error && (
          <div className="bg-red-50 dark:bg-destructive/30 text-destructive dark:text-destructive border border-destructive dark:border-destructive rounded-lg px-4 py-2 text-sm mb-3">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              المبلغ المحصل *
            </label>
            <input
              type="number"
              className={`${MODAL_INPUT_CLS} font-mono tabular-nums`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-1">
              سيتم توزيع المبلغ تلقائياً على الفواتير المفتوحة والأقدم أولاً (FIFO).
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              طريقة الدفع
            </label>
            <select
              className={MODAL_INPUT_CLS}
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option value="CASH">نقدي (كاش)</option>
              <option value="BANK">تحويل بنكي</option>
              <option value="VODAFONE_CASH">فودافون كاش / محفظة</option>
              <option value="CARD">بطاقة / فيزا</option>
              <option value="OTHER">أخرى</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              ملاحظات أو رقم الإيصال
            </label>
            <input
              className={MODAL_INPUT_CLS}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="مثلاً: إيصال رقم #..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-foreground border rounded-lg hover:bg-muted dark:hover:bg-muted disabled:opacity-50"
          >
            {t("dentalLab.common.cancel")}
          </button>
          <button
            onClick={save}
            disabled={saving || !amount || Number(amount) <= 0}
            className="px-4 py-2 bg-success text-white rounded-lg hover:bg-success disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Banknote className="w-4 h-4" />
            )}
            {saving ? t("dentalLab.common.saving") : "تسجيل الدفعة وتوزيعها"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BulkPaymentModal;
