import React from "react";
import { CreditCard, Plus, Receipt, Send } from "lucide-react";

interface ServiceOrderFinanceCardProps {
  order: any;
  onOpenPaymentModal: () => void;
  onOpenInvoiceModal: () => void;
  onSendInvoiceWhatsApp: () => void;
}

export const ServiceOrderFinanceCard: React.FC<ServiceOrderFinanceCardProps> = ({
  order,
  onOpenPaymentModal,
  onOpenInvoiceModal,
  onSendInvoiceWhatsApp,
}) => {
  return (
    <div className="bg-card rounded-xl border border-border dark:border-border p-4 sm:p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-border dark:border-border">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-success" />
          الماليات وحالة الدفع
        </h3>
        <button
          type="button"
          onClick={onOpenPaymentModal}
          className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>تسجيل دفعة</span>
        </button>
      </div>

      {/* Financial Summary */}
      <div className="space-y-2 text-xs">
        <div className="flex justify-between items-center p-2 rounded-xl bg-muted dark:bg-muted">
          <span className="text-gray-500">السعر الإجمالي:</span>
          <span className="font-bold text-foreground tabular-nums">
            {order.payment?.totalAmount || 0} ج.م
          </span>
        </div>
        <div className="flex justify-between items-center p-2 rounded-xl bg-success/50 dark:bg-success/20 text-success dark:text-success">
          <span>المدفوع (عربون/تحصيل):</span>
          <span className="font-bold tabular-nums">
            {order.payment?.paidAmount || 0} ج.م
          </span>
        </div>
        <div className="flex justify-between items-center p-2 rounded-xl bg-destructive/50 dark:bg-destructive/20 text-destructive dark:text-destructive">
          <span>المبلغ المتبقي:</span>
          <span className="font-bold tabular-nums">
            {order.payment?.remainingAmount || 0} ج.م
          </span>
        </div>
      </div>

      {/* Action Buttons for Invoice */}
      <div className="pt-2 border-t border-border dark:border-border flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenInvoiceModal}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-primary/10 hover:bg-primary dark:bg-primary/40 dark:hover:bg-primary/50 text-primary dark:text-primary text-xs font-bold rounded-xl transition-colors"
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>عرض الفاتورة</span>
        </button>

        <button
          type="button"
          onClick={onSendInvoiceWhatsApp}
          className="flex items-center justify-center p-2 bg-success/10 hover:bg-success dark:bg-success/40 text-success dark:text-success rounded-xl transition-colors"
          title="إرسال الفاتورة عبر واتساب"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
