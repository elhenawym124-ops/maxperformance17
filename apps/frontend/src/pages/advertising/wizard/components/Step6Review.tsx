import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  CheckCircle,
  ExternalLink,
  Target,
  DollarSign,
  Users,
  Layout,
  Image,
  AlertCircle,
} from "lucide-react";
import type { FormData, CreatedFullAdSummary, TargetingOption } from "../types";
import type {
  FacebookCustomAudience,
  FacebookLookalikeAudience,
  FacebookPage,
  FacebookPixel,
} from "../../../../services/facebookAdsService";
import {
  getObjectives,
  getPerformanceGoals,
  getConversionEvents,
  getBidStrategies,
  getAttributionWindows,
  getCountries,
} from "../constants";
import {
  getCompatibleAttributionWindows,
  normalizeAttributionWindowForObjective,
  formatAdAccountCurrency,
  buildWizardGeoSummary,
} from "../../CreateAdWizard.helpers";

interface Step6ReviewProps {
  createdFullAd: CreatedFullAdSummary | null;
  formData: FormData;
  handleChange: (field: keyof FormData, value: any) => void;
  selectedBusinessName: string;
  selectedAdAccountName: string;
  selectedAdAccountId: string;
  selectedFacebookPage?: FacebookPage | null;
  selectedFacebookPixel?: FacebookPixel | null;
  selectedAdAccountCurrency?: string;
  selectedInterests?: TargetingOption[];
  selectedCustomAudiences?: string[];
  customAudiences?: FacebookCustomAudience[];
  selectedLookalikeAudiences?: string[];
  lookalikeAudiences?: FacebookLookalikeAudience[];
  errors?: Record<string, string>;
}

