import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TrashIcon,
  ArrowUpTrayIcon,
  ExclamationTriangleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import courierService, { Courier, CourierDocument } from '../../../../services/courierService';

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  NATIONAL_ID_FRONT: 'بطاقة الرقم القومي (الوجه الأمامي)',
  NATIONAL_ID_BACK: 'بطاقة الرقم القومي (الوجه الخلفي)',
  CUSTODY_RECEIPT: 'وصل أمانة (عهدة مالية وبضائع)',
  CRIMINAL_RECORD: 'صحيفة الحالة الجنائية (فيش وتشبيه)',
  DRIVING_LICENSE: 'رخصة القيادة / تسيير المركبة',
  CONTRACT: 'عقد العمل / اتفاقية التوصيل',
  MEDICAL: 'شهادة كشف طبي / تحليل مخدرات',
  OTHER: 'مستند آخر'
};

interface CourierDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  courier: Courier | null;
  onStatusUpdated?: (newStatus: string) => void;
}

export const CourierDocumentsModal: React.FC<CourierDocumentsModalProps> = ({
  isOpen,
  onClose,
  courier,
  onStatusUpdated,
}) => {
  const [documents, setDocuments] = useState<CourierDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState('NATIONAL_ID_FRONT');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const fetchDocs = async () => {
    if (!courier) return;
    setLoading(true);
    try {
      const res = await courierService.listDocuments(courier.id);
      if (res.success && res.data) {
        setDocuments(res.data.documents || []);
      }
    } catch (err: any) {
      toast.error(err?.message || 'تعذر تحميل المستندات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && courier) {
      fetchDocs();
    }
  }, [isOpen, courier]);

  if (!isOpen || !courier) return null;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('يرجى اختيار ملف المستند');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', docType);
      if (expiryDate) formData.append('expiryDate', expiryDate);
      if (notes.trim()) formData.append('notes', notes.trim());

      const res = await courierService.uploadDocument(courier.id, formData);
      if (res.success) {
        toast.success('تم رفع المستند بنجاح');
        setFile(null);
        setNotes('');
        setExpiryDate('');
        if (res.data?.documentsStatus && onStatusUpdated) {
          onStatusUpdated(res.data.documentsStatus);
        }
        fetchDocs();
      }
    } catch (err: any) {
      toast.error(err?.message || 'تعذر رفع المستند');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateStatus = async (docId: string, status: 'VERIFIED' | 'REJECTED') => {
    let reason = '';
    if (status === 'REJECTED') {
      const promptRes = window.prompt('سبب رفض المستند (اختياري):');
      if (promptRes === null) return;
      reason = promptRes.trim();
    }

    try {
      const res = await courierService.updateDocumentStatus(courier.id, docId, {
        status,
        notes: reason || undefined
      });
      if (res.success) {
        toast.success(status === 'VERIFIED' ? 'تم اعتماد المستند' : 'تم رفض المستند');
        if (res.data?.documentsStatus && onStatusUpdated) {
          onStatusUpdated(res.data.documentsStatus);
        }
        fetchDocs();
      }
    } catch (err: any) {
      toast.error(err?.message || 'تعذر تحديث حالة المستند');
    }
  };

  const handleDelete = async (docId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المستند؟')) return;
    try {
      const res = await courierService.deleteDocument(courier.id, docId);
      if (res.success) {
        toast.success('تم حذف المستند');
        if (res.data?.documentsStatus && onStatusUpdated) {
          onStatusUpdated(res.data.documentsStatus);
        }
        fetchDocs();
      }
    } catch (err: any) {
      toast.error(err?.message || 'تعذر حذف المستند');
    }
  };

  const isExpired = (dateStr?: string | null) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  const isExpiringSoon = (dateStr?: string | null) => {
    if (!dateStr) return false;
    const diffDays = (new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
    return diffDays > 0 && diffDays <= 30;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-muted backdrop-blur-xs">
      <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-foreground dark:text-muted-foreground">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border dark:border-border bg-muted dark:bg-muted">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base sm:text-lg">ملف ومستندات المندوب: {courier.name}</h3>
              {courier.documentsStatus === 'VERIFIED' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success/10 text-success dark:bg-success/40 dark:text-success border border-success dark:border-success">
                  <CheckCircleIcon className="w-3.5 h-3.5" />
                  ملف معتمد وموثق
                </span>
              ) : courier.documentsStatus === 'PENDING_REVIEW' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-warning/10 text-warning dark:bg-warning/40 dark:text-warning border border-warning dark:border-warning">
                  <ClockIcon className="w-3.5 h-3.5" />
                  قيد مراجعة المستندات
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-destructive/10 text-destructive dark:bg-destructive/40 dark:text-destructive border border-destructive dark:border-destructive">
                  <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                  ملف ناقص (يلزم بطاقة + وصل أمانة)
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-0.5">
              إلزامي للعمل الميداني: اعتماد بطاقة الرقم القومي ووصل الأمانة لضمان سلامة العهد والطرود
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground text-lg">✕</button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm">
          {/* Upload Form */}
          <form onSubmit={handleUpload} className="bg-slate-50 dark:bg-muted p-4 rounded-xl border border-border dark:border-border space-y-3">
            <div className="font-semibold text-foreground dark:text-muted-foreground flex items-center gap-1.5">
              <ArrowUpTrayIcon className="w-4 h-4 text-primary" />
              رفع مستند أو إقرار رسمي جديد
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-foreground dark:text-muted-foreground mb-1">نوع المستند *</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-muted border border-border dark:border-border rounded-lg text-xs"
                >
                  {Object.entries(DOCUMENT_TYPE_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-foreground dark:text-muted-foreground mb-1">تاريخ انتهاء الصلاحية</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-muted border border-border dark:border-border rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-foreground dark:text-muted-foreground mb-1">الملف (صورة / PDF حتى 10MB) *</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  required
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full px-2 py-1.5 bg-white dark:bg-muted border border-border dark:border-border rounded-lg text-xs"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                placeholder="ملاحظات توضيحية على المستند..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-muted border border-border dark:border-border rounded-lg text-xs"
              />
              <button
                type="submit"
                disabled={uploading || !file}
                className="w-full sm:w-auto px-5 py-2 text-white bg-muted dark:bg-muted dark:text-foreground font-semibold rounded-lg hover:bg-muted transition active:scale-95 disabled:opacity-50 whitespace-nowrap text-xs"
              >
                {uploading ? 'جاري الرفع...' : 'رفع المستند'}
              </button>
            </div>
          </form>

          {/* Documents List */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground dark:text-muted-foreground">سجل المستندات المرفوعة ({documents.length})</h4>
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">جاري تحميل المستندات...</div>
            ) : documents.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-border dark:border-border rounded-xl text-muted-foreground">
                لم يتم رفع أي مستندات لهذا المندوب حتى الآن
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => {
                  const expired = isExpired(doc.expiryDate);
                  const expiringSoon = isExpiringSoon(doc.expiryDate);

                  return (
                    <div
                      key={doc.id}
                      className="p-3.5 bg-white dark:bg-muted border border-border dark:border-border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-muted dark:bg-muted text-foreground dark:text-muted-foreground">
                          <DocumentTextIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-foreground dark:text-muted-foreground flex items-center gap-2 flex-wrap">
                            <span>{DOCUMENT_TYPE_LABELS[doc.type] || doc.type}</span>
                            {doc.status === 'VERIFIED' ? (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-success/10 text-success dark:bg-success/40 dark:text-success border border-success">
                                معتمد
                              </span>
                            ) : doc.status === 'REJECTED' ? (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-destructive/10 text-destructive dark:bg-destructive/40 dark:text-destructive border border-destructive">
                                مرفوض
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-warning/10 text-warning dark:bg-warning/40 dark:text-warning border border-warning">
                                قيد المراجعة
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground dark:text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
                            <span>الملف: {doc.fileName}</span>
                            <span>الحجم: {(doc.sizeBytes / 1024).toFixed(0)} KB</span>
                            {doc.expiryDate && (
                              <span
                                className={`font-medium ${
                                  expired
                                    ? 'text-rose-600 font-bold'
                                    : expiringSoon
                                    ? 'text-amber-600 font-bold'
                                    : 'text-slate-500'
                                }`}
                              >
                                ينتهي: {new Date(doc.expiryDate).toLocaleDateString('ar-EG')}
                                {expired && ' (منتهي الصلاحية!)'}
                                {expiringSoon && ' (ينتهي قريباً!)'}
                              </span>
                            )}
                          </div>
                          {doc.notes && <div className="text-xs text-foreground dark:text-muted-foreground mt-1 bg-muted dark:bg-muted p-1.5 rounded">ملاحظة: {doc.notes}</div>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border border-border dark:border-border rounded-lg hover:bg-muted dark:hover:bg-muted transition"
                        >
                          <EyeIcon className="w-3.5 h-3.5" />
                          عرض الملف
                        </a>
                        {doc.status !== 'VERIFIED' && (
                          <button
                            onClick={() => handleUpdateStatus(doc.id, 'VERIFIED')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-success bg-success/10 dark:bg-success/40 dark:text-success border border-success rounded-lg hover:bg-success transition"
                          >
                            <CheckCircleIcon className="w-3.5 h-3.5" />
                            اعتماد
                          </button>
                        )}
                        {doc.status !== 'REJECTED' && (
                          <button
                            onClick={() => handleUpdateStatus(doc.id, 'REJECTED')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-destructive bg-destructive/10 dark:bg-destructive/40 dark:text-destructive border border-destructive rounded-lg hover:bg-destructive transition"
                          >
                            <XCircleIcon className="w-3.5 h-3.5" />
                            رفض
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-1.5 text-destructive hover:text-destructive rounded-lg hover:bg-destructive/10 dark:hover:bg-destructive/40 transition"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
