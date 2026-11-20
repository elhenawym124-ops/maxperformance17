import React, { useState, useEffect, useCallback } from 'react';
import {
  Receipt,
  Plus,
  RefreshCw,
  Eye,
  Download,
  CheckCircle,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  SettlementItem,
  SettlementMerchant,
  SETTLEMENT_STATUS_MAP,
  formatEgp,
} from './settlements/SettlementTypes';
import { SettlementPreviewModal } from './settlements/SettlementPreviewModal';
import { SettlementDetailModal } from './settlements/SettlementDetailModal';
import { SettlementPayModal } from './settlements/SettlementPayModal';

export const SettlementsPage: React.FC = () => {
  const [settlements, setSettlements] = useState<SettlementItem[]>([]);
  const [merchants, setMerchants] = useState<SettlementMerchant[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [merchantFilter, setMerchantFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Modals state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedSettlementId, setSelectedSettlementId] = useState<string | null>(null);
  const [payingSettlement, setPayingSettlement] = useState<SettlementItem | null>(null);

  const token = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
    ? window.localStorage.getItem('token') || window.localStorage.getItem('accessToken') || ''
    : '';

  const authHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  };

  const fetchMerchants = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/shipping-portal/merchants', { headers: authHeaders });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setMerchants(data.data);
      }
    } catch {}
  }, []);

  const fetchSettlements = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (merchantFilter) params.append('merchantId', merchantFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);

      const res = await fetch(`/api/v1/shipping-portal/settlements?${params.toString()}`, {
        headers: authHeaders,
      });
      const data = await res.json();
      if (data.success) {
        setSettlements(data.settlements || []);
      } else {
        toast.error(data.message || 'فشل في جلب قائمة التسويات');
      }
    } catch {
      toast.error('خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  }, [merchantFilter, statusFilter, fromDate, toDate]);

  useEffect(() => {
    fetchMerchants();
    fetchSettlements();
  }, [fetchMerchants, fetchSettlements]);

  // Aggregate metrics
  const totalGross = settlements.reduce((s, item) => s + Number(item.grossCOD || 0), 0);
  const totalNet = settlements.reduce((s, item) => s + Number(item.netPayout || 0), 0);
  const totalParcels = settlements.reduce((s, item) => s + (item.totalShipments || 0), 0);

  return (
    <div className="p-4 sm:p-6 space-y-5 bg-white dark:bg-muted min-h-screen w-full max-w-[1800px] mx-auto" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border dark:border-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-foreground dark:text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600" />
            تسويات وكشوف COD لعملاء الشحن
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            إجمالي المحصل − رسوم الشحن − رسوم COD − المرتجعات = صافي التوريد
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchSettlements()}
            disabled={loading}
            className="p-2 border border-border dark:border-border rounded-lg text-foreground dark:text-muted-foreground hover:bg-muted transition-colors"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowPreviewModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            معاينة وإنشاء كشف جديد
          </button>
        </div>
      </div>

      {/* Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 dark:bg-muted p-3.5 rounded-lg border border-border dark:border-border">
          <span className="text-xs text-muted-foreground block">عدد الكشوف</span>
          <span className="text-lg font-bold text-foreground dark:text-white tabular-nums">
            {settlements.length}
          </span>
        </div>
        <div className="bg-slate-50 dark:bg-muted p-3.5 rounded-lg border border-border dark:border-border">
          <span className="text-xs text-muted-foreground block">إجمالي الشحنات المدرجة</span>
          <span className="text-lg font-bold text-foreground dark:text-white tabular-nums">
            {totalParcels}
          </span>
        </div>
        <div className="bg-slate-50 dark:bg-muted p-3.5 rounded-lg border border-border dark:border-border">
          <span className="text-xs text-muted-foreground block">إجمالي محصل COD</span>
          <span className="text-lg font-bold text-foreground dark:text-white tabular-nums">
            {formatEgp(totalGross)}
          </span>
        </div>
        <div className="bg-emerald-50 dark:bg-success/20 p-3.5 rounded-lg border border-success dark:border-success">
          <span className="text-xs text-success dark:text-success font-medium block">
            إجمالي صافي التوريدات
          </span>
          <span className="text-lg font-bold text-success dark:text-success tabular-nums">
            {formatEgp(totalNet)}
          </span>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="bg-slate-50 dark:bg-muted p-3 rounded-lg border border-border dark:border-border flex flex-wrap gap-2.5 items-center">
        <div className="min-w-[180px]">
          <select
            value={merchantFilter}
            onChange={(e) => setMerchantFilter(e.target.value)}
            className="w-full text-xs border border-border dark:border-border rounded-lg px-3 py-1.5 bg-white dark:bg-muted text-foreground dark:text-white"
          >
            <option value="">جميع العملاء</option>
            {merchants.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[140px]">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full text-xs border border-border dark:border-border rounded-lg px-3 py-1.5 bg-white dark:bg-muted text-foreground dark:text-white"
          >
            <option value="">جميع الحالات</option>
            <option value="DRAFT">مسودة</option>
            <option value="ISSUED">تم الإصدار</option>
            <option value="APPROVED">معتمد</option>
            <option value="PAID">تم التوريد والصرف</option>
            <option value="REJECTED">مرفوض</option>
          </select>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>من:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border border-border dark:border-border rounded-lg px-2 py-1 bg-white dark:bg-muted text-foreground dark:text-white"
          />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>إلى:</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border border-border dark:border-border rounded-lg px-2 py-1 bg-white dark:bg-muted text-foreground dark:text-white"
          />
        </div>
      </div>

      {/* Settlements Table */}
      <div className="border border-border dark:border-border rounded-lg overflow-hidden">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 dark:bg-muted text-muted-foreground border-b border-border dark:border-border">
            <tr>
              <th className="p-3">رقم الكشف</th>
              <th className="p-3">عميل الشحن</th>
              <th className="p-3">الفترة</th>
              <th className="p-3 text-center">الشحنات</th>
              <th className="p-3 text-left">إجمالي المحصل</th>
              <th className="p-3 text-left">الرسوم والمصاريف</th>
              <th className="p-3 text-left font-bold text-foreground dark:text-white">
                صافي التوريد
              </th>
              <th className="p-3 text-center">الحالة</th>
              <th className="p-3 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border dark:divide-border">
            {loading ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-muted-foreground">
                  جارٍ تحميل بيانات الكشوف...
                </td>
              </tr>
            ) : settlements.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-muted-foreground">
                  لا توجد كشوف تسوية مطابقة للبحث
                </td>
              </tr>
            ) : (
              settlements.map((item) => {
                const statusConfig =
                  SETTLEMENT_STATUS_MAP[item.status] || SETTLEMENT_STATUS_MAP.DRAFT;
                const totalFees =
                  Number(item.shippingFeesTotal || 0) +
                  Number(item.codFeesTotal || 0) +
                  Number(item.returnFeesTotal || 0);

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 dark:hover:bg-muted transition-colors"
                  >
                    <td className="p-3 font-mono font-medium text-blue-600 dark:text-blue-400">
                      {item.settlementNumber}
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-foreground dark:text-white">
                        {item.merchant?.name || '—'}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {item.merchant?.phone || ''}
                      </div>
                    </td>
                    <td className="p-3 text-[11px] text-muted-foreground">
                      <div>من: {new Date(item.periodStart).toLocaleDateString('ar-EG')}</div>
                      <div>إلى: {new Date(item.periodEnd).toLocaleDateString('ar-EG')}</div>
                    </td>
                    <td className="p-3 text-center">
                      <span className="font-semibold text-foreground dark:text-muted-foreground tabular-nums">
                        {item.totalShipments}
                      </span>
                      <div className="text-[10px] text-muted-foreground">
                        {item.deliveredCount} مسلّمة · {item.returnedCount} مرتجع
                      </div>
                    </td>
                    <td className="p-3 text-left tabular-nums font-medium text-foreground dark:text-white">
                      {formatEgp(item.grossCOD)}
                    </td>
                    <td className="p-3 text-left tabular-nums text-destructive">
                      -{formatEgp(totalFees)}
                    </td>
                    <td className="p-3 text-left tabular-nums font-bold text-success dark:text-success text-sm">
                      {formatEgp(item.netPayout)}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${statusConfig.badgeClass}`}
                      >
                        {statusConfig.labelAr}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedSettlementId(item.id)}
                          className="p-1.5 text-muted-foreground hover:text-blue-600 rounded hover:bg-muted dark:hover:bg-muted"
                          title="عرض تفاصيل الأسطر"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <a
                          href={`/api/v1/shipping-portal/settlements/${item.id}/export`}
                          download
                          className="p-1.5 text-muted-foreground hover:text-success rounded hover:bg-muted dark:hover:bg-muted"
                          title="تحميل كشف CSV"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        {item.status === 'APPROVED' && (
                          <button
                            onClick={() => setPayingSettlement(item)}
                            className="p-1.5 text-success hover:text-success rounded hover:bg-success/10 dark:hover:bg-success/30"
                            title="تسجيل التوريد والصرف"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <SettlementPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        merchants={merchants}
        onSettlementCreated={fetchSettlements}
        authHeaders={authHeaders}
      />

      <SettlementDetailModal
        isOpen={Boolean(selectedSettlementId)}
        onClose={() => setSelectedSettlementId(null)}
        settlementId={selectedSettlementId}
        authHeaders={authHeaders}
        onRefresh={fetchSettlements}
        onOpenPayModal={(item) => {
          setSelectedSettlementId(null);
          setPayingSettlement(item);
        }}
      />

      <SettlementPayModal
        isOpen={Boolean(payingSettlement)}
        onClose={() => setPayingSettlement(null)}
        settlement={payingSettlement}
        authHeaders={authHeaders}
        onPaid={fetchSettlements}
      />
    </div>
  );
};

export default SettlementsPage;
