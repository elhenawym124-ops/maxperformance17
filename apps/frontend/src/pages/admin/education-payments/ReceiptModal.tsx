import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Printer, X, RefreshCw } from "lucide-react";
import { fetchReceipt } from "./api";
import { formatDateTime, money } from "./shared";
import { PAYMENT_METHOD_LABELS } from "./types";
import type { ReceiptPayload } from "./types";

interface Props {
  paymentId: string;
  onClose: () => void;
}

const ReceiptModal: React.FC<Props> = ({ paymentId, onClose }) => {
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";
  const [data, setData] = useState<ReceiptPayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    fetchReceipt(paymentId)
      .then((payload) => alive && setData(payload))
      .catch((e) => alive && setError(e.message || "فشل تحميل الإيصال"));
    return () => {
      alive = false;
    };
  }, [paymentId]);

  const print = () => window.print();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-3 sm:p-4"
      dir={isEn ? "ltr" : "rtl"}
      onClick={onClose}
    >
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .edu-receipt-print, .edu-receipt-print * { visibility: visible !important; }
          .edu-receipt-print { position: fixed; inset: 0; margin: 0 auto; width: 100%; max-width: 420px; padding: 24px; background: white; color: black; }
          .edu-receipt-no-print { display: none !important; }
        }
      `}</style>
      <div
        className="w-full max-w-md rounded-xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={isEn ? "Payment receipt" : "إيصال دفع"}
      >
        <div className="flex items-center justify-between gap-2 p-4 border-b border-border/70 edu-receipt-no-print">
          <h2 className="text-sm font-bold text-foreground">{isEn ? "Payment receipt" : "إيصال دفع"}</h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={print}
              disabled={!data}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isEn ? "Print" : "طباعة"}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              aria-label={isEn ? "Close" : "إغلاق"}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error ? (
          <p className="p-6 text-xs text-destructive text-center">{error}</p>
        ) : !data ? (
          <div className="p-10 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-muted-foreground animate-spin" />
          </div>
        ) : (
          <div className="edu-receipt-print p-5 space-y-4 text-black">
            <div className="text-center space-y-1 border-b border-black/20 pb-3">
              <p className="text-base font-bold">{data.company?.name || (isEn ? "Education Center" : "المركز التعليمي")}</p>
              {data.company?.phone ? <p className="text-[11px]">{data.company.phone}</p> : null}
              {data.company?.address ? <p className="text-[11px]">{data.company.address}</p> : null}
              <p className="text-xs font-semibold pt-1">{isEn ? "Payment receipt" : "إيصال تحصيل رسوم"}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="block text-black/60">{isEn ? "Receipt no." : "رقم الإيصال"}</span>
                <span className="font-mono font-semibold">{data.payment.receiptNumber || data.payment.paymentNumber}</span>
              </div>
              <div>
                <span className="block text-black/60">{isEn ? "Date" : "التاريخ"}</span>
                <span className="font-mono"><span dir="ltr">{formatDateTime(data.payment.paidAt)}</span></span>
              </div>
              <div>
                <span className="block text-black/60">{isEn ? "Student" : "الطالب"}</span>
                <span className="font-semibold">
                  {data.payment.studentName || `${data.student?.firstName || ""} ${data.student?.lastName || ""}`.trim() || "—"}
                </span>
              </div>
              <div>
                <span className="block text-black/60">{isEn ? "Student code" : "كود الطالب"}</span>
                <span className="font-mono">{data.student?.code || "—"}</span>
              </div>
              {data.package ? (
                <div className="col-span-2">
                  <span className="block text-black/60">{isEn ? "Package" : "الباقة"}</span>
                  <span className="font-semibold">{data.package.name}</span>
                  {data.package.hoursCount ? <span className="text-black/60"> — {data.package.hoursCount} {isEn ? "hours" : "ساعة"}</span> : null}
                </div>
              ) : null}
              <div>
                <span className="block text-black/60">{isEn ? "Method" : "طريقة الدفع"}</span>
                <span>{isEn ? PAYMENT_METHOD_LABELS[data.payment.method]?.en || data.payment.method : PAYMENT_METHOD_LABELS[data.payment.method]?.ar || data.payment.method}</span>
              </div>
              <div>
                <span className="block text-black/60">{isEn ? "Cashier" : "الكاشير"}</span>
                <span>{data.payment.cashierName || "—"}</span>
              </div>
            </div>

            <div className="flex items-center justify-between border-y border-black/20 py-2">
              <span className="text-xs font-semibold">{isEn ? "Amount paid" : "المبلغ المحصل"}</span>
              <span className="text-base font-bold font-mono">
                {money(data.payment.amount)} {isEn ? "EGP" : "ج.م"}
              </span>
            </div>

            {data.payment.status === "REVERSED" ? (
              <p className="text-[11px] text-center font-bold">
                {isEn ? "REVERSED" : "ملغاة"}
                {data.payment.reversalReason ? ` — ${data.payment.reversalReason}` : ""}
              </p>
            ) : null}

            {data.payment.notes ? <p className="text-[11px] text-black/70">{data.payment.notes}</p> : null}

            <div className="pt-6 flex items-end justify-between text-[10px]">
              <span>{isEn ? "Cashier signature" : "توقيع الكاشير"}</span>
              <span>{isEn ? "Center stamp" : "ختم المركز"}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiptModal;
