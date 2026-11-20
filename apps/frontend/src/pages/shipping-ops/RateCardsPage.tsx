import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CreditCard,
  Package,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Building2,
  MapPin,
  Scale,
  Banknote,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  shippingOpsService,
  ClientRateCardItem,
  RateCardInput,
  MerchantItem,
} from '../../services/shippingOpsService';
import { EGYPT_GOVERNORATES } from '../../constants/egyptGovernorates';
import { formatCurrency } from './shippingOpsShared';
import { ClientPackagesTab } from './ClientPackagesTab';

export const RateCardsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === 'en';

  const [rateCards, setRateCards] = useState<ClientRateCardItem[]>([]);
  const [merchants, setMerchants] = useState<MerchantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Sub-tab (SHIP-W14)
  const [activeTab, setActiveTab] = useState<'rate_cards' | 'packages'>('rate_cards');

  // Filter
  const [filterMerchantId, setFilterMerchantId] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<ClientRateCardItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<RateCardInput>({
    merchantId: '',
    name: '',
    governorateCode: '',
    basePrice: 60,
    baseWeightKg: 1,
    extraKgPrice: 10,
    codFeeFixed: 0,
    codFeePercent: 0,
    returnFee: 20,
    isActive: true,
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [cards, merchs] = await Promise.all([
        shippingOpsService.getRateCards({ merchantId: filterMerchantId || undefined }),
        shippingOpsService.getMerchants(),
      ]);
      setRateCards(cards);
      setMerchants(merchs);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('shippingOps.loadError', 'حدث خطأ أثناء تحميل بطاقات الأسعار');
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [filterMerchantId, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    setEditingCard(null);
    setFormData({
      merchantId: merchants[0]?.id || '',
      name: '',
      governorateCode: '',
      basePrice: 60,
      baseWeightKg: 1,
      extraKgPrice: 10,
      codFeeFixed: 0,
      codFeePercent: 0,
      returnFee: 20,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (card: ClientRateCardItem) => {
    setEditingCard(card);
    setFormData({
      merchantId: card.merchantId,
      name: card.name,
      governorateCode: card.governorateCode || '',
      basePrice: Number(card.basePrice),
      baseWeightKg: Number(card.baseWeightKg || 1),
      extraKgPrice: Number(card.extraKgPrice || 0),
      codFeeFixed: Number(card.codFeeFixed || 0),
      codFeePercent: Number(card.codFeePercent || 0),
      returnFee: Number(card.returnFee || 0),
      isActive: card.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.merchantId) {
      toast.error('يرجى تحديد العميل/التاجر');
      return;
    }
    if (!formData.name.trim()) {
      toast.error('اسم بطاقة السعر مطلوب');
      return;
    }

    try {
      setSaving(true);
      if (editingCard) {
        await shippingOpsService.updateRateCard(editingCard.id, formData);
        toast.success(isEn ? 'Rate card updated' : 'تم تحديث بطاقة السعر بنجاح');
      } else {
        await shippingOpsService.createRateCard(formData);
        toast.success(isEn ? 'Rate card created' : 'تم إنشاء بطاقة السعر بنجاح');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'تعذر حفظ بطاقة السعر';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(isEn ? 'Delete this rate card?' : 'هل أنت متأكد من رغبتك في حذف بطاقة السعر هذه؟')) {
      return;
    }
    try {
      setDeletingId(id);
      await shippingOpsService.deleteRateCard(id);
      toast.success(isEn ? 'Rate card deleted' : 'تم حذف بطاقة السعر');
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'تعذر حذف بطاقة السعر';
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 w-full max-w-[1800px] mx-auto text-foreground dark:text-muted-foreground">
      {/* Header (No nav element) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border dark:border-border pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {t('shippingOps.rateCardsPage.title', 'بطاقات أسعار العملاء')}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground mt-1">
            {t('shippingOps.rateCardsPage.subtitle', 'تخصيص أسعار شحن خاصة ومخصصة لكل تاجر وعميل حسب المحافظات والوزن')}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium border border-border dark:border-border rounded-lg hover:bg-muted dark:hover:bg-muted transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-foreground dark:text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
            <span>{isEn ? 'Refresh' : 'تحديث'}</span>
          </button>
          {activeTab === 'rate_cards' && (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-primary hover:bg-primary dark:bg-primary dark:hover:bg-primary rounded-lg shadow-sm transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{t('shippingOps.rateCardsPage.addRateCard', 'إضافة بطاقة سعر')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-tab Switcher: Rate Cards vs Monthly Packages */}
      <div className="flex items-center gap-1 bg-muted dark:bg-muted p-1 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('rate_cards')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition ${
            activeTab === 'rate_cards'
              ? 'bg-white dark:bg-muted text-primary dark:text-primary shadow-sm'
              : 'text-slate-600 dark:text-muted-foreground hover:text-foreground'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>{isEn ? 'Client Rate Cards' : 'بطاقات أسعار المحافظات والمدن'}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('packages')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition ${
            activeTab === 'packages'
              ? 'bg-white dark:bg-muted text-primary dark:text-primary shadow-sm'
              : 'text-slate-600 dark:text-muted-foreground hover:text-foreground'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>{isEn ? 'Monthly Volume Packages' : 'الباقات الشهرية (حجم الطلبات)'}</span>
        </button>
      </div>

      {activeTab === 'packages' ? (
        <ClientPackagesTab merchants={merchants} isEn={isEn} />
      ) : (
        <>
      {error && (
        <div className="p-4 bg-destructive/10 dark:bg-destructive/40 border border-destructive dark:border-destructive text-destructive dark:text-destructive rounded-xl text-xs sm:text-sm">
          {error}
        </div>
      )}

      {/* Filter by Merchant */}
      <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-3 sm:p-4 flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-80">
          <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
          <select
            value={filterMerchantId}
            onChange={(e) => setFilterMerchantId(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">{isEn ? 'All Merchants' : 'جميع العملاء / التجار'}</option>
            {merchants.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        {filterMerchantId && (
          <button
            onClick={() => setFilterMerchantId('')}
            className="text-xs text-destructive hover:underline"
          >
            إلغاء التصفية
          </button>
        )}
      </div>

      {/* Rate Cards Table */}
      <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right rtl:text-right ltr:text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-muted text-muted-foreground dark:text-muted-foreground border-b border-border dark:border-border">
              <tr>
                <th className="px-4 py-3 font-medium">{t('shippingOps.rateCardsPage.name', 'اسم البطاقة')}</th>
                <th className="px-4 py-3 font-medium">{t('shippingOps.rateCardsPage.merchant', 'العميل')}</th>
                <th className="px-4 py-3 font-medium">{t('shippingOps.rateCardsPage.governorate', 'المحافظة')}</th>
                <th className="px-4 py-3 font-medium">{t('shippingOps.rateCardsPage.basePrice', 'السعر الأساسي')}</th>
                <th className="px-4 py-3 font-medium">{t('shippingOps.rateCardsPage.baseWeight', 'الوزن المشمول')}</th>
                <th className="px-4 py-3 font-medium">{t('shippingOps.rateCardsPage.extraKgPrice', 'سعر الكيلو الزائد')}</th>
                <th className="px-4 py-3 font-medium">{t('shippingOps.rateCardsPage.codFee', 'رسوم COD')}</th>
                <th className="px-4 py-3 font-medium">{t('shippingOps.rateCardsPage.returnFee', 'رسوم المرتجع')}</th>
                <th className="px-4 py-3 font-medium">{t('shippingOps.rateCardsPage.status', 'الحالة')}</th>
                <th className="px-4 py-3 font-medium text-center">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-border">
              {loading && rateCards.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-muted-foreground" />
                    <span>{isEn ? 'Loading rate cards...' : 'جاري تحميل بطاقات الأسعار...'}</span>
                  </td>
                </tr>
              ) : rateCards.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">
                    <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <span>{t('shippingOps.rateCardsPage.noRateCards', 'لا توجد بطاقات أسعار مسجلة')}</span>
                  </td>
                </tr>
              ) : (
                rateCards.map((rc) => (
                  <tr key={rc.id} className="hover:bg-slate-50/70 dark:hover:bg-muted transition">
                    <td className="px-4 py-3 font-semibold text-foreground dark:text-muted-foreground">
                      {rc.name}
                    </td>
                    <td className="px-4 py-3 text-foreground dark:text-muted-foreground">
                      {rc.merchant?.name || rc.merchantId}
                    </td>
                    <td className="px-4 py-3">
                      {rc.governorateCode ? (
                        <span className="inline-flex items-center gap-1 font-medium text-primary dark:text-primary">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{rc.governorateCode}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-muted dark:bg-muted text-foreground dark:text-muted-foreground">
                          عام (كل المحافظات)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold tabular-nums text-success dark:text-success">
                      {formatCurrency(Number(rc.basePrice))}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-foreground dark:text-muted-foreground">
                      {rc.baseWeightKg} كجم
                    </td>
                    <td className="px-4 py-3 tabular-nums text-foreground dark:text-muted-foreground">
                      {formatCurrency(Number(rc.extraKgPrice))}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-foreground dark:text-muted-foreground">
                      {Number(rc.codFeeFixed) > 0 ? `${rc.codFeeFixed} ج` : ''}
                      {Number(rc.codFeePercent) > 0 ? ` + ${rc.codFeePercent}%` : ''}
                      {Number(rc.codFeeFixed) === 0 && Number(rc.codFeePercent) === 0 ? 'مجاني' : ''}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-foreground dark:text-muted-foreground">
                      {formatCurrency(Number(rc.returnFee))}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                        rc.isActive
                          ? 'bg-emerald-50 text-success border-success dark:bg-success/40 dark:text-success'
                          : 'bg-slate-100 text-foreground border-border dark:bg-muted dark:text-muted-foreground'
                      }`}>
                        {rc.isActive ? 'مفعلة' : 'معطلة'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(rc)}
                          className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/40 rounded-lg transition"
                          title="تعديل"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(rc.id)}
                          disabled={deletingId === rc.id}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/40 rounded-lg transition disabled:opacity-50"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

      {/* Modal: Create or Edit Rate Card */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-muted backdrop-blur-sm">
          <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-5 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border dark:border-border pb-3">
              <div className="flex items-center gap-2 font-bold text-base">
                <CreditCard className="w-5 h-5 text-primary" />
                <span>
                  {editingCard
                    ? t('shippingOps.rateCardsPage.editRateCard', 'تعديل بطاقة السعر')
                    : t('shippingOps.rateCardsPage.addRateCard', 'إضافة بطاقة سعر جديدة')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-foreground dark:hover:text-muted-foreground"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-foreground dark:text-muted-foreground mb-1">
                    العميل / التاجر <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.merchantId}
                    onChange={(e) => setFormData((p) => ({ ...p, merchantId: e.target.value }))}
                    disabled={Boolean(editingCard)}
                    required
                    className="w-full px-3 py-2 bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">اختر العميل...</option>
                    {merchants.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-foreground dark:text-muted-foreground mb-1">
                    اسم بطاقة السعر <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: تسعير القاهرة الكبرى، تسعير الصعيد"
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-foreground dark:text-muted-foreground mb-1">
                    المحافظة (اتركها فارغة لتعميمها على جميع المحافظات)
                  </label>
                  <select
                    value={formData.governorateCode || ''}
                    onChange={(e) => setFormData((p) => ({ ...p, governorateCode: e.target.value || null }))}
                    className="w-full px-3 py-2 bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">{t('shippingOps.rateCardsPage.allGovernorates', 'عام (كل المحافظات)')}</option>
                    {EGYPT_GOVERNORATES.map((g) => (
                      <option key={g.id} value={g.nameAr}>
                        {isEn ? g.nameEn : g.nameAr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground dark:text-muted-foreground mb-1">
                    السعر الأساسي (جنيه) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={formData.basePrice}
                    onChange={(e) => setFormData((p) => ({ ...p, basePrice: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary tabular-nums font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground dark:text-muted-foreground mb-1">
                    الوزن المشمول (كجم)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={formData.baseWeightKg}
                    onChange={(e) => setFormData((p) => ({ ...p, baseWeightKg: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground dark:text-muted-foreground mb-1">
                    سعر الكيلو الزائد (جنيه)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.extraKgPrice}
                    onChange={(e) => setFormData((p) => ({ ...p, extraKgPrice: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground dark:text-muted-foreground mb-1">
                    رسوم المرتجع (جنيه)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.returnFee}
                    onChange={(e) => setFormData((p) => ({ ...p, returnFee: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground dark:text-muted-foreground mb-1">
                    رسوم COD ثابتة (جنيه)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.codFeeFixed}
                    onChange={(e) => setFormData((p) => ({ ...p, codFeeFixed: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground dark:text-muted-foreground mb-1">
                    رسوم COD نسبة (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.codFeePercent}
                    onChange={(e) => setFormData((p) => ({ ...p, codFeePercent: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary tabular-nums"
                  />
                </div>

                <div className="sm:col-span-2 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))}
                      className="w-4 h-4 text-primary rounded border-border dark:border-border"
                    />
                    <span className="font-medium text-foreground dark:text-muted-foreground">
                      تفعيل بطاقة السعر للاستخدام الفوري
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border dark:border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                  className="px-3.5 py-2 text-xs font-medium border border-border dark:border-border rounded-lg hover:bg-muted dark:hover:bg-muted transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary rounded-lg transition active:scale-95 disabled:opacity-50"
                >
                  {saving ? 'جاري الحفظ...' : t('shippingOps.rateCardsPage.saveRateCard', 'حفظ البطاقة')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RateCardsPage;
