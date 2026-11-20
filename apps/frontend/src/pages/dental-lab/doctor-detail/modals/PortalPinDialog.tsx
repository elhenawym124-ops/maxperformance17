import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Eye, EyeOff, KeyRound, Loader2, X as XMarkIcon } from "lucide-react";
import { MODAL_INPUT_CLS, updateDoctor } from "../../shared";
import type { PortalPinDialogProps } from "../types/doctorDetailTypes";

export function PortalPinDialog({
  doctor,
  onClose,
  onSaved,
}: PortalPinDialogProps) {
  const { t } = useTranslation();
  const [phone, setPhone] = useState(doctor.phone || "");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const trimmedPhone = phone.trim();
    const trimmedPin = pin.trim();
    if (!/^01[0-9]{9}$/.test(trimmedPhone)) {
      setError("رقم الهاتف مطلوب بصيغة صحيحة (11 رقمًا تبدأ بـ 01، مثال: 01012345678)");
      return;
    }
    if (trimmedPin.length < 4 || trimmedPin.length > 8) {
      setError("رمز الدخول (PIN) مطلوب: من 4 إلى 8 خانات");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await updateDoctor(doctor.id, {
        phone: trimmedPhone,
        portalPin: trimmedPin,
      });
      toast.success(t("dentalLab.doctors.updated"));
      onSaved({ ...doctor, ...updated, hasPortalPin: true });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("dentalLab.common.noData"));
    } finally {
      setSaving(false);
    }
  };

  const inputCls = `${MODAL_INPUT_CLS} text-sm`;
  const labelCls = "block text-sm font-medium text-foreground mb-1";

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-3 animate-in fade-in duration-200"
      onClick={() => !saving && onClose()}
    >
      <div
        className="bg-white dark:bg-muted rounded-xl shadow-2xl border dark:border-border p-5 w-full max-w-sm mx-4 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" />
            <span>{doctor.hasPortalPin ? "تغيير رمز الدخول (PIN)" : "تعيين رمز الدخول (PIN)"}</span>
          </h3>
          <button
            onClick={onClose}
            disabled={saving}
            aria-label="إغلاق"
            className="p-1 hover:bg-muted rounded-lg text-muted-foreground transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-destructive/30 text-destructive dark:text-destructive border border-destructive dark:border-destructive rounded-lg px-3 py-2 text-xs mb-3">
            {error}
          </div>
        )}

        <div className="space-y-3.5">
          <div>
            <label className={labelCls}>{t("dentalLab.common.phone")} *</label>
            <input
              className={inputCls}
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01012345678"
              inputMode="numeric"
              maxLength={11}
            />
          </div>

          <div>
            <label className={labelCls}>{t("dentalLab.doctors.portalPin")} *</label>
            <div className="relative">
              <input
                className={`${inputCls} ps-10`}
                type={showPin ? "text" : "password"}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="مثال: 1234"
                inputMode="numeric"
                maxLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPin((s) => !s)}
                aria-label={showPin ? "إخفاء رمز الدخول" : "إظهار رمز الدخول"}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground rounded"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              يستخدمه الطبيب مع رقم الهاتف لتسجيل الدخول إلى بوابة الأطباء.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-3 border-t dark:border-border">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm text-foreground border rounded-lg hover:bg-muted dark:hover:bg-muted transition-colors"
          >
            {t("dentalLab.common.cancel")}
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="px-5 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary disabled:opacity-50 flex items-center gap-2 font-medium transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            {saving ? t("dentalLab.common.saving") : t("dentalLab.common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PortalPinDialog;
