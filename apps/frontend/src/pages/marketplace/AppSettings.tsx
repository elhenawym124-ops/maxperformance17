import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  Package,
  Save,
  Settings2,
  Sparkles,
} from "lucide-react";
import { supportsAppSettings } from "../../config/appSettingsSupport";
import { useMarketplaceAppSettingsData } from "./hooks/useMarketplaceAppSettingsData";
import { AppSettingsInsights } from "./components/settings/AppSettingsInsights";
import { InternalCourierFleetSettingsTab } from "./components/settings/InternalCourierFleetSettingsTab";
import { ConversionSuiteSettingsTab } from "./components/settings/ConversionSuiteSettingsTab";
import { UpsellCenterTab } from "./components/upsell/UpsellCenterTab";
import { UgcReviewsSettingsTab } from "./components/settings/UgcReviewsSettingsTab";
import { CommerceAdvancedSettingsTab } from "./components/settings/CommerceAdvancedSettingsTab";
import { SchemaAppSettingsTab } from "./components/settings/SchemaAppSettingsTab";

export default function AppSettings() {
  const {
    slug,
    navigate,
    companyApp,
    loading,
    saving,
    normalizedSettings,
    generalSettings,
    modulesSettings,
    uiSettings,
    thresholdsSettings,
    countdownSettings,
    copySettings,
    isUpsellCenter,
    activeUpsellSection,
    supported,
    pageTitle,
    pageDescription,
    backDestination,
    backLabel,
    topFeature,
    usageInsights,
    conversionJourney,
    upsellCenterMetrics,
    activeUpsellPlacements,
    cartPlacementEnabled,
    upsellFallbackSummary,
    reviewInsights,
    insightsLoading,
    billingSummary,
    billingSummaryLoading,
    treasuryAccounts,
    updateAtPath,
    applyPreset,
    handleSave,
    setUpsellSection,
  } = useMarketplaceAppSettingsData();

  const renderForm = () => {
    switch (slug) {
      case "internal-courier-fleet":
        return (
          <InternalCourierFleetSettingsTab
            normalizedSettings={normalizedSettings}
            treasuryAccounts={treasuryAccounts}
            updateAtPath={updateAtPath}
            navigate={navigate}
          />
        );
      case "conversion-suite":
      case "upsell-center":
        return isUpsellCenter || slug === "upsell-center" ? (
          <UpsellCenterTab
            activeUpsellSection={activeUpsellSection}
            setUpsellSection={setUpsellSection}
            generalSettings={generalSettings}
            modulesSettings={modulesSettings}
            uiSettings={uiSettings}
            thresholdsSettings={thresholdsSettings}
            copySettings={copySettings}
            activeUpsellPlacements={activeUpsellPlacements}
            cartPlacementEnabled={cartPlacementEnabled}
            upsellFallbackSummary={upsellFallbackSummary}
            upsellCenterMetrics={upsellCenterMetrics}
            updateAtPath={updateAtPath}
            applyPreset={applyPreset}
            navigate={navigate}
          />
        ) : (
          <ConversionSuiteSettingsTab
            generalSettings={generalSettings}
            modulesSettings={modulesSettings}
            uiSettings={uiSettings}
            thresholdsSettings={thresholdsSettings}
            countdownSettings={countdownSettings}
            copySettings={copySettings}
            updateAtPath={updateAtPath}
            applyPreset={applyPreset}
          />
        );
      case "ugc-reviews-pro":
        return (
          <UgcReviewsSettingsTab
            generalSettings={generalSettings}
            modulesSettings={modulesSettings}
            uiSettings={uiSettings}
            updateAtPath={updateAtPath}
          />
        );
      case "commerce-advanced":
        return (
          <CommerceAdvancedSettingsTab
            modulesSettings={modulesSettings}
            uiSettings={uiSettings}
            copySettings={copySettings}
            updateAtPath={updateAtPath}
          />
        );
      default: {
        const schema = companyApp?.app?.settingsSchema || companyApp?.settingsSchema;
        if (schema) {
          return (
            <SchemaAppSettingsTab
              schema={schema}
              settings={normalizedSettings}
              onChange={updateAtPath}
              onSave={handleSave}
              saving={saving}
              appName={companyApp?.app?.name || slug}
            />
          );
        }
        return null;
      }
    }
  };

  useEffect(() => {
    if (!loading && companyApp && slug && !supportsAppSettings(slug, companyApp)) {
      toast.info("التطبيق ده مالوش إعدادات — دي صفحته");
      navigate(`/marketplace/${slug}`, { replace: true });
    }
  }, [loading, companyApp, slug, navigate, companyApp?.app?.settingsSchema, companyApp?.settingsSchema]);

  if (loading) {
    return (
      <div className="min-h-screen bg-muted dark:bg-muted flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!companyApp) {
    return (
      <div className="min-h-screen bg-muted dark:bg-muted flex items-center justify-center p-6">
        <div className="max-w-lg rounded-xl border border-border dark:border-border bg-card p-8 text-center">
          <AlertCircle className="mx-auto mb-4 text-warning" size={40} />
          <h1 className="mb-2 text-2xl font-bold text-foreground">
            التطبيق غير مفعّل
          </h1>
          <p className="mb-6 text-foreground dark:text-muted-foreground">
            فعّل التطبيق أولًا من Marketplace حتى تبدأ ربطه مع القوالب والثيم.
          </p>
          <button
            onClick={() => navigate(`/marketplace/${slug}`)}
            className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
          >
            فتح صفحة التطبيق
          </button>
        </div>
      </div>
    );
  }

  if (slug && !supportsAppSettings(slug, companyApp)) {
    return <Navigate to={`/marketplace/${slug}`} replace />;
  }

  return (
    <div className="min-h-screen bg-muted dark:bg-muted">
      <div className="border-b border-border bg-white dark:border-border dark:bg-muted">
        <div className="mx-auto flex max-w-6xl 2xl:max-w-7xl flex-col sm:flex-row sm:items-center justify-between gap-4 px-3 py-4 sm:px-6 sm:py-6">
          <div className="space-y-3">
            <button
              onClick={() => navigate(backDestination)}
              className="flex items-center gap-2 text-sm text-foreground transition-colors hover:text-foreground dark:text-muted-foreground dark:hover:text-white"
            >
              <ArrowLeft size={18} />
              {backLabel}
            </button>
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex h-12 w-12 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-2xl sm:text-3xl dark:bg-blue-900/30">
                {companyApp.app.icon ? (
                  <span>{companyApp.app.icon}</span>
                ) : (
                  <Package className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <div>
                <div className="mb-1 sm:mb-2 flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-3xl font-bold text-foreground">
                    {pageTitle}
                  </h1>
                  {(supported || supportsAppSettings(slug, companyApp)) && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 sm:px-3 sm:py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      <Sparkles size={14} />
                      {slug === "internal-courier-fleet" ? "Fleet Operations" : (isUpsellCenter || slug === "upsell-center") ? "Unified" : "Template Ready"}
                    </span>
                  )}
                </div>
                <p className="max-w-3xl text-xs sm:text-sm text-foreground dark:text-muted-foreground">
                  {pageDescription}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 sm:px-5 sm:py-3 text-sm sm:text-base font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Save size={18} />
            {saving ? "جارٍ الحفظ..." : "حفظ الإعدادات"}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl 2xl:max-w-7xl px-0 py-4 sm:px-6 sm:py-8">
        {!isUpsellCenter && slug !== "internal-courier-fleet" ? (
          <div className="mb-4 sm:mb-6 rounded-xl border border-blue-100 bg-blue-50 p-4 sm:p-5 dark:border-blue-900/40 dark:bg-blue-900/10">
            <div className="mb-2 flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Settings2 size={18} />
              <span className="font-semibold">منطق التنفيذ الحالي</span>
            </div>
            <p className="text-xs sm:text-sm leading-6 sm:leading-7 text-blue-800 dark:text-blue-200">
              الإعدادات هنا مصممة لتخدم 3 طبقات معًا: الظهور في Marketplace، والربط مع الـ
              storefront العام، والإدراج داخل القوالب والثيمات كـ components وvariants.
            </p>
          </div>
        ) : null}

        <AppSettingsInsights
          slug={slug}
          isUpsellCenter={isUpsellCenter}
          companyApp={companyApp}
          usageInsights={usageInsights}
          topFeature={topFeature}
          insightsLoading={insightsLoading}
          billingSummary={billingSummary}
          billingSummaryLoading={billingSummaryLoading}
          conversionJourney={conversionJourney}
          reviewInsights={reviewInsights}
          navigate={navigate}
        />

        {renderForm()}

        {!isUpsellCenter ? (
          <div className="mt-6 sm:mt-8 rounded-xl border border-border bg-white p-4 sm:p-6 dark:border-border dark:bg-muted">
            <div className="mb-3 flex items-center gap-2 text-foreground">
              <Package size={18} />
              <span className="font-semibold">معاينة بنية الإعدادات</span>
            </div>
            <pre className="overflow-x-auto rounded-xl bg-muted p-3 sm:p-4 text-xs leading-6 text-success">
              {JSON.stringify(normalizedSettings, null, 2)}
            </pre>
          </div>
        ) : null}
      </div>
    </div>
  );
}
