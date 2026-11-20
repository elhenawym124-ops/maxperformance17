import type { Dispatch, SetStateAction } from "react";
import { Lock, Mail, ShieldCheck } from "lucide-react";
import { MODAL_INPUT_CLS } from "../../../../shared";
import type { TechnicianForm } from "../../types/technicianTypes";

interface TechnicianAccountSectionProps {
  modal: TechnicianForm;
  setModal: Dispatch<SetStateAction<TechnicianForm | null>>;
}

export function TechnicianAccountSection({ modal, setModal }: TechnicianAccountSectionProps) {
  const inputCls = `${MODAL_INPUT_CLS} text-sm`;
  const labelCls = "block text-sm font-medium text-foreground mb-1";

  return (
    <>
      <div className="sm:col-span-2 border-t dark:border-border pt-4 mt-2">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-primary dark:text-primary" />
          <h4 className="text-xs font-bold text-foreground">
            بيانات تسجيل الدخول لحساب الفني بالمنصة (Portal Login Account)
          </h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>البريد الإلكتروني / اسم الدخول *</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute top-1/2 -translate-y-1/2 right-3 text-muted-foreground pointer-events-none" />
              <input
                className={`${inputCls} pe-9 font-mono`}
                type="email"
                value={modal.email}
                onChange={(e) => setModal({ ...modal, email: e.target.value })}
                placeholder="technician@lab.com"
                dir="ltr"
                required
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>
              {modal.id ? "تحديث كلمة المرور (فارغ للإبقاء)" : "كلمة المرور للدخول *"}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute top-1/2 -translate-y-1/2 right-3 text-muted-foreground pointer-events-none" />
              <input
                className={`${inputCls} pe-9 font-mono`}
                type="password"
                value={modal.password}
                onChange={(e) => setModal({ ...modal, password: e.target.value })}
                placeholder={modal.id ? "•••••••• (فارغ للإبقاء)" : "6 أحرف على الأقل"}
                dir="ltr"
                required={!modal.id}
              />
            </div>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          يتم إنشاء وتفعيل حساب المستخدم فورياً لتمكين الفني من الدخول لبوابة المعمل ومسح باركود الحالات وتتبع مهامه.
        </p>
      </div>

      {modal.id && (
        <div className="sm:col-span-2 flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="tech-active"
            checked={modal.isActive}
            onChange={(e) => setModal({ ...modal, isActive: e.target.checked })}
            className="rounded border-border text-primary focus:ring-primary"
          />
          <label htmlFor="tech-active" className="text-sm font-medium text-foreground cursor-pointer">
            عضو نشط (متاح لتعيين مراحل الشغل له)
          </label>
        </div>
      )}
    </>
  );
}