export const Step6Review: React.FC<Step6ReviewProps> = ({
  createdFullAd,
  formData,
  handleChange,
  selectedBusinessName,
  selectedAdAccountName,
  selectedAdAccountId,
  selectedFacebookPage,
  selectedFacebookPixel,
  selectedAdAccountCurrency,
  selectedInterests,
  selectedCustomAudiences,
  customAudiences,
  selectedLookalikeAudiences,
  lookalikeAudiences,
  errors,
}) => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isEn = Boolean(i18n.language && i18n.language.startsWith("en"));

  const objectives = getObjectives(isEn);
  const performanceGoals = getPerformanceGoals(isEn);
  const conversionEvents = getConversionEvents(isEn);
  const bidStrategies = getBidStrategies(isEn);
  const attributionWindows = getAttributionWindows(isEn);
  const countries = getCountries(isEn);

  const compatibleAttributionWindows = getCompatibleAttributionWindows(
    formData.objective,
    attributionWindows,
  );
  const selectedAttributionWindowLabel =
    compatibleAttributionWindows.find(
      (window) => window.value === formData.attributionWindow,
    )?.label ||
    attributionWindows.find((window) => window.value === formData.attributionWindow)
      ?.label ||
    normalizeAttributionWindowForObjective(
      formData.objective,
      formData.attributionWindow,
    );
  const formatSelectedAdAccountCurrency = (value?: number | string | null) =>
    formatAdAccountCurrency(value, selectedAdAccountCurrency, isEn);
  const selectedGeoSummary = buildWizardGeoSummary(formData, isEn, countries);
  const selectedTargetingSignalCount =
    (selectedInterests?.length || 0) +
    (selectedCustomAudiences?.length || 0) +
    (selectedLookalikeAudiences?.length || 0) +
    (formData.excludedCustomAudiences?.length || 0) +
    (formData.languages?.length || 0) +
    (formData.devicePlatforms?.length || 0);
  return (
    <div className="space-y-6">
      {errors && Object.keys(errors).length > 0 && (
        <div className="rounded-xl border border-destructive dark:border-destructive/60 bg-destructive/10 dark:bg-destructive/40 p-5 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-destructive dark:text-destructive">
            <AlertCircle className="w-5 h-5 text-destructive dark:text-destructive shrink-0" />
            <span>
              {isEn
                ? "Please resolve the following required fields before confirming:"
                : "يرجى استكمال البيانات التالية قبل تأكيد النشر:"}
            </span>
          </div>
          <ul className="list-disc list-inside text-sm text-destructive dark:text-destructive space-y-1">
            {Object.entries(errors).map(([key, msg]) => (
              <li key={key}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      {createdFullAd && (
        <div
          className="rounded-xl border border-success dark:border-success/60 bg-success/10 dark:bg-success/40 p-5"
          data-testid="full-ad-created-panel"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-success dark:text-success">
                {isEn ? "Ad created on Meta" : "تم إنشاء الإعلان على Meta"}
              </p>
              <h3 className="mt-1 text-xl font-bold text-foreground dark:text-white">
                {isEn ? "Ad is saved and linked with production IDs" : "الإعلان محفوظ ومربوط بمعرفات الإنتاج"}
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {createdFullAd.localAdId && (
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/advertising/facebook-ads/ads/${createdFullAd.localAdId}`,
                    )
                  }
                  className="rounded-xl bg-success px-4 py-2 text-sm font-semibold text-white hover:bg-success"
                >
                  {isEn ? "Open Ad Details" : "فتح تفاصيل الإعلان"}
                </button>
              )}
              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/advertising/facebook-ads?adAccountId=${createdFullAd.adAccountId}`,
                  )
                }
                className="rounded-xl border border-success dark:border-success bg-card px-4 py-2 text-sm font-semibold text-success dark:text-success hover:bg-success dark:hover:bg-success/40"
              >
                {isEn ? "Back to Ads Dashboard" : "رجوع للوحة الإعلانات"}
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["Campaign", createdFullAd.facebookCampaignId],
              ["Ad Set", createdFullAd.facebookAdSetId],
              ["Ad", createdFullAd.facebookAdId],
              ["Creative", createdFullAd.creativeId],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-success dark:border-success/60 bg-card px-4 py-3"
              >
                <div className="text-xs font-semibold uppercase text-success dark:text-success">
                  {label}
                </div>
                <div className="mt-1 break-all text-sm font-bold text-foreground dark:text-white">
                  {value || (isEn ? "Unavailable" : "غير متاح")}
                </div>
              </div>
            ))}
          </div>

          {(createdFullAd.localCampaignId ||
            createdFullAd.localAdSetId ||
            createdFullAd.localAdId) && (
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {[
                ["Local Campaign", createdFullAd.localCampaignId],
                ["Local Ad Set", createdFullAd.localAdSetId],
                ["Local Ad", createdFullAd.localAdId],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-success dark:border-success/60 bg-success/60 dark:bg-success/40 px-4 py-3"
                >
                  <div className="text-xs font-semibold uppercase text-success dark:text-success">
                    {label}
                  </div>
                  <div className="mt-1 break-all text-sm font-bold text-foreground dark:text-white">
                    {value || (isEn ? "Unavailable" : "غير متاح")}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 text-sm font-semibold text-success dark:text-success">
            {isEn ? "Status: " : "الحالة: "}{createdFullAd.status}
          </div>
        </div>
      )}

      <div className="bg-gray-50 dark:bg-muted border border-border dark:border-border rounded-xl p-6">
        <h3 className="text-lg font-bold text-foreground mb-4">
          {isEn ? "Ad Summary" : "ملخص الإعلان"}
        </h3>

        {/* Campaign Summary */}
        <div className="space-y-4">
          <div className="flex justify-between py-2 border-b border-border dark:border-border">
            <span className="text-gray-600 dark:text-muted-foreground">{isEn ? "Campaign Name" : "اسم الحملة"}</span>
            <span className="font-medium text-foreground">{formData.campaignName}</span>
          </div>
          {(formData.adSetName || formData.adName) && (
            <div className="flex justify-between gap-4 py-2 border-b border-border dark:border-border">
              <span className="text-gray-600 dark:text-muted-foreground">{isEn ? "Ad Structure" : "هيكل الإعلان"}</span>
              <span className="text-left font-medium text-foreground">
                {[formData.adSetName, formData.adName].filter(Boolean).join(" / ")}
              </span>
            </div>
          )}
          <div className="flex justify-between py-2 border-b border-border dark:border-border">
            <span className="text-gray-600 dark:text-muted-foreground">{isEn ? "Objective" : "الهدف"}</span>
            <span className="font-medium text-foreground">
              {objectives.find((o) => o.value === formData.objective)?.label}
            </span>
          </div>

          {/* Ad Set Level Info */}
          {compatibleAttributionWindows.length > 0 && (
            <>
              {(formData.objective === "OUTCOME_SALES" ||
                formData.objective === "OUTCOME_LEADS") && (
                <>
                  <div className="flex justify-between py-2 border-b border-border dark:border-border">
                    <span className="text-gray-600 dark:text-muted-foreground">{isEn ? "Performance Goal" : "هدف الأداء"}</span>
                    <span className="font-medium text-foreground">
                      {
                        performanceGoals.find(
                          (g) => g.value === formData.performanceGoal,
                        )?.label
                      }
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border dark:border-border">
                    <span className="text-gray-600 dark:text-muted-foreground">{isEn ? "Conversion Event" : "حدث التحويل"}</span>
                    <span className="font-medium text-foreground">
                      {
                        conversionEvents.find(
                          (e) => e.value === formData.conversionEvent,
                        )?.label
                      }
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between py-2 border-b border-border dark:border-border">
                <span className="text-gray-600 dark:text-muted-foreground">{isEn ? "Attribution Window" : "نافذة الإحالة"}</span>
                <span className="font-medium text-foreground">{selectedAttributionWindowLabel}</span>
              </div>
            </>
          )}

          <div className="flex justify-between py-2 border-b border-border dark:border-border">
            <span className="text-gray-600 dark:text-muted-foreground">{isEn ? "Budget" : "الميزانية"}</span>
            <span className="font-medium text-foreground">
              {formatSelectedAdAccountCurrency(formData.budgetAmount)} /{" "}
              {formData.budgetType === "DAILY" ? (isEn ? "Daily" : "يومياً") : (isEn ? "Lifetime" : "إجمالي")}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-border dark:border-border">
            <span className="text-gray-600 dark:text-muted-foreground">{isEn ? "Bid Strategy" : "استراتيجية المزايدة"}</span>
            <span className="font-medium text-foreground">
              {
                bidStrategies.find((b) => b.value === formData.bidStrategy)
                  ?.label
              }
            </span>
          </div>
          {formData.frequencyCap && (
            <div className="flex justify-between py-2 border-b border-border dark:border-border">
              <span className="text-gray-600 dark:text-muted-foreground">{isEn ? "Frequency Cap" : "حد التكرار"}</span>
              <span className="font-medium text-foreground">
                {formData.frequencyCap} {isEn ? (formData.frequencyCap === 1 ? "time" : "times") : "مرة"} /{" "}
                {formData.frequencyCapInterval === "DAY"
                  ? (isEn ? "Daily" : "يومياً")
                  : formData.frequencyCapInterval === "WEEK"
                    ? (isEn ? "Weekly" : "أسبوعياً")
                    : (isEn ? "Monthly" : "شهرياً")}
              </span>
            </div>
          )}
          <div className="flex justify-between py-2 border-b border-border dark:border-border">
            <span className="text-gray-600 dark:text-muted-foreground">{isEn ? "Locations" : "المواقع"}</span>
            <span className={`font-medium text-foreground ${isEn ? "text-right" : "text-left"}`}>
              {selectedGeoSummary || (isEn ? "Unspecified" : "غير محدد")}
            </span>
          </div>
          {selectedTargetingSignalCount > 0 && (
            <div className="flex justify-between py-2 border-b border-border dark:border-border">
              <span className="text-gray-600 dark:text-muted-foreground">{isEn ? "Active Targeting Signals" : "إشارات الاستهداف النشطة"}</span>
              <span className="font-medium text-foreground">
                {selectedTargetingSignalCount} {isEn ? (selectedTargetingSignalCount === 1 ? "signal" : "signals") : "اختيار"}
              </span>
            </div>
          )}
          <div className="flex justify-between py-2 border-b border-border dark:border-border">
            <span className="text-gray-600 dark:text-muted-foreground">{isEn ? "Age Range" : "الفئة العمرية"}</span>
            <span className="font-medium text-foreground">
              {formData.ageMin} - {formData.ageMax}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-border dark:border-border">
            <span className="text-gray-600 dark:text-muted-foreground">{isEn ? "Placements" : "المواضع"}</span>
            <span className="font-medium text-foreground">
              {formData.placementType === "AUTOMATIC"
                ? (isEn ? "Automatic" : "تلقائي")
                : `${formData.publisherPlatforms?.length || 0} ${isEn ? "placements" : "مواضع"}`}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-border dark:border-border">
            <span className="text-gray-600 dark:text-muted-foreground">{isEn ? "Creative Format" : "نوع المحتوى"}</span>
            <span className="font-medium text-foreground">
              {formData.creativeType === "SINGLE_IMAGE"
                ? (isEn ? "Single Image" : "صورة")
                : formData.creativeType === "SINGLE_VIDEO"
                  ? (isEn ? "Single Video" : "فيديو")
                  : formData.creativeType === "CAROUSEL"
                    ? (isEn ? "Carousel" : "دوّار")
                    : formData.creativeType === "EXISTING_POST"
                      ? (isEn ? "Existing Page Post" : "منشور من الصفحة")
                      : (isEn ? "Flexible" : "مرن (Flexible)")}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-border dark:border-border">
            <span className="text-gray-600 dark:text-muted-foreground">{isEn ? "Ad Page" : "صفحة الإعلان"}</span>
            <span className="font-medium text-foreground">
              {selectedFacebookPage?.name || formData.pageId || (isEn ? "Unspecified" : "غير محددة")}
            </span>
          </div>
          {selectedFacebookPage?.isConnectedToCompany === false && (
            <div className="rounded-lg border border-warning dark:border-warning/60 bg-warning/10 dark:bg-warning/40 px-4 py-3 text-sm text-warning dark:text-warning">
              {isEn
                ? "The ad will be published under an available page from the current Meta account, but it is not linked to this company in Max P."
                : "الإعلان سيُنشر باسم صفحة متاحة من حساب Meta الحالي لكنها غير مربوطة بهذه الشركة داخل Max P."}
            </div>
          )}
          {formData.creativeType === "EXISTING_POST" && formData.postId && (
            <div className="flex justify-between py-2 border-b border-border dark:border-border">
              <span className="text-gray-600 dark:text-muted-foreground">{isEn ? "Post ID" : "معرف المنشور"}</span>
              <span className="font-medium text-foreground">
                {formData.postId}
              </span>
            </div>
          )}
          {formData.creativeType === "FLEXIBLE" &&
            (formData.flexibleAssets?.length || 0) > 0 && (
              <div className="flex justify-between py-2 border-b border-border dark:border-border">
                <span className="text-gray-600 dark:text-muted-foreground">{isEn ? "File Count" : "عدد الملفات"}</span>
                <span className="font-medium text-success dark:text-success">
                  {formData.flexibleAssets?.length || 0} {isEn ? ((formData.flexibleAssets?.length || 0) === 1 ? "file" : "files") : "ملف"}
                </span>
              </div>
            )}
          {formData.linkUrl && (
            <div className="flex justify-between py-2">
              <span className="text-gray-600 dark:text-muted-foreground">{isEn ? "Destination URL" : "رابط الوجهة"}</span>
              <span className="font-medium text-primary dark:text-primary truncate max-w-xs">
                {formData.linkUrl}
              </span>
            </div>
          )}
          {formData.urlParameters && (
            <div className="flex justify-between py-2">
              <span className="text-gray-600 dark:text-muted-foreground">{isEn ? "URL Parameters" : "معاملات URL"}</span>
              <span className="font-medium text-xs text-muted-foreground truncate max-w-xs">
                {formData.urlParameters}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Status Selection */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          {isEn ? "Ad Status After Publishing" : "حالة الإعلان بعد النشر"}
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleChange("status", "PAUSED")}
            className={`p-4 border-2 rounded-xl text-center transition-all ${
              formData.status === "PAUSED"
                ? "border-yellow-500 bg-warning/10 dark:bg-warning/40 text-warning dark:text-warning"
                : "border-gray-200 dark:border-border hover:border-border text-foreground bg-card"
            }`}
          >
            <div className="font-medium">{isEn ? "Paused" : "متوقف مؤقتاً"}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {isEn ? "Review ad before activating" : "راجع الإعلان قبل تفعيله"}
            </div>
          </button>
          <button
            type="button"
            onClick={() => handleChange("status", "ACTIVE")}
            className={`p-4 border-2 rounded-xl text-center transition-all ${
              formData.status === "ACTIVE"
                ? "border-green-500 bg-success/10 dark:bg-success/40 text-success dark:text-success"
                : "border-gray-200 dark:border-border hover:border-border text-foreground bg-card"
            }`}
          >
            <div className="font-medium">{isEn ? "Active Immediately" : "نشط فوراً"}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {isEn ? "Start ad delivery immediately" : "ابدأ عرض الإعلان مباشرة"}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
