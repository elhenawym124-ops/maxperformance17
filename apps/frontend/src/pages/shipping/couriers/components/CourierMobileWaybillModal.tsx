import React from 'react';
import { DeliveryRunItem } from '../../../../services/courierService';
import { useCurrency } from '../../../../hooks/useCurrency';

interface CourierMobileWaybillModalProps {
  shipment: DeliveryRunItem | null;
  onClose: () => void;
}

export const CourierMobileWaybillModal: React.FC<CourierMobileWaybillModalProps> = ({
  shipment,
  onClose,
}) => {
  const { formatPrice } = useCurrency();

  if (!shipment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-muted backdrop-blur-xs">
      <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border dark:border-border pb-3">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase">بوليصة شحن الكابتن</span>
            <h3 className="font-bold text-base text-foreground dark:text-muted-foreground font-mono">
              {shipment.order?.orderNumber}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 p-1">
            ✕
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-3 rounded-xl bg-muted dark:bg-muted border border-border dark:border-border space-y-1">
            <div className="text-slate-400 text-[11px]">المستلم</div>
            <div className="font-bold text-sm text-foreground dark:text-muted-foreground">
              {shipment.order?.customerName}
            </div>
            <div className="font-mono text-xs text-muted-foreground tabular-nums" dir="ltr">
              {shipment.order?.customerPhone}
            </div>
            <div className="mt-1 text-foreground dark:text-muted-foreground">
              {shipment.order?.customerAddress || shipment.destinationAddress || 'العنوان غير مدون'}
            </div>
          </div>

          {shipment.order?.items && shipment.order.items.length > 0 && (
            <div>
              <div className="font-medium text-muted-foreground text-[11px] mb-1">القطع المطلوب تسليمها:</div>
              <div className="p-2.5 rounded-xl bg-muted dark:bg-muted border border-border dark:border-border space-y-1">
                {shipment.order.items.map((it) => (
                  <div key={it.id} className="flex justify-between text-xs">
                    <span>
                      {it.quantity}x {it.name}
                    </span>
                    <span className="font-mono font-medium tabular-nums">
                      {formatPrice(it.price * it.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-3 rounded-xl bg-muted text-white dark:bg-muted dark:text-foreground flex justify-between items-center">
            <div>
              <div className="text-[10px] opacity-80">المبلغ المطلوب تحصيله (COD)</div>
              <div className="text-xl font-bold tabular-nums font-mono">
                {formatPrice(shipment.order?.total || 0)}
              </div>
            </div>
            <span className="text-[11px] font-bold border border-current px-2 py-0.5 rounded">
              كاش عند الاستلام
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 text-xs font-semibold border border-border dark:border-border rounded-xl"
        >
          إغلاق
        </button>
      </div>
    </div>
  );
};
