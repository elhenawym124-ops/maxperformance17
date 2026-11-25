import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Calculator, RefreshCw } from 'lucide-react';
import { MarketplaceHubLayout } from './components/MarketplaceHubLayout';
import {
  CalculateProfitPayload,
  CountryCode,
  MarketplaceHubMetadata,
  MarketplacePlatform,
  ProfitCalculationResult,
  marketplaceHubService,
} from '../../services/marketplaceHubService';

const PLATFORMS: { id: MarketplacePlatform; label: string }[] = [
  { id: 'amazon', label: 'Amazon' },
  { id: 'noon', label: 'Noon' },
  { id: 'jumia', label: 'Jumia' },
  { id: 'trendyol', label: 'Trendyol' },
];

export const MarketplaceCalculatorPage: React.FC = () => {
  const [metadata, setMetadata] = useState<MarketplaceHubMetadata | null>(null);
  const [platform, setPlatform] = useState<MarketplacePlatform>('amazon');
  const [country, setCountry] = useState<CountryCode>('EGY');
  const [productCost, setProductCost] = useState<number>(100);
  const [profitMarginPct, setProfitMarginPct] = useState<number>(30);

  // Amazon inputs
  const [shipmentType, setShipmentType] = useState<'EASY_SHIP' | 'SELLER_FLEX' | 'FBA'>('EASY_SHIP');
  const [amazonCategory, setAmazonCategory] = useState<string>('home');
  const [weightGrams, setWeightGrams] = useState<number>(500);
  const [lengthCm, setLengthCm] = useState<number>(20);
  const [widthCm, setWidthCm] = useState<number>(15);
  const [heightCm, setHeightCm] = useState<number>(10);

  // Noon inputs
  const [fulfillmentType, setFulfillmentType] = useState<'FBN' | 'FBP'>('FBN');
  const [packageType, setPackageType] = useState<'STANDARD' | 'OVERSIZE'>('STANDARD');
  const [noonFamily, setNoonFamily] = useState<string>('home_kitchen');
  const [noonType, setNoonType] = useState<string>('Cookware');
  const [weightKg, setWeightKg] = useState<number>(0.5);

  // Jumia inputs
  const [jumiaFamily, setJumiaFamily] = useState<string>('home_supplies');
  const [jumiaType, setJumiaType] = useState<string>('Kitchen & Dining');
  const [productSize, setProductSize] = useState<'SMALL' | 'MEDIUM' | 'LARGE'>('SMALL');
  const [warehouseType, setWarehouseType] = useState<'YOUR_WAREHOUSE' | 'JUMIA_EXPRESS'>('YOUR_WAREHOUSE');

  // Trendyol inputs
  const [shippingProvider, setShippingProvider] = useState<string>('Aramex');
  const [trendyolCategory, setTrendyolCategory] = useState<string>('clothing');
  const [trendyolSub, setTrendyolSub] = useState<string>('T-Shirts & Tops');
  const [isNewSeller, setIsNewSeller] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ProfitCalculationResult | null>(null);

  useEffect(() => {
    marketplaceHubService
      .getMetadata()
      .then((data) => setMetadata(data))
      .catch(() => toast.error('تعذر تحميل بيانات المنصات'));
  }, []);

  const handlePlatformChange = (next: MarketplacePlatform) => {
    setPlatform(next);
    if (next === 'jumia') setCountry('EGY');
    if (next === 'trendyol' && country === 'EGY') setCountry('KSA');
  };

  const handleCalculate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const payload: CalculateProfitPayload = {
        platform,
        country,
        productCost,
        profitMarginPct,
        shipmentType,
        category: amazonCategory,
        weightGrams,
        lengthCm,
        widthCm,
        heightCm,
        fulfillmentType,
        packageType,
        productFamily: platform === 'noon' ? noonFamily : jumiaFamily,
        productType: platform === 'noon' ? noonType : jumiaType,
        weightKg,
        productSize,
        warehouseType,
        shippingProvider,
        mainCategory: trendyolCategory,
        subCategory: trendyolSub,
        isNewSeller,
      };
      const data = await marketplaceHubService.calculateProfit(payload);
      setResult(data);
    } catch {
      toast.error('تعذر حساب الرسوم');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void handleCalculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform]);

  const availableCountries =
    platform === 'jumia'
      ? [{ code: 'EGY' as CountryCode, label: 'مصر (EGP)' }]
      : platform === 'trendyol'
        ? [
            { code: 'KSA' as CountryCode, label: 'السعودية (SAR)' },
            { code: 'UAE' as CountryCode, label: 'الإمارات (AED)' },
          ]
        : [
            { code: 'EGY' as CountryCode, label: 'مصر (EGP)' },
            { code: 'KSA' as CountryCode, label: 'السعودية (SAR)' },
            { code: 'UAE' as CountryCode, label: 'الإمارات (AED)' },
          ];

  const activeNoonTypes = metadata?.noonFamilies.find((f) => f.id === noonFamily)?.types || [];
  const activeJumiaTypes = metadata?.jumiaFamilies.find((f) => f.id === jumiaFamily)?.types || [];
  const activeTrendyolSubs = metadata?.trendyolCategories.find((c) => c.id === trendyolCategory)?.subs || [];

  return (
    <MarketplaceHubLayout title="حاسبة رسوم وصافي ربح المنصات">
      {/* Platform selector */}
      <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => handlePlatformChange(p.id)}
            className={`shrink-0 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors active:scale-[0.97] ${
              platform === p.id
                ? 'bg-primary text-primary-foreground'
                : 'border border-border/70 bg-background text-muted-foreground hover:text-foreground'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Inputs Form */}
        <form
          onSubmit={handleCalculate}
          className="space-y-4 border-t border-border/70 pt-4 lg:col-span-7 lg:rounded-md lg:border lg:bg-background lg:p-5"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">الدولة</label>
              <select
                value={country}
                disabled={platform === 'jumia'}
                onChange={(e) => setCountry(e.target.value as CountryCode)}
                className="w-full rounded-md border border-border/70 bg-card px-3 py-2 text-sm text-foreground"
              >
                {availableCountries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {platform === 'amazon' && (
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">نوع الشحن</label>
                <select
                  value={shipmentType}
                  onChange={(e) => setShipmentType(e.target.value as 'EASY_SHIP' | 'SELLER_FLEX' | 'FBA')}
                  className="w-full rounded-md border border-border/70 bg-card px-3 py-2 text-sm text-foreground"
                >
                  <option value="EASY_SHIP">Easy Ship</option>
                  <option value="SELLER_FLEX">Seller Flex</option>
                  <option value="FBA">FBA (شحن أمازون)</option>
                </select>
              </div>
            )}

            {platform === 'noon' && (
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">نموذج التنفيذ</label>
                <select
                  value={fulfillmentType}
                  onChange={(e) => setFulfillmentType(e.target.value as 'FBN' | 'FBP')}
                  className="w-full rounded-md border border-border/70 bg-card px-3 py-2 text-sm text-foreground"
                >
                  <option value="FBN">FBN (Fulfilled by Noon)</option>
                  <option value="FBP">FBP (Fulfilled by Partner)</option>
                </select>
              </div>
            )}

            {platform === 'jumia' && (
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">المستودع</label>
                <select
                  value={warehouseType}
                  onChange={(e) => setWarehouseType(e.target.value as 'YOUR_WAREHOUSE' | 'JUMIA_EXPRESS')}
                  className="w-full rounded-md border border-border/70 bg-card px-3 py-2 text-sm text-foreground"
                >
                  <option value="YOUR_WAREHOUSE">مخزن التاجر</option>
                  <option value="JUMIA_EXPRESS">Jumia Express</option>
                </select>
              </div>
            )}

            {platform === 'trendyol' && (
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">شركة الشحن</label>
                <select
                  value={shippingProvider}
                  onChange={(e) => setShippingProvider(e.target.value)}
                  className="w-full rounded-md border border-border/70 bg-card px-3 py-2 text-sm text-foreground"
                >
                  {(metadata?.trendyolProviders || ['Aramex']).map((prov) => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Category / Family selectors */}
          {platform === 'amazon' && (
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">فئة المنتج</label>
              <select
                value={amazonCategory}
                onChange={(e) => setAmazonCategory(e.target.value)}
                className="w-full rounded-md border border-border/70 bg-card px-3 py-2 text-sm text-foreground"
              >
                {(metadata?.amazonCategories || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameAr} — {c.nameEn}
                  </option>
                ))}
              </select>
            </div>
          )}

          {platform === 'noon' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">نوع الطرد</label>
                <select
                  value={packageType}
                  onChange={(e) => setPackageType(e.target.value as 'STANDARD' | 'OVERSIZE')}
                  className="w-full rounded-md border border-border/70 bg-card px-3 py-2 text-sm text-foreground"
                >
                  <option value="STANDARD">Standard Parcel</option>
                  <option value="OVERSIZE">Oversize Parcel</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">عائلة المنتج</label>
                <select
                  value={noonFamily}
                  onChange={(e) => setNoonFamily(e.target.value)}
                  className="w-full rounded-md border border-border/70 bg-card px-3 py-2 text-sm text-foreground"
                >
                  {(metadata?.noonFamilies || []).map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nameAr}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">نوع المنتج</label>
                <select
                  value={noonType}
                  onChange={(e) => setNoonType(e.target.value)}
                  className="w-full rounded-md border border-border/70 bg-card px-3 py-2 text-sm text-foreground"
                >
                  {activeNoonTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {platform === 'jumia' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">عائلة المنتج</label>
                <select
                  value={jumiaFamily}
                  onChange={(e) => setJumiaFamily(e.target.value)}
                  className="w-full rounded-md border border-border/70 bg-card px-3 py-2 text-sm text-foreground"
                >
                  {(metadata?.jumiaFamilies || []).map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nameAr}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">نوع المنتج</label>
                <select
                  value={jumiaType}
                  onChange={(e) => setJumiaType(e.target.value)}
                  className="w-full rounded-md border border-border/70 bg-card px-3 py-2 text-sm text-foreground"
                >
                  {activeJumiaTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">حجم المنتج</label>
                <select
                  value={productSize}
                  onChange={(e) => setProductSize(e.target.value as 'SMALL' | 'MEDIUM' | 'LARGE')}
                  className="w-full rounded-md border border-border/70 bg-card px-3 py-2 text-sm text-foreground"
                >
                  <option value="SMALL">صغير (Small)</option>
                  <option value="MEDIUM">متوسط (Medium)</option>
                  <option value="LARGE">كبير (Large)</option>
                </select>
              </div>
            </div>
          )}

          {platform === 'trendyol' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">التصنيف الرئيسي</label>
                <select
                  value={trendyolCategory}
                  onChange={(e) => setTrendyolCategory(e.target.value)}
                  className="w-full rounded-md border border-border/70 bg-card px-3 py-2 text-sm text-foreground"
                >
                  {(metadata?.trendyolCategories || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameAr}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">التصنيف الفرعي</label>
                <select
                  value={trendyolSub}
                  onChange={(e) => setTrendyolSub(e.target.value)}
                  className="w-full rounded-md border border-border/70 bg-card px-3 py-2 text-sm text-foreground"
                >
                  {activeTrendyolSubs.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Cost & Margin */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">تكلفة المنتج *</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={productCost}
                onChange={(e) => setProductCost(Number(e.target.value))}
                className="w-full rounded-md border border-border/70 bg-card px-3 py-2 font-mono text-sm tabular-nums text-foreground"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">هامش الربح %</label>
              <input
                type="number"
                min={0}
                step="0.5"
                value={profitMarginPct}
                onChange={(e) => setProfitMarginPct(Number(e.target.value))}
                className="w-full rounded-md border border-border/70 bg-card px-3 py-2 font-mono text-sm tabular-nums text-foreground"
              />
            </div>
          </div>

          {/* Weight & Dimensions */}
          {(platform === 'amazon' || platform === 'trendyol') && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  {platform === 'amazon' ? 'الوزن (جم) *' : 'الوزن (كجم) *'}
                </label>
                <input
                  type="number"
                  min={0.1}
                  step={platform === 'amazon' ? '10' : '0.1'}
                  value={platform === 'amazon' ? weightGrams : weightKg}
                  onChange={(e) =>
                    platform === 'amazon'
                      ? setWeightGrams(Number(e.target.value))
                      : setWeightKg(Number(e.target.value))
                  }
                  className="w-full rounded-md border border-border/70 bg-card px-3 py-2 font-mono text-sm tabular-nums text-foreground"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">الطول (سم)</label>
                <input
                  type="number"
                  min={0}
                  value={lengthCm}
                  onChange={(e) => setLengthCm(Number(e.target.value))}
                  className="w-full rounded-md border border-border/70 bg-card px-3 py-2 font-mono text-sm tabular-nums text-foreground"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">العرض (سم)</label>
                <input
                  type="number"
                  min={0}
                  value={widthCm}
                  onChange={(e) => setWidthCm(Number(e.target.value))}
                  className="w-full rounded-md border border-border/70 bg-card px-3 py-2 font-mono text-sm tabular-nums text-foreground"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">الارتفاع (سم)</label>
                <input
                  type="number"
                  min={0}
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="w-full rounded-md border border-border/70 bg-card px-3 py-2 font-mono text-sm tabular-nums text-foreground"
                />
              </div>
            </div>
          )}

          {platform === 'noon' && (
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">الوزن (كجم) *</label>
              <input
                type="number"
                min={0.1}
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                className="w-full rounded-md border border-border/70 bg-card px-3 py-2 font-mono text-sm tabular-nums text-foreground"
              />
            </div>
          )}

          {platform === 'trendyol' && (
            <label className="flex items-center gap-2 text-xs text-foreground">
              <input
                type="checkbox"
                checked={isNewSeller}
                onChange={(e) => setIsNewSeller(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <span>تاجر جديد على Trendyol (خصم عمولة)</span>
            </label>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-95 active:scale-[0.99] disabled:opacity-60"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
            <span>احسب الرسوم وصافي الربح</span>
          </button>
        </form>

        {/* Results Pane */}
        <div className="space-y-4 border-t border-border/70 pt-4 lg:col-span-5 lg:rounded-md lg:border lg:bg-muted/20 lg:p-5">
          {result ? (
            <>
              <div className="flex items-center justify-between border-b border-border/70 pb-3">
                <div>
                  <div className="text-xs text-muted-foreground">سعر البيع النهائي المقترح</div>
                  <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-foreground">
                    {result.finalSellingPrice.toFixed(2)} {result.currency}
                  </div>
                </div>
                <div className="text-end">
                  <div className="text-xs text-muted-foreground">صافي الربح</div>
                  <div className="mt-1 font-mono text-lg font-semibold tabular-nums text-primary">
                    {result.netProfit.toFixed(2)} {result.currency}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="rounded border border-border/70 bg-card p-2.5">
                  <div className="text-muted-foreground">السعر قبل الضريبة</div>
                  <div className="mt-0.5 font-mono font-semibold tabular-nums">
                    {result.finalPriceExVat.toFixed(2)} {result.currency}
                  </div>
                </div>
                <div className="rounded border border-border/70 bg-card p-2.5">
                  <div className="text-muted-foreground">السعر الأساسي</div>
                  <div className="mt-0.5 font-mono font-semibold tabular-nums">
                    {result.basePrice.toFixed(2)} {result.currency}
                  </div>
                </div>
                <div className="rounded border border-border/70 bg-card p-2.5">
                  <div className="text-muted-foreground">فئة الحجم</div>
                  <div className="mt-0.5 font-mono font-semibold uppercase">{result.tierType}</div>
                </div>
                <div className="rounded border border-border/70 bg-card p-2.5">
                  <div className="text-muted-foreground">العائد على التكلفة (ROI)</div>
                  <div className="mt-0.5 font-mono font-semibold tabular-nums">{result.roiPct}%</div>
                </div>
              </div>

              <div className="space-y-2 border-t border-border/70 pt-3 text-xs">
                <div className="font-semibold text-foreground">تفصيل الرسوم</div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">رسوم الشحن</span>
                  <span className="font-mono tabular-nums">
                    {result.feesBreakdown.shippingFee.toFixed(2)} {result.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    العمولة (<span className="font-mono tabular-nums">{result.commissionRatePct}%</span>)
                  </span>
                  <span className="font-mono tabular-nums">
                    {result.feesBreakdown.commissionFee.toFixed(2)} {result.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    الضريبة (<span className="font-mono tabular-nums">{result.vatBreakdown.vatRatePct}%</span>)
                  </span>
                  <span className="font-mono tabular-nums">
                    {result.feesBreakdown.vatAmount.toFixed(2)} {result.currency}
                  </span>
                </div>
                <div className="flex justify-between border-t border-border/50 pt-2 font-semibold">
                  <span>إجمالي الرسوم</span>
                  <span className="font-mono tabular-nums">
                    {result.feesBreakdown.totalFees.toFixed(2)} {result.currency}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 border-t border-border/70 pt-3 text-xs">
                <div className="font-semibold text-foreground">تفصيل الضريبة (VAT)</div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ضريبة القيمة المضافة على المنتج</span>
                  <span className="font-mono tabular-nums">
                    {result.vatBreakdown.vatOnProduct.toFixed(2)} {result.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ضريبة الشحن والعمولة</span>
                  <span className="font-mono tabular-nums">
                    {result.vatBreakdown.vatOnShippingAndReferral.toFixed(2)} {result.currency}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-xs text-muted-foreground">
              أدخل البيانات واضغط احسب لعرض تفصيل السعر والرسوم.
            </div>
          )}
        </div>
      </div>
    </MarketplaceHubLayout>
  );
};

export default MarketplaceCalculatorPage;
