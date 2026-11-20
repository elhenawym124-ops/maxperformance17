import React from 'react';
import {
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  ExternalLink,
} from 'lucide-react';
import { SampleOrder } from '../../manufacturingApi';

export interface DrawerStatusBannersProps {
  sample: SampleOrder;
  onNavigateOrder: (orderId: string) => void;
  onOpenConvertModal: () => void;
}

export const DrawerStatusBanners: React.FC<DrawerStatusBannersProps> = ({
  sample,
  onNavigateOrder,
  onOpenConvertModal,
}) => {
  return (
    <div className="px-4 pt-3">
      {sample.status === 'CONVERTED' && (
        <div className="p-3.5 rounded-xl bg-primary/10 dark:bg-primary/40 border border-primary dark:border-primary text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-primary dark:text-primary font-semibold">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
            <div>
              <p>تم تحويل العينة بنجاح لأمر تصنيع كامل</p>
              <p className="text-[11px] font-normal text-primary/80 dark:text-primary/80 tabular-nums">
                رقم أمر الإنتاج:{' '}
                {sample.convertedOrder?.orderNumber || sample.convertedOrderId}
              </p>
            </div>
          </div>
          {sample.convertedOrderId && (
            <button
              onClick={() => onNavigateOrder(sample.convertedOrderId!)}
              className="px-3 py-1.5 rounded-lg bg-primary text-white font-semibold hover:bg-primary transition-colors shrink-0 flex items-center gap-1 shadow-sm text-xs"
            >
              <span>اذهب للأمر</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {sample.status === 'APPROVED' && (
        <div className="p-3.5 rounded-xl bg-success/10 dark:bg-success/40 border border-success dark:border-success text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-success dark:text-success font-semibold">
            <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
            <div>
              <p>العينة معتمدة وجاهزة للتحويل لأمر تصنيع كامل</p>
              {sample.resultNotes && (
                <p className="text-[11px] font-normal text-success/80 dark:text-success/80">
                  ملاحظات الاعتماد: {sample.resultNotes}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onOpenConvertModal}
            className="px-3 py-1.5 rounded-lg bg-success text-white font-bold hover:bg-success transition-colors shrink-0 flex items-center gap-1 shadow-sm text-xs active:scale-95"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>تحويل لأمر تصنيع</span>
          </button>
        </div>
      )}

      {sample.status === 'REJECTED' && (
        <div className="p-3.5 rounded-xl bg-destructive/10 dark:bg-destructive/40 border border-destructive dark:border-destructive text-xs">
          <div className="flex items-center gap-2 text-destructive dark:text-destructive font-semibold mb-1">
            <XCircle className="w-4 h-4 text-destructive shrink-0" />
            <span>تم رفض هذه العينة</span>
          </div>
          <p className="text-[11px] text-destructive dark:text-destructive">
            سبب الرفض:{' '}
            <span className="font-medium">
              {sample.resultNotes || 'غير محدد'}
            </span>
          </p>
        </div>
      )}
    </div>
  );
};
