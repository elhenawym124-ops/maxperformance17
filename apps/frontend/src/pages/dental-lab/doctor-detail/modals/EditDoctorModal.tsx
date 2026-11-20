import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2, Pencil, X as XMarkIcon } from "lucide-react";
import type { DentalLabDoctor, DentalLabDoctorDetail } from "../../shared";
import { MODAL_CONTENT_CLS, MODAL_INPUT_CLS, updateDoctor } from "../../shared";
import type { EditDoctorModalProps } from "../types/doctorDetailTypes";

export function EditDoctorModal({
  doctor,
  onClose,
  onSaved,
}: EditDoctorModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(doctor.name || "");
  const [phone, setPhone] = useState(doctor.phone || "");
  const [clinicName, setClinicName] = useState(doctor.clinicName || "");
  const [governorate, setGovernorate] = useState(doctor.governorate || "");
  const [creditLimit, setCreditLimit] = useState(String(doctor.creditLimit ?? "0"));
  const [notes, setNotes] = useState(doctor.notes || "");
  const [portalPin, setPortalPin] = useState("");
  const [isActive, setIsActive] = useState(doctor.isActive);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!name.trim()) {
      setError(t("dentalLab.common.nameRequired", "اسم الطبيب مطلوب"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: Partial<DentalLabDoctor> & { portalPin?: string } = {
        name: name.trim(),
        phone: phone.trim() || undefined,
        clinicName: clinicName.trim() || undefined,
        governorate: governorate.trim() || undefined,
        creditLimit: Math.max(0, Number(creditLimit) || 0),
        notes: notes.trim() || undefined,
        isActive,
      };
      if (portalPin.trim()) {
        payload.portalPin = portalPin.trim();
      }
      const updated = await updateDoctor(doctor.id, payload);
      toast.success(t("dentalLab.doctors.updated"));
      onSaved({
        ...doctor,
        ...updated,
        hasPortalPin: portalPin.trim() ? true : doctor.hasPortalPin,
      });
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
        className={`${MODAL_CONTENT_CLS} max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Pencil className="w-5 h-5 text-primary" />
            {t("dentalLab.doctors.editTitle")}
          </h3>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1 hover:bg-muted rounded-lg text-muted-foreground transition-colors"
            aria-label="إغلاق"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-destructive/30 text-destructive dark:text-destructive border border-destructive dark:border-destructive rounded-lg px-4 py-2 text-sm mb-4">
            {error}
          </div>
        )}

        <div className="space-y-3.5">
          <div>
            <label className={labelCls}>{t("dentalLab.common.name")} *</label>
            <input
              className={inputCls}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="د. أحمد مصطفى"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{t("dentalLab.common.phone")}</label>
              <input
                className={inputCls}
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01012345678"
              />
            </div>
            <div>
              <label className={labelCls}>{t("dentalLab.doctors.governorate")}</label>
              <input
                className={inputCls}
                value={governorate}
                onChange={(e) => setGovernorate(e.target.value)}
                placeholder="القاهرة / الجيزة"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{t("dentalLab.doctors.clinicName")}</label>
              <input
                className={inputCls}
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                placeholder="عيادة النور لطب الأسنان"
              />
            </div>
            <div>
              <label className={labelCls}>{t("dentalLab.doctors.creditLimit")}</label>
              <input
                className={inputCls}
                type="number"
                min="0"
                step="500"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                placeholder="0 = بدون حد"
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>
              {t("dentalLab.doctors.portalPin")} (PIN للدخول للبوابة الذاتية)
            </label>
            <input
              className={inputCls}
              type="password"
              maxLength={8}
              value={portalPin}
              onChange={(e) => setPortalPin(e.target.value)}
              placeholder={
                doctor.hasPortalPin
                  ? "اتركه فارغاً للإبقاء على الرمز الحالي"
                  : "تعيين رمز الدخول (مثال: 1234)"
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              يستخدمه الطبيب لتسجيل الدخول إلى بوابة الأطباء ومتابعة حالاته.
            </p>
          </div>

          <div>
            <label className={labelCls}>{t("dentalLab.common.notes")}</label>
            <textarea
              className={`${inputCls} h-20 resize-none`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أي ملاحظات خاصة بالتعامل أو التوصيل أو المواعيد..."
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="doc-active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-primary border-border"
            />
            <label
              htmlFor="doc-active"
              className="text-sm font-medium text-foreground cursor-pointer"
            >
              حساب الطبيب نشط (يسمح بإسناد واستلام حالات جديدة)
            </label>
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
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {saving ? t("dentalLab.common.saving") : t("dentalLab.common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditDoctorModal;
