import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { BarChart3, RefreshCw, PlugZap, ShoppingBag, DollarSign, PackageCheck } from 'lucide-react';
import { MarketplaceHubLayout } from './components/MarketplaceHubLayout';
import {
  ChannelAnalyticsResponse,
  CountryCode,
  marketplaceHubService,
} from '../../services/marketplaceHubService';

type AnalyticsTab = 'overview' | 'sales' | 'products' | 'payments';

const DATE_RANGES = [
  { id: '1d', label: 'اليوم' },
  { id: '7d', label: 'آخر 7 أيام' },
  { id: '15d', label: 'آخر 15 يوماً' },
  { id: '30d', label: 'آخر 30 يوماً' },
  { id: '60d', label: 'آخر 60 يوماً' },
];

export const MarketplaceDashboardPage: React.FC = () => {
  const [tab, setTab] = useState<AnalyticsTab>('overview');
  const [country, setCountry] = useState<CountryCode>('EGY');
  const [dateRange, setDateRange] = useState<string>('30d');
  const [loading, setLoading] = useState<boolean>(false);
  const [analytics, setAnalytics] = useState<ChannelAnalyticsResponse | null>(null);

  // Optional direct Sandbox test inputs
  const [showSandboxForm, setShowSandboxForm] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [apiSecret, setApiSecret] = useState<string>('');
  const [refreshToken, setRefreshToken] = useState<string>('');
  const [region, setRegion] = useState<'na' | 'eu'>('na');

  const fetchDashboard = async (useManualCreds = false) => {
    setLoading(true);
    try {
      const data = await marketplaceHubService.getDashboardAnalytics({
        country,
        dateRange,
        region,
        mode: 'sandbox',
        credentials: useManualCreds && apiKey && apiSecret && refreshToken
          ? { apiKey, apiSecret, refreshToken }
          : undefined,
      });
      setAnalytics(data);
      if (useManualCreds && data.connected) {
        toast.success('تمت مزامنة الطلبات من Amazon SP-API Sandbox');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'تعذر تحميل تحليلات القنوات';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDashboard(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, dateRange]);

  const currency = analytics?.currency || 'EGP';

  return (
    <MarketplaceHubLayout title="لوحة تحليلات القنوات الموحدة">
      {/* Global Controls */}
      <div className="mb-4 flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value as CountryCode)}
            className="rounded border border-border/70 bg-background px-2.5 py-1.5 text-xs"
          >
            <option value="EGY">مصر (EGY)</option>
            <option value="KSA">السعودية (KSA)</option>
            <option value="UAE">الإمارات (UAE)</option>
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="rounded border border-border/70 bg-background px-2.5 py-1.5 text-xs"
          >
            {DATE_RANGES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => void fetchDashboard(Boolean(apiKey && apiSecret && refreshToken))}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded border border-border/70 bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted/60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>تحديث</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowSandboxForm((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
        >
          <PlugZap className="h-3.5 w-3.5" />
          <span>مزامنة فورية من SP-API Sandbox</span>
        </button>
      </div>

      {showSandboxForm && (
        <div className="mb-5 space-y-3 rounded-md border border-border/70 bg-muted/20 p-4">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-4">
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              dir="ltr"
              placeholder="LWA Client ID"
              className="rounded border border-border/70 bg-card px-2.5 py-1.5 font-mono text-xs"
            />
            <input
              type="password"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              dir="ltr"
              placeholder="Client Secret"
              className="rounded border border-border/70 bg-card px-2.5 py-1.5 font-mono text-xs"
            />
            <input
              type="password"
              value={refreshToken}
              onChange={(e) => setRefreshToken(e.target.value)}
              dir="ltr"
              placeholder="Refresh Token (Atzr|...)"
              className="rounded border border-border/70 bg-card px-2.5 py-1.5 font-mono text-xs"
            />
            <div className="flex gap-2">
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value as 'na' | 'eu')}
                className="flex-1 rounded border border-border/70 bg-card px-2 py-1.5 text-xs"
              >
                <option value="na">NA (ATVPDKIKX0DER)</option>
                <option value="eu">EU (ARBP9OOSHTCHU)</option>
              </select>
              <button
                type="button"
                disabled={loading}
                onClick={() => void fetchDashboard(true)}
                className="rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
              >
                سحب
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4 Sub-tabs */}
      <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'overview', label: 'نظرة عامة (Overview+)' },
          { id: 'sales', label: 'المبيعات والطلبات' },
          { id: 'products', label: 'أداء القنوات والمنتجات' },
          { id: 'payments', label: 'المدفوعات والتسويات' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id as AnalyticsTab)}
            className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              tab === item.id
                ? 'bg-primary text-primary-foreground'
                : 'border border-border/70 bg-background text-muted-foreground hover:text-foreground'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {!analytics?.connected ? (
        <div className="rounded-md border border-border/70 bg-background p-8 text-center">
          <BarChart3 className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <div className="text-sm font-semibold text-foreground">لا توجد قناة مربوطة لهذه الدولة حالياً</div>
          <p className="mt-1 text-xs text-muted-foreground">
            اربط حساب Amazon أو استخدم زر المزامنة الفورية مع Sandbox لعرض الطلبات والتسويات هنا.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Link
              to="/marketplace-hub/channels"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
            >
              <PlugZap className="h-3.5 w-3.5" />
              <span>الانتقال لصفحة ربط المنصات</span>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {tab === 'overview' && analytics.overview && (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="rounded-md border border-border/70 bg-background p-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>إجمالي الطلبات</span>
                  <ShoppingBag className="h-4 w-4 text-primary" />
                </div>
                <div className="mt-2 font-mono text-2xl font-bold tabular-nums">{analytics.overview.totalOrders}</div>
              </div>
              <div className="rounded-md border border-border/70 bg-background p-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>إجمالي الإيرادات</span>
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
                <div className="mt-2 font-mono text-2xl font-bold tabular-nums">
                  {analytics.overview.totalRevenue.toFixed(2)} {currency}
                </div>
              </div>
              <div className="rounded-md border border-border/70 bg-background p-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>قيد التجهيز (Unshipped)</span>
                  <PackageCheck className="h-4 w-4 text-primary" />
                </div>
                <div className="mt-2 font-mono text-2xl font-bold tabular-nums">{analytics.overview.unshippedCount}</div>
              </div>
              <div className="rounded-md border border-border/70 bg-background p-4">
                <div className="text-xs text-muted-foreground">متوسط قيمة الطلب</div>
                <div className="mt-2 font-mono text-2xl font-bold tabular-nums">
                  {analytics.overview.averageOrderValue.toFixed(2)} {currency}
                </div>
              </div>
            </div>
          )}

          {tab === 'sales' && (
            <div className="overflow-x-auto border-t border-border/70 sm:rounded-md sm:border">
              <table className="w-full text-start text-xs">
                <thead className="border-b border-border/70 bg-muted/30 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2.5 text-start">رقم الطلب</th>
                    <th className="px-3 py-2.5 text-start">القناة</th>
                    <th className="px-3 py-2.5 text-start">الحالة</th>
                    <th className="px-3 py-2.5 text-end">القطع</th>
                    <th className="px-3 py-2.5 text-end">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {analytics.sales.map((o) => (
                    <tr key={o.orderId}>
                      <td className="px-3 py-2.5 font-mono tabular-nums">{o.orderId}</td>
                      <td className="px-3 py-2.5">{o.salesChannel} ({o.fulfillmentChannel})</td>
                      <td className="px-3 py-2.5 font-mono">{o.status}</td>
                      <td className="px-3 py-2.5 text-end font-mono tabular-nums">{o.itemsCount}</td>
                      <td className="px-3 py-2.5 text-end font-mono font-semibold tabular-nums">
                        {o.amount.toFixed(2)} {o.currency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'products' && (
            <div className="overflow-x-auto border-t border-border/70 sm:rounded-md sm:border">
              <table className="w-full text-start text-xs">
                <thead className="border-b border-border/70 bg-muted/30 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2.5 text-start">القناة / نموذج الشحن</th>
                    <th className="px-3 py-2.5 text-end">عدد الطلبات</th>
                    <th className="px-3 py-2.5 text-end">الوحدات</th>
                    <th className="px-3 py-2.5 text-end">الإيرادات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {analytics.productsPerformance.map((row) => (
                    <tr key={row.channel}>
                      <td className="px-3 py-2.5 font-medium">{row.channel}</td>
                      <td className="px-3 py-2.5 text-end font-mono tabular-nums">{row.ordersCount}</td>
                      <td className="px-3 py-2.5 text-end font-mono tabular-nums">{row.units}</td>
                      <td className="px-3 py-2.5 text-end font-mono font-semibold tabular-nums">
                        {row.revenue.toFixed(2)} {currency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'payments' && analytics.payments && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-md border border-border/70 bg-background p-4">
                <div className="text-xs text-muted-foreground">إجمالي المبيعات</div>
                <div className="mt-1 font-mono text-xl font-bold tabular-nums">
                  {analytics.payments.grossSales.toFixed(2)} {currency}
                </div>
              </div>
              <div className="rounded-md border border-border/70 bg-background p-4">
                <div className="text-xs text-muted-foreground">عمولة تقديرية (13%)</div>
                <div className="mt-1 font-mono text-xl font-semibold tabular-nums">
                  -{analytics.payments.estimatedCommission.toFixed(2)} {currency}
                </div>
              </div>
              <div className="rounded-md border border-border/70 bg-background p-4">
                <div className="text-xs text-muted-foreground">شحن تقديري</div>
                <div className="mt-1 font-mono text-xl font-semibold tabular-nums">
                  -{analytics.payments.estimatedShipping.toFixed(2)} {currency}
                </div>
              </div>
              <div className="rounded-md border border-border/70 bg-background p-4">
                <div className="text-xs text-muted-foreground">صافي التسوية المتوقع</div>
                <div className="mt-1 font-mono text-xl font-bold tabular-nums text-primary">
                  {analytics.payments.netPayout.toFixed(2)} {currency}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </MarketplaceHubLayout>
  );
};

export default MarketplaceDashboardPage;
