import React from 'react';
import {
  DocumentTextIcon,
  PrinterIcon,
  ClipboardDocumentIcon,
  ChatBubbleLeftRightIcon,
  ArrowRightCircleIcon,
  XMarkIcon,
  NoSymbolIcon
} from '@heroicons/react/24/outline';
import { DeliveryRun, DeliveryRunItem } from '../../../../services/courierService';

interface DeliveryRunDetailModalProps {
  selectedRun: DeliveryRun;
  onClose: () => void;
  onCopyMobileLink: (run: DeliveryRun) => void;
  onShareWhatsApp: (run: DeliveryRun) => void;
  onViewWaybill: (val: { run: DeliveryRun; shipment?: DeliveryRunItem }) => void;
  onPrint: () => void;
  onOpenReassign: (shipment: DeliveryRunItem) => void;
  onRevokeLink?: (run: DeliveryRun) => void;
  formatDate: (date: any) => string;
  formatPrice: (price: number) => string;
}

export const DeliveryRunDetailModal: React.FC<DeliveryRunDetailModalProps> = ({
  selectedRun,
  onClose,
  onCopyMobileLink,
  onShareWhatsApp,
  onViewWaybill,
  onPrint,
  onOpenReassign,
  onRevokeLink,
  formatDate,
  formatPrice
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-muted backdrop-blur-sm print:p-0 print:bg-white">
      <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl w-full max-w-[1200px] max-h-[90vh] shadow-xl flex flex-col overflow-hidden print:border-none print:shadow-none print:max-h-none">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border dark:border-border print:hidden">
          <div className="flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-base sm:text-lg">
              مانيفست مأمورية التوصيل: <span className="font-mono">{selectedRun.runNumber}</span>
            </h3>
          </div>
          <div className="flex items-center flex-wrap gap-2">
            {onRevokeLink && (
              <button
                onClick={() => onRevokeLink(selectedRun)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-destructive bg-destructive/10 dark:bg-destructive/50 border border-destructive dark:border-destructive rounded-lg hover:bg-destructive transition"
              >
                <NoSymbolIcon className="w-4 h-4" />
                إلغاء الرابط
              </button>
            )}
            <button
              onClick={() => onCopyMobileLink(selectedRun)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border dark:border-border rounded-lg hover:bg-muted dark:hover:bg-muted transition"
            >
              <ClipboardDocumentIcon className="w-4 h-4 text-muted-foreground" />
              رابط المندوب
            </button>
            <button
              onClick={() => onShareWhatsApp(selectedRun)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-success bg-success/10 dark:bg-success/50 border border-success dark:border-success rounded-lg hover:bg-success transition"
            >
              <ChatBubbleLeftRightIcon className="w-4 h-4" />
              واتساب
            </button>
            <button
              onClick={() => onViewWaybill({ run: selectedRun })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 dark:bg-primary/50 border border-primary dark:border-primary rounded-lg hover:bg-primary transition"
            >
              <PrinterIcon className="w-4 h-4" />
              طباعة كل البوالص
            </button>
            <button
              onClick={onPrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border dark:border-border rounded-lg hover:bg-muted dark:hover:bg-muted transition"
            >
              <PrinterIcon className="w-4 h-4" />
              طباعة المانيفست
            </button>
            <button
              onClick={onClose}
              aria-label="إغلاق"
              className="p-1.5 text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground rounded-lg transition"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Manifest Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-muted dark:bg-muted border border-border dark:border-border">
            <div>
              <div className="text-xs text-muted-foreground">المندوب المستلم</div>
              <div className="font-semibold text-foreground dark:text-muted-foreground mt-0.5">{selectedRun.courier?.name}</div>
              <div className="text-[11px] text-muted-foreground font-mono" dir="ltr">{selectedRun.courier?.phone}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">تاريخ الخروج</div>
              <div className="font-semibold mt-0.5">{formatDate(selectedRun.dispatchDate)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">إجمالي الطرود</div>
              <div className="font-semibold mt-0.5 tabular-nums font-mono">{selectedRun.totalShipments} طرد</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">إجمالي المبلغ المطلوب (COD)</div>
              <div className="font-semibold text-primary dark:text-primary mt-0.5 tabular-nums font-mono">
                {formatPrice(selectedRun.totalCODExpected)}
              </div>
            </div>
          </div>

          {/* Shipments List */}
          <div className="border border-border dark:border-border rounded-xl overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-muted border-b border-border dark:border-border font-medium text-muted-foreground">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">رقم الطلب</th>
                  <th className="py-2.5 px-3">العميل</th>
                  <th className="py-2.5 px-3">العنوان</th>
                  <th className="py-2.5 px-3">المحتويات</th>
                  <th className="py-2.5 px-3">المبلغ المطلوب</th>
                  <th className="py-2.5 px-3">الحالة الميدانية</th>
                  <th className="py-2.5 px-3 print:hidden">بوليصة الشحن</th>
                  <th className="py-2.5 px-3 print:table-cell hidden">توقيع المستلم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-border">
                {selectedRun.shipments?.map((s, idx) => (
                  <tr key={s.id}>
                    <td className="py-2.5 px-3 tabular-nums font-mono text-muted-foreground">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-mono font-medium">{s.order?.orderNumber}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium">{s.order?.customerName}</div>
                      <div className="text-[11px] text-muted-foreground font-mono" dir="ltr">{s.order?.customerPhone}</div>
                    </td>
                    <td className="py-2.5 px-3 max-w-[200px] truncate">
                      {s.order?.governorate ? `${s.order.governorate} - ` : ''}
                      {s.order?.customerAddress || s.destinationAddress || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">
                      {s.order?.items?.map((it) => `${it.quantity}x ${it.name}`).join('، ') || 'طرد مغلق'}
                    </td>
                    <td className="py-2.5 px-3 font-semibold tabular-nums font-mono">
                      {formatPrice(s.order?.total || 0)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-medium text-foreground dark:text-muted-foreground">
                        {s.status === 'DELIVERED' ? 'تم التسليم' : s.status === 'RETURNED' ? 'مرتجع' : s.status === 'DELAYED' ? 'مؤجل' : 'في الطريق'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 print:hidden">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onViewWaybill({ run: selectedRun, shipment: s })}
                          title="طباعة بوليصة هذا الطرد"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium border border-border dark:border-border rounded-lg hover:bg-muted dark:hover:bg-muted transition"
                        >
                          <PrinterIcon className="w-3.5 h-3.5 text-primary" />
                          بوليصة
                        </button>
                        {!['SETTLED', 'CANCELLED'].includes(selectedRun.status) &&
                         !['DELIVERED', 'RETURNED', 'FAILED', 'CANCELLED'].includes(s.status) && (
                          <button
                            onClick={() => onOpenReassign(s)}
                            title="إعادة إسناد الطرد لمندوب آخر"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium border border-border dark:border-border rounded-lg hover:bg-muted dark:hover:bg-muted transition"
                          >
                            <ArrowRightCircleIcon className="w-3.5 h-3.5 text-warning" />
                            نقل
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 print:table-cell hidden border-b border-dashed border-border w-24"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Signatures for print */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs print:grid hidden">
            <div className="border-t border-border pt-2">
              توقيع أمين المخزن المسلم: ..............................
            </div>
            <div className="border-t border-border pt-2">
              توقيع المندوب المستلم للعهدة: ..............................
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
