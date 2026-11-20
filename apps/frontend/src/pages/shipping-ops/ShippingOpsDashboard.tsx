import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  PackagePlus,
  RefreshCw,
  Truck,
  CheckCircle2,
  XCircle,
  Banknote,
  Clock,
  ArrowRight,
  Eye,
  Boxes,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
} from 'lucide-react';
import { shippingOpsService, DashboardStats, CompanyWalletData, ShippingPolicyData } from '../../services/shippingOpsService';
import { Calendar, AlertTriangle } from 'lucide-react';
import { getStatusBadge, formatDate, formatCurrency } from './shippingOpsShared';

export const ShippingOpsDashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === 'en';

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [wallet, setWallet] = useState<CompanyWalletData | null>(null);
  const [policy, setPolicy] = useState<ShippingPolicyData | null>(null);
  const [staleCount, setStaleCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsRes, walletRes, policyRes, staleRes] = await Promise.allSettled([
        shippingOpsService.getDashboardStats(),
        shippingOpsService.getWalletSummary(),
        shippingOpsService.getShippingPolicy(),
        shippingOpsService.getStaleShipments(),
      ]);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (walletRes.status === 'fulfilled') setWallet(walletRes.value);
      if (policyRes.status === 'fulfilled') setPolicy(policyRes.value);
      if (staleRes.status === 'fulfilled') setStaleCount(staleRes.value?.count || 0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('shippingOps.loadError', 'حدث خطأ أثناء تحميل البيانات');
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);


  const dayNamesAr: Record<string, string> = {
    SUNDAY: 'الأحد',
    MONDAY: 'الاثنين',
    TUESDAY: 'الثلاثاء',
    WEDNESDAY: 'الأربعاء',
    THURSDAY: 'الخميس',
    FRIDAY: 'الجمعة',
    SATURDAY: 'السبت',
  };

  const rawDays = policy?.remittanceDays;
  const parsedDaysList: string[] = Array.isArray(rawDays)
    ? rawDays
    : (typeof rawDays === 'string' ? (rawDays.startsWith('[') ? JSON.parse(rawDays) : rawDays.split(',')) : ['SUNDAY', 'WEDNESDAY']);
  const formattedDaysText = isEn
    ? parsedDaysList.join(', ')
    : parsedDaysList.map((d) => dayNamesAr[d] || d).join('، ');
  const maxDaysVal = policy?.maxDeliveryDays ?? 11;

  return (
    <div className="p-4 sm:p-6 space-y-6 w-full max-w-[1800px] mx-auto text-foreground dark:text-muted-foreground">
      {/* Page Header (No nav element) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border dark:border-border pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {t('shippingOps.dashboard', 'لوحة تشغيل الشحن')}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground mt-1">
            {t('shippingOps.subtitle', 'إدارة الطرود المستقلة، تسعير العملاء، ومتابعة حركة الشحنات والتسليم')}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadStats}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium border border-border dark:border-border rounded-lg hover:bg-muted dark:hover:bg-muted transition active:scale-95 disabled:opacity-50"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 text-foreground dark:text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
            <span>{isEn ? 'Refresh' : 'تحديث'}</span>
          </button>
          <Link
            to="/shipping-ops/wallet"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium border border-border dark:border-border rounded-lg hover:bg-muted dark:hover:bg-muted transition"
            title="المحفظة ودفتر المعاملات"
          >
            <Wallet className="w-4 h-4 text-success dark:text-success" />
            <span>{isEn ? 'Wallet Ledger' : 'المحفظة والمعاملات'}</span>
          </Link>
          <Link
            to="/shipping-ops/parcels"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium border border-border dark:border-border rounded-lg hover:bg-muted dark:hover:bg-muted transition"
          >
            <Boxes className="w-4 h-4 text-foreground dark:text-muted-foreground" />
            <span>{t('shippingOps.parcels', 'سجل الطرود')}</span>
          </Link>
          <Link
            to="/shipping-ops/parcels/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-primary hover:bg-primary dark:bg-primary dark:hover:bg-primary rounded-lg shadow-sm transition active:scale-95"
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

      {/* SHIP-T2: Turbo Financial Wallet Cards (الرصيد · القابل للتوريد · التوريد القادم) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {/* Total Balance */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-xl p-4 sm:p-5 shadow-sm border border-border relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground tracking-wide">
              {isEn ? 'Total Balance' : 'الرصيد الإجمالي'}
            </span>
            <div className="p-2 rounded-lg bg-success/20 text-success">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold tabular-nums tracking-tight text-white mt-1">
            {loading ? '—' : formatCurrency(wallet?.balance ?? 0, wallet?.currency || 'EGP')}
          </div>
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>{isEn ? 'Live Net Liquidity' : 'صافي الرصيد اللحظي'}</span>
            <Link to="/shipping-ops/wallet" className="inline-flex items-center gap-1 text-success hover:text-success font-medium">
              <span>{isEn ? 'Ledger' : 'دفتر المعاملات'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Available For Remittance */}
        <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground dark:text-muted-foreground tracking-wide">
              {isEn ? 'Available for Remittance' : 'القابل للتوريد'}
            </span>
            <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/50 text-primary dark:text-primary">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold tabular-nums tracking-tight text-primary dark:text-primary mt-1">
            {loading ? '—' : formatCurrency(wallet?.availableForRemittance ?? 0, wallet?.currency || 'EGP')}
          </div>
          <div className="mt-3 pt-3 border-t border-border dark:border-border flex items-center justify-between text-xs text-muted-foreground dark:text-muted-foreground">
            <span>{isEn ? 'COD − Fees − Payouts' : 'مجموع COD المحصّل − الرسوم'}</span>
            <Link to="/shipping-ops/settlements" className="text-blue-600 dark:text-primary hover:underline font-medium">
              {isEn ? 'Settlements' : 'كشوف التسوية'}
            </Link>
          </div>
        </div>

        {/* Upcoming Remittance */}
        <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground dark:text-muted-foreground tracking-wide">
              {isEn ? 'Upcoming Remittance' : 'التوريد القادم'}
            </span>
            <div className="p-2 rounded-lg bg-warning/10 dark:bg-warning/50 text-warning dark:text-warning">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold tabular-nums tracking-tight text-warning dark:text-warning mt-1">
            {loading ? '—' : formatCurrency(wallet?.upcomingRemittance ?? 0, wallet?.currency || 'EGP')}
          </div>
          <div className="mt-3 pt-3 border-t border-border dark:border-border flex items-center justify-between text-xs text-muted-foreground dark:text-muted-foreground">
            <span>{isEn ? 'Net Issued Statements' : 'صافي كشوف التسوية المعتمدة'}</span>
            <span className="text-slate-400 font-mono text-[11px]">{isEn ? 'ISSUED/APPROVED' : 'معتمد/قيد الصرف'}</span>
          </div>
        </div>
      </div>

      {/* SHIP-T5: Turbo Policy & Remittance Cards (جدول التوريد + أقصى فترة توصيل) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {/* Remittance Days Card */}
        <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground dark:text-muted-foreground tracking-wide">
              {isEn ? 'Remittance Schedule (Turbo)' : 'جدول أيام التوريد (Turbo)'}
            </span>
            <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/50 text-primary">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-primary mt-1">
            {loading ? '—' : formattedDaysText}
          </div>
          <div className="mt-3 pt-3 border-t border-border dark:border-border flex items-center justify-between text-xs text-muted-foreground dark:text-muted-foreground">
            <span>{isEn ? 'Automatic COD payout cycle' : 'دورة توريد وتحويل متحصلات الشحن'}</span>
            <Link to="/shipping-ops/settings" className="text-primary hover:underline font-medium">
              {isEn ? 'Edit Schedule' : 'تعديل الجدول'}
            </Link>
          </div>
        </div>

        {/* Max Delivery Window & Stale Alert Card */}
        <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground dark:text-muted-foreground tracking-wide">
              {isEn ? 'Max Delivery Window (SLA)' : 'أقصى فترة توصيل مسموحة'}
            </span>
            <div className={`p-2 rounded-lg ${staleCount > 0 ? 'bg-rose-50 text-destructive dark:bg-destructive/50 dark:text-destructive' : 'bg-slate-100 text-foreground dark:bg-muted dark:text-muted-foreground'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-bold tabular-nums tracking-tight text-foreground dark:text-muted-foreground">
              {loading ? '—' : maxDaysVal}
            </span>
            <span className="text-xs text-muted-foreground font-medium">{isEn ? 'Days' : 'يوم'}</span>
            {staleCount > 0 && (
              <span className="me-auto px-2.5 py-0.5 rounded-full text-xs font-bold bg-destructive text-destructive dark:bg-destructive/60 dark:text-destructive animate-pulse">
                {staleCount} {isEn ? 'stale parcels' : 'شحنة متأخرة'}
              </span>
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-border dark:border-border flex items-center justify-between text-xs text-muted-foreground dark:text-muted-foreground">
            <span>{isEn ? 'Threshold for stale parcel alert' : 'تنبيه آلي للشحنات المتجاوزة للمهلة'}</span>
            <Link to="/shipping-ops/parcels" className="text-blue-600 dark:text-primary hover:underline font-medium">
              {isEn ? 'View Parcels' : 'سجل الشحنات'}
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Today Parcels */}
        <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-muted-foreground dark:text-muted-foreground mb-2">
            <span className="text-xs font-medium">{t('shippingOps.kpi.todayShipments', 'شحنات اليوم')}</span>
            <Clock className="w-4 h-4 text-primary" />
          </div>
          <div className="text-xl sm:text-2xl font-bold tabular-nums">
            {loading ? '—' : stats?.todayCount ?? 0}
          </div>
        </div>

        {/* Out for Delivery */}
        <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-muted-foreground dark:text-muted-foreground mb-2">
            <span className="text-xs font-medium">{t('shippingOps.kpi.outForDelivery', 'قيد التسليم')}</span>
            <Truck className="w-4 h-4 text-info" />
          </div>
          <div className="text-xl sm:text-2xl font-bold tabular-nums text-info dark:text-info">
            {loading ? '—' : stats?.outForDeliveryCount ?? 0}
          </div>
        </div>

        {/* Delivered */}
        <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-muted-foreground dark:text-muted-foreground mb-2">
            <span className="text-xs font-medium">{t('shippingOps.kpi.delivered', 'مسلّمة بنجاح')}</span>
            <CheckCircle2 className="w-4 h-4 text-success" />
          </div>
          <div className="text-xl sm:text-2xl font-bold tabular-nums text-success dark:text-success">
            {loading ? '—' : stats?.deliveredCount ?? 0}
          </div>
        </div>

        {/* Returned */}
        <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-muted-foreground dark:text-muted-foreground mb-2">
            <span className="text-xs font-medium">{t('shippingOps.kpi.returned', 'مرتجعة')}</span>
            <XCircle className="w-4 h-4 text-destructive" />
          </div>
          <div className="text-xl sm:text-2xl font-bold tabular-nums text-destructive dark:text-destructive">
            {loading ? '—' : stats?.returnedCount ?? 0}
          </div>
        </div>

        {/* Expected COD */}
        <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-muted-foreground dark:text-muted-foreground mb-2">
            <span className="text-xs font-medium">{t('shippingOps.kpi.codExpected', 'COD متوقع')}</span>
            <Banknote className="w-4 h-4 text-warning" />
          </div>
          <div className="text-lg sm:text-xl font-bold tabular-nums text-warning dark:text-warning truncate">
            {loading ? '—' : formatCurrency(stats?.codExpected)}
          </div>
        </div>

        {/* Collected COD */}
        <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-muted-foreground dark:text-muted-foreground mb-2">
            <span className="text-xs font-medium">{t('shippingOps.kpi.codCollected', 'COD محصّل')}</span>
            <Banknote className="w-4 h-4 text-success" />
          </div>
          <div className="text-lg sm:text-xl font-bold tabular-nums text-success dark:text-success truncate">
            {loading ? '—' : formatCurrency(stats?.codCollected)}
          </div>
        </div>
      </div>

      {/* Recent 10 Shipments */}
      <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border dark:border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-primary dark:text-primary" />
            <h2 className="text-sm sm:text-base font-semibold">
              {t('shippingOps.recentShipments', 'آخر ١٠ شحنات مسجلة')}
            </h2>
          </div>
          <Link
            to="/shipping-ops/parcels"
            className="text-xs font-medium text-primary hover:text-primary dark:text-primary inline-flex items-center gap-1"
          >
            <span>{isEn ? 'View all' : 'عرض الكل'}</span>
            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right rtl:text-right ltr:text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-muted text-muted-foreground dark:text-muted-foreground border-b border-border dark:border-border">
              <tr>
                <th className="px-4 py-3 font-medium">{t('shippingOps.list.trackingNumber', 'رقم التتبع')}</th>
                <th className="px-4 py-3 font-medium">{t('shippingOps.list.recipient', 'المستلم')}</th>
                <th className="px-4 py-3 font-medium">{t('shippingOps.list.destination', 'الوجهة')}</th>
                <th className="px-4 py-3 font-medium">{t('shippingOps.list.merchant', 'العميل')}</th>
                <th className="px-4 py-3 font-medium">{t('shippingOps.list.cod', 'مبلغ التحصيل')}</th>
                <th className="px-4 py-3 font-medium">{t('shippingOps.list.cost', 'التكلفة')}</th>
                <th className="px-4 py-3 font-medium">{t('shippingOps.list.status', 'الحالة')}</th>
                <th className="px-4 py-3 font-medium">{t('shippingOps.list.createdAt', 'التاريخ')}</th>
                <th className="px-4 py-3 font-medium text-center">{t('shippingOps.list.actions', 'إجراء')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-border">
              {loading && !stats ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-muted-foreground" />
                    <span>{isEn ? 'Loading shipments...' : 'جاري تحميل الشحنات...'}</span>
                  </td>
                </tr>
              ) : !stats?.recentShipments || stats.recentShipments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                    {t('shippingOps.list.noParcelsFound', 'لا توجد شحنات مسجلة بعد')}
                  </td>
                </tr>
              ) : (
                stats.recentShipments.map((s) => {
                  const badge = getStatusBadge(s.status, isEn);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-muted transition">
                      <td className="px-4 py-3 font-mono font-medium text-primary dark:text-primary">
                        <Link to={`/shipping-ops/parcels/${s.id}`} className="hover:underline">
                          {s.trackingNumber}
                        </Link>
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
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${badge.badgeClass}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(s.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          to={`/shipping-ops/parcels/${s.id}`}
                          className="inline-flex items-center justify-center p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/40 rounded-lg transition"
                          title={t('shippingOps.list.viewDetails', 'عرض التفاصيل')}
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ShippingOpsDashboard;
