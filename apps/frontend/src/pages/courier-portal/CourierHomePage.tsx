import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  TruckIcon,
  ArrowRightOnRectangleIcon,
  ArrowPathIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ChevronLeftIcon,
  WifiIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import courierPortalApi, {
  CourierUser,
  CourierKPIs,
  DeliveryRunSummary,
  getCourierToken,
  getCourierUser,
} from './services/courierPortalApi';
import { useOfflineQueue } from './services/offlineQueue';
import { resolveBrandingLogoUrl, useCompanyBranding } from '../../hooks/useCompanyBranding';
import { extractCompanyIdFromToken } from '../../utils/portalSessionManager';
import { PortalInstallBanner } from '../../components/common/PortalInstallBanner';
import { PortalPushToggle } from '../../components/common/PortalPushToggle';

const DEFAULT_STATUS_LABEL = { label: 'في الميدان', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200' };
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'مسودة', color: 'bg-slate-100 text-foreground dark:bg-muted dark:text-muted-foreground' },
  DISPATCHED: { label: 'في الميدان', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200' },
  COMPLETED: { label: 'مكتملة', color: 'bg-emerald-50 text-success dark:bg-success/60 dark:text-success border-success' },
  SETTLED: { label: 'تم التوريد', color: 'bg-purple-50 text-primary dark:bg-primary/60 dark:text-primary border-primary' },
  CANCELLED: { label: 'ملغاة', color: 'bg-rose-50 text-destructive dark:bg-destructive/60 dark:text-destructive border-destructive' },
};

