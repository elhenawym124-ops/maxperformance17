import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  PackagePlus,
  RefreshCw,
  FileSpreadsheet,
  Search,
  Eye,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Boxes,
  Copy,
  Printer,
  AlertCircle,
  Globe2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  shippingOpsService,
  ShipmentItem,
  MerchantItem,
  ShipmentsQuery,
} from '../../services/shippingOpsService';
import { EGYPT_GOVERNORATES } from '../../constants/egyptGovernorates';
import { getStatusBadge, formatDate, formatCurrency, printShipmentLabel, printBatchShipments } from './shippingOpsShared';
import { InternationalAcksModal } from './InternationalAcksModal';
import { BulkOrdersImportModal } from './BulkOrdersImportModal';
import { DateInput } from '../../components/ui/DateInput';

const TURBO_STATUS_TABS = [
  { key: '', labelAr: 'الكل', labelEn: 'All' },
  { key: 'INCOMPLETE', labelAr: 'غير مكتملة', labelEn: 'Incomplete' },
  { key: 'PENDING', labelAr: 'قيد الانتظار', labelEn: 'Pending' },
  { key: 'ASSIGNED', labelAr: 'قيد التنفيذ', labelEn: 'Assigned' },
  { key: 'PICKED_UP', labelAr: 'مسلمة للمندوب', labelEn: 'Handed to Courier' },
  { key: 'OUT_FOR_DELIVERY', labelAr: 'خرجت للتوصيل', labelEn: 'Out for Delivery' },
  { key: 'POSTPONED', labelAr: 'مؤجلة مع المندوب', labelEn: 'Postponed' },
  { key: 'DELIVERED', labelAr: 'تم التسليم', labelEn: 'Delivered' },
  { key: 'RETURNED_AT_COMPANY', labelAr: 'مرتجعات في الشركة', labelEn: 'Returned at Hub' },
  { key: 'RETURNED_DAMAGED', labelAr: 'مرتجعات معدومة', labelEn: 'Damaged' },
  { key: 'RETURNED_LOST', labelAr: 'مرتجعات مفقودة', labelEn: 'Lost' },
  { key: 'RETURNED_RECEIVED', labelAr: 'مرتجعات وصلتني', labelEn: 'Returns Received' },
  { key: 'RESHIPPED', labelAr: 'معاد إرسالها', labelEn: 'Reshipped' },
  { key: 'REMITTED', labelAr: 'تم التوريد', labelEn: 'Remitted' },
];

