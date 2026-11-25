import React, { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Coins, KeyRound, Loader2, RefreshCcw, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../../components/ui/button';
import { aiCreditsService, MerchantAiCreditsSummary } from '../../../services/aiCreditsService';
import { CreditTopupPanel } from './CreditTopupPanel';

export default function MerchantAiCreditsPage() {
  const location = useLocation();
  const [summary, setSummary] = useState<MerchantAiCreditsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await aiCreditsService.getSummary();
      setSummary(data);
    } catch {
      toast.error('تعذر تحميل بيانات رصيد الكريدت');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const orderId = params.get('orderId');
    if (orderId && orderId.startsWith('AIC-')) {
      window.history.replaceState({}, '', location.pathname);
      aiCreditsService
        .verifyKashierTopup(orderId)
        .then((res) => {
          if (res.verified) toast.success(res.message || 'تم شحن الكريدت بنجاح');
          else toast.info(res.message || 'جاري التحقق من الدفع');
        })
        .catch(() => {})
        .finally(() => void load());
    } else {
      void load();
    }
  }, [location.search, location.pathname, load]);

  const toggleAutoTopup = async (enabled: boolean) => {
    if (!summary) return;
    setSavingPrefs(true);
    try {
      const fallbackPkgId = summary.wallet.autoTopupPackageId || summary.packages[0]?.id || null;
      await aiCreditsService.updatePreferences({
        autoTopupEnabled: enabled,
        autoTopupPackageId: fallbackPkgId,
      });
      toast.success(enabled ? 'تم تفعيل الشحن التلقائي من المحفظة' : 'تم إيقاف الشحن التلقائي');
      await load();
    } catch {
      toast.error('فشل تحديث الإعدادات');
    } finally {
      setSavingPrefs(false);
    }
  };

  if (loading || !summary) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 p-3 sm:p-5" dir="rtl">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-border/70 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted/30 text-primary">
            <Coins className="size-4.5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
              رصيد وكريدت الذكاء الاصطناعي
            </h1>
            <p className="text-xs text-muted-foreground">
              إدارة رصيد الأيجنت والتوكن واختيار باقة وطريقة الشحن المناسبة
            </p>
          </div>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={() => void load()} aria-label="تحديث">
          <RefreshCcw className="size-3.5" />
        </Button>
      </div>

      {/* Single-Surface Telemetry Strip */}
      <div className="grid divide-y divide-border/60 rounded-xl border border-border/70 bg-card sm:grid-cols-4 sm:divide-x sm:divide-x-reverse sm:divide-y-0">
        <div className="p-4">
          <div className="text-xs text-muted-foreground">الرصيد المتاح</div>
          <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-primary">
            {summary.wallet.totalAvailable.toLocaleString('en-US')} <span className="text-xs font-normal">Cr</span>
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs text-muted-foreground">الاستهلاك اليومي</div>
          <div className="mt-1 font-mono text-xl font-semibold tabular-nums text-foreground">
            {summary.wallet.dailyUsed.toLocaleString('en-US')}
            <span className="text-xs font-normal text-muted-foreground">
              {' '}
              / {summary.wallet.effectiveDailyLimit.toLocaleString('en-US')}
            </span>
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs text-muted-foreground">سعر الكريدت</div>
          <div className="mt-1 font-mono text-xl font-semibold tabular-nums text-foreground">
            {summary.pricing.creditPriceEgp} <span className="text-xs font-normal">ج.م</span>
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs text-muted-foreground">وضع المفاتيح</div>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
            {summary.byokActive && summary.pricing.byokFreeTokens ? (
              <>
                <KeyRound className="size-4 text-success" />
                <span>BYOK (مفاتيحك مجاناً)</span>
              </>
            ) : (
              <>
                <ShieldCheck className="size-4 text-primary" />
                <span>Platform Managed</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Top-up Options & Auto-topup */}
      <div className="rounded-xl border border-border/70 bg-card p-3 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
          <h2 className="text-sm font-semibold text-foreground">شحن رصيد الكريدت</h2>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              disabled={savingPrefs}
              checked={summary.wallet.autoTopupEnabled}
              onChange={(e) => void toggleAutoTopup(e.target.checked)}
              className="size-4 accent-primary"
            />
            <span>تفعيل الشحن التلقائي من محفظة الشركة عند نفاد الرصيد</span>
          </label>
        </div>

        <CreditTopupPanel
          packages={summary.packages}
          companyWalletBalance={summary.companyWalletBalance}
          onSuccess={() => void load()}
        />
      </div>

      {/* Usage & Top-up Ledger */}
      <div className="rounded-xl border border-border/70 bg-card p-3 sm:p-5">
        <h2 className="mb-3 border-b border-border/60 pb-2.5 text-sm font-semibold text-foreground">
          سجل حركات الكريدت والاستهلاك
        </h2>
        {summary.transactions.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground">لا توجد حركات مسجلة بعد</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/70 text-muted-foreground">
                  <th className="py-2 pe-3 text-start font-medium">الوصف</th>
                  <th className="py-2 px-2 text-start font-medium">الموديل</th>
                  <th className="py-2 px-2 text-start font-medium">الرصيد</th>
                  <th className="py-2 px-2 text-start font-medium">الحالة</th>
                  <th className="py-2 ps-2 text-end font-medium">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {summary.transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="py-2.5 pe-3 text-foreground">{tx.description || tx.type}</td>
                    <td className="py-2.5 px-2 font-mono text-[11px] text-muted-foreground" dir="ltr">
                      {tx.modelName || tx.source}
                    </td>
                    <td
                      className={`py-2.5 px-2 font-mono font-semibold tabular-nums ${
                        tx.creditsDelta >= 0 ? 'text-success' : 'text-foreground'
                      }`}
                    >
                      {tx.creditsDelta >= 0 ? `+${tx.creditsDelta}` : tx.creditsDelta} Cr
                    </td>
                    <td className="py-2.5 px-2 font-mono text-[11px]">{tx.status}</td>
                    <td className="py-2.5 ps-2 text-end font-mono text-[11px] tabular-nums text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleString('ar-EG', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
