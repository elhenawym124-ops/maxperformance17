import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  AlertTriangle,
  PackageCheck,
  Truck,
  ShieldAlert,
  Send,
  DollarSign,
  FileCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { shippingOpsService, ShipmentItem } from '../../services/shippingOpsService';

interface ShipmentTransitionsBarProps {
  shipment: ShipmentItem;
  onUpdated: () => void;
}

interface ActionConfig {
  labelAr: string;
  labelEn: string;
  btnClass: string;
  icon: React.ElementType;
}

const ACTION_MAP: Record<string, ActionConfig> = {
  PICKED_UP: {
    labelAr: 'تسليم للمندوب',
    labelEn: 'Mark Picked Up',
    btnClass: 'bg-primary hover:bg-primary/90 text-white',
    icon: Truck,
  },
  OUT_FOR_DELIVERY: {
    labelAr: 'خروج للتوصيل',
    labelEn: 'Out for Delivery',
    btnClass: 'bg-sky-600 hover:bg-info text-white',
    icon: Truck,
  },
  POSTPONED: {
    labelAr: 'تأجيل مع المندوب',
    labelEn: 'Postpone with Courier',
    btnClass: 'bg-amber-600 hover:bg-warning text-white',
    icon: Clock,
  },
  DELIVERED: {
    labelAr: 'تم التسليم (تحصيل)',
    labelEn: 'Mark Delivered',
    btnClass: 'bg-emerald-600 hover:bg-success text-white',
    icon: CheckCircle2,
  },
  FAILED: {
    labelAr: 'فشل التوصيل',
    labelEn: 'Delivery Failed',
    btnClass: 'bg-rose-600 hover:bg-destructive text-white',
    icon: AlertTriangle,
  },
  RETURNED_AT_COMPANY: {
    labelAr: 'مرتجع في الشركة (RTO)',
    labelEn: 'Returned at Company',
    btnClass: 'bg-primary hover:bg-primary/90 text-white',
    icon: PackageCheck,
  },
  RETURNED_RECEIVED: {
    labelAr: 'مرتجع وصلني',
    labelEn: 'Returned Received',
    btnClass: 'bg-teal-600 hover:bg-success text-white',
    icon: PackageCheck,
  },
  RETURNED_DAMAGED: {
    labelAr: 'مرتجع معدوم (تالف)',
    labelEn: 'Mark Damaged',
    btnClass: 'bg-rose-700 hover:bg-destructive text-white',
    icon: ShieldAlert,
  },
  RETURNED_LOST: {
    labelAr: 'مرتجع مفقود',
    labelEn: 'Mark Lost',
    btnClass: 'bg-red-800 hover:bg-destructive text-white',
    icon: ShieldAlert,
  },
  RESHIPPED: {
    labelAr: 'إعادة إرسال الشحنة',
    labelEn: 'Reship Order',
    btnClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    icon: Send,
  },
  REMITTED: {
    labelAr: 'تم التوريد المالي',
    labelEn: 'Mark Remitted',
    btnClass: 'bg-emerald-700 hover:bg-success text-white',
    icon: DollarSign,
  },
  CLOSED: {
    labelAr: 'إغلاق الشحنة',
    labelEn: 'Close Shipment',
    btnClass: 'bg-slate-700 hover:bg-muted text-white',
    icon: FileCheck,
  },
  CANCELLED: {
    labelAr: 'إلغاء الشحنة',
    labelEn: 'Cancel Shipment',
    btnClass: 'text-rose-600 border border-destructive dark:border-destructive hover:bg-destructive/10 dark:hover:bg-destructive/40 bg-white dark:bg-muted',
    icon: XCircle,
  },
};

