import React, { useState, useEffect, useCallback } from 'react';
import { Search, CheckCircle2, XCircle, Clock, RefreshCw, Check, Ban } from 'lucide-react';
import { toast } from 'sonner';
import {
  OrderChangeRequestItem,
  OrderChangeType,
  OrderChangeStatus,
  formatDateTime,
} from './shippingServicesTypes';
import { ApproveChangeRequestModal, RejectChangeRequestModal } from './OrderChangeActionModals';

interface OrderChangeRequestsTabProps {
  authHeaders: Record<string, string>;
  isEn?: boolean;
}

export const OrderChangeRequestsTab: React.FC<OrderChangeRequestsTabProps> = ({
  authHeaders,
  isEn,
}) => {
  const [requests, setRequests] = useState<OrderChangeRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const [approvingItem, setApprovingItem] = useState<OrderChangeRequestItem | null>(null);
  const [rejectingItem, setRejectingItem] = useState<OrderChangeRequestItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (typeFilter !== 'ALL') params.append('type', typeFilter);
      if (search) params.append('shipmentId', search);

      const res = await fetch(
        `/api/v1/shipping-portal/order-change-requests?${params.toString()}`,
        { headers: authHeaders }
      );
      const data = await res.json();
      if (data.success) {
        setRequests(data.data || []);
      } else {
        toast.error(data.message || (isEn ? 'Failed to fetch change requests' : 'فشل في جلب طلبات تعديل الأوردر'));
      }
    } catch {
      toast.error(isEn ? 'Network error' : 'خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  }, [authHeaders, statusFilter, typeFilter, search, isEn]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async () => {
    if (!approvingItem) return;
    setActionLoading(true);
    try {
      const res = await fetch(
        `/api/v1/shipping-portal/order-change-requests/${approvingItem.id}/approve`,
        {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({}),
        }
      );
      const data = await res.json();
      if (data.success) {
        toast.success(isEn ? 'Change applied to shipment' : 'تم اعتماد وتطبيق التعديل على الشحنة بنجاح');
        setApprovingItem(null);
        fetchRequests();
      } else {
        toast.error(data.message || (isEn ? 'Approval failed' : 'فشل في اعتماد التعديل'));
      }
    } catch {
      toast.error(isEn ? 'Network error' : 'خطأ في الاتصال بالخادم');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (rejectionReason: string) => {
    if (!rejectingItem) return;
    if (!rejectionReason.trim()) {
      toast.error(isEn ? 'Rejection reason is required' : 'سبب الرفض مطلوب');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(
        `/api/v1/shipping-portal/order-change-requests/${rejectingItem.id}/reject`,
        {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ rejectionReason: rejectionReason.trim() }),
        }
      );
      const data = await res.json();
      if (data.success) {
        toast.success(isEn ? 'Change request rejected' : 'تم رفض طلب تعديل الأوردر');
        setRejectingItem(null);
        fetchRequests();
      } else {
        toast.error(data.message || (isEn ? 'Rejection failed' : 'فشل في رفض الطلب'));
      }
    } catch {
      toast.error(isEn ? 'Network error' : 'خطأ في الاتصال بالخادم');
    } finally {
      setActionLoading(false);
    }
  };

  const formatValueSnippet = (val?: string | null) => {
    if (!val) return '—';
    try {
      const parsed = JSON.parse(val);
      if (typeof parsed === 'object' && parsed !== null) {
        return Object.entries(parsed).map(([k, v]) => `${k}: ${v}`).join(' · ');
      }
      return String(parsed);
    } catch {
      return String(val);
    }
  };

  const filtered = requests.filter((r) => {
    if (!search) return true;
    const term = search.toLowerCase();
    const barcode = r.shipment?.barcode || r.shipment?.trackingNumber || r.shipmentId || '';
    return barcode.toLowerCase().includes(term) || (r.requestedBy || '').toLowerCase().includes(term);
  });

  return (
    <div className="space-y-4">
      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isEn ? 'Search barcode or requester...' : 'ابحث بالباركود أو صاحب الطلب...'}
              className="w-full pe-9 ps-3 py-1.5 text-xs bg-muted dark:bg-muted border border-border dark:border-border rounded-lg text-foreground dark:text-white focus:outline-none"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs bg-muted dark:bg-muted border border-border dark:border-border rounded-lg px-2.5 py-1.5 text-foreground dark:text-muted-foreground"
          >
            <option value="ALL">{isEn ? 'All Types' : 'كافة أنواع التعديل'}</option>
            <option value="ADDRESS">{isEn ? 'Address' : 'تعديل العنوان'}</option>
            <option value="AMOUNT">{isEn ? 'COD Amount' : 'تعديل مبلغ COD'}</option>
            <option value="RECIPIENT">{isEn ? 'Recipient' : 'بيانات المستلم'}</option>
          </select>
          <div className="flex items-center gap-1 bg-muted dark:bg-muted p-0.5 rounded-lg border border-border dark:border-border text-xs">
            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  statusFilter === st
                    ? 'bg-white dark:bg-muted text-foreground dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-muted-foreground hover:text-foreground'
                }`}
              >
                {st === 'ALL' ? (isEn ? 'All' : 'الكل') : st === 'PENDING' ? (isEn ? 'Pending' : 'قيد المراجعة') : st === 'APPROVED' ? (isEn ? 'Approved' : 'المعتمدة') : (isEn ? 'Rejected' : 'المرفوضة')}
              </button>
            ))}
          </div>
          <button
            onClick={() => fetchRequests()}
            className="p-1.5 text-muted-foreground hover:text-foreground border border-border dark:border-border rounded-lg hover:bg-muted transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-border dark:border-border rounded-lg overflow-hidden bg-white dark:bg-muted">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-muted text-muted-foreground border-b border-border dark:border-border">
              <tr>
                <th className="p-2.5 font-medium">{isEn ? 'Shipment' : 'الباركود / الشحنة'}</th>
                <th className="p-2.5 font-medium">{isEn ? 'Type' : 'نوع التعديل'}</th>
                <th className="p-2.5 font-medium">{isEn ? 'Change (Old → New)' : 'التعديل المطلوب'}</th>
                <th className="p-2.5 font-medium">{isEn ? 'Requester' : 'مقدم الطلب'}</th>
                <th className="p-2.5 font-medium">{isEn ? 'Status' : 'الحالة'}</th>
                <th className="p-2.5 font-medium">{isEn ? 'Review' : 'المراجعة'}</th>
                <th className="p-2.5 font-medium text-center">{isEn ? 'Actions' : 'إجراءات'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-border">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">{isEn ? 'Loading...' : 'جارٍ التحميل...'}</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">{isEn ? 'No requests' : 'لا توجد طلبات تعديل'}</td></tr>
              ) : (
                filtered.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-muted transition-colors">
                    <td className="p-2.5">
                      <div className="font-mono font-medium text-foreground dark:text-white">
                        {req.shipment?.barcode || req.shipment?.trackingNumber || req.shipmentId}
                      </div>
                      {req.shipment?.recipientName && (
                        <div className="text-[11px] text-muted-foreground">{req.shipment.recipientName}</div>
                      )}
                    </td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-primary/10 dark:bg-primary/30 text-primary dark:text-primary border border-primary dark:border-primary">
                        {req.type === 'ADDRESS' ? (isEn ? 'Address' : 'عنوان') : req.type === 'AMOUNT' ? (isEn ? 'COD Amount' : 'مبلغ COD') : (isEn ? 'Recipient' : 'مستلم')}
                      </span>
                    </td>
                    <td className="p-2.5">
                      <div className="flex flex-col gap-0.5 max-w-sm">
                        {req.oldValue && (
                          <div className="text-[11px] text-muted-foreground line-through">
                            {formatValueSnippet(req.oldValue)}
                          </div>
                        )}
                        <div className="text-[11px] font-medium text-success dark:text-success">
                          {formatValueSnippet(req.newValue)}
                        </div>
                        {req.reason && <div className="text-[10px] text-muted-foreground">{isEn ? 'Reason:' : 'السبب:'} {req.reason}</div>}
                        {req.rejectionReason && <div className="text-[10px] text-destructive">{isEn ? 'Rejected:' : 'سبب الرفض:'} {req.rejectionReason}</div>}
                      </div>
                    </td>
                    <td className="p-2.5">
                      <div className="font-medium text-foreground dark:text-muted-foreground">{req.requestedBy}</div>
                      <span className="text-[10px] text-muted-foreground">
                        {req.requestedByType === 'CLIENT' ? (isEn ? 'Merchant' : 'العميل') : req.requestedByType === 'COURIER' ? (isEn ? 'Courier' : 'المندوب') : (isEn ? 'Admin' : 'الإدارة')}
                      </span>
                    </td>
                    <td className="p-2.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                        req.status === 'PENDING' ? 'bg-amber-50 text-warning border-warning' :
                        req.status === 'APPROVED' ? 'bg-emerald-50 text-success border-success' :
                        'bg-rose-50 text-destructive border-destructive'
                      }`}>
                        {req.status === 'PENDING' ? <Clock className="w-3 h-3" /> : req.status === 'APPROVED' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {req.status === 'PENDING' ? (isEn ? 'Pending' : 'قيد المراجعة') : req.status === 'APPROVED' ? (isEn ? 'Approved' : 'معتمد') : (isEn ? 'Rejected' : 'مرفوض')}
                      </span>
                    </td>
                    <td className="p-2.5">
                      {req.reviewedBy ? (
                        <div>
                          <div className="text-slate-800 dark:text-muted-foreground font-medium">{req.reviewedBy}</div>
                          <div className="text-[10px] text-muted-foreground">{formatDateTime(req.reviewedAt)}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">{formatDateTime(req.createdAt)}</span>
                      )}
                    </td>
                    <td className="p-2.5 text-center">
                      {req.status === 'PENDING' ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setApprovingItem(req)}
                            className="px-2 py-1 bg-success hover:bg-success text-white rounded text-[11px] font-medium flex items-center gap-1 shadow-xs"
                          >
                            <Check className="w-3 h-3" />
                            <span>{isEn ? 'Approve' : 'موافقة'}</span>
                          </button>
                          <button
                            onClick={() => setRejectingItem(req)}
                            className="px-2 py-1 border border-destructive text-destructive hover:bg-destructive/10 rounded text-[11px] font-medium flex items-center gap-1"
                          >
                            <Ban className="w-3 h-3" />
                            <span>{isEn ? 'Reject' : 'رفض'}</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ApproveChangeRequestModal
        isOpen={Boolean(approvingItem)}
        onClose={() => setApprovingItem(null)}
        item={approvingItem}
        onConfirm={handleApprove}
        loading={actionLoading}
        isEn={isEn}
      />

      <RejectChangeRequestModal
        isOpen={Boolean(rejectingItem)}
        onClose={() => setRejectingItem(null)}
        item={rejectingItem}
        onConfirm={handleReject}
        loading={actionLoading}
        isEn={isEn}
      />
    </div>
  );
};
