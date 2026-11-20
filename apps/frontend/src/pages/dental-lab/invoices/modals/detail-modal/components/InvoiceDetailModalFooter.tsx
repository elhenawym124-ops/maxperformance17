import { Banknote, FileText, Link2, MessageCircle } from "lucide-react";
import type { DentalInvoice } from "../../../../shared";
import { shareInvoiceWhatsApp } from "../../../types/dentalInvoicesTypes";

interface InvoiceDetailModalFooterProps {
  invoice: DentalInvoice;
  onPdf: () => void;
  onPaymentLink: () => void;
  onAddPayment: () => void;
  onClose: () => void;
}

export function InvoiceDetailModalFooter({
  invoice,
  onPdf,
  onPaymentLink,
  onAddPayment,
  onClose,
}: InvoiceDetailModalFooterProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t dark:border-border mt-4">
      <div className="flex items-center gap-2">
        <button
          onClick={onPdf}
          className="px-3 py-1.5 border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:bg-blue-900/30 rounded-lg text-xs font-semibold flex items-center gap-1.5"
        >
          <FileText className="w-3.5 h-3.5" /> فاتورة PDF
        </button>
        <button
          onClick={onPaymentLink}
          className="px-3 py-1.5 border border-primary text-primary bg-primary/10 hover:bg-primary dark:border-primary dark:text-primary dark:bg-primary/30 rounded-lg text-xs font-semibold flex items-center gap-1.5"
        >
          <Link2 className="w-3.5 h-3.5" /> رابط دفع
        </button>
        <button
          onClick={() => shareInvoiceWhatsApp(invoice)}
          className="px-3 py-1.5 border border-success text-success bg-success/10 hover:bg-success dark:border-success dark:text-success dark:bg-success/30 rounded-lg text-xs font-semibold flex items-center gap-1.5"
        >
          <MessageCircle className="w-3.5 h-3.5" /> إرسال واتساب
        </button>
      </div>

      <div className="flex items-center gap-2">
        {invoice.remaining > 0 && (
          <button
            onClick={onAddPayment}
            className="px-4 py-1.5 bg-success text-white rounded-lg text-xs font-semibold hover:bg-success flex items-center gap-1.5"
          >
            <Banknote className="w-3.5 h-3.5" /> تسجيل سداد
          </button>
        )}
        <button
          onClick={onClose}
          className="px-4 py-1.5 border dark:border-border rounded-lg text-xs font-semibold text-foreground hover:bg-muted dark:hover:bg-muted"
        >
          إغلاق
        </button>
      </div>
    </div>
  );
}