export const ShipmentTransitionsBar: React.FC<ShipmentTransitionsBarProps> = ({ shipment, onUpdated }) => {
  const { i18n } = useTranslation();
  const isEn = i18n.language === 'en';
  const navigate = useNavigate();

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [collectedAmount, setCollectedAmount] = useState<number>(shipment.codAmount || 0);
  const [failureReasonCode, setFailureReasonCode] = useState('CUSTOMER_REFUSED');
  const [postponeDate, setPostponeDate] = useState('');
  const [notes, setNotes] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [reshipReason, setReshipReason] = useState('');

  const allowedTransitions = shipment.allowedTransitions || [];

  if (!allowedTransitions.length) {
    return null;
  }

  const handleOpenAction = (targetStatus: string) => {
    setActiveModal(targetStatus);
    setNotes('');
    if (targetStatus === 'DELIVERED') {
      setCollectedAmount(shipment.codAmount || 0);
    }
  };

  const handleExecuteTransition = async (targetStatus: string) => {
    try {
      setSubmitting(true);

      if (targetStatus === 'CANCELLED') {
        await shippingOpsService.cancelShipment(shipment.id, cancelReason || notes || 'Cancelled by operator');
        toast.success(isEn ? 'Shipment cancelled' : 'تم إلغاء الشحنة بنجاح');
      } else if (targetStatus === 'RESHIPPED') {
        const reshipRes = await shippingOpsService.reshipShipment(shipment.id, {
          reason: reshipReason || notes || 'Reshipment initiated from returned shipment',
        });
        toast.success(isEn ? 'New shipment created and linked' : 'تم إنشاء شحنة جديدة وربطها بنجاح');
        setActiveModal(null);
        if (reshipRes?.childShipment?.id) {
          navigate(`/shipping-ops/parcels/${reshipRes.childShipment.id}`);
          return;
        }
      } else {
        await shippingOpsService.updateShipmentStatus(shipment.id, {
          status: targetStatus,
          collectedAmount: targetStatus === 'DELIVERED' ? Number(collectedAmount) : undefined,
          failureReasonCode: targetStatus === 'FAILED' ? failureReasonCode : undefined,
          nextAttemptDate: targetStatus === 'POSTPONED' && postponeDate ? new Date(postponeDate).toISOString() : undefined,
          notes: notes.trim() || undefined,
        });
        toast.success(isEn ? `Status updated to ${targetStatus}` : 'تم تحديث حالة الشحنة بنجاح');
      }

      setActiveModal(null);
      onUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'تعذر تحديث حالة الشحنة';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1.5 flex-wrap">
        {allowedTransitions.map((statusKey) => {
          const config = ACTION_MAP[statusKey] || {
            labelAr: statusKey,
            labelEn: statusKey,
            btnClass: 'bg-slate-600 hover:bg-muted text-white',
            icon: CheckCircle2,
          };
          const Icon = config.icon;

          return (
            <button
              key={statusKey}
              type="button"
              onClick={() => handleOpenAction(statusKey)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition active:scale-95 shadow-xs cursor-pointer ${config.btnClass}`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{isEn ? config.labelEn : config.labelAr}</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Action Modal */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border dark:border-border pb-3">
              <h3 className="font-bold text-base text-foreground dark:text-muted-foreground">
                {isEn ? `Transition to ${activeModal}` : `تحويل الحالة إلى: ${ACTION_MAP[activeModal]?.labelAr || activeModal}`}
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-foreground"
              >
                ✕
              </button>
            </div>

            {/* Custom Inputs per Status */}
            {activeModal === 'DELIVERED' && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  {isEn
                    ? 'Confirm cash on delivery (COD) collected from the recipient.'
                    : 'تأكيد تحصيل المبلغ النقدي عند الاستلام (COD) من المستلم.'}
                </p>
                <div>
                  <label className="block text-xs font-medium text-foreground dark:text-muted-foreground mb-1">
                    {isEn ? 'Collected COD Amount (EGP)' : 'المبلغ المحصل فعلياً (ج.م)'}
                  </label>
                  <input
                    type="number"
                    value={collectedAmount}
                    onChange={(e) => setCollectedAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:ring-2 focus:ring-success font-bold"
                  />
                </div>
              </div>
            )}

            {activeModal === 'FAILED' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-foreground dark:text-muted-foreground mb-1">
                    {isEn ? 'Failure Reason' : 'سبب تعذر التسليم'}
                  </label>
                  <select
                    value={failureReasonCode}
                    onChange={(e) => setFailureReasonCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:ring-2 focus:ring-destructive"
                  >
                    <option value="CUSTOMER_REFUSED">{isEn ? 'Customer Refused Order' : 'رفض العميل استلام الشحنة'}</option>
                    <option value="UNREACHABLE">{isEn ? 'Customer Unreachable / Closed' : 'الهاتف مغلق / لا يرد'}</option>
                    <option value="WRONG_ADDRESS">{isEn ? 'Incorrect / Incomplete Address' : 'العنوان غير واضح / غير مطابق'}</option>
                    <option value="POSTPONED_BY_CUSTOMER">{isEn ? 'Customer Requested Postponement' : 'طلب العميل التأجيل لموعد آخر'}</option>
                    <option value="OTHER">{isEn ? 'Other Reason' : 'سبب آخر'}</option>
                  </select>
                </div>
              </div>
            )}

            {activeModal === 'POSTPONED' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-foreground dark:text-muted-foreground mb-1">
                    {isEn ? 'Postponed Date / Next Attempt' : 'موعد المحاولة القادمة'}
                  </label>
                  <input
                    type="datetime-local"
                    value={postponeDate}
                    onChange={(e) => setPostponeDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:ring-2 focus:ring-warning"
                  />
                </div>
              </div>
            )}

            {(activeModal === 'RETURNED_DAMAGED' || activeModal === 'RETURNED_LOST') && (
              <div className="p-3 bg-destructive/10 dark:bg-destructive/40 border border-destructive dark:border-destructive rounded-xl space-y-1">
                <div className="flex items-center gap-2 text-destructive dark:text-destructive font-semibold text-xs">
                  <ShieldAlert className="w-4 h-4 text-destructive" />
                  <span>{isEn ? 'Financial Settlement Warning' : 'تنبيه التسوية المالية للمرتجع'}</span>
                </div>
                <p className="text-[11px] text-destructive dark:text-destructive">
                  {isEn
                    ? 'Marking as damaged/lost will automatically open a loss deduction in the courier settlement.'
                    : 'تسجيل الشحنة كـ تالف/مفقود سيفتح تلقائياً بند خصم خسارة في تسوية عهدة المندوب.'}
                </p>
              </div>
            )}

            {activeModal === 'RESHIPPED' && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  {isEn
                    ? 'A new child shipment will be created and linked to this returned shipment.'
                    : 'سيتم إنشاء شحنة جديدة مرتبطة بهذه الشحنة المرتجعة وإعادة إرسالها.'}
                </p>
                <div>
                  <label className="block text-xs font-medium text-foreground dark:text-muted-foreground mb-1">
                    {isEn ? 'Reship Reason' : 'سبب إعادة الإرسال'}
                  </label>
                  <input
                    type="text"
                    value={reshipReason}
                    onChange={(e) => setReshipReason(e.target.value)}
                    placeholder={isEn ? 'e.g. Customer re-ordered or updated phone' : 'مثال: العميل طلب إعادة الإرسال / تم تحديث العنوان'}
                    className="w-full px-3 py-2 text-xs bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {activeModal === 'REMITTED' && (
              <div className="p-3 bg-success/10 dark:bg-success/40 border border-success dark:border-success rounded-xl space-y-1">
                <p className="text-xs text-success dark:text-success font-medium">
                  {isEn
                    ? 'Mark this delivered shipment as financially remitted to the merchant.'
                    : 'تأكيد توريد مبلغ التحصيل للعميل/التاجر مالياً.'}
                </p>
              </div>
            )}

            {activeModal === 'CANCELLED' && (
              <div>
                <label className="block text-xs font-medium text-foreground dark:text-muted-foreground mb-1">
                  {isEn ? 'Cancellation Reason' : 'سبب الإلغاء'}
                </label>
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder={isEn ? 'Reason for cancellation...' : 'سبب إلغاء الشحنة...'}
                  className="w-full px-3 py-2 text-xs bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:ring-2 focus:ring-destructive"
                />
              </div>
            )}

            {/* General notes input for any transition */}
            <div>
              <label className="block text-xs font-medium text-foreground dark:text-muted-foreground mb-1">
                {isEn ? 'Internal Notes / Event Comment' : 'ملاحظات العملية / السجل'}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={isEn ? 'Optional note for timeline event...' : 'ملاحظة اختيارية تُسجل في الخط الزمني...'}
                rows={2}
                className="w-full px-3 py-2 text-xs bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border dark:border-border">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                disabled={submitting}
                className="px-3.5 py-1.5 text-xs font-medium border border-border dark:border-border rounded-lg hover:bg-muted dark:hover:bg-muted transition cursor-pointer"
              >
                {isEn ? 'Cancel' : 'تراجع'}
              </button>
              <button
                type="button"
                onClick={() => handleExecuteTransition(activeModal)}
                disabled={submitting}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (isEn ? 'Saving...' : 'جاري التنفيذ...') : (isEn ? 'Confirm' : 'تأكيد العملية')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
export default ShipmentTransitionsBar;
