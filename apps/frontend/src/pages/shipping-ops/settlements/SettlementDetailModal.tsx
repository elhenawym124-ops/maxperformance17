import React, { useState, useEffect } from 'react';
import { X, Download, CheckCircle, DollarSign, XCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';
import {
  SettlementItem,
  SETTLEMENT_STATUS_MAP,
  formatEgp,
} from './SettlementTypes';

interface SettlementDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  settlementId: string | null;
  authHeaders: Record<string, string>;
  onRefresh: () => void;
  onOpenPayModal: (settlement: SettlementItem) => void;
}

export const SettlementDetailModal: React.FC<SettlementDetailModalProps> = ({
  isOpen,
  onClose,
  settlementId,
  authHeaders,
  onRefresh,
  onOpenPayModal,
}) => {
  const [settlement, setSettlement] = useState<SettlementItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !settlementId) return;
    setLoading(true);
    fetch(`/api/v1/shipping-portal/settlements/${settlementId}`, {
      headers: authHeaders,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSettlement(data.data);
        } else {
          toast.error(data.message || 'فشل في تحميل تفاصيل الكشف');
        }
      })
      .catch(() => toast.error('خطأ في الاتصال بالخادم'))
      .finally(() => setLoading(false));
  }, [isOpen, settlementId]);

  if (!isOpen) return null;

  const handleApprove = async () => {
    if (!settlement) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/shipping-portal/settlements/${settlement.id}/approve`, {
        method: 'POST',
        headers: authHeaders,
      });
      const data = await res.json();
      if (data.success) {
        toast.success('تم اعتماد كشف التسوية بنجاح');
        setSettlement(data.data);
        onRefresh();
      } else {
        toast.error(data.message || 'فشل في اعتماد الكشف');
      }
    } catch {
      toast.error('خطأ في الاتصال بالخادم');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!settlement) return;
    const reason = window.prompt('سبب الرفض:');
    if (reason === null) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/shipping-portal/settlements/${settlement.id}/reject`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('تم رفض كشف التسوية');
        setSettlement(data.data);
        onRefresh();
      } else {
        toast.error(data.message || 'فشل في رفض الكشف');
      }
    } catch {
      toast.error('خطأ في الاتصال بالخادم');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (!settlement) return;
    window.open(`/api/v1/shipping-portal/settlements/${settlement.id}/export`, '_blank');
  };

  const statusConfig = settlement
    ? SETTLEMENT_STATUS_MAP[settlement.status] || SETTLEMENT_STATUS_MAP.DRAFT
    : SETTLEMENT_STATUS_MAP.DRAFT;

  const hasExtraFees = Boolean(
    settlement?.lines?.some((l) => (l.extraFees || 0) > 0 || (l.shipment?.extraFees || 0) > 0) ||
    (settlement?.extraFeesTotal != null && settlement.extraFeesTotal > 0)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-muted rounded-xl shadow-xl w-full max-w-[1200px] max-h-[90vh] flex flex-col border border-border dark:border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border dark:border-border">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-foreground dark:text-white text-base">
                  {settlement?.settlementNumber || 'تفاصيل كشف التسوية'}
                </h3>
                {settlement && (
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${statusConfig.badgeClass}`}>
                    {statusConfig.labelAr}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                العميل: {settlement?.merchant?.name || 'غير محدد'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              disabled={!settlement}
              className="px-3 py-1.5 text-xs font-medium border border-border dark:border-border rounded-lg hover:bg-muted dark:hover:bg-muted flex items-center gap-1.5 text-foreground dark:text-muted-foreground transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              تصدير CSV
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">جارٍ تحميل البيانات...</div>
          ) : settlement ? (
            <>
              {/* Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-6 gap-2 text-center">
                <div className="bg-slate-50 dark:bg-muted p-2.5 rounded-lg border border-border dark:border-border">
                  <span className="text-[11px] text-muted-foreground block">إجمالي المحصّل</span>
                  <span className="font-bold text-foreground dark:text-white text-sm tabular-nums">
                    {formatEgp(settlement.grossCOD)}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-muted p-2.5 rounded-lg border border-border dark:border-border">
                  <span className="text-[11px] text-muted-foreground block">رسوم الشحن</span>
                  <span className="font-bold text-destructive text-sm tabular-nums">
                    -{formatEgp(settlement.shippingFeesTotal)}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-muted p-2.5 rounded-lg border border-border dark:border-border">
                  <span className="text-[11px] text-muted-foreground block">رسوم COD</span>
                  <span className="font-bold text-destructive text-sm tabular-nums">
                    -{formatEgp(settlement.codFeesTotal)}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-muted p-2.5 rounded-lg border border-border dark:border-border">
                  <span className="text-[11px] text-muted-foreground block">رسوم المرتجع</span>
                  <span className="font-bold text-destructive text-sm tabular-nums">
                    -{formatEgp(settlement.returnFeesTotal)}
                  </span>
                </div>
                {(settlement.extraFeesTotal != null && settlement.extraFeesTotal > 0) && (
                  <div className="bg-slate-50 dark:bg-muted p-2.5 rounded-lg border border-border dark:border-border">
                    <span className="text-[11px] text-muted-foreground block">رسوم إضافية</span>
                    <span className="font-bold text-destructive text-sm tabular-nums">
                      -{formatEgp(settlement.extraFeesTotal)}
                    </span>
                  </div>
                )}
                <div className="col-span-2 sm:col-span-1 bg-success/10 dark:bg-success/30 p-2.5 rounded-lg border border-success dark:border-success">
                  <span className="text-[11px] text-success dark:text-success font-medium block">
                    صافي التوريد
                  </span>
                  <span className="font-bold text-success dark:text-success text-base tabular-nums">
                    {formatEgp(settlement.netPayout)}
                  </span>
                </div>
              </div>

              {/* Payment Details if Paid */}
              {settlement.status === 'PAID' && (
                <div className="bg-teal-50 dark:bg-success/20 border border-success dark:border-success rounded-lg p-3 text-xs flex flex-wrap gap-4 text-success dark:text-success">
                  <div>
                    <span className="font-medium text-success dark:text-success">طريقة التوريد: </span>
                    {settlement.paymentMethod || 'نقدي'}
                  </div>
                  <div>
                    <span className="font-medium text-success dark:text-success">المرجع: </span>
                    <span className="font-mono">{settlement.paymentReference || '—'}</span>
                  </div>
                  {settlement.paidAt && (
                    <div>
                      <span className="font-medium text-success dark:text-success">تاريخ الصرف: </span>
                      {new Date(settlement.paidAt).toLocaleDateString('ar-EG')}
                    </div>
                  )}
                </div>
              )}

              {/* Lines Table */}
              <div className="border border-border dark:border-border rounded-lg overflow-hidden">
                <div className="bg-slate-100 dark:bg-muted px-3 py-2 text-xs font-medium text-foreground dark:text-muted-foreground">
                  أسطر الشحنات المدرجة ({settlement.lines?.length || 0} شحنة)
                </div>
                <div className="max-h-64 overflow-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 dark:bg-muted sticky top-0 text-muted-foreground border-b border-border dark:border-border">
                      <tr>
                        <th className="p-2">الباركود / التتبع</th>
                        <th className="p-2">المستلم / المحافظة</th>
                        <th className="p-2">الحالة</th>
                        <th className="p-2 text-left">قيمة COD</th>
                        <th className="p-2 text-left">المحصّل</th>
                        <th className="p-2 text-left">رسوم الشحن</th>
                        <th className="p-2 text-left">رسوم COD</th>
                        <th className="p-2 text-left">رسوم المرتجع</th>
                        {hasExtraFees && <th className="p-2 text-left">رسوم إضافية</th>}
                        <th className="p-2 text-left font-bold">الصافي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border dark:divide-border">
                      {(settlement.lines || []).map((l) => {
                        const lineExtra = l.extraFees ?? l.shipment?.extraFees ?? 0;
                        return (
                          <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-muted">
                            <td className="p-2 font-mono text-[11px]">
                              {l.shipment?.barcode || l.shipment?.trackingNumber || l.shipmentId}
                            </td>
                            <td className="p-2">
                              <div>{l.shipment?.recipientName || '—'}</div>
                              <div className="text-[10px] text-muted-foreground">
                                {l.shipment?.destinationGovernorate || '—'}
                              </div>
                            </td>
                            <td className="p-2">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                  l.shipment?.status === 'DELIVERED'
                                    ? 'bg-emerald-50 text-success'
                                    : 'bg-rose-50 text-destructive'
                                }`}
                              >
                                {l.shipment?.status === 'DELIVERED' ? 'مسلمة' : 'مرتجع'}
                              </span>
                            </td>
                            <td className="p-2 text-left tabular-nums">{formatEgp(l.codAmount)}</td>
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
                            {hasExtraFees && (
                              <td className="p-2 text-left tabular-nums text-destructive">
                                {lineExtra > 0 ? `-${formatEgp(lineExtra)}` : '0.00'}
                              </td>
                            )}
                            <td className="p-2 text-left tabular-nums font-bold text-foreground dark:text-white">
                              {formatEgp(l.net)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3 bg-muted dark:bg-muted border-t border-border dark:border-border flex justify-between items-center">
          <div className="flex gap-2">
            {(settlement?.status === 'ISSUED' || settlement?.status === 'DRAFT') && (
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="px-3.5 py-1.5 bg-success hover:bg-success text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                اعتماد الكشف
              </button>
            )}
            {settlement?.status === 'APPROVED' && (
              <button
                onClick={() => onOpenPayModal(settlement)}
                disabled={actionLoading}
                className="px-3.5 py-1.5 bg-success hover:bg-success text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <DollarSign className="w-3.5 h-3.5" />
                تسجيل التوريد والصرف
              </button>
            )}
            {settlement && settlement.status !== 'PAID' && settlement.status !== 'REJECTED' && (
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="px-3.5 py-1.5 border border-destructive text-destructive hover:bg-destructive/10 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                رفض
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-border dark:border-border rounded-lg text-xs text-foreground dark:text-muted-foreground hover:bg-muted"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
