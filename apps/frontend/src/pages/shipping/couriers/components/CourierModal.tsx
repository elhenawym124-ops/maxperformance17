import React, { useState } from 'react';
import {
  UserIcon,
  BanknotesIcon,
  CalculatorIcon,
  SparklesIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';
import { Courier, CourierInput } from '../../../../services/courierService';

interface CourierModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCourier: Courier | null;
  formData: CourierInput;
  setFormData: React.Dispatch<React.SetStateAction<CourierInput>>;
  saving: boolean;
  onSave: (e: React.FormEvent) => Promise<void>;
}

export const CourierModal: React.FC<CourierModalProps> = ({
  isOpen,
  onClose,
  editingCourier,
  formData,
  setFormData,
  saving,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'compensation'>('info');
  const [testOrders, setTestOrders] = useState<number>(40);

  if (!isOpen) return null;

  // Real-time Preview Calculation
  const calculatePreview = () => {
    const model = formData.compensationModel || (formData.commissionType === 'SALARY_ONLY' ? 'SALARY_ONLY' : 'COMMISSION_ONLY');
    const base = ['SALARY_ONLY', 'SALARY_PLUS_BONUS', 'SALARY_PLUS_COMMISSION'].includes(model)
      ? Number(formData.salaryBase || 0)
      : 0;

    let bonus = 0;
    let parsedTiers = null;
    if (formData.bonusTiers) {
      try {
        parsedTiers = typeof formData.bonusTiers === 'string' ? JSON.parse(formData.bonusTiers) : formData.bonusTiers;
      } catch (_) {}
    }

    if (Array.isArray(parsedTiers) && parsedTiers.length > 0) {
      for (const tier of parsedTiers) {
        const from = Number(tier.from) || 1;
        const to = tier.to ? Number(tier.to) : Infinity;
        const rate = Number(tier.amount) || 0;
        if (testOrders >= from) {
          const eligible = Math.min(testOrders, to) - from + 1;
          if (eligible > 0) bonus += eligible * rate;
        }
      }
    } else if (Number(formData.bonusPerOrder || 0) > 0) {
      const threshold = Number(formData.bonusStartsAfterOrders || 0);
      const eligible = Math.max(0, testOrders - threshold);
      bonus = eligible * Number(formData.bonusPerOrder);
    }

    const commission = ['COMMISSION_ONLY', 'SALARY_PLUS_COMMISSION'].includes(model)
      ? testOrders * Number(formData.commissionAmount || 0)
      : 0;

    const total = base + bonus + commission;
    return { base, bonus, commission, total };
  };

  const preview = calculatePreview();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-muted backdrop-blur-xs">
      <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border dark:border-border">
          <div>
            <h3 className="font-bold text-base sm:text-lg">
              {editingCourier ? 'تعديل بيانات المندوب' : 'إضافة مندوب توصيل داخلي'}
            </h3>
            <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-0.5">
              تحديد بيانات الهوية، وسيلة النقل، ونظام المستحقات (راتب، بونص، أو عمولة)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-foreground dark:hover:text-muted-foreground text-lg"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-border dark:border-border bg-muted dark:bg-muted px-6 pt-2 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`pb-3 font-semibold text-xs sm:text-sm flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'info'
                ? 'border-slate-900 text-foreground dark:border-border dark:text-muted-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground dark:text-muted-foreground'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            البيانات الأساسية
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('compensation')}
            className={`pb-3 font-semibold text-xs sm:text-sm flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'compensation'
                ? 'border-slate-900 text-foreground dark:border-border dark:text-muted-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground dark:text-muted-foreground'
            }`}
          >
            <BanknotesIcon className="w-4 h-4" />
            المرتب والبونص والعمولة
          </button>
        </div>

        <form onSubmit={onSave} className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {activeTab === 'info' ? (
            <>
              {/* Login Notice Banner */}
              <div className="p-3 bg-primary/80 dark:bg-primary/40 border border-primary dark:border-primary/60 rounded-xl text-xs text-primary dark:text-primary flex items-start gap-2.5">
                <KeyIcon className="w-4 h-4 text-primary dark:text-primary shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold">بيانات دخول المندوب على التطبيق:</p>
                  <p className="text-slate-600 dark:text-muted-foreground">
                    لا يلزم بريد إلكتروني — يدخل المندوب على التطبيق بـ <b>رقم الهاتف</b> و <b>رمز PIN الميداني</b> (الافتراضي 0000).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1">اسم المندوب *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:outline-none"
                    placeholder="مثال: أحمد عبد الله"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">رقم الهاتف *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:outline-none font-mono tabular-nums"
                    placeholder="01xxxxxxxxx"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1">
                    رمز PIN الميداني للدخول (4-6 أرقام)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={formData.pin || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pin: e.target.value.replace(/\D/g, ''),
                      })
                    }
                    className="w-full px-3 py-2 bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:outline-none font-mono tabular-nums tracking-widest text-center"
                    placeholder={
                      editingCourier
                        ? 'اتركه فارغاً للإبقاء على الرمز الحالي'
                        : '0000 (الافتراضي)'
                    }
                    dir="ltr"
                  />
                  <span className="text-[11px] text-muted-foreground dark:text-muted-foreground mt-1 block">
                    الرمز الافتراضي: 0000 إذا تركته فارغاً
                  </span>
                </div>
                <div>
                  <label className="block font-medium mb-1">وسيلة الانتقال</label>
                  <select
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    className="w-full px-3 py-2 bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:outline-none"
                  >
                    <option value="MOTORCYCLE">دراجة نارية / موتوسيكل</option>
                    <option value="CAR">سيارة ملاكي</option>
                    <option value="VAN">فان / نقل بضائع</option>
                    <option value="BICYCLE">دراجة هوائية</option>
                    <option value="ON_FOOT">راجل / مشياً</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1">الرقم القومي (اختياري)</label>
                  <input
                    type="text"
                    value={formData.nationalId || ''}
                    onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                    className="w-full px-3 py-2 bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:outline-none font-mono tabular-nums"
                    placeholder="14 رقم"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">رقم اللوحة / المركبة</label>
                  <input
                    type="text"
                    value={formData.plateNumber || ''}
                    onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:outline-none font-mono"
                    placeholder="مثال: أ ب ج 123"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1">تاريخ بداية العمل / التعيين</label>
                  <input
                    type="date"
                    value={formData.hireDate ? formData.hireDate.slice(0, 10) : ''}
                    onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                    className="w-full px-3 py-2 bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">المناطق / خطوط السير المغطاة</label>
                  <input
                    type="text"
                    value={formData.governorates || ''}
                    onChange={(e) => setFormData({ ...formData, governorates: e.target.value })}
                    className="w-full px-3 py-2 bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:outline-none"
                    placeholder="مثال: القاهرة، مدينة نصر، مصر الجديدة، التجمع"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">ملاحظات داخلية</label>
                <textarea
                  rows={2}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:outline-none"
                  placeholder="أي تفاصيل خاصة بالمندوب..."
                />
              </div>
            </>
          ) : (
            <>
              {/* Compensation Tab */}
              <div>
                <label className="block font-medium mb-1">نظام التعويض والمستحقات *</label>
                <select
                  value={formData.compensationModel || 'COMMISSION_ONLY'}
                  onChange={(e) => setFormData({ ...formData, compensationModel: e.target.value })}
                  className="w-full px-3 py-2 bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:outline-none font-medium"
                >
                  <option value="COMMISSION_ONLY">عمولة فقط لكل شحنة مسلّمة (COMMISSION_ONLY)</option>
                  <option value="SALARY_ONLY">مرتب شهري ثابت فقط (SALARY_ONLY)</option>
                  <option value="SALARY_PLUS_BONUS">مرتب شهري ثابت + بونص أداء (SALARY_PLUS_BONUS)</option>
                  <option value="SALARY_PLUS_COMMISSION">مرتب شهري ثابت + عمولة شحنة (SALARY_PLUS_COMMISSION)</option>
                </select>
              </div>

              {['SALARY_ONLY', 'SALARY_PLUS_BONUS', 'SALARY_PLUS_COMMISSION'].includes(
                formData.compensationModel || ''
              ) && (
                <div>
                  <label className="block font-medium mb-1">المرتب الشهري الأساسي (ج.م) *</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={formData.salaryBase || 0}
                    onChange={(e) => setFormData({ ...formData, salaryBase: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:outline-none font-mono tabular-nums text-base font-semibold"
                    placeholder="مثال: 4000"
                  />
                </div>
              )}

              {['COMMISSION_ONLY', 'SALARY_PLUS_COMMISSION'].includes(
                formData.compensationModel || 'COMMISSION_ONLY'
              ) && (
                <div>
                  <label className="block font-medium mb-1">عمولة التوصيل لكل طرد مسلّم (ج.م)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.commissionAmount || 0}
                    onChange={(e) => setFormData({ ...formData, commissionAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:outline-none font-mono tabular-nums"
                  />
                </div>
              )}

              {formData.compensationModel === 'SALARY_PLUS_BONUS' && (
                <div className="space-y-3 p-3.5 bg-muted dark:bg-muted rounded-xl border border-border dark:border-border">
                  <div className="font-semibold text-foreground dark:text-muted-foreground flex items-center gap-1.5">
                    <SparklesIcon className="w-4 h-4 text-warning" />
                    قواعد بونص الأداء
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-foreground dark:text-muted-foreground mb-1">قيمة البونص لكل أوردر إضافي (ج.م)</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={formData.bonusPerOrder || 0}
                        onChange={(e) => setFormData({ ...formData, bonusPerOrder: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white dark:bg-muted border border-border dark:border-border rounded-lg text-xs font-mono"
                        placeholder="مثال: 6"
                      />
                    </div>
                    <div>
                      <label className="block text-foreground dark:text-muted-foreground mb-1">يبدأ البونص بعد إنجاز (أوردر)</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={formData.bonusStartsAfterOrders || 0}
                        onChange={(e) => setFormData({ ...formData, bonusStartsAfterOrders: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white dark:bg-muted border border-border dark:border-border rounded-lg text-xs font-mono"
                        placeholder="مثال: 30"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-foreground dark:text-muted-foreground mb-1">
                      شرائح البونص المتقدمة (JSON اختياري — يلغي البونص البسيط أعلاه عند وجوده)
                    </label>
                    <textarea
                      rows={2}
                      value={typeof formData.bonusTiers === 'object' ? JSON.stringify(formData.bonusTiers) : formData.bonusTiers || ''}
                      onChange={(e) => setFormData({ ...formData, bonusTiers: e.target.value })}
                      placeholder='[{"from":1,"to":50,"amount":6},{"from":51,"to":null,"amount":8}]'
                      className="w-full px-3 py-2 bg-white dark:bg-muted border border-border dark:border-border rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Real-time Math Simulator */}
              <div className="p-3.5 bg-primary/70 dark:bg-primary/30 rounded-xl border border-primary dark:border-primary space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-primary dark:text-primary flex items-center gap-1.5">
                    <CalculatorIcon className="w-4 h-4 text-primary" />
                    معاينة حية لاحتساب مستحقات الشهر
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-blue-800 dark:text-primary">أوردرات الشهر التجريبية:</span>
                    <input
                      type="number"
                      min="0"
                      value={testOrders}
                      onChange={(e) => setTestOrders(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-16 px-2 py-0.5 bg-white dark:bg-muted border border-primary rounded font-mono text-center font-bold text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center pt-1 font-mono text-xs">
                  <div className="bg-white/80 dark:bg-muted p-2 rounded-lg">
                    <div className="text-[10px] text-muted-foreground">الأساسي</div>
                    <div className="font-bold text-foreground dark:text-muted-foreground">{preview.base} ج</div>
                  </div>
                  <div className="bg-white/80 dark:bg-muted p-2 rounded-lg">
                    <div className="text-[10px] text-muted-foreground">البونص</div>
                    <div className="font-bold text-warning">{preview.bonus} ج</div>
                  </div>
                  <div className="bg-white/80 dark:bg-muted p-2 rounded-lg">
                    <div className="text-[10px] text-muted-foreground">العمولة</div>
                    <div className="font-bold text-primary">{preview.commission} ج</div>
                  </div>
                  <div className="bg-blue-600 text-white p-2 rounded-lg shadow-xs">
                    <div className="text-[10px] opacity-80">الصافي المتوقع</div>
                    <div className="font-bold text-sm">{preview.total} ج</div>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border dark:border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border dark:border-border rounded-lg hover:bg-muted dark:hover:bg-muted transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-white bg-muted dark:bg-muted dark:text-foreground rounded-lg hover:bg-muted transition active:scale-95 disabled:opacity-50 font-medium"
            >
              {saving ? 'جاري الحفظ...' : editingCourier ? 'حفظ التعديلات' : 'إضافة المندوب'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
