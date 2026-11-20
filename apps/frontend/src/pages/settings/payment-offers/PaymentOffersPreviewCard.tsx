import React from 'react';
import { Banknote, CreditCard, Gift, Info, Smartphone } from 'lucide-react';
import type { PaymentOffersFormState } from './types';

interface PaymentOffersPreviewCardProps {
  form: PaymentOffersFormState;
  sampleOrderSubtotal: number;
  sampleDiscountAmount: number;
  sampleOrderTotal: number;
}

export const PaymentOffersPreviewCard: React.FC<PaymentOffersPreviewCardProps> = ({
  form,
  sampleOrderSubtotal,
  sampleDiscountAmount,
  sampleOrderTotal,
}) => {
  return (
    <div className="rounded-xl border border-primary bg-primary/40 p-4 dark:border-primary/40 dark:bg-primary/20 space-y-3.5">
      <div className="flex items-center gap-2">
        <Info className="size-4 text-primary" />
        <span className="text-xs font-bold text-primary dark:text-primary">
          معاينة تجربة العميل في المتجر
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {/* Payment Options Preview */}
        <div className="rounded-lg bg-card p-3 shadow-xs border border-border space-y-2">
          <p className="font-semibold text-foreground text-[11px] mb-1">
            طرق الدفع في الشيك أوت:
          </p>
          <div className="flex items-center justify-between p-2 rounded border border-border bg-muted/40">
            <span className="flex items-center gap-1.5 font-medium">
              <Banknote className="size-3.5 text-muted-foreground" />
              الدفع عند الاستلام
            </span>
            <span className="text-muted-foreground text-[11px]">بدون خصم</span>
          </div>

          {form.walletEnabled && form.walletNumber.trim() ? (
            <div className="flex items-center justify-between p-2 rounded border border-success bg-success/80 dark:bg-success/40 dark:border-success">
              <span className="flex items-center gap-1.5 font-bold text-success dark:text-success">
                <Smartphone className="size-3.5 text-success dark:text-success" />
                الدفع بالمحفظة
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-success px-2 py-0.5 text-[10px] font-bold text-success dark:bg-success/60 dark:text-success">
                <Gift className="size-3" />
                خصم <span className="font-mono tabular-nums">{form.discountPercent}%</span>
              </span>
            </div>
          ) : null}

          {form.cardEnabled ? (
            <div className="flex items-center justify-between p-2 rounded border border-success bg-success/80 dark:bg-success/40 dark:border-success">
              <span className="flex items-center gap-1.5 font-bold text-success dark:text-success">
                <CreditCard className="size-3.5 text-success dark:text-success" />
                بطاقة ائتمان
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-success px-2 py-0.5 text-[10px] font-bold text-success dark:bg-success/60 dark:text-success">
                <Gift className="size-3" />
                خصم <span className="font-mono tabular-nums">{form.discountPercent}%</span>
              </span>
            </div>
          ) : null}
        </div>

        {/* Summary Preview */}
        <div className="rounded-lg bg-card p-3 shadow-xs border border-border space-y-1.5 font-mono">
          <p className="font-sans font-semibold text-foreground text-[11px] mb-1">
            ملخص الطلب (مثال: طلب بقيمة <span className="font-mono tabular-nums">{sampleOrderSubtotal}</span> ج.م):
          </p>
          <div className="flex justify-between text-muted-foreground">
            <span className="font-sans">إجمالي المنتجات:</span>
            <span className="tabular-nums">{sampleOrderSubtotal} ج.م</span>
          </div>
          <div className="flex justify-between text-success font-bold">
            <span className="font-sans">
              خصم الدفع الإلكتروني (<span className="tabular-nums">{form.discountPercent}%</span>):
            </span>
            <span className="tabular-nums">-{sampleDiscountAmount.toFixed(0)} ج.م</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-border font-bold text-foreground">
            <span className="font-sans">الإجمالي المطلوب:</span>
            <span className="tabular-nums">{sampleOrderTotal.toFixed(0)} ج.م</span>
          </div>
        </div>
      </div>
    </div>
  );
};
