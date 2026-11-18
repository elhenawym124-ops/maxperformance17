import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { StorefrontSettings } from "../../../services/storefrontSettingsService";
import {
  GlobeAltIcon,
  CheckCircleIcon,
  ArrowTopRightOnSquareIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

interface StoreSeoTabProps {
  settings: StorefrontSettings | null;
  company: Record<string, unknown> | null;
  onSave: (seoData: {
    title: string;
    description: string;
    keywords: string;
    ogImage: string;
    googleSiteVerification: string;
    facebookDomainVerification: string;
  }) => Promise<void>;
}

export const StoreSeoTab: React.FC<StoreSeoTabProps> = ({
  settings,
  company,
  onSave,
}) => {
  const { t } = useTranslation();

  const existingTokens = (settings?.designTokens || {}) as Record<string, any>;
  const existingSeo = (existingTokens?.seo || existingTokens?.settings?.seo || {}) as Record<string, any>;

  const defaultTitle =
    existingSeo.title ||
    existingTokens.storeName ||
    settings?.storeName ||
    company?.name ||
    "";
  const defaultDesc =
    existingSeo.description ||
    existingTokens.description ||
    settings?.description ||
    company?.description ||
    "";
  const defaultKeywords =
    existingSeo.keywords ||
    "";
  const defaultOgImage =
    existingSeo.ogImage ||
    "";
  const defaultGsc =
    settings?.googleSiteVerification ||
    existingTokens?.googleSiteVerification ||
    existingSeo?.googleSiteVerification ||
    "";
  const defaultMetaVerify =
    settings?.facebookDomainVerification ||
    existingTokens?.facebookDomainVerification ||
    existingSeo?.facebookDomainVerification ||
    "";

  const [title, setTitle] = useState<string>(String(defaultTitle || ""));
  const [description, setDescription] = useState<string>(String(defaultDesc || ""));
  const [keywords, setKeywords] = useState<string>(String(defaultKeywords || ""));
  const [ogImage, setOgImage] = useState<string>(String(defaultOgImage || ""));
  const [gsc, setGsc] = useState<string>(String(defaultGsc || ""));
  const [metaVerify, setMetaVerify] = useState<string>(String(defaultMetaVerify || ""));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(String(defaultTitle || ""));
    setDescription(String(defaultDesc || ""));
    setKeywords(String(defaultKeywords || ""));
    setOgImage(String(defaultOgImage || ""));
    setGsc(String(defaultGsc || ""));
    setMetaVerify(String(defaultMetaVerify || ""));
  }, [settings, company]);

  const companySlug = settings?.companySlug || company?.slug || "store";
  const customDomain = settings?.customDomain || company?.customDomain;
  const storeUrl = customDomain
    ? `https://${customDomain}`
    : `https://${companySlug}.maxp.online`;
  const sitemapUrl = `${storeUrl}/sitemap.xml`;
  const robotsUrl = `${storeUrl}/robots.txt`;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t("common.copied", `تم نسخ ${label} إلى الحافظة`));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await onSave({
        title: title.trim(),
        description: description.trim(),
        keywords: keywords.trim(),
        ogImage: ogImage.trim(),
        googleSiteVerification: gsc.trim(),
        facebookDomainVerification: metaVerify.trim(),
      });
      toast.success(t("storeSettings.seoSaved", "تم حفظ إعدادات الـ SEO للمتجر بنجاح"));
    } catch (err) {
      console.error("Failed to save SEO settings:", err);
      toast.error(t("storeSettings.seoSaveFailed", "تعذر حفظ إعدادات الـ SEO"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <GlobeAltIcon className="h-5 w-5 text-indigo-600" />
            <span>{t("storeSettings.seoStudioTitle", "استوديو تحسين محركات البحث (SEO)")}</span>
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t("storeSettings.seoStudioDesc", "تحكم في كيفية ظهور متجرك على Google وشبكات التواصل الاجتماعي لزيادة المبيعات العضوية.")}
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
        >
          {saving ? (
            <span>{t("common.saving", "جاري الحفظ...")}</span>
          ) : (
            <>
              <CheckCircleIcon className="h-4 w-4" />
              <span>{t("common.saveChanges", "حفظ إعدادات الـ SEO")}</span>
            </>
          )}
        </button>
      </div>

      {/* Google Search Result Preview */}
      <div className="p-4 sm:p-5 bg-gray-50 dark:bg-gray-900/60 rounded-2xl border border-gray-200/80 dark:border-gray-800 space-y-2">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {t("storeSettings.googlePreview", "معاينة حية للظهور على Google (SERP Preview)")}
        </div>
        <div className="p-3.5 bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 max-w-2xl">
          <div className="text-xs text-emerald-700 dark:text-emerald-400 truncate mb-1" dir="ltr">
            {storeUrl}
          </div>
          <div className="text-base sm:text-lg font-medium text-blue-700 dark:text-blue-400 hover:underline cursor-pointer truncate">
            {title || t("storeSettings.defaultStoreTitle", "عنوان المتجر في نتائج البحث")}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2 leading-relaxed">
            {description || t("storeSettings.defaultStoreDesc", "وصف المتجر سيظهر هنا للمستخدمين في محرك البحث Google...")}
          </div>
        </div>
      </div>

      {/* Main Meta Fields */}
      <div className="grid grid-cols-1 gap-6">
        {/* Meta Title */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {t("storeSettings.metaTitle", "عنوان المتجر (Meta Title)")}
            </label>
            <span
              className={`text-xs font-mono tabular-nums ${
                title.length > 60 ? "text-amber-600 font-bold" : "text-gray-500"
              }`}
            >
              {title.length}/60 حرف
            </span>
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("storeSettings.metaTitlePlaceholder", "مثال: سوان للأحذية | أحذية وسنيكرز فاخرة في مصر")}
            maxLength={70}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {t("storeSettings.metaTitleHint", "العنوان المثالي يتراوح بين 50 و 60 حرفاً ويحتوي على اسم المتجر ونوع المنتجات المستهدفة.")}
          </p>
        </div>

        {/* Meta Description */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {t("storeSettings.metaDescription", "وصف المتجر (Meta Description)")}
            </label>
            <span
              className={`text-xs font-mono tabular-nums ${
                description.length > 160 ? "text-amber-600 font-bold" : "text-gray-500"
              }`}
            >
              {description.length}/160 حرف
            </span>
          </div>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("storeSettings.metaDescriptionPlaceholder", "اكتب وصفاً جذاباً لمتجرك يوضح المزايا التنافسية وتشكيلة المنتجات...")}
            maxLength={170}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {t("storeSettings.metaDescriptionHint", "الوصف المثالي يتراوح بين 120 و 160 حرفاً ويحفز الزائر على النقر عبر دعوة لاتخاذ إجراء (CTA).")}
          </p>
        </div>

        {/* Meta Keywords */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
            {t("storeSettings.metaKeywords", "الكلمات المفتاحية للمتجر (Meta Keywords)")}
          </label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="احذية, كوتشيات حريمي, سنيكرز, تسوق اونلاين, مصر"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {t("storeSettings.metaKeywordsHint", "افصل بين كل كلمة أو عبارة بفاصلة (,).")}
          </p>
        </div>

        {/* Social Share OG Image */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
            {t("storeSettings.ogImage", "رابط صورة المشاركة على السوشيال ميديا (OG Image URL)")}
          </label>
          <input
            type="text"
            value={ogImage}
            onChange={(e) => setOgImage(e.target.value)}
            placeholder="https://.../cover.jpg"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {t("storeSettings.ogImageHint", "الصورة التي ستظهر عند مشاركة رابط متجرك على واتساب وفيسبوك (المقاس المثالي 1200x630 بكسل).")}
          </p>
        </div>
      </div>

      {/* Verification Tags (Google & Facebook) */}
      <div className="pt-6 border-t border-gray-100 dark:border-gray-800 space-y-4">
        <h4 className="text-sm font-bold text-gray-900 dark:text-white">
          {t("storeSettings.verificationSection", "أكواد إثبات الملكية وتتبع محركات البحث")}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Google Search Console Verification Tag
            </label>
            <input
              type="text"
              value={gsc}
              onChange={(e) => setGsc(e.target.value)}
              placeholder="google-site-verification token or meta tag"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Facebook / Meta Domain Verification Tag
            </label>
            <input
              type="text"
              value={metaVerify}
              onChange={(e) => setMetaVerify(e.target.value)}
              placeholder="facebook-domain-verification token"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Live Technical Endpoints (Sitemap & Robots) */}
      <div className="pt-6 border-t border-gray-100 dark:border-gray-800 space-y-3">
        <h4 className="text-sm font-bold text-gray-900 dark:text-white">
          {t("storeSettings.endpointsSection", "روابط الزحف والفهرسة لمتجرك")}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="truncate mr-2">
              <span className="font-semibold block text-gray-800 dark:text-gray-200">خريطة الموقع (Sitemap):</span>
              <span className="text-gray-500 truncate block font-mono" dir="ltr">{sitemapUrl}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => handleCopy(sitemapUrl, "رابط السايت ماب")}
                className="p-1.5 text-gray-600 hover:text-indigo-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800"
                title="نسخ الرابط"
              >
                <DocumentDuplicateIcon className="h-4 w-4" />
              </button>
              <a
                href={sitemapUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 text-gray-600 hover:text-indigo-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800"
                title="فتح الرابط"
              >
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="truncate mr-2">
              <span className="font-semibold block text-gray-800 dark:text-gray-200">ملف التوجيه (Robots.txt):</span>
              <span className="text-gray-500 truncate block font-mono" dir="ltr">{robotsUrl}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => handleCopy(robotsUrl, "رابط ملف Robots")}
                className="p-1.5 text-gray-600 hover:text-indigo-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800"
                title="نسخ الرابط"
              >
                <DocumentDuplicateIcon className="h-4 w-4" />
              </button>
              <a
                href={robotsUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 text-gray-600 hover:text-indigo-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800"
                title="فتح الرابط"
              >
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
