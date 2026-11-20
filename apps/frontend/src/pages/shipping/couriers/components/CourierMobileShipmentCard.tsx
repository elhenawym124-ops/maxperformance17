import React from 'react';
import {
  PhoneIcon,
  MapPinIcon,
  ChatBubbleLeftRightIcon,
  CubeIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { DeliveryRunItem } from '../../../../services/courierService';
import { useCurrency } from '../../../../hooks/useCurrency';

interface CourierMobileShipmentCardProps {
  shipment: DeliveryRunItem;
  runCourierName?: string;
  activeTab: 'pending' | 'delivered' | 'returned';
  onOpenAction: (s: DeliveryRunItem, type: 'DELIVERED' | 'DELAYED' | 'RETURNED') => void;
  onViewWaybill: (s: DeliveryRunItem) => void;
  formatWhatsAppUrl: (phone: string, text?: string) => string;
}

export const CourierMobileShipmentCard: React.FC<CourierMobileShipmentCardProps> = ({
  shipment: s,
  runCourierName,
  activeTab,
  onOpenAction,
  onViewWaybill,
  formatWhatsAppUrl,
}) => {
  const { formatPrice } = useCurrency();
  const phone = s.order?.customerPhone || '';
  const address = s.order?.customerAddress || s.destinationAddress || '';
  const total = Number(s.order?.total || 0);

  return (
    <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-4 shadow-xs space-y-3">
      {/* Header: Order & COD */}
      <div className="flex items-center justify-between border-b border-border dark:border-border pb-2.5">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold text-xs text-foreground dark:text-muted-foreground">
              {s.order?.orderNumber}
            </span>
            <button
              onClick={() => onViewWaybill(s)}
              title="عرض تفاصيل البوليصة"
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] text-primary dark:text-primary bg-primary/10 dark:bg-primary/40 rounded border border-primary dark:border-primary hover:bg-primary transition"
            >
              <DocumentTextIcon className="w-3 h-3" />
              بوليصة
            </button>
          </div>
          <h4 className="font-bold text-sm text-foreground dark:text-muted-foreground mt-0.5">
            {s.order?.customerName}
          </h4>
        </div>
        <div className="text-left">
          <div className="text-[10px] text-muted-foreground">المبلغ المطلوب (COD)</div>
          <div className="text-base font-bold text-primary dark:text-primary tabular-nums font-mono">
            {formatPrice(
              s.collectedAmount !== null && s.collectedAmount !== undefined
                ? s.collectedAmount
                : total
            )}
          </div>
        </div>
      </div>

      {/* Address & Items */}
      <div className="space-y-1.5 text-xs text-foreground dark:text-muted-foreground">
        <div className="flex items-start gap-1.5">
          <MapPinIcon className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <span>{address || 'العنوان غير مدون بدقة'}</span>
        </div>
        {s.order?.items && s.order.items.length > 0 && (
          <div className="flex items-start gap-1.5 text-muted-foreground text-[11px]">
            <CubeIcon className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{s.order.items.map((it) => `${it.quantity}x ${it.name}`).join('، ')}</span>
          </div>
        )}
      </div>

      {/* Direct Action Contacts */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border dark:border-border">
        {phone ? (
          <a
            href={`tel:${phone}`}
            className="flex items-center justify-center gap-1 py-2 bg-muted dark:bg-muted border border-border dark:border-border rounded-lg text-xs font-semibold text-foreground dark:text-muted-foreground active:scale-95"
          >
            <PhoneIcon className="w-3.5 h-3.5 text-success" />
            اتصال
          </a>
        ) : (
          <div />
        )}
        {phone ? (
          <a
            href={formatWhatsAppUrl(
              phone,
              `مرحباً ${s.order?.customerName || ''}، أنا كابتن ${runCourierName || ''} ومعي طلبك رقم ${
                s.order?.orderNumber || ''
              }`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 py-2 bg-muted dark:bg-muted border border-border dark:border-border rounded-lg text-xs font-semibold text-success dark:text-success active:scale-95"
          >
            <ChatBubbleLeftRightIcon className="w-3.5 h-3.5" />
            واتساب
          </a>
        ) : (
          <div />
        )}
        {address ? (
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 py-2 bg-muted dark:bg-muted border border-border dark:border-border rounded-lg text-xs font-semibold text-primary dark:text-primary active:scale-95"
          >
            <MapPinIcon className="w-3.5 h-3.5" />
            الخريطة
          </a>
        ) : (
          <div />
        )}
      </div>

      {/* Status Update Buttons */}
      {activeTab === 'pending' && (
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border dark:border-border">
          <button
            onClick={() => onOpenAction(s, 'DELIVERED')}
            className="col-span-1 py-2.5 bg-success hover:bg-success text-white font-bold rounded-lg text-xs active:scale-95 transition"
          >
            تم التسليم
          </button>
          <button
            onClick={() => onOpenAction(s, 'DELAYED')}
            className="col-span-1 py-2.5 bg-warning hover:bg-warning text-white font-bold rounded-lg text-xs active:scale-95 transition"
          >
            تأجيل
          </button>
          <button
            onClick={() => onOpenAction(s, 'RETURNED')}
            className="col-span-1 py-2.5 bg-destructive hover:bg-destructive text-white font-bold rounded-lg text-xs active:scale-95 transition"
          >
            مرتجع
          </button>
        </div>
      )}
    </div>
  );
};
