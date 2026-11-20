import React, { useState, useEffect } from 'react';
import { X, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface ClientLine {
  id: string;
  shipmentId: string;
  barcode?: string;
  trackingNumber?: string;
  recipientName?: string;
  destinationGovernorate?: string;
  destinationCity?: string;
  status?: string;
  codAmount: number;
  collectedAmount: number;
  shippingFee: number;
  codFee: number;
  returnFee: number;
  net: number;
}

interface ClientSettlementDetail {
  id: string;
  settlementNumber: string;
  status: string;
  periodStart: string;
  periodEnd: string;
  totalShipments: number;
  deliveredCount: number;
  returnedCount: number;
  grossCOD: number;
  shippingFeesTotal: number;
  codFeesTotal: number;
  returnFeesTotal: number;
  netPayout: number;
  paymentMethod?: string;
  paymentReference?: string;
  paidAt?: string;
  lines?: ClientLine[];
}

interface ClientSettlementDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  settlementId: string | null;
  authHeaders: Record<string, string>;
}

const formatEgp = (n: number | string | undefined | null) =>
  `${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م`;

export const ClientSettlementDetailModal: React.FC<ClientSettlementDetailModalProps> = ({
  isOpen,
  onClose,
  settlementId,
  authHeaders,
}) => {
  const [data, setData] = useState<ClientSettlementDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !settlementId) return;
    setLoading(true);
    fetch(`/api/v1/shipping-client/settlements/${settlementId}`, {
      headers: authHeaders,
    })
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          setData(resData.data);
        } else {
          toast.error(resData.message || 'فشل في تحميل تفاصيل الكشف');
        }
      })
      .catch(() => toast.error('خطأ في الاتصال بالخادم'))
      .finally(() => setLoading(false));
  }, [isOpen, settlementId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-[1200px] max-h-[90vh] flex flex-col border border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-bold text-foreground text-base">
                {data?.settlementNumber || 'تفاصيل كشف التسوية'}
              </h3>
              <p className="text-xs text-muted-foreground">
                من {data ? new Date(data.periodStart).toLocaleDateString('ar-EG') : ''} إلى{' '}
                {data ? new Date(data.periodEnd).toLocaleDateString('ar-EG') : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/api/v1/shipping-client/settlements/${settlementId}/export`}
              download
              className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-muted flex items-center gap-1.5 text-foreground transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              تحميل CSV
            </a>
            <button onClick={onClose} className="text-gray-400 hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">جارٍ تحميل البيانات...</div>
          ) : data ? (
            <>
              {/* Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                <div className="bg-gray-50 p-2.5 rounded-lg border border-border">
                  <span className="text-[11px] text-muted-foreground block">إجمالي المحصّل</span>
                  <span className="font-bold text-foreground tabular-nums text-sm">
                    {formatEgp(data.grossCOD)}
                  </span>
                </div>
                <div className="bg-gray-50 p-2.5 rounded-lg border border-border">
                  <span className="text-[11px] text-muted-foreground block">رسوم الشحن</span>
                  <span className="font-bold text-destructive tabular-nums text-sm">
                    -{formatEgp(data.shippingFeesTotal)}
                  </span>
                </div>
                <div className="bg-gray-50 p-2.5 rounded-lg border border-border">
                  <span className="text-[11px] text-muted-foreground block">رسوم COD</span>
                  <span className="font-bold text-destructive tabular-nums text-sm">
                    -{formatEgp(data.codFeesTotal)}
                  </span>
                </div>
                <div className="bg-gray-50 p-2.5 rounded-lg border border-border">
                  <span className="text-[11px] text-muted-foreground block">رسوم المرتجع</span>
                  <span className="font-bold text-destructive tabular-nums text-sm">
                    -{formatEgp(data.returnFeesTotal)}
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1 bg-success/10 p-2.5 rounded-lg border border-success">
                  <span className="text-[11px] text-success font-medium block">صافي التوريد المستحق</span>
                  <span className="font-bold text-success tabular-nums text-base">
                    {formatEgp(data.netPayout)}
                  </span>
                </div>
              </div>

              {/* Payment Receipt Info */}
              {data.status === 'PAID' && (
                <div className="bg-teal-50 border border-success rounded-lg p-3 text-xs flex flex-wrap gap-4 text-success">
                  <div>
                    <span className="font-medium text-success">طريقة التوريد: </span>
                    {data.paymentMethod || 'نقدي'}
                  </div>
                  <div>
                    <span className="font-medium text-success">مرجع التوريد: </span>
                    <span className="font-mono">{data.paymentReference || '—'}</span>
                  </div>
                  {data.paidAt && (
                    <div>
                      <span className="font-medium text-success">تاريخ الصرف: </span>
                      {new Date(data.paidAt).toLocaleDateString('ar-EG')}
                    </div>
                  )}
                </div>
              )}

              {/* Lines Table */}
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-3 py-2 text-xs font-medium text-foreground">
                  شحنات الكشف ({data.lines?.length || 0})
                </div>
                <div className="max-h-64 overflow-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-gray-50 sticky top-0 text-muted-foreground border-b border-border">
                      <tr>
                        <th className="p-2">الباركود</th>
                        <th className="p-2">المستلم / المحافظة</th>
                        <th className="p-2">الحالة</th>
                        <th className="p-2 text-left">المحصل</th>
                        <th className="p-2 text-left">رسوم الشحن</th>
                        <th className="p-2 text-left">رسوم COD</th>
                        <th className="p-2 text-left">رسوم المرتجع</th>
                        <th className="p-2 text-left font-bold">الصافي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(data.lines || []).map((l) => (
                        <tr key={l.id} className="hover:bg-gray-50">
                          <td className="p-2 font-mono text-[11px]">{l.barcode || l.shipmentId}</td>
                          <td className="p-2">
                            <div>{l.recipientName || '—'}</div>
                            <div className="text-[10px] text-muted-foreground">{l.destinationGovernorate || '—'}</div>
                          </td>
                          <td className="p-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                l.status === 'DELIVERED'
                                  ? 'bg-emerald-50 text-success'
                                  : 'bg-rose-50 text-destructive'
                              }`}
                            >
                              {l.status === 'DELIVERED' ? 'مسلمة' : 'مرتجع'}
                            </span>
                          </td>
                          <td className="p-2 text-left tabular-nums">{formatEgp(l.collectedAmount)}</td>
                          <td className="p-2 text-left tabular-nums text-destructive">
                            {l.shippingFee > 0 ? `-${formatEgp(l.shippingFee)}` : '0.00'}
                          </td>
                          <td className="p-2 text-left tabular-nums text-destructive">
                            {l.codFee > 0 ? `-${formatEgp(l.codFee)}` : '0.00'}
                          </td>
                          <td className="p-2 text-left tabular-nums text-destructive">
                            {l.returnFee > 0 ? `-${formatEgp(l.returnFee)}` : '0.00'}
                          </td>
                          <td className="p-2 text-left tabular-nums font-bold text-foreground">
                            {formatEgp(l.net)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-muted border-t border-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-border rounded-lg text-xs text-foreground hover:bg-muted"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
