import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  PackagePlus,
  ArrowRight,
  Calculator,
  ShieldCheck,
  Building2,
  User,
  MapPin,
  FileText,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import { BulkOrdersImportModal } from './BulkOrdersImportModal';
import { toast } from 'sonner';
import {
  shippingOpsService,
  CreateShipmentInput,
  QuoteResponse,
  MerchantItem,
} from '../../services/shippingOpsService';
import { EGYPT_GOVERNORATES } from '../../constants/egyptGovernorates';
import { formatCurrency } from './shippingOpsShared';

export const NewParcelPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === 'en';
  const navigate = useNavigate();
  const [, startTransition] = useTransition();

  // Form State
  const [formData, setFormData] = useState<CreateShipmentInput>({
    recipientName: '',
    recipientPhone: '',
    recipientPhone2: '',
    destinationGovernorate: '',
    destinationCity: '',
    destinationAddress: '',
    pieces: 1,
    weightKg: 1,
    contentDescription: '',
    codAmount: 0,
    declaredValue: 0,
    isFragile: false,
    allowOpenPackage: true,
    merchantId: '',
    notes: '',
  });

  // Supporting state
  const [merchants, setMerchants] = useState<MerchantItem[]>([]);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);

  // Load merchants
  useEffect(() => {
    shippingOpsService
      .getMerchants()
      .then(setMerchants)
      .catch((err) => console.warn('Failed to load merchants for shipping form', err));
  }, []);

  // Real-time dynamic quote calculation
  const fetchQuote = useCallback(async () => {
    if (!formData.destinationGovernorate) {
      setQuote(null);
      setQuoteError(null);
      return;
    }

    try {
      setQuoteLoading(true);
      setQuoteError(null);
      const res = await shippingOpsService.getQuote({
        governorate: formData.destinationGovernorate,
        city: formData.destinationCity,
        destinationCity: formData.destinationCity,
        weightKg: Number(formData.weightKg || 1),
        codAmount: Number(formData.codAmount || 0),
        merchantId: formData.merchantId || undefined,
      });
      setQuote(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'تعذر احتساب سعر الشحن لهذه المحافظة';
      setQuote(null);
      setQuoteError(msg);
    } finally {
      setQuoteLoading(false);
    }
  }, [formData.destinationGovernorate, formData.destinationCity, formData.weightKg, formData.codAmount, formData.merchantId]);

  // Debounced quote recalculation
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQuote();
    }, 350);
    return () => clearTimeout(timer);
  }, [fetchQuote]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    startTransition(() => {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!formData.recipientName.trim()) {
      setFormError(isEn ? 'Recipient name is required' : 'اسم المستلم مطلوب');
      return;
    }
    if (!formData.recipientPhone.trim()) {
      setFormError(isEn ? 'Recipient phone is required' : 'رقم هاتف المستلم مطلوب');
      return;
    }
    if (!formData.destinationGovernorate) {
      setFormError(isEn ? 'Governorate is required' : 'يرجى تحديد المحافظة');
      return;
    }
    if (!formData.destinationAddress.trim()) {
      setFormError(isEn ? 'Detailed address is required' : 'العنوان التفصيلي مطلوب');
      return;
    }

    try {
      setSubmitting(true);
      const payload: CreateShipmentInput = {
        ...formData,
        pieces: Number(formData.pieces || 1),
        weightKg: Number(formData.weightKg || 1),
        codAmount: formData.codAmount !== undefined ? Number(formData.codAmount) : 0,
        declaredValue: formData.declaredValue ? Number(formData.declaredValue) : undefined,
        merchantId: formData.merchantId || undefined,
      };

      const created = await shippingOpsService.createShipment(payload);
      toast.success(
        isEn
          ? `Parcel created successfully! Tracking #${created.trackingNumber}`
          : `تم إنشاء الطرد بنجاح! رقم التتبع: ${created.trackingNumber}`
      );
      navigate(`/shipping-ops/parcels/${created.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ الشحنة';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 w-full max-w-[1800px] mx-auto text-foreground dark:text-muted-foreground">
      {/* Page Header (No nav element) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border dark:border-border pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link to="/shipping-ops/parcels" className="hover:underline">
              {t('shippingOps.parcels', 'الشحنات والطرود')}
            </Link>
            <span>/</span>
            <span>{t('shippingOps.newParcel', 'إنشاء طرد جديد')}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {t('shippingOps.newParcel', 'إنشاء طرد مستقل جديد')}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-success bg-success/10 hover:bg-success dark:text-success dark:bg-success/40 border border-success dark:border-success rounded-lg shadow-sm transition active:scale-95 cursor-pointer"
            title={isEn ? 'Import Orders & Shipments from Excel' : 'استيراد أوردرات وشحنات كاملة من ملف إكسيل'}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isEn ? 'Import Excel' : 'استيراد Excel'}</span>
          </button>
          <Link
            to="/shipping-ops/parcels"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium border border-border dark:border-border rounded-lg hover:bg-muted dark:hover:bg-muted transition"
          >
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            <span>{isEn ? 'Back to Parcels' : 'العودة لسجل الشحنات'}</span>
          </Link>
        </div>
      </div>

      {formError && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 dark:bg-destructive/40 border border-destructive dark:border-destructive text-destructive dark:text-destructive rounded-xl text-xs sm:text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Inputs: 2 Columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Merchant & Source */}
          <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground dark:text-muted-foreground border-b border-border dark:border-border pb-2">
              <Building2 className="w-4 h-4 text-primary dark:text-primary" />
              <span>{t('shippingOps.form.merchant', 'العميل / التاجر صاحب الشحنة')}</span>
            </div>
            <div>
              <label htmlFor="merchantId" className="block text-xs font-medium text-foreground dark:text-muted-foreground mb-1">
                {t('shippingOps.form.merchant', 'اختيار العميل (اختياري)')}
              </label>
              <select
                id="merchantId"
                name="merchantId"
                value={formData.merchantId || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">{isEn ? 'Direct (No specific merchant)' : 'شحنة مباشرة (بدون تاجر محدد)'}</option>
                {merchants.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.phone ? `(${m.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 2: Recipient Details */}
          <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground dark:text-muted-foreground border-b border-border dark:border-border pb-2">
              <User className="w-4 h-4 text-primary dark:text-primary" />
              <span>{t('shippingOps.form.recipientInfo', 'بيانات المستلم')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="recipientName" className="block text-xs font-medium text-foreground dark:text-muted-foreground mb-1">
                  {t('shippingOps.form.recipientName', 'اسم المستلم')} <span className="text-red-500">*</span>
                </label>
                <input
                  id="recipientName"
                  type="text"
                  name="recipientName"
                  value={formData.recipientName}
                  onChange={handleChange}
                  placeholder="محمد أحمد علي"
                  required
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label htmlFor="recipientPhone" className="block text-xs font-medium text-foreground dark:text-muted-foreground mb-1">
                  {t('shippingOps.form.recipientPhone', 'رقم الهاتف الأساسي')} <span className="text-red-500">*</span>
                </label>
                <input
                  id="recipientPhone"
                  type="tel"
                  name="recipientPhone"
                  value={formData.recipientPhone}
                  onChange={handleChange}
                  placeholder="01012345678"
                  dir="ltr"
                  required
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label htmlFor="recipientPhone2" className="block text-xs font-medium text-foreground dark:text-muted-foreground mb-1">
                  {t('shippingOps.form.recipientPhone2', 'رقم هاتف بديل (اختياري)')}
                </label>
                <input
                  id="recipientPhone2"
                  type="tel"
                  name="recipientPhone2"
                  value={formData.recipientPhone2 || ''}
                  onChange={handleChange}
                  placeholder="01187654321"
                  dir="ltr"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Destination & Address */}
          <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground dark:text-muted-foreground border-b border-border dark:border-border pb-2">
              <MapPin className="w-4 h-4 text-primary dark:text-primary" />
              <span>{t('shippingOps.form.destinationGovernorate', 'عنوان وجهة التوصيل')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label htmlFor="destinationGovernorate" className="block text-xs font-medium text-foreground dark:text-muted-foreground mb-1">
                  {t('shippingOps.form.destinationGovernorate', 'المحافظة')} <span className="text-red-500">*</span>
                </label>
                <select
                  id="destinationGovernorate"
                  data-testid="governorate-select"
                  name="destinationGovernorate"
                  value={formData.destinationGovernorate}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                >
                  <option value="">{t('shippingOps.form.selectGovernorate', 'اختر المحافظة...')}</option>
                  {EGYPT_GOVERNORATES.map((gov) => (
                    <option key={gov.id} value={gov.nameAr}>
                      {isEn ? gov.nameEn : gov.nameAr}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="destinationCity" className="block text-xs font-medium text-foreground dark:text-muted-foreground mb-1">
                  {t('shippingOps.form.destinationCity', 'المدينة / المركز / المنطقة')}
                </label>
                <input
                  id="destinationCity"
                  type="text"
                  name="destinationCity"
                  value={formData.destinationCity || ''}
                  onChange={handleChange}
                  placeholder="مدينة نصر / التجمع الخامس"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="destinationAddress" className="block text-xs font-medium text-foreground dark:text-muted-foreground mb-1">
                  {t('shippingOps.form.destinationAddress', 'العنوان التفصيلي')} <span className="text-red-500">*</span>
                </label>
                <input
                  id="destinationAddress"
                  type="text"
                  name="destinationAddress"
                  value={formData.destinationAddress}
                  onChange={handleChange}
                  placeholder="شارع عباس العقاد، عمارة ١٢، الدور الثالث، شقة ٥"
                  required
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Parcel & Cargo Details */}
          <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground dark:text-muted-foreground border-b border-border dark:border-border pb-2">
              <FileText className="w-4 h-4 text-primary dark:text-primary" />
              <span>{t('shippingOps.form.parcelInfo', 'تفاصيل الشحنة والبضاعة')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label htmlFor="pieces" className="block text-xs font-medium text-foreground dark:text-muted-foreground mb-1">
                  {t('shippingOps.form.pieces', 'عدد القطع')}
                </label>
                <input
                  id="pieces"
                  type="number"
                  name="pieces"
                  min="1"
                  value={formData.pieces || 1}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="weightKg" className="block text-xs font-medium text-foreground dark:text-muted-foreground mb-1">
                  {t('shippingOps.form.weightKg', 'الوزن (كجم)')}
                </label>
                <input
                  id="weightKg"
                  data-testid="weight-input"
                  type="number"
                  step="0.1"
                  min="0.1"
                  name="weightKg"
                  value={formData.weightKg || 1}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="codAmount" className="block text-xs font-medium text-foreground dark:text-muted-foreground mb-1">
                  {t('shippingOps.form.codAmount', 'مبلغ التحصيل (COD)')}
                </label>
                <input
                  id="codAmount"
                  type="number"
                  min="0"
                  name="codAmount"
                  value={formData.codAmount !== undefined ? formData.codAmount : 0}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary tabular-nums font-semibold"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="contentDescription" className="block text-xs font-medium text-foreground dark:text-muted-foreground mb-1">
                  {t('shippingOps.form.contentDescription', 'وصف المحتوى')}
                </label>
                <input
                  id="contentDescription"
                  type="text"
                  name="contentDescription"
                  value={formData.contentDescription || ''}
                  onChange={handleChange}
                  placeholder="ملابس رجالي، أحذية، أدوات منزلية..."
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label htmlFor="declaredValue" className="block text-xs font-medium text-foreground dark:text-muted-foreground mb-1">
                  {t('shippingOps.form.declaredValue', 'القيمة المعلنة (اختياري)')}
                </label>
                <input
                  id="declaredValue"
                  type="number"
                  min="0"
                  name="declaredValue"
                  value={formData.declaredValue || ''}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary tabular-nums"
                />
              </div>
            </div>

            {/* Checkboxes: Fragile & Open package */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2 border-t border-border dark:border-border">
              <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm text-foreground dark:text-muted-foreground">
                <input
                  type="checkbox"
                  name="isFragile"
                  checked={Boolean(formData.isFragile)}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary rounded border-border dark:border-border focus:ring-primary"
                />
                <span>{t('shippingOps.form.isFragile', 'قابل للكسر (عناية خاصة)')}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm text-foreground dark:text-muted-foreground">
                <input
                  type="checkbox"
                  name="allowOpenPackage"
                  checked={Boolean(formData.allowOpenPackage)}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary rounded border-border dark:border-border focus:ring-primary"
                />
                <span>{t('shippingOps.form.allowOpenPackage', 'يسمح بفتح الطرد للمعاينة قبل الاستلام')}</span>
              </label>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-xs font-medium text-foreground dark:text-muted-foreground mb-1">
                {t('shippingOps.form.notes', 'ملاحظات خاصة للمندوب')}
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={2}
                value={formData.notes || ''}
                onChange={handleChange}
                placeholder="الاتصال قبل الوصول بربع ساعة، عدم رن الجرس..."
                className="w-full px-3 py-2 text-xs sm:text-sm bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Sidebar Column: Real-Time Quote Card & Submit */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-4 sm:p-5 space-y-4 shadow-sm sticky top-6">
            <div className="flex items-center justify-between border-b border-border dark:border-border pb-3">
              <div className="flex items-center gap-2 text-sm font-bold">
                <Calculator className="w-4 h-4 text-primary dark:text-primary" />
                <span>{t('shippingOps.form.pricingQuote', 'التسعير اللحظي للطرد')}</span>
              </div>
              {quoteLoading && (
                <span className="text-xs text-primary animate-pulse">
                  {t('shippingOps.form.quoteCalculating', 'جاري الحساب...')}
                </span>
              )}
            </div>

            {!formData.destinationGovernorate ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                اختر المحافظة لعرض التكلفة التقديرية لحظياً
              </div>
            ) : quoteError ? (
              <div className="p-3 bg-warning/10 dark:bg-warning/40 border border-warning dark:border-warning text-warning dark:text-warning rounded-lg text-xs">
                {quoteError}
              </div>
            ) : quote ? (
              <div className="space-y-3">
                <div className="bg-blue-50/60 dark:bg-primary/30 p-3.5 rounded-lg border border-primary dark:border-primary/40">
                  <div className="text-xs text-primary dark:text-primary font-medium mb-1">
                    {t('shippingOps.form.quoteTotal', 'تكلفة الشحن المقدرة')}
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-primary dark:text-primary tabular-nums">
                    {formatCurrency(quote.price, quote.currency)}
                  </div>
                </div>

                <div className="space-y-2 text-xs divide-y divide-border dark:divide-border">
                {quote.isOverage && (
                  <div className="p-2.5 bg-warning/10 dark:bg-warning/40 border border-warning dark:border-warning text-warning dark:text-warning rounded-lg text-xs flex items-center gap-1.5 font-medium">
                    <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
                    <span>تجاوز الحد الشهري للباقة (+{quote.overage || 1} زائدة) — احتسبت بسعر Overage</span>
                  </div>
                )}

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-slate-500">{t('shippingOps.form.quoteSource', 'مصدر التسعير')}</span>
                    <span className="font-medium text-foreground dark:text-muted-foreground text-end">
                      {quote.packageName ? (
                        <span className="inline-flex items-center gap-1 text-primary dark:text-primary">
                          <span>باقة: {quote.packageName}</span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-primary dark:bg-primary/60 rounded">
                            {quote.priceSource === 'PACKAGE_CITY' ? 'مدينة' : 'محافظة'}
                          </span>
                        </span>
                      ) : quote.rateCardName ? (
                        <span className="inline-flex items-center gap-1">
                          <span>{quote.rateCardName}</span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-muted dark:bg-muted rounded text-foreground dark:text-muted-foreground">
                            {quote.priceSource === 'RATE_CARD_CITY' ? 'بطاقة مدينة' : 'بطاقة محافظة'}
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <span>{t('shippingOps.form.quoteSourceZone', 'تسعير المناطق')}</span>
                          {quote.priceSource === 'ZONE_CITY' && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-muted dark:bg-muted rounded">مدينة</span>
                          )}
                        </span>
                      )}
                    </span>
                  </div>

                  {quote.breakdown && (
                    <>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-slate-500">{t('shippingOps.form.quoteBasePrice', 'السعر الأساسي')}</span>
                        <span className="font-medium tabular-nums">{formatCurrency(quote.breakdown.basePrice)}</span>
                      </div>
                      {Number(quote.breakdown.extraWeightFee || 0) > 0 && (
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-slate-500">{t('shippingOps.form.quoteExtraWeight', 'وزن إضافي')}</span>
                          <span className="font-medium tabular-nums">{formatCurrency(quote.breakdown.extraWeightFee)}</span>
                        </div>
                      )}
                      {Number(quote.breakdown.codFee || 0) > 0 && (
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-slate-500">{t('shippingOps.form.quoteCodFee', 'رسوم COD')}</span>
                          <span className="font-medium tabular-nums">{formatCurrency(quote.breakdown.codFee)}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : null}

            <div className="pt-3 border-t border-border dark:border-border space-y-2">
              <button
                type="submit"
                disabled={submitting || quoteLoading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary dark:bg-primary dark:hover:bg-primary rounded-lg shadow-sm transition active:scale-95 disabled:opacity-50"
              >
                {submitting ? (
                  <span>{t('shippingOps.form.creatingParcel', 'جاري إنشاء الطرد...')}</span>
                ) : (
                  <>
                    <PackagePlus className="w-4 h-4" />
                    <span>{t('shippingOps.form.createParcelBtn', 'حفظ وإنشاء الطرد')}</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-success" />
                <span>إصدار تلقائي لرقم التتبع وسجل Timeline</span>
              </div>
            </div>
          </div>
        </div>
      </form>
      <BulkOrdersImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => {
          navigate('/shipping-ops/parcels');
        }}
        isEn={isEn}
      />
    </div>
  );
};

export default NewParcelPage;
