import React, { useEffect, useState } from "react";
import { Printer, RefreshCw, X } from "lucide-react";

interface ReceiptPayload {
  payment: {
    id: string;
    paymentNumber: string;
    receiptNumber?: string | null;
    studentName?: string | null;
    amount: number;
    method: string;
    status: string;
    paidAt: string;
    cashierName?: string | null;
    notes?: string | null;
    reversalReason?: string | null;
  };
  company?: { name: string; phone?: string | null; address?: string | null } | null;
  student?: { code?: string | null; firstName: string; lastName: string } | null;
  package?: { name: string; hoursCount: number } | null;
}

const METHOD_LABELS: Record<string, string> = {
  CASH: "نقدي",
  TRANSFER: "تحويل بنكي",
  WALLET: "محفظة",
  CARD: "بطاقة",
  INSTAPAY: "إنستاپاي",
  OTHER: "أخرى",
};

const money = (value: number) => (Number(value) || 0).toLocaleString("ar-EG");

const ParentReceiptModal: React.FC<{ paymentId: string; onClose: () => void }> = ({ paymentId, onClose }) => {
  const [data, setData] = useState<ReceiptPayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    const token = localStorage.getItem("parentToken");
    fetch(`/api/v1/education/parent-portal/payments/${paymentId}/receipt`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((json) => {
        if (!alive) return;
        if (json.success) setData(json.data);
        else setError(json.error || json.message || "فشل تحميل الإيصال");
      })
      .catch(() => alive && setError("تعذر الاتصال بالخادم"));
    return () => {
      alive = false;
    };
  }, [paymentId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-3 sm:p-4"
      dir="rtl"
      onClick={onClose}
    >
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .parent-receipt-print, .parent-receipt-print * { visibility: visible !important; }
          .parent-receipt-print { position: fixed; inset: 0; margin: 0 auto; width: 100%; max-width: 420px; padding: 24px; background: white; color: black; }
          .parent-receipt-no-print { display: none !important; }
        }
      `}</style>
      <div
        className="w-full max-w-md rounded-xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="إيصال دفع"
      >
        <div className="flex items-center justify-between gap-2 p-4 border-b border-border/70 parent-receipt-no-print">
          <h2 className="text-sm font-bold text-foreground">إيصال دفع</h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => window.print()}
              disabled={!data}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              aria-label="إغلاق"
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
          <div className="parent-receipt-print p-5 space-y-4 text-black">
            <div className="text-center space-y-1 border-b border-black/20 pb-3">
              <p className="text-base font-bold">{data.company?.name || "المركز التعليمي"}</p>
              {data.company?.phone ? <p className="text-[11px]">{data.company.phone}</p> : null}
              <p className="text-xs font-semibold pt-1">إيصال تحصيل رسوم</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="block text-black/60">رقم الإيصال</span>
                <span className="font-mono font-semibold">{data.payment.receiptNumber || data.payment.paymentNumber}</span>
              </div>
              <div>
                <span className="block text-black/60">التاريخ</span>
                <span className="font-mono">
                  <span dir="ltr">{new Date(data.payment.paidAt).toLocaleString("ar-EG")}</span>
                </span>
              </div>
              <div>
                <span className="block text-black/60">الطالب</span>
                <span className="font-semibold">
                  {data.payment.studentName || `${data.student?.firstName || ""} ${data.student?.lastName || ""}`.trim() || "—"}
                </span>
              </div>
              <div>
                <span className="block text-black/60">كود الطالب</span>
                <span className="font-mono">{data.student?.code || "—"}</span>
              </div>
              {data.package ? (
                <div className="col-span-2">
                  <span className="block text-black/60">الباقة</span>
                  <span className="font-semibold">{data.package.name}</span>
                </div>
              ) : null}
              <div>
                <span className="block text-black/60">طريقة الدفع</span>
                <span>{METHOD_LABELS[data.payment.method] || data.payment.method}</span>
              </div>
              <div>
                <span className="block text-black/60">الحالة</span>
                <span>{data.payment.status === "REVERSED" ? "ملغاة" : "محصلة"}</span>
              </div>
            </div>

            <div className="flex items-center justify-between border-y border-black/20 py-2">
              <span className="text-xs font-semibold">المبلغ المحصل</span>
              <span className="text-base font-bold font-mono">{money(data.payment.amount)} ج.م</span>
            </div>

            {data.payment.status === "REVERSED" ? (
              <p className="text-[11px] text-center font-bold">
                ملغاة{data.payment.reversalReason ? ` — ${data.payment.reversalReason}` : ""}
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentReceiptModal;
