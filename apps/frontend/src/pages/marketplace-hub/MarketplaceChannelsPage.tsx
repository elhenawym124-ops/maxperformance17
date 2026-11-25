import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, ExternalLink, KeyRound, Trash2, Coins } from 'lucide-react';
import { MarketplaceHubLayout } from './components/MarketplaceHubLayout';
import {
  AmazonOAuthInfo,
  ChannelConnection,
  CountryCode,
  MarketplacePlatform,
  WalletSummary,
  marketplaceHubService,
} from '../../services/marketplaceHubService';

export const MarketplaceChannelsPage: React.FC = () => {
  const [country, setCountry] = useState<CountryCode>('EGY');
  const [connections, setConnections] = useState<ChannelConnection[]>([]);
  const [amazonOAuth, setAmazonOAuth] = useState<AmazonOAuthInfo | null>(null);
  const [wallet, setWallet] = useState<WalletSummary | null>(null);

  // Quick connect form
  const [platform, setPlatform] = useState<MarketplacePlatform>('amazon');
  const [storeName, setStoreName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');

  // Custom Plan Builder
  const [usage, setUsage] = useState({ studio: 10, alpha: 30, leo: 50, emma: 100, bekam: 20 });
  const [planQuote, setPlanQuote] = useState<{
    totalCredits: number;
    discountPct: number;
    listPriceUsd: number;
    discountedPriceUsd: number;
  } | null>(null);

  const loadAll = async () => {
    try {
      const [connData, walletData] = await Promise.all([
        marketplaceHubService.getConnections(country),
        marketplaceHubService.getWallet(),
      ]);
      setConnections(connData.connections);
      setAmazonOAuth(connData.amazonOAuth);
      setWallet(walletData);
    } catch {
      toast.error('تعذر تحميل بيانات الربط والمحفظة');
    }
  };

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country]);

  useEffect(() => {
    marketplaceHubService
      .calculateCustomPlan(usage)
      .then(setPlanQuote)
      .catch(() => {});
  }, [usage]);

  const handleSaveConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await marketplaceHubService.saveConnection({
        platform,
        country,
        storeName: storeName || `${platform.toUpperCase()} Store`,
        authMode: platform === 'amazon' ? 'SP_API_OAUTH' : 'API_KEY',
        credentials: { apiKey, apiSecret },
      });
      setApiKey('');
      setApiSecret('');
      toast.success('تم حفظ إعدادات القناة وتشفير المفاتيح');
      await loadAll();
    } catch {
      toast.error('تعذر حفظ الربط');
    }
  };

  const handleDelete = async (p: MarketplacePlatform, c: CountryCode) => {
    try {
      await marketplaceHubService.deleteConnection(p, c);
      toast.success('تم فصل القناة');
      await loadAll();
    } catch {
      toast.error('تعذر فصل القناة');
    }
  };

  return (
    <MarketplaceHubLayout title="ربط المنصات ومحفظة الكريدت">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Channel Connections & Amazon SP-API Readiness */}
        <div className="space-y-4 lg:col-span-7">
          <div className="flex items-center justify-between border-b border-border/70 pb-3">
            <h2 className="text-sm font-semibold text-foreground">ربط القنوات والأسواق</h2>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value as CountryCode)}
              className="rounded border border-border/70 bg-background px-2.5 py-1 text-xs"
            >
              <option value="EGY">مصر (EGY)</option>
              <option value="KSA">السعودية (KSA)</option>
              <option value="UAE">الإمارات (UAE)</option>
            </select>
          </div>

          {amazonOAuth && !amazonOAuth.ready && (
            <div className="rounded-md border border-border/70 bg-muted/30 p-3 text-xs">
              <div className="font-semibold text-foreground">حالة ربط Amazon SP-API</div>
              <p className="mt-1 text-muted-foreground">{amazonOAuth.reason}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {amazonOAuth.sellerSignupUrl && (
                  <a
                    href={amazonOAuth.sellerSignupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded border border-border/70 bg-card px-2.5 py-1 font-medium hover:border-primary/60"
                  >
                    <span>فتح حساب بائع أمازون</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {amazonOAuth.developerRegisterUrl && (
                  <a
                    href={amazonOAuth.developerRegisterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded border border-border/70 bg-card px-2.5 py-1 font-medium hover:border-primary/60"
                  >
                    <span>تسجيل تطبيق SP-API</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSaveConnection} className="space-y-3 rounded-md border border-border/70 bg-background p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">المنصة</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as MarketplacePlatform)}
                  className="w-full rounded border border-border/70 bg-card px-3 py-2 text-xs"
                >
                  <option value="amazon">Amazon (SP-API)</option>
                  <option value="noon">Noon (Partner API / JSON)</option>
                  <option value="jumia">Jumia (Vendor OAuth2)</option>
                  <option value="trendyol">Trendyol (Seller API)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">اسم المتجر</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="مثال: متجر الشركة الرسمي"
                  className="w-full rounded border border-border/70 bg-card px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Client ID / API Key</label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  dir="ltr"
                  className="w-full rounded border border-border/70 bg-card px-3 py-2 font-mono text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Client Secret / Token</label>
                <input
                  type="password"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  dir="ltr"
                  className="w-full rounded border border-border/70 bg-card px-3 py-2 font-mono text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>حفظ وتشفيـر بيانات الربط</span>
            </button>
          </form>

          {/* Saved Connections */}
          <div className="divide-y divide-border/50 rounded-md border border-border/70 bg-background">
            {connections.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">لا توجد قنوات مربوطة حالياً</div>
            ) : (
              connections.map((c) => (
                <div key={c.id} className="flex items-center justify-between px-4 py-3 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <div>
                      <div className="font-semibold uppercase">
                        {c.platform} ({c.country})
                      </div>
                      <div className="text-[11px] text-muted-foreground">{c.storeName}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded border border-border/70 px-2 py-0.5 font-mono text-[10px]">
                      {c.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleDelete(c.platform, c.country)}
                      aria-label="حذف الربط"
                      className="rounded p-1 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Credit Wallet & Custom Plan Builder */}
        <div className="space-y-4 border-t border-border/70 pt-4 lg:col-span-5 lg:rounded-md lg:border lg:bg-muted/20 lg:p-5">
          <div className="flex items-center justify-between border-b border-border/70 pb-3">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">محفظة الكريدت</h2>
            </div>
            <span className="font-mono text-lg font-bold tabular-nums text-primary">
              {wallet ? `${wallet.wallet.balance} Cr` : '...'}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="font-semibold text-foreground">صمم باقتك (خصم 20%)</div>
            {[
              { key: 'studio', label: 'استوديو كامل (18 Cr)' },
              { key: 'alpha', label: 'صور Alpha (3 Cr)' },
              { key: 'leo', label: 'محتوى Leo (2 Cr)' },
              { key: 'emma', label: 'مساعد التاجر (1 Cr)' },
              { key: 'bekam', label: 'مقارنة أسعار (4 Cr)' },
            ].map((item) => {
              const k = item.key as keyof typeof usage;
              return (
                <div key={item.key} className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">{item.label}</span>
                  <input
                    type="number"
                    min={0}
                    value={usage[k]}
                    onChange={(e) => setUsage((prev) => ({ ...prev, [k]: Math.max(0, Number(e.target.value)) }))}
                    className="w-20 rounded border border-border/70 bg-card px-2 py-1 text-center font-mono tabular-nums"
                  />
                </div>
              );
            })}

            {planQuote && (
              <div className="mt-3 flex items-center justify-between rounded border border-border/70 bg-card p-3">
                <div>
                  <div className="text-muted-foreground">الكريدت الشهري</div>
                  <div className="font-mono text-sm font-bold tabular-nums">{planQuote.totalCredits} Cr</div>
                </div>
                <div className="text-end">
                  <div className="font-mono text-[11px] tabular-nums text-muted-foreground line-through">
                    ${planQuote.listPriceUsd}
                  </div>
                  <div className="font-mono text-base font-bold tabular-nums text-primary">
                    ${planQuote.discountedPriceUsd} / 30 يوم
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MarketplaceHubLayout>
  );
};

export default MarketplaceChannelsPage;