export const CourierHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { queueCount, isSyncing, isOnline, syncNow } = useOfflineQueue();

  const [courier, setCourier] = useState<CourierUser | null>(getCourierUser());
  const [runs, setRuns] = useState<DeliveryRunSummary[]>([]);
  const [kpis, setKpis] = useState<CourierKPIs>({
    deliveredCount: 0,
    pendingCount: 0,
    returnedCount: 0,
    totalCODExpected: 0,
    totalCODCollected: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [logoError, setLogoError] = useState<boolean>(false);

  const courierCompanyId = courier?.companyId || extractCompanyIdFromToken(getCourierToken());
  const branding = useCompanyBranding(courierCompanyId);
  const accentColor = branding.accent?.trim() || '#2563eb';
  const resolvedLogo = !logoError ? resolveBrandingLogoUrl(branding.logo) : null;
  const brandTitle = branding.name?.trim() || courier?.companyName?.trim() || 'بوابة الكابتن';

  useEffect(() => {
    setLogoError(false);
  }, [branding.logo]);

  const loadData = useCallback(async () => {
    if (!getCourierToken()) {
      navigate('/courier-portal/login', { replace: true });
      return;
    }

    setLoading(true);
    try {
      const res = await courierPortalApi.getMe();
      if (res.success) {
        if (res.courier) setCourier(res.courier);
        if (res.todayRuns) setRuns(res.todayRuns);
        if (res.kpis) setKpis(res.kpis);
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        navigate('/courier-portal/login', { replace: true });
        return;
      }
      toast.error('تعذر تحديث بيانات المأموريات');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleLogout = async () => {
    await courierPortalApi.logout();
    navigate('/courier-portal/login', { replace: true });
  };

  const handleManualSync = async () => {
    try {
      const result = await syncNow();
      if (!result) return;
      if (result.failed === 0) toast.success(`تم مزامنة ${result.synced} عملية بنجاح`);
      else toast.warning(`تم مزامنة ${result.synced}، وتعذر ${result.failed} عمليات`);
      void loadData();
    } catch {
      toast.error('فشلت محاولة المزامنة، تحقق من الاتصال بالشبكة');
    }
  };

  return (
    <div
      className="min-h-screen bg-muted dark:bg-muted text-foreground dark:text-muted-foreground pb-16"
      dir="rtl"
      style={{ '--portal-primary': accentColor, '--auth-accent': accentColor } as React.CSSProperties}
    >
      <header className="bg-white dark:bg-muted border-b border-border dark:border-border sticky top-0 z-20 px-3 sm:px-4 py-2.5 shadow-xs">
        <div className="w-full max-w-[1800px] mx-auto flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            {resolvedLogo ? (
              <img src={resolvedLogo} alt={brandTitle} onError={() => setLogoError(true)} className="w-9 h-9 shrink-0 rounded-xl object-contain bg-white border border-border dark:border-border p-0.5 shadow-xs" />
            ) : (
              <div className="w-9 h-9 shrink-0 rounded-xl text-white flex items-center justify-center font-bold shadow-xs" style={{ backgroundColor: accentColor }}>
                <TruckIcon className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm text-foreground dark:text-muted-foreground truncate">{courier?.name || 'كابتن التوصيل'}</h1>
                {isOnline ? (
                  <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-success dark:text-success">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    متصل
                  </span>
                ) : (
                  <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-warning dark:text-warning">
                    <WifiIcon className="w-3 h-3" />
                    أوفلاين
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
                {branding.name ? <span className="truncate font-medium text-muted-foreground dark:text-muted-foreground">{branding.name} ·</span> : null}
                <span className="font-mono tabular-nums" dir="ltr">{courier?.phone}</span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <PortalPushToggle portal="courier" accentColor={accentColor} />
            <button
              type="button"
              onClick={() => void loadData()}
              aria-label="تحديث"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground rounded-lg hover:bg-muted dark:hover:bg-muted transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
            >
              <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => void handleLogout()}
              aria-label="تسجيل الخروج"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center text-muted-foreground hover:text-destructive dark:hover:text-destructive rounded-lg hover:bg-muted dark:hover:bg-muted transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="w-full max-w-[1800px] mx-auto p-3.5 sm:p-6 space-y-4">
        <PortalInstallBanner
          portal="courier"
          companyId={branding.companyId || courierCompanyId}
          companyName={brandTitle}
          companyLogo={branding.logo}
          accentColor={accentColor}
        />

        {queueCount > 0 ? (
          <div className="bg-amber-50 dark:bg-warning/40 border border-warning dark:border-warning rounded-xl p-3 flex items-center justify-between gap-2 text-xs text-warning dark:text-warning shadow-xs">
            <div className="flex min-w-0 items-center gap-2">
              <CloudArrowUpIcon className="w-5 h-5 text-warning flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold truncate">يوجد <span className="font-mono tabular-nums">{queueCount}</span> عمليات أوفلاين معلقة</p>
                <p className="text-[11px] text-warning dark:text-warning truncate">تم حفظها محلياً وسيتم رفعها للسيرفر</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void handleManualSync()}
              disabled={isSyncing || !isOnline}
              className="min-h-[44px] shrink-0 px-3 py-1.5 bg-warning text-white rounded-lg font-bold text-xs hover:bg-warning disabled:opacity-40 transition flex items-center gap-1.5 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer"
            >
              {isSyncing ? (
                <>
                  <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                  <span>جاري الرفع…</span>
                </>
              ) : (
                <span>مزامنة الآن</span>
              )}
            </button>
          </div>
        ) : null}

        <Link
          to="/courier-portal/custody"
          className="flex min-h-[44px] items-center justify-between bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-3 shadow-xs hover:border-blue-400 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="w-8 h-8 shrink-0 rounded-lg bg-success/10 dark:bg-success/50 text-success flex items-center justify-center">
              <BanknotesIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs text-foreground dark:text-muted-foreground truncate">العهدة المالية والنقدية</p>
              <p className="text-[11px] text-muted-foreground dark:text-muted-foreground truncate">
                المحصل اليوم: <span className="font-mono font-bold text-success tabular-nums">{kpis.totalCODCollected.toLocaleString()}</span> ج.م
              </p>
            </div>
          </div>
          <ChevronLeftIcon className="w-4 h-4 shrink-0 text-muted-foreground" />
        </Link>

        <section className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-3.5 shadow-xs">
          <h2 className="text-xs font-bold text-muted-foreground dark:text-muted-foreground mb-2.5">إحصائيات إنجاز اليوم</h2>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-emerald-50/60 dark:bg-success/30 rounded-lg p-2.5 text-center">
              <div className="flex items-center justify-center text-success mb-1"><CheckCircleIcon className="w-4 h-4" /></div>
              <div className="text-lg font-bold font-mono text-success dark:text-success tabular-nums">{kpis.deliveredCount}</div>
              <div className="text-[11px] text-success/80 dark:text-success font-medium">تم التسليم</div>
            </div>
            <div className="bg-blue-50/60 dark:bg-blue-950/30 rounded-lg p-2.5 text-center">
              <div className="flex items-center justify-center text-blue-600 mb-1"><ClockIcon className="w-4 h-4" /></div>
              <div className="text-lg font-bold font-mono text-blue-700 dark:text-blue-300 tabular-nums">{kpis.pendingCount}</div>
              <div className="text-[11px] text-blue-700/80 dark:text-blue-400 font-medium">متبقي / قيد التوصيل</div>
            </div>
            <div className="bg-rose-50/60 dark:bg-destructive/30 rounded-lg p-2.5 text-center">
              <div className="flex items-center justify-center text-destructive mb-1"><XCircleIcon className="w-4 h-4" /></div>
              <div className="text-lg font-bold font-mono text-destructive dark:text-destructive tabular-nums">{kpis.returnedCount}</div>
              <div className="text-[11px] text-destructive/80 dark:text-destructive font-medium">تعذر / مرتجع</div>
            </div>
          </div>

          <div className="mt-2.5 pt-2.5 border-t border-border dark:border-border grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between items-center gap-1 px-2 py-1.5 bg-muted dark:bg-muted rounded-lg">
              <span className="text-slate-500 text-[11px] truncate">مطلوب تحصيله:</span>
              <span className="font-bold text-foreground dark:text-muted-foreground tabular-nums shrink-0"><span className="font-mono">{kpis.totalCODExpected.toLocaleString()}</span> ج.م</span>
            </div>
            <div className="flex justify-between items-center gap-1 px-2 py-1.5 bg-muted dark:bg-muted rounded-lg">
              <span className="text-slate-500 text-[11px] truncate">محصل فعلياً:</span>
              <span className="font-bold text-success dark:text-success tabular-nums shrink-0"><span className="font-mono">{kpis.totalCODCollected.toLocaleString()}</span> ج.م</span>
            </div>
          </div>
        </section>

        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-foreground dark:text-muted-foreground tabular-nums">مأموريات اليوم ({runs.length})</h2>
          </div>

          {runs.length === 0 ? (
            <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-8 text-center shadow-xs">
              <TruckIcon className="w-10 h-10 text-muted-foreground dark:text-foreground mx-auto mb-2" />
              <p className="text-xs font-semibold text-foreground dark:text-muted-foreground">لا توجد مأموريات نشطة مسندة لك اليوم</p>
              <p className="text-[11px] text-muted-foreground mt-1">سيظهر بيان الشحنات هنا فور قيام الإدارة بإسناد المأمورية وخروجك للتوزيع</p>
            </div>
          ) : (
            runs.map((r) => {
              const status = (r.status ? STATUS_LABELS[r.status] : undefined) ?? DEFAULT_STATUS_LABEL;
              const delivered = r.deliveredCount ?? 0;
              const total = r.totalShipments || 1;
              const pct = Math.round((delivered / total) * 100);

              return (
                <div key={r.id} className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-3.5 shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-foreground dark:text-muted-foreground tabular-nums">{r.runNumber}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border shrink-0 ${status.color}`}>{status.label}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        <span className="font-mono tabular-nums">{r.totalShipments}</span> طرد — مطلوب تحصيل{' '}
                        <span className="font-mono font-semibold text-foreground dark:text-muted-foreground tabular-nums">{r.totalCODExpected.toLocaleString()}</span> ج.م
                      </p>
                    </div>

                    <Link
                      to={`/courier-portal/runs/${r.id}`}
                      style={{ backgroundColor: accentColor }}
                      className="min-h-[44px] shrink-0 px-3.5 py-2 hover:opacity-95 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      <span>فتح الرحلة</span>
                      <ChevronLeftIcon className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                      <span>إنجاز التسليم</span>
                      <span className="font-semibold tabular-nums">{delivered} من {r.totalShipments} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-muted dark:bg-muted rounded-full h-2 overflow-hidden">
                      <div className="bg-emerald-500 h-2 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </main>
    </div>
  );
};

export default CourierHomePage;
