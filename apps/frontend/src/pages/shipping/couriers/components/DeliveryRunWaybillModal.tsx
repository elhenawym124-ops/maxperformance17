import React from 'react';
import { PrinterIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { DeliveryRun, DeliveryRunItem } from '../../../../services/courierService';

interface DeliveryRunWaybillModalProps {
  viewingWaybill: { run: DeliveryRun; shipment?: DeliveryRunItem };
  onClose: () => void;
  onPrint: () => void;
  formatDate: (date: any) => string;
  formatPrice: (price: number) => string;
}

export const DeliveryRunWaybillModal: React.FC<DeliveryRunWaybillModalProps> = ({
  viewingWaybill,
  onClose,
  onPrint,
  formatDate,
  formatPrice
}) => {
  const shipmentsList = viewingWaybill.shipment
    ? [viewingWaybill.shipment]
    : viewingWaybill.run.shipments || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-muted backdrop-blur-sm print:p-0 print:bg-white overflow-y-auto">
      <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl w-full max-w-2xl my-auto shadow-2xl p-6 space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Header / Actions for Print */}
        <div className="flex items-center justify-between border-b border-border dark:border-border pb-3 print:hidden">
          <div className="flex items-center gap-2">
            <PrinterIcon className="w-5 h-5 text-success" />
            <h3 className="font-bold text-base">
              معاينة وطباعة بوليصة الشحن (Airway Bill)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onPrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-muted dark:bg-muted dark:text-foreground rounded-lg hover:bg-muted transition active:scale-95"
            >
              <PrinterIcon className="w-4 h-4" />
              طباعة الآن
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

        {/* Waybill Content (Single or Multi) */}
        <div className="space-y-8">
          {shipmentsList.map((s, idx) => (
            <div
              key={s.id}
              className="border-2 border-border dark:border-border rounded-xl p-5 text-foreground dark:text-muted-foreground font-sans space-y-4 print:page-break-after-always print:m-0"
            >
              {/* Top Header of Waybill */}
              <div className="flex items-start justify-between border-b-2 border-border dark:border-border pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    أسطول التوصيل الداخلي السريع
                  </span>
                  <h2 className="text-lg font-black tracking-tight">بوليصة شحن وتوصيل</h2>
                  <div className="text-xs font-mono font-bold mt-0.5">
                    رقم المأمورية: {viewingWaybill.run.runNumber}
                  </div>
                </div>
                <div className="text-left font-mono">
                  <div className="text-[11px] text-muted-foreground">BARCODE / REF</div>
                  <div className="text-sm font-black border border-border dark:border-border px-2.5 py-1 rounded mt-0.5">
                    *{s.order?.orderNumber}*
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">طرد رقم {idx + 1}</div>
                </div>
              </div>

              {/* Consignee and Sender Grid */}
              <div className="grid grid-cols-2 gap-4 border-b border-border dark:border-border pb-4 text-xs">
                <div>
                  <div className="font-bold text-[11px] text-muted-foreground mb-1">بيانات العميل والمستلم:</div>
                  <div className="font-bold text-sm text-foreground dark:text-muted-foreground">
                    {s.order?.customerName}
                  </div>
                  <div className="font-mono font-semibold mt-0.5" dir="ltr">
                    {s.order?.customerPhone}
                  </div>
                  <div className="mt-1 text-foreground dark:text-muted-foreground">
                    {s.order?.governorate ? `${s.order.governorate} - ` : ''}
                    {s.order?.customerAddress || s.destinationAddress || 'العنوان غير مدون'}
                  </div>
                </div>
                <div className="text-left">
                  <div className="font-bold text-[11px] text-muted-foreground mb-1">المندوب وتاريخ الإسناد:</div>
                  <div className="font-bold text-sm">{viewingWaybill.run.courier?.name}</div>
                  <div className="font-mono text-xs text-muted-foreground" dir="ltr">
                    {viewingWaybill.run.courier?.phone}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatDate(viewingWaybill.run.dispatchDate)}
                  </div>
                </div>
              </div>

              {/* Parcel Items */}
              <div className="text-xs space-y-1">
                <div className="font-bold text-[11px] text-muted-foreground">محتويات الشحنة:</div>
                <div className="bg-slate-50 dark:bg-muted p-2.5 rounded-lg border border-border dark:border-border">
                  {s.order?.items && s.order.items.length > 0 ? (
                    s.order.items.map((it) => (
                      <div key={it.id} className="flex justify-between py-0.5">
                        <span>{it.quantity}x {it.name} {it.variantTitle ? `(${it.variantTitle})` : ''}</span>
                        <span className="font-mono font-medium">{formatPrice(it.price * it.quantity)}</span>
                      </div>
                    ))
                  ) : (
                    <span>طرد مغلق - تسليم مباشر</span>
                  )}
                </div>
              </div>

              {/* Cash Collection Block */}
              <div className="bg-slate-900 text-white dark:bg-white dark:text-foreground p-4 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-medium opacity-80">المبلغ المطلوب تحصيله نقداً (COD)</div>
                  <div className="text-2xl font-black tabular-nums font-mono tracking-tight">
                    {formatPrice(s.order?.total || 0)}
                  </div>
                </div>
                <div className="text-left">
                  <span className="inline-block border border-current px-2.5 py-1 rounded text-xs font-bold uppercase">
                    دفع عند الاستلام
                  </span>
                </div>
              </div>

              {/* Instructions and Signature */}
              <div className="pt-2 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border dark:border-border">
                <div>
                  <span>تعليمات: مسموح بالمعاينة قبل الاستلام وفق سياسة المتجر.</span>
                </div>
                <div>
                  <span>توقيع العميل: ....................</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
