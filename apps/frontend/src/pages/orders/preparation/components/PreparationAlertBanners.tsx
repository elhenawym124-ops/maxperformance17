import React from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";

export interface PreparationAlertBannersProps {
  preparationSettingsEnabled: boolean;
  allOverdueShortageFollowUpCount: number;
  allOverdueProblemFollowUpCount: number;
}

export const PreparationAlertBanners: React.FC<PreparationAlertBannersProps> = ({
  preparationSettingsEnabled,
  allOverdueShortageFollowUpCount,
  allOverdueProblemFollowUpCount,
}) => {
  const { t } = useTranslation();

  return (
    <>
      {!preparationSettingsEnabled && (
        <div className="flex items-center gap-2 rounded-xl border border-warning bg-warning/10 px-4 py-2.5 text-xs sm:text-sm text-warning dark:border-warning/60 dark:bg-warning/20 dark:text-warning shadow-xs">
          <AlertTriangle className="h-4 w-4 shrink-0 text-warning dark:text-warning" />
          <span className="font-semibold">{t("preparation.k_1", { defaultValue: "إعدادات التجهيز غير مفعلة" })}</span>
          <span className="text-warning dark:text-warning">{t("preparation.k_2", { defaultValue: "يرجى مراجعة إعدادات المستودع" })}</span>
        </div>
      )}

      {allOverdueShortageFollowUpCount > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-warning bg-warning/10 px-4 py-2.5 text-xs sm:text-sm text-warning dark:border-warning/60 dark:bg-warning/20 dark:text-warning shadow-xs">
          <AlertTriangle className="h-4 w-4 shrink-0 text-warning dark:text-warning" />
          <span className="font-semibold">
            {t("preparation.overdueBanner", {
              count: allOverdueShortageFollowUpCount,
              defaultValue: `يوجد ${allOverdueShortageFollowUpCount} طلب متأخر في متابعة النواقص`,
            })}
          </span>
          <span className="text-warning dark:text-warning">{t("preparation.k_3", { defaultValue: "يرجى اتخاذ إجراء سريع" })}</span>
        </div>
      )}

      {allOverdueProblemFollowUpCount > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-warning bg-warning/10 px-4 py-2.5 text-xs sm:text-sm text-warning dark:border-warning/60 dark:bg-warning/20 dark:text-warning shadow-xs">
          <AlertTriangle className="h-4 w-4 shrink-0 text-warning dark:text-warning" />
          <span className="font-semibold">
            {t("preparation.problemOverdueBanner", {
              count: allOverdueProblemFollowUpCount,
              defaultValue: `يوجد ${allOverdueProblemFollowUpCount} طلب متأخر في حل المشكلات`,
            })}
          </span>
        </div>
      )}
    </>
  );
};

export default PreparationAlertBanners;
