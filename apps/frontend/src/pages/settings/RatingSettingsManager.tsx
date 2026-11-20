import React from "react";
import {
  RatingAutomationPoliciesCard,
  RatingHealthReportCard,
  RatingSaveBar,
  RatingThresholdsCard,
  useRatingSettingsController,
} from "./rating-settings";

const RatingSettingsManager: React.FC = () => {
  const {
    loading,
    saving,
    healthData,
    settings,
    validationError,
    handleSave,
    handleChange,
  } = useRatingSettingsController();

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground dark:text-muted-foreground">
        جاري تحميل الإعدادات...
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <RatingHealthReportCard healthData={healthData} />

      <RatingThresholdsCard
        settings={settings}
        validationError={validationError}
        onChange={handleChange}
      />

      <RatingAutomationPoliciesCard
        autoApproveExcellent={settings.autoApproveExcellent}
        autoRejectBad={settings.autoRejectBad}
        onChange={handleChange}
      />

      <RatingSaveBar
        saving={saving}
        disabled={Boolean(validationError)}
        onSave={handleSave}
      />
    </div>
  );
};

export default RatingSettingsManager;
