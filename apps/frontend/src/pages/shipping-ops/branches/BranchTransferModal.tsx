import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeftRight,
  Building2,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Truck,
} from 'lucide-react';
import { toast } from 'sonner';
import { ShippingBranch } from '../shippingOpsShared';

interface BranchTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceBranch: ShippingBranch;
  branches: ShippingBranch[];
  selectedShipmentIds: string[];
  onSuccess: () => void;
}

export const BranchTransferModal: React.FC<BranchTransferModalProps> = ({
  isOpen,
  onClose,
  sourceBranch,
  branches,
  selectedShipmentIds,
  onSuccess,
}) => {
  const { i18n } = useTranslation();
  const isEn = i18n.language === 'en';

  const [toBranchId, setToBranchId] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resultManifest, setResultManifest] = useState<any | null>(null);

  if (!isOpen) return null;

  const availableBranches = branches.filter((b) => b.id !== sourceBranch.id && b.isActive);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toBranchId) {
      toast.error(isEn ? 'Please select target branch' : 'يرجى اختيار الفرع المحول إليه');
      return;
    }
    if (selectedShipmentIds.length === 0) {
      toast.error(isEn ? 'No shipments selected' : 'لم يتم تحديد أي شحنات');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/shipping-portal/branches/${sourceBranch.id}/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shipmentIds: selectedShipmentIds,
          toBranchId,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResultManifest(data);
        toast.success(
          isEn
            ? `Transferred ${data.manifest?.transferredCount || 0} shipments successfully`
            : `تم تحويل ${data.manifest?.transferredCount || 0} شحنة بنجاح`
        );
        onSuccess();
      } else {
        toast.error(data.error || 'فشل تحويل الشحنات');
      }
    } catch {
      toast.error('حدث خطأ أثناء الاتصال بالسيرفر');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setResultManifest(null);
    setToBranchId('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-muted backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border dark:border-border">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-600">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground dark:text-muted-foreground">
                {isEn ? 'Inter-Branch Custody Transfer' : 'تحويل عهدة بين الفروع'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isEn
                  ? `Transfer ${selectedShipmentIds.length} parcel(s) from ${sourceBranch.name}`
                  : `تحويل ${selectedShipmentIds.length} شحنة من ${sourceBranch.name}`}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground rounded-lg hover:bg-muted dark:hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Manifest Result View */}
        {resultManifest ? (
          <div className="p-6 space-y-4">
            <div className="p-4 bg-success/10 dark:bg-success/30 border border-success dark:border-success rounded-xl text-success dark:text-success space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <span>{isEn ? 'Transfer Manifest Created' : 'تم إصدار مانيفست التحويل بنجاح'}</span>
              </div>
              <div className="text-xs space-y-1 font-mono">
                <div>رقم المانيفست: <span className="font-bold">{resultManifest.manifest?.manifestNumber}</span></div>
                <div>الفرع المصدر: {resultManifest.manifest?.sourceBranch?.name}</div>
                <div>الفرع المحول إليه: {resultManifest.manifest?.targetBranch?.name}</div>
                <div>العدد المحول: {resultManifest.manifest?.transferredCount} شحنة</div>
              </div>
            </div>

            {/* If any failed */}
            {resultManifest.failed && resultManifest.failed.length > 0 && (
              <div className="p-3 bg-warning/10 dark:bg-warning/30 border border-warning dark:border-warning rounded-xl text-xs text-warning dark:text-warning space-y-2">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertCircle className="w-4 h-4 text-warning" />
                  <span>شحنات تعذر تحويلها ({resultManifest.failed.length}):</span>
                </div>
                <div className="max-h-28 overflow-y-auto space-y-1">
                  {resultManifest.failed.map((f: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between border-b border-warning/50 pb-1">
                      <span className="font-mono">{f.trackingNumber || f.id}</span>
                      <span className="text-amber-700 dark:text-warning">{f.message || f.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2 bg-muted text-white hover:bg-muted dark:bg-muted dark:text-foreground rounded-xl text-xs font-semibold"
              >
                {isEn ? 'Close' : 'إغلاق ومتابعة العهدة'}
              </button>
            </div>
          </div>
        ) : (
          /* Transfer Form */
          <form onSubmit={handleTransfer} className="p-6 space-y-4">
            {/* Source Branch context */}
            <div className="p-3 bg-muted dark:bg-muted border border-border dark:border-border rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">الفرع المصدر:</span>
              <span className="font-bold text-foreground dark:text-muted-foreground">{sourceBranch.name} ({sourceBranch.code})</span>
            </div>

            {/* Target Branch Picker */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-foreground dark:text-muted-foreground">
                {isEn ? 'Target Branch' : 'الفرع المحول إليه *'}
              </label>
              <select
                value={toBranchId}
                onChange={(e) => setToBranchId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-border dark:border-border rounded-xl bg-muted dark:bg-muted outline-none text-xs"
              >
                <option value="">{isEn ? '-- Select target branch --' : '-- اختر الفرع الهدف --'}</option>
                {availableBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.governorate} - {b.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Count */}
            <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between text-xs text-blue-900 dark:text-blue-300">
              <span>عدد الشحنات المحددة للتحويل:</span>
              <span className="font-bold font-mono text-sm">{selectedShipmentIds.length}</span>
            </div>

            {/* Transfer Notes */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-foreground dark:text-muted-foreground">
                {isEn ? 'Transfer Notes / Courier Ref' : 'ملاحظات التحويل أو إشارة المندوب الناقل'}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="مثال: تم التسليم لمندوب التحويلات، شحنات خاصة بمنطقة الدقي..."
                className="w-full px-3 py-2 border border-border dark:border-border rounded-xl bg-muted dark:bg-muted outline-none text-xs"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border dark:border-border">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-border dark:border-border rounded-xl hover:bg-muted dark:hover:bg-muted text-xs font-medium"
              >
                {isEn ? 'Cancel' : 'إلغاء'}
              </button>
              <button
                type="submit"
                disabled={submitting || !toBranchId}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                {submitting ? (
                  <span>جاري التحويل...</span>
                ) : (
                  <>
                    <ArrowLeftRight className="w-4 h-4" />
                    <span>تأكيد التحويل وإصدار المانيفست</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