export const ShippingParcelsList: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === 'en';

  const [shipments, setShipments] = useState<ShipmentItem[]>([]);
  const [merchants, setMerchants] = useState<MerchantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [needsRtoReview, setNeedsRtoReview] = useState(false);
  const [isInternational, setIsInternational] = useState<boolean>(false);
  const [showIntlModal, setShowIntlModal] = useState<boolean>(false);

  const [governorate, setGovernorate] = useState('');
  const [merchantId, setMerchantId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Cancel Modal State
  const [cancellingShipment, setCancellingShipment] = useState<ShipmentItem | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  // Multi-select & Batch Print (SHIP-W17)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [batchTemplate, setBatchTemplate] = useState<string>('WAYBILL');
  const [batchCopies, setBatchCopies] = useState<number>(1);
  const [batchPrinting, setBatchPrinting] = useState<boolean>(false);

  const handleSelectAll = () => {
    if (selectedIds.length === shipments.length && shipments.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(shipments.map((s) => s.id));
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBatchPrint = async () => {
    if (selectedIds.length === 0) return;
    try {
      setBatchPrinting(true);
      await printBatchShipments(selectedIds, batchTemplate, batchCopies);
    } finally {
      setBatchPrinting(false);
    }
  };

  // Load merchants list for filter
  useEffect(() => {
    shippingOpsService
      .getMerchants()
      .then(setMerchants)
      .catch((err) => console.warn('Failed to load merchants', err));
  }, []);

  const loadShipments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const query: ShipmentsQuery = {
        page,
        limit: 20,
        search: search.trim() || undefined,
        status: status || undefined,
        governorate: governorate || undefined,
        merchantId: merchantId || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        needsRtoReview: needsRtoReview || undefined,
        isInternational: isInternational ? true : undefined,
      };

      const res = await shippingOpsService.getShipments(query);
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray((res as any)?.items) ? (res as any).items : []);
      setShipments(list);
      setTotalPages(res?.pagination?.totalPages || (res as any)?.totalPages || 1);
      setTotalCount(res?.pagination?.total || (res as any)?.total || list.length);
      if (res?.statusCounts) {
        setStatusCounts(res.statusCounts);
      } else {
        shippingOpsService.getStatusCounts().then(setStatusCounts).catch(() => {});
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('shippingOps.loadError', 'حدث خطأ أثناء جلب قائمة الشحنات');
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [page, search, status, governorate, merchantId, fromDate, toDate, needsRtoReview, isInternational, t]);

  useEffect(() => {
    loadShipments();
  }, [loadShipments]);

  const handleResetFilters = () => {
    setSearch('');
    setStatus('');
    setNeedsRtoReview(false);
    setIsInternational(false);
    setGovernorate('');
    setMerchantId('');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const handleCopyTracking = (tracking: string) => {
    navigator.clipboard.writeText(tracking);
    toast.success(isEn ? 'Tracking number copied' : 'تم نسخ رقم التتبع بنجاح');
  };

  const handleConfirmCancel = async () => {
    if (!cancellingShipment) return;
    try {
      setCancelLoading(true);
      await shippingOpsService.cancelShipment(cancellingShipment.id, cancelReason);
      toast.success(isEn ? 'Shipment cancelled successfully' : 'تم إلغاء الشحنة بنجاح');
      setCancellingShipment(null);
      setCancelReason('');
      loadShipments();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'تعذر إلغاء الشحنة';
      toast.error(msg);
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 w-full max-w-[1800px] mx-auto text-foreground dark:text-muted-foreground">
      {/* Page Header (No nav element) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border dark:border-border pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {t('shippingOps.parcels', 'سجل الشحنات والطرود')}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground mt-1">
            {t('shippingOps.subtitle', 'إدارة الطرود المستقلة، تسعير العملاء، ومتابعة حركة الشحنات والتسليم')}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadShipments}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium border border-border dark:border-border rounded-lg hover:bg-muted dark:hover:bg-muted transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-foreground dark:text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
            <span>{isEn ? 'Refresh' : 'تحديث'}</span>
          </button>
                    <button
            type="button"
            onClick={() => setShowIntlModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 dark:text-blue-300 dark:bg-blue-950/40 dark:hover:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-lg shadow-xs transition active:scale-95 cursor-pointer"
            title="مراجعة الإقرارات الجمركية للشحنات الدولية"
          >
            <Globe2 className="w-4 h-4" />
            <span>الإقرارات الدولية</span>
          </button>
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-success bg-success/10 hover:bg-success dark:text-success dark:bg-success/40 dark:hover:bg-success/60 border border-success dark:border-success rounded-lg shadow-sm transition active:scale-95 cursor-pointer"
            title={isEn ? 'Import Orders & Shipments from Excel' : 'استيراد أوردرات وشحنات كاملة من ملف إكسيل'}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isEn ? 'Import Excel' : 'استيراد Excel'}</span>
          </button>
          <Link
            to="/shipping-ops/parcels/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg shadow-sm transition active:scale-95"
          >
            <PackagePlus className="w-4 h-4" />
            <span>{t('shippingOps.newParcel', 'إنشاء طرد جديد')}</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 dark:bg-destructive/40 border border-destructive dark:border-destructive text-destructive dark:text-destructive rounded-xl text-xs sm:text-sm">
          {error}
        </div>
      )}

      {/* Turbo-style Status Tabs Ribbon with Counts */}
      <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-2.5 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {TURBO_STATUS_TABS.map((tab) => {
            const isSelected = status === tab.key;
            const count = tab.key === '' ? (statusCounts['ALL'] !== undefined ? statusCounts['ALL'] : totalCount) : (statusCounts[tab.key] || 0);
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setStatus(tab.key);
                  setPage(1);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-muted text-foreground dark:text-muted-foreground border-border dark:border-border hover:bg-muted dark:hover:bg-muted'
                }`}
              >
                <span>{isEn ? tab.labelEn : tab.labelAr}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[11px] tabular-nums font-bold ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200/80 dark:bg-muted text-foreground dark:text-muted-foreground'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-4 space-y-3 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={String(t('shippingOps.list.searchPlaceholder', 'بحث برقم التتبع، المستلم، أو الهاتف...'))}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full ps-3 pe-9 py-2 text-xs sm:text-sm bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{isEn ? 'All Statuses' : 'جميع الحالات'}</option>
              <option value="INCOMPLETE">{isEn ? 'Incomplete (Draft)' : 'غير مكتملة (مسودة)'}</option>
              <option value="PENDING">{isEn ? 'Pending' : 'قيد الانتظار'}</option>
              <option value="ASSIGNED">{isEn ? 'Assigned' : 'قيد التنفيذ / مسندة للمندوب'}</option>
              <option value="PICKED_UP">{isEn ? 'Handed to Courier' : 'مسلمة للمندوب'}</option>
              <option value="OUT_FOR_DELIVERY">{isEn ? 'Out for Delivery' : 'خرجت للتوصيل'}</option>
              <option value="POSTPONED">{isEn ? 'Postponed with Courier' : 'مؤجلة مع المندوب'}</option>
              <option value="DELIVERED">{isEn ? 'Delivered' : 'تم التسليم'}</option>
              <option value="RETURNED_AT_COMPANY">{isEn ? 'Returned at Hub' : 'مرتجعات في الشركة'}</option>
              <option value="RETURNED_DAMAGED">{isEn ? 'Damaged / Write-off' : 'مرتجعات معدومة'}</option>
              <option value="RETURNED_LOST">{isEn ? 'Lost in Transit' : 'مرتجعات مفقودة'}</option>
              <option value="RETURNED_RECEIVED">{isEn ? 'Returns Received' : 'مرتجعات وصلتني'}</option>
              <option value="RESHIPPED">{isEn ? 'Reshipped' : 'معاد إرسالها'}</option>
              <option value="REMITTED">{isEn ? 'Remitted' : 'تم التوريد'}</option>
              <option value="FAILED">{isEn ? 'Delivery Failed' : 'تعذر التسليم / معلقة'}</option>
              <option value="CANCELLED">{isEn ? 'Cancelled' : 'ملغية'}</option>
            </select>
          </div>

          {/* Governorate Filter */}
          <div>
            <select
              value={governorate}
              onChange={(e) => {
                setGovernorate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('shippingOps.list.filterAllGov', 'جميع المحافظات')}</option>
              {EGYPT_GOVERNORATES.map((g) => (
                <option key={g.id} value={g.nameAr}>
                  {isEn ? g.nameEn : g.nameAr}
                </option>
              ))}
            </select>
          </div>

          {/* Merchant Filter */}
          <div>
            <select
              value={merchantId}
              onChange={(e) => {
                setMerchantId(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('shippingOps.list.filterAllMerchants', 'جميع العملاء / التجار')}</option>
              {merchants.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Filter & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border dark:border-border text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-500 font-medium">{t('shippingOps.list.dateFrom', 'من')}:</span>
            <DateInput
              
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 bg-muted dark:bg-muted border border-border dark:border-border rounded-lg"
            />
            <span className="text-slate-500 font-medium">{t('shippingOps.list.dateTo', 'إلى')}:</span>
            <DateInput
              
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 bg-muted dark:bg-muted border border-border dark:border-border rounded-lg"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setNeedsRtoReview((prev) => !prev);
                setPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                needsRtoReview
                  ? 'bg-amber-100 text-warning border-warning dark:bg-warning dark:text-warning dark:border-warning'
                  : 'bg-slate-50 text-foreground border-border hover:bg-muted dark:bg-muted dark:text-muted-foreground dark:border-border'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5 text-warning" />
              <span>{isEn ? 'Needs RTO Review' : 'شحنات بحاجة لمراجعة RTO'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsInternational((prev) => !prev);
                setPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                isInternational
                  ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700'
                  : 'bg-slate-50 text-foreground border-border hover:bg-muted dark:bg-muted dark:text-muted-foreground dark:border-border'
              }`}
            >
              <Globe2 className="w-3.5 h-3.5 text-blue-600" />
              <span>{isEn ? 'International Only' : 'شحنات دولية فقط'}</span>
            </button>

          </div>

          {(search || status || governorate || merchantId || fromDate || toDate || needsRtoReview) && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-destructive hover:underline font-medium"
            >
              إعادة ضبط الفلاتر
            </button>
          )}
        </div>
      </div>

      {/* Batch Print Floating/Inline Action Bar (SHIP-W17) */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-blue-50/90 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-xl shadow-sm text-xs sm:text-sm animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="font-bold text-blue-900 dark:text-blue-200">
              {isEn ? `Selected ${selectedIds.length} shipments` : `تم تحديد ${selectedIds.length} شحنة`}
            </span>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-xs text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground underline me-1"
            >
              {isEn ? 'Deselect all' : 'إلغاء التحديد'}
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-white dark:bg-muted px-2 py-1 rounded-lg border border-blue-200 dark:border-blue-800 text-xs">
              <span className="text-slate-500">{isEn ? 'Template:' : 'القالب:'}</span>
              <select
                value={batchTemplate}
                onChange={(e) => setBatchTemplate(e.target.value)}
                className="bg-transparent font-semibold text-foreground dark:text-muted-foreground cursor-pointer focus:outline-none"
              >
                <option value="WAYBILL">{isEn ? 'Waybill (A6)' : 'بوليصة لصق'}</option>
                <option value="INVOICE">{isEn ? 'COD Invoice' : 'فاتورة COD'}</option>
                <option value="PICKUP_SLIP">{isEn ? 'Pickup Slip' : 'إذن استلام'}</option>
                <option value="BOTH">{isEn ? 'Both (Waybill+Invoice)' : 'الاثنين (بوليصة+فاتورة)'}</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-white dark:bg-muted px-2 py-1 rounded-lg border border-blue-200 dark:border-blue-800 text-xs">
              <span className="text-slate-500">{isEn ? 'Copies:' : 'النسخ:'}</span>
              <select
                value={batchCopies}
                onChange={(e) => setBatchCopies(Number(e.target.value))}
                className="bg-transparent font-bold text-foreground dark:text-muted-foreground cursor-pointer focus:outline-none"
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleBatchPrint}
              disabled={batchPrinting}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>
                {batchPrinting
                  ? (isEn ? 'Generating PDF...' : 'جاري الدمج...')
                  : (isEn ? `Print Selected (${selectedIds.length})` : `طباعة المحدد (${selectedIds.length})`)}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Parcels Table */}
      <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right rtl:text-right ltr:text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-muted text-muted-foreground dark:text-muted-foreground border-b border-border dark:border-border">
              <tr>
                <th className="w-10 px-3 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={shipments.length > 0 && selectedIds.length === shipments.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-border dark:border-border cursor-pointer"
                    title={isEn ? 'Select all on page' : 'تحديد كل الصفحة'}
                  />
                </th>
                <th className="px-4 py-3 font-medium">{t('shippingOps.list.trackingNumber', 'رقم التتبع')}</th>
                <th className="px-4 py-3 font-medium">{t('shippingOps.list.recipient', 'المستلم')}</th>
                <th className="px-4 py-3 font-medium">{t('shippingOps.list.destination', 'الوجهة')}</th>
                <th className="px-4 py-3 font-medium">{t('shippingOps.list.merchant', 'العميل')}</th>
                <th className="px-4 py-3 font-medium">{t('shippingOps.list.cod', 'مبلغ التحصيل')}</th>
                <th className="px-4 py-3 font-medium">{t('shippingOps.list.cost', 'التكلفة')}</th>
                <th className="px-4 py-3 font-medium">{t('shippingOps.list.status', 'الحالة')}</th>
                <th className="px-4 py-3 font-medium">{isEn ? 'Latest Event' : 'آخر حالة'}</th>
                <th className="px-4 py-3 font-medium">{t('shippingOps.list.createdAt', 'التاريخ')}</th>
                <th className="px-4 py-3 font-medium text-center">{t('shippingOps.list.actions', 'إجراء')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-border">
              {loading && shipments.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                    <span>{isEn ? 'Loading parcels...' : 'جاري تحميل الشحنات...'}</span>
                  </td>
                </tr>
              ) : (!shipments || shipments.length === 0) ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-muted-foreground">
                    <Boxes className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <span>{t('shippingOps.list.noParcelsFound', 'لم يتم العثور على أي شحنات')}</span>
                  </td>
                </tr>
              ) : (
                shipments.map((s) => {
                  const badge = getStatusBadge(s.status, isEn);
                  const isCancelable = ['PENDING', 'ASSIGNED', 'INCOMPLETE'].includes(s.status);

                  return (
                    <tr key={s.id} className={`hover:bg-slate-50/70 dark:hover:bg-muted transition ${selectedIds.includes(s.id) ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''}`}>
                      <td className="w-10 px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(s.id)}
                          onChange={() => handleSelectOne(s.id)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-border dark:border-border cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 font-mono font-medium text-blue-600 dark:text-blue-400">
                          <Link to={`/shipping-ops/parcels/${s.id}`} className="hover:underline">
                            {s.trackingNumber}
                          </Link>
                          {s.isInternational && (
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                s.intlAckStatus === 'APPROVED'
                                  ? 'bg-emerald-50 text-success border-success dark:bg-success/60 dark:text-success'
                                  : s.intlAckStatus === 'REJECTED'
                                  ? 'bg-rose-50 text-destructive border-destructive dark:bg-destructive/60 dark:text-destructive'
                                  : 'bg-amber-50 text-warning border-warning dark:bg-warning/60 dark:text-warning animate-pulse'
                              }`}
                              title={`شحنة دولية: ${s.destinationCountry || ''} (${s.intlAckStatus || 'معلق'})`}
                            >
                              <Globe2 className="w-3 h-3" />
                              <span>{s.intlAckStatus === 'APPROVED' ? 'دولية: معتمد' : s.intlAckStatus === 'REJECTED' ? 'دولية: مرفوض' : 'دولية: معلق'}</span>
                            </span>
                          )}

                          <button
                            onClick={() => printShipmentLabel(s.id, s.trackingNumber)}
                            className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition"
                            title={isEn ? 'Print Waybill (A6)' : 'طباعة البوليصة'}
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCopyTracking(s.trackingNumber)}
                            className="p-1 text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground transition"
                            title="نسخ رقم التتبع"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground dark:text-muted-foreground">{s.recipientName}</div>
                        <div className="text-xs text-muted-foreground font-mono" dir="ltr">{s.recipientPhone}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-900 dark:text-muted-foreground">{s.destinationGovernorate}</div>
                        {s.destinationCity && (
                          <div className="text-xs text-muted-foreground">{s.destinationCity}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-foreground dark:text-muted-foreground">
                        {s.merchant?.name || (isEn ? 'Direct' : 'مباشر')}
                      </td>
                      <td className="px-4 py-3 font-semibold tabular-nums text-foreground dark:text-muted-foreground">
                        {formatCurrency(s.codAmount)}
                      </td>
                      <td className="px-4 py-3 font-medium tabular-nums text-foreground dark:text-muted-foreground">
                        {formatCurrency(s.cost)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${badge.badgeClass}`}>
                            {badge.label}
                          </span>
                          {Boolean((s as any).isStale) && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-destructive text-destructive dark:bg-destructive/60 dark:text-destructive border border-destructive dark:border-destructive animate-pulse">
                              {isEn ? 'Stale (>11d)' : 'متأخرة (تجاوزت المهلة)'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {s.latestEvent ? (
                          <div className="text-xs">
                            <span className="font-medium text-foreground dark:text-muted-foreground">
                              {getStatusBadge(s.latestEvent.toStatus, isEn).label}
                            </span>
                            {s.latestEvent.notes && (
                              <p className="text-[11px] text-muted-foreground truncate max-w-[140px]" title={s.latestEvent.notes}>
                                {s.latestEvent.notes}
                              </p>
                            )}
                            <span className="text-[10px] text-muted-foreground block font-mono">
                              {new Date(s.latestEvent.createdAt).toLocaleTimeString(isEn ? 'en-US' : 'ar-EG', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(s.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center gap-1">
                          <Link
                            to={`/shipping-ops/parcels/${s.id}`}
                            className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition"
                            title={String(t('shippingOps.list.viewDetails', 'عرض التفاصيل'))}
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => printShipmentLabel(s.id, s.trackingNumber)}
                            className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition"
                            title={isEn ? 'Print Waybill (A6)' : 'طباعة البوليصة'}
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          {isCancelable && (
                            <button
                              onClick={() => {
                                setCancellingShipment(s);
                                setCancelReason('');
                              }}
                              className="p-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/40 rounded-lg transition"
                              title={String(t('shippingOps.list.cancelShipment', 'إلغاء الشحنة'))}
                            >
                              <XCircle className="w-4 h-4" />
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

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-border dark:border-border text-xs text-muted-foreground">
          <div>
            <span>{t('shippingOps.list.totalRecords', 'إجمالي الشحنات')}: </span>
            <span className="font-bold text-foreground dark:text-muted-foreground tabular-nums">{totalCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="inline-flex items-center gap-1 px-3 py-1.5 border border-border dark:border-border rounded-lg hover:bg-muted dark:hover:bg-muted disabled:opacity-40 transition"
            >
              <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
              <span>{isEn ? 'Previous' : 'السابق'}</span>
            </button>
            <span className="px-2 font-medium">
              {t('shippingOps.list.page', 'صفحة')} {page} {t('shippingOps.list.of', 'من')} {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="inline-flex items-center gap-1 px-3 py-1.5 border border-border dark:border-border rounded-lg hover:bg-muted dark:hover:bg-muted disabled:opacity-40 transition"
            >
              <span>{isEn ? 'Next' : 'التالي'}</span>
              <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      {cancellingShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-muted backdrop-blur-sm">
          <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-5 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-destructive">
              <XCircle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base text-foreground dark:text-muted-foreground">
                {t('shippingOps.list.cancelConfirmTitle', 'تأكيد إلغاء الشحنة')}
              </h3>
            </div>
            <p className="text-xs text-foreground dark:text-muted-foreground">
              {t('shippingOps.list.cancelConfirmDesc', 'هل أنت متأكد من رغبتك في إلغاء هذه الشحنة؟ لا يمكن التراجع عن هذا الإجراء.')}
            </p>
            <div className="p-3 bg-muted dark:bg-muted rounded-lg text-xs space-y-1">
              <div><span className="text-slate-400">رقم التتبع:</span> <span className="font-mono font-medium">{cancellingShipment.trackingNumber}</span></div>
              <div><span className="text-slate-400">المستلم:</span> <span className="font-medium">{cancellingShipment.recipientName}</span></div>
            </div>
            <div>
              <label htmlFor="cancelReason" className="block text-xs font-medium text-foreground dark:text-muted-foreground mb-1">
                سبب الإلغاء (اختياري)
              </label>
              <input
                id="cancelReason"
                type="text"
                placeholder="طلب العميل، خطأ في العنوان، تكرار..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-destructive"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border dark:border-border">
              <button
                type="button"
                onClick={() => setCancellingShipment(null)}
                disabled={cancelLoading}
                className="px-3.5 py-2 text-xs font-medium border border-border dark:border-border rounded-lg hover:bg-muted dark:hover:bg-muted transition"
              >
                {t('shippingOps.list.cancelDismissBtn', 'تراجع')}
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancelLoading}
                className="px-4 py-2 text-xs font-semibold text-white bg-destructive hover:bg-destructive rounded-lg transition active:scale-95 disabled:opacity-50"
              >
                {cancelLoading ? 'جاري الإلغاء...' : t('shippingOps.list.confirmCancelBtn', 'تأكيد الإلغاء')}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Bulk Orders Import Modal (SHIP-W17) */}
      <BulkOrdersImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => {
          loadShipments();
        }}
        isEn={isEn}
      />
          {/* International Customs Acknowledgments Modal (SHIP-T4) */}
      <InternationalAcksModal
        isOpen={showIntlModal}
        onClose={() => setShowIntlModal(false)}
        onAckUpdated={loadShipments}
      />
</div>
  );
};

export default ShippingParcelsList;
