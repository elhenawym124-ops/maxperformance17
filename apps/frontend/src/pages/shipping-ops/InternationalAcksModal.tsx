import React, { useState, useEffect, useCallback } from 'react';
import { X, Globe2, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import {
  shippingOpsService,
  InternationalAcknowledgmentItem,
} from '../../services/shippingOpsService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAckUpdated?: () => void;
}

export const InternationalAcksModal: React.FC<Props> = ({ isOpen, onClose, onAckUpdated }) => {
  const [items, setItems] = useState<InternationalAcknowledgmentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const loadPending = useCallback(async () => {
    try {
      setLoading(true);
      const res = await shippingOpsService.getPendingInternational();
      setItems(res.items || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'تعذر تحميل الإقرارات الجمركية المعلقة';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadPending();
    }
  }, [isOpen, loadPending]);

  if (!isOpen) return null;

  const handleReview = async (ackId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      setActionLoadingId(ackId);
      const note = notes[ackId] || undefined;
      await shippingOpsService.reviewInternationalAck(ackId, { status, notes: note });
      toast.success(status === 'APPROVED' ? 'تمت الموافقة على الإقرار الجمركي بنجاح' : 'تم رفض الإقرار الجمركي');
      setItems((prev) => prev.filter((i) => i.id !== ackId));
      if (onAckUpdated) onAckUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'تعذر تحديث حالة الإقرار';
      toast.error(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-muted backdrop-blur-xs">
      <div className="relative w-full max-w-3xl bg-white dark:bg-muted border border-border dark:border-border rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-border dark:border-border flex items-center justify-between bg-muted dark:bg-muted">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/60 text-primary dark:text-primary">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground dark:text-muted-foreground">
                إقرارات الشحنات الدولية المعلقة
              </h2>
              <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                مراجعة الإقرارات الجمركية قبل إسناد الشحنات لرحلات التوصيل
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadPending}
              disabled={loading}
              className="p-1.5 text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground rounded-lg hover:bg-muted dark:hover:bg-muted"
              title="تحديث"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground rounded-lg hover:bg-muted dark:hover:bg-muted"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {loading && items.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-muted-foreground" />
              <span>جاري تحميل الإقرارات الجمركية...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-success opacity-80" />
              <p className="text-xs font-semibold text-foreground dark:text-muted-foreground">
                لا توجد إقرارات جمركية معلقة بانتظار المراجعة
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                جميع الشحنات الدولية معتمدة ومؤهلة للخروج إلى رحلات التوصيل
              </p>
            </div>
          ) : (
            items.map((ack) => {
              const isActing = actionLoadingId === ack.id;
              return (
                <div
                  key={ack.id}
                  className="p-3.5 rounded-xl border border-border dark:border-border bg-muted dark:bg-muted space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border dark:border-border pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary dark:text-primary">
                        {ack.shipment?.trackingNumber || ack.shipmentId}
                      </span>
                      <span className="text-[11px] font-semibold text-foreground dark:text-muted-foreground">
                        ({ack.customerName})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-primary text-primary dark:bg-primary/60 dark:text-primary">
                        {ack.shipment?.destinationCountry || 'دولي'}
                      </span>
                      <span className="tabular-nums font-bold text-success dark:text-success">
                        قيمة جمركية: {ack.customsValue} USD
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-foreground dark:text-muted-foreground space-y-1">
                    <div className="flex items-start gap-1.5">
                      <span className="text-slate-400 whitespace-nowrap">وصف المحتويات:</span>
                      <span className="font-medium text-foreground dark:text-muted-foreground">{ack.contentDescription}</span>
                    </div>
                  </div>

                  {/* Actions row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="ملاحظات المراجعة (اختياري)..."
                      value={notes[ack.id] || ''}
                      onChange={(e) => setNotes({ ...notes, [ack.id]: e.target.value })}
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-border dark:border-border bg-white dark:bg-muted flex-1"
                    />
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleReview(ack.id, 'APPROVED')}
                        disabled={isActing}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-success text-white hover:bg-success transition active:scale-95 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>موافقة واعتِماد</span>
                      </button>
                      <button
                        onClick={() => handleReview(ack.id, 'REJECTED')}
                        disabled={isActing}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-destructive text-white hover:bg-destructive transition active:scale-95 disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>رفض الإقرار</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-muted dark:bg-muted border-t border-border dark:border-border flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-warning" />
            <span>الشحنات المرفوضة أو المعلقة لا يمكن إسنادها لرحلة تسليم.</span>
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-border dark:border-border text-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-muted transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
