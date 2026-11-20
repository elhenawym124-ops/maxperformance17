import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRightIcon,
  BanknotesIcon,
  ArrowPathIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  DocumentCheckIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import courierPortalApi, {
  CustodySummary,
  getCourierToken,
} from './services/courierPortalApi';

export const CourierCustodyPage: React.FC = () => {
  const navigate = useNavigate();
  const [custody, setCustody] = useState<CustodySummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadCustody = useCallback(async () => {
    if (!getCourierToken()) {
      navigate('/courier-portal/login', { replace: true });
      return;
    }

    setLoading(true);
    try {
      const res = await courierPortalApi.getCustodySummary();
      if (res.success && res.data) {
        setCustody(res.data);
      }
    } catch (err: any) {
      if (err?.response?.status === 401) {
        navigate('/courier-portal/login', { replace: true });
        return;
      }
      toast.error('تعذر تحميل تقرير العهدة المالية');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadCustody();
  }, [loadCustody]);

  if (loading && !custody) {
    return (
      <div className="min-h-screen bg-muted dark:bg-muted flex items-center justify-center p-4">
        <ArrowPathIcon className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const expected = custody?.totalCODExpected ?? 0;
  const collected = custody?.totalCODCollected ?? 0;
  const difference = custody?.difference ?? collected;
  const runs = custody?.runs || [];

  return (
    <div className="min-h-screen bg-muted dark:bg-muted text-foreground dark:text-muted-foreground pb-16" dir="rtl">
      {/* Top Header */}
      <header className="bg-white dark:bg-muted border-b border-border dark:border-border sticky top-0 z-20 px-4 py-3 shadow-xs">
        <div className="w-full max-w-[1800px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              to="/courier-portal"
              aria-label="الرجوع للرئيسية"
              className="p-1.5 -me-1.5 text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground rounded-lg hover:bg-muted dark:hover:bg-muted"
            >
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-bold text-sm text-foreground dark:text-muted-foreground">
                العهدة المالية والنقدية
              </h1>
              <p className="text-[11px] text-muted-foreground">
                متابعة المبالغ المحصلة والتوريد للخزينة
              </p>
            </div>
          </div>

          <button
            onClick={() => loadCustody()}
            aria-label="تحديث"
            className="p-2 text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground rounded-lg hover:bg-muted dark:hover:bg-muted transition"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-[1800px] mx-auto p-3.5 sm:p-6 space-y-4">
        {/* Total Cash in Custody Hero Card */}
        <div className="bg-gradient-to-br from-primary to-primary text-white rounded-xl p-4 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-primary">
              المبلغ الواجب توريده للخزينة الآن
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
              <BanknotesIcon className="w-5 h-5 text-white" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono tabular-nums tracking-tight">
              {difference.toLocaleString()}
            </span>
            <span className="text-sm font-semibold text-primary">جنيه مصري</span>
          </div>

          <div className="pt-2 border-t border-white/15 flex items-center justify-between text-xs text-primary">
            <span>مطلوب تحصيله: <strong className="font-mono text-white">{expected.toLocaleString()}</strong> ج.م</span>
            <span>المحصل: <strong className="font-mono text-white">{collected.toLocaleString()}</strong> ج.م</span>
          </div>
        </div>

        {/* Remittance Instructions Banner */}
        <div className="bg-amber-50 dark:bg-warning/40 border border-warning dark:border-warning rounded-xl p-3 flex items-start gap-2.5 text-xs text-warning dark:text-warning">
          <ExclamationTriangleIcon className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">تعليمات التوريد اليومي:</p>
            <p className="text-[11px] text-warning dark:text-warning leading-relaxed">
              يجب تسليم النقدية المحصلة إلى مسؤول الخزينة في نهاية اليوم للحصول على سند التوريد وتصفية مأمورياتك.
            </p>
          </div>
        </div>

        {/* Runs Breakdown Section */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-foreground dark:text-muted-foreground">
              تفاصيل الرحلات والمأموريات ({runs.length})
            </h2>
          </div>

          {runs.length === 0 ? (
            <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-8 text-center text-xs text-muted-foreground">
              لا توجد مأموريات مسجلة اليوم
            </div>
          ) : (
            runs.map((r) => {
              const isSettled = r.status === 'SETTLED';
              const runDiff = (r.totalCODCollected ?? 0);

              return (
                <div
                  key={r.id}
                  className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-3.5 shadow-xs space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-foreground dark:text-muted-foreground">
                          {r.runNumber}
                        </span>
                        {isSettled ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success/10 text-success dark:bg-success/60 dark:text-success border border-success">
                            <CheckBadgeIcon className="w-3.5 h-3.5" />
                            تم التوريد للخزينة
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary dark:bg-primary/60 dark:text-primary border border-primary">
                            <DocumentCheckIcon className="w-3.5 h-3.5" />
                            بانتظار التوريد
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {r.totalShipments} طرد
                      </p>
                    </div>

                    <Link
                      to={`/courier-portal/runs/${r.id}`}
                      className="text-xs font-bold text-primary hover:text-primary"
                    >
                      عرض المانيفست
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border dark:border-border">
                    <div className="bg-slate-50 dark:bg-muted p-2 rounded-lg">
                      <span className="text-[11px] text-muted-foreground block">المبلغ المطلوب (COD):</span>
                      <span className="font-mono font-bold text-foreground dark:text-muted-foreground">
                        {r.totalCODExpected.toLocaleString()} ج.م
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-muted p-2 rounded-lg">
                      <span className="text-[11px] text-muted-foreground block">المبلغ المحصل فعلياً:</span>
                      <span className="font-mono font-bold text-success dark:text-success">
                        {runDiff.toLocaleString()} ج.م
                      </span>
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

export default CourierCustodyPage;
