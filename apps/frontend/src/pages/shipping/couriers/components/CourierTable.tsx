import React from 'react';
import { toast } from 'sonner';
import {
  PhoneIcon,
  PencilSquareIcon,
  TrashIcon,
  KeyIcon,
  DocumentTextIcon,
  CheckBadgeIcon,
  ClockIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import courierService, { Courier } from '../../../../services/courierService';
import { useCurrency } from '../../../../hooks/useCurrency';

export const VEHICLE_LABELS: Record<string, string> = {
  MOTORCYCLE: 'دراجة نارية / موتوسيكل',
  CAR: 'سيارة ملاكي',
  VAN: 'فان / سيارة نقل بضائع',
  BICYCLE: 'دراجة هوائية',
  ON_FOOT: 'توصيل راجل',
};

interface CourierTableProps {
  couriers: Courier[];
  onOpenEdit: (c: Courier) => void;
  onOpenDocuments?: (c: Courier) => void;
  onDelete: (id: string, name: string) => Promise<void>;
}

export const CourierTable: React.FC<CourierTableProps> = ({
  couriers,
  onOpenEdit,
  onOpenDocuments,
  onDelete,
}) => {
  const { formatPrice } = useCurrency();

  const handleSetPin = async (c: Courier) => {
    const pin = window.prompt(
      `تعيين رمز PIN ميداني للمندوب ${c.name} (من 4 إلى 6 أرقام).\nاتركه فاضي وألغِ لإلغاء الرمز الحالي.`
    );
    if (pin === null) return;
    if (pin.trim() !== '' && !/^\d{4,6}$/.test(pin.trim())) {
      toast.error('رمز PIN يجب أن يكون من 4 إلى 6 أرقام');
      return;
    }
    try {
      const res = await courierService.setCourierPin(c.id, pin.trim() || null);
      if (res.success) toast.success(res.message || 'تم التحديث');
    } catch (err: any) {
      toast.error(err?.message || 'تعذر تعيين رمز PIN');
    }
  };

  return (
    <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs sm:text-sm">
          <thead className="bg-slate-50 dark:bg-muted border-b border-border dark:border-border text-muted-foreground dark:text-muted-foreground">
            <tr>
              <th className="py-3 px-4 font-medium">المندوب والتوثيق</th>
              <th className="py-3 px-4 font-medium">وسيلة الانتقال</th>
              <th className="py-3 px-4 font-medium">الحالة</th>
              <th className="py-3 px-4 font-medium">شحنات جارية</th>
              <th className="py-3 px-4 font-medium">كاش معلق بالعهدة</th>
              <th className="py-3 px-4 font-medium">نسبة النجاح</th>
              <th className="py-3 px-4 font-medium text-left">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border dark:divide-border">
            {couriers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground dark:text-muted-foreground">
                  لا يوجد مناديب مسجلين حالياً تطابق معايير البحث
                </td>
              </tr>
            ) : (
              couriers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-muted transition">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-foreground dark:text-muted-foreground">{c.name}</div>
                      {c.documentsStatus === 'VERIFIED' ? (
                        <span
                          title="مستندات معتمدة وموثقة بالكامل"
                          className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-success/10 text-success dark:bg-success/40 dark:text-success border border-success"
                        >
                          <CheckBadgeIcon className="w-3.5 h-3.5" />
                          موثق
                        </span>
                      ) : c.documentsStatus === 'PENDING_REVIEW' ? (
                        <span
                          title="مستندات مرفوعة قيد المراجعة"
                          className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-warning/10 text-warning dark:bg-warning/40 dark:text-warning border border-warning"
                        >
                          <ClockIcon className="w-3.5 h-3.5" />
                          قيد الفحص
                        </span>
                      ) : (
                        <span
                          title="أوراق ناقصة (يلزم بطاقة + وصل أمانة)"
                          className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-destructive/10 text-destructive dark:bg-destructive/40 dark:text-destructive border border-destructive"
                        >
                          <ExclamationCircleIcon className="w-3.5 h-3.5" />
                          أوراق ناقصة
                        </span>
                      )}
                    </div>
                    <div
                      className="text-xs text-muted-foreground dark:text-muted-foreground flex items-center gap-1 mt-0.5"
                      dir="ltr"
                    >
                      <PhoneIcon className="w-3.5 h-3.5" />
                      <span className="font-mono tabular-nums">{c.phone}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="text-xs">{VEHICLE_LABELS[c.vehicleType] || c.vehicleType}</div>
                    {c.plateNumber && (
                      <div className="text-[11px] text-muted-foreground tabular-nums font-mono">
                        لوحة: {c.plateNumber}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {c.status === 'ON_DUTY' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success dark:bg-success/40 dark:text-success border border-success dark:border-success">
                        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
                        في الميدان
                      </span>
                    ) : c.status === 'AVAILABLE' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground dark:bg-muted dark:text-muted-foreground">
                        متاح بالمقر
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive dark:bg-destructive/40 dark:text-destructive">
                        خارج الدوام
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 tabular-nums font-mono">
                    {c.activeShipmentsCount > 0 ? (
                      <span className="font-semibold text-primary dark:text-primary">
                        {c.activeShipmentsCount} طرد
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 tabular-nums font-mono font-medium">
                    {c.pendingSettlementCash > 0 ? (
                      <span className="text-amber-600 dark:text-warning">
                        {formatPrice(c.pendingSettlementCash)}
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 tabular-nums font-mono">
                    <span
                      className={`font-semibold ${
                        c.successRate >= 80
                          ? 'text-emerald-600 dark:text-success'
                          : 'text-amber-600 dark:text-warning'
                      }`}
                    >
                      {c.successRate}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-left">
                    <div className="flex items-center justify-end gap-1.5">
                      {onOpenDocuments && (
                        <button
                          onClick={() => onOpenDocuments(c)}
                          title="إدارة مستندات وتوثيق المندوب"
                          className="p-1.5 text-primary hover:text-primary dark:hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/40 rounded-lg transition"
                        >
                          <DocumentTextIcon className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleSetPin(c)}
                        title="تعيين/إلغاء رمز PIN الميداني"
                        className="p-1.5 text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground hover:bg-muted dark:hover:bg-muted rounded-lg transition"
                      >
                        <KeyIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onOpenEdit(c)}
                        title="تعديل بيانات المندوب"
                        className="p-1.5 text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground hover:bg-muted dark:hover:bg-muted rounded-lg transition"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(c.id, c.name)}
                        title="حذف المندوب"
                        className="p-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/40 rounded-lg transition"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
