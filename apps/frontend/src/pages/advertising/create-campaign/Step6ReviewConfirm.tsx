import React from "react";
import { CampaignFormData, FacebookPixel } from "./types";
import {
  conversionLocations,
  optimizationGoals,
  availableLocations,
  availableInterests,
  availablePlacements,
  buyingTypes,
  bidStrategies,
  specialAdCategories,
} from "./constants";
import { CAMPAIGN_OBJECTIVES } from "../../../services/facebookAdsService";

interface Step6ReviewConfirmProps {
  formData: CampaignFormData;
  pixels: FacebookPixel[];
}

export const Step6ReviewConfirm: React.FC<Step6ReviewConfirmProps> = ({
  formData,
  pixels,
}) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">
        مراجعة وإطلاق
      </h2>

      <div className="space-y-4">
        {/* Campaign Info */}
        <div className="p-6 bg-muted dark:bg-muted rounded-lg space-y-4">
          <h3 className="font-medium text-foreground">معلومات الحملة</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-foreground dark:text-muted-foreground">اسم الحملة</p>
              <p className="font-semibold text-foreground">
                {formData.name}
              </p>
            </div>
            {formData.description && (
              <div>
                <p className="text-sm text-foreground dark:text-muted-foreground">الوصف</p>
                <p className="font-semibold text-foreground">
                  {formData.description}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-foreground dark:text-muted-foreground">الهدف</p>
              <p className="font-semibold text-foreground">
                {
                  CAMPAIGN_OBJECTIVES.find(
                    (o) => o.value === formData.objective,
                  )?.label
                }
              </p>
            </div>
            <div>
              <p className="text-sm text-foreground dark:text-muted-foreground">الحالة</p>
              <p className="font-semibold text-foreground">
                {formData.status === "ACTIVE" ? "نشطة" : "متوقفة"}
              </p>
            </div>
          </div>
        </div>

        {/* Budget */}
        <div className="p-6 bg-muted dark:bg-muted rounded-lg space-y-4">
          <h3 className="font-medium text-foreground">الميزانية</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-foreground dark:text-muted-foreground">نوع الميزانية</p>
              <p className="font-semibold text-foreground">
                {formData.budgetType === "DAILY" ? "يومية" : "إجمالية"}
              </p>
            </div>
            <div>
              <p className="text-sm text-foreground dark:text-muted-foreground">مبلغ الميزانية</p>
              <p className="font-semibold text-foreground font-mono tabular-nums">
                {formData.budgetAmount.toLocaleString()} EGP
              </p>
            </div>
            {formData.spendLimit && (
              <div>
                <p className="text-sm text-foreground dark:text-muted-foreground">حد الإنفاق</p>
                <p className="font-semibold text-foreground font-mono tabular-nums">
                  {formData.spendLimit.toLocaleString()} EGP
                </p>
              </div>
            )}
            {formData.budgetOptimization && (
              <div>
                <p className="text-sm text-foreground dark:text-muted-foreground">CBO</p>
                <p className="font-semibold text-success dark:text-success">مفعل</p>
              </div>
            )}
            {formData.startDate && (
              <div>
                <p className="text-sm text-foreground dark:text-muted-foreground">تاريخ البدء</p>
                <p className="font-semibold text-foreground font-mono tabular-nums">
                  {new Date(formData.startDate).toLocaleDateString("ar-EG")}
                </p>
              </div>
            )}
            {formData.endDate && (
              <div>
                <p className="text-sm text-foreground dark:text-muted-foreground">تاريخ الانتهاء</p>
                <p className="font-semibold text-foreground font-mono tabular-nums">
                  {new Date(formData.endDate).toLocaleDateString("ar-EG")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Targeting */}
        <div className="p-6 bg-muted dark:bg-muted rounded-lg space-y-4">
          <h3 className="font-medium text-foreground">الاستهداف</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-foreground dark:text-muted-foreground">مكان التحويل</p>
              <p className="font-semibold text-foreground">
                {conversionLocations.find(
                  (l) => l.value === formData.conversionLocation,
                )?.label || formData.conversionLocation}
              </p>
            </div>
            <div>
              <p className="text-sm text-foreground dark:text-muted-foreground">هدف التحسين</p>
              <p className="font-semibold text-foreground">
                {optimizationGoals.find(
                  (g) => g.value === formData.optimizationGoal,
                )?.label || formData.optimizationGoal}
              </p>
            </div>
            <div>
              <p className="text-sm text-foreground dark:text-muted-foreground">الفئة العمرية</p>
              <p className="font-semibold text-foreground font-mono tabular-nums">
                {formData.targetingAgeMin} - {formData.targetingAgeMax} سنة
              </p>
            </div>
            <div>
              <p className="text-sm text-foreground dark:text-muted-foreground">الجنس</p>
              <p className="font-semibold text-foreground">
                {formData.targetingGenders.length === 0
                  ? "الكل"
                  : formData.targetingGenders
                      .map((g) => (g === "male" ? "ذكور" : "إناث"))
                      .join(" و ")}
              </p>
            </div>
            <div>
              <p className="text-sm text-foreground dark:text-muted-foreground">المواقع</p>
              <p className="font-semibold text-foreground">
                {formData.targetingLocations
                  .map(
                    (code) =>
                      availableLocations.find((l) => l.value === code)
                        ?.label || code,
                  )
                  .join(", ")}
              </p>
            </div>
            {formData.targetingInterests.length > 0 && (
              <div>
                <p className="text-sm text-foreground dark:text-muted-foreground">الاهتمامات</p>
                <p className="font-semibold text-foreground">
                  {formData.targetingInterests
                    .map(
                      (i) =>
                        availableInterests.find((int) => int.value === i)
                          ?.label || i,
                    )
                    .join(", ")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Placements */}
        <div className="p-6 bg-muted dark:bg-muted rounded-lg space-y-4">
          <h3 className="font-medium text-foreground">المواضع</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-foreground dark:text-muted-foreground">نوع المواضع</p>
              <p className="font-semibold text-foreground">
                {formData.placementType === "AUTOMATIC"
                  ? "Advantage+ (تلقائي)"
                  : "يدوي"}
              </p>
            </div>
            {formData.placementType === "MANUAL" &&
              formData.placements.length > 0 && (
                <div>
                  <p className="text-sm text-foreground dark:text-muted-foreground">المواضع المحددة</p>
                  <p className="font-semibold text-foreground">
                    {formData.placements
                      .map(
                        (p) =>
                          availablePlacements.find((pl) => pl.value === p)
                            ?.label || p,
                      )
                      .join(", ")}
                  </p>
                </div>
              )}
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="p-6 bg-muted dark:bg-muted rounded-lg space-y-4">
          <h3 className="font-medium text-foreground">
            الإعدادات المتقدمة
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-foreground dark:text-muted-foreground">نوع الشراء</p>
              <p className="font-semibold text-foreground">
                {buyingTypes.find((t) => t.value === formData.buyingType)
                  ?.label || "مزاد"}
              </p>
            </div>
            <div>
              <p className="text-sm text-foreground dark:text-muted-foreground">استراتيجية المزايدة</p>
              <p className="font-semibold text-foreground">
                {bidStrategies.find(
                  (s) => s.value === formData.bidStrategy,
                )?.label || "أقل تكلفة"}
              </p>
            </div>
            {formData.pixelId && (
              <div>
                <p className="text-sm text-foreground dark:text-muted-foreground">Facebook Pixel</p>
                <p className="font-semibold text-foreground">
                  {pixels.find((p) => p.pixelId === formData.pixelId)
                    ?.pixelName || formData.pixelId}
                </p>
              </div>
            )}
            {formData.specialAdCategories &&
              formData.specialAdCategories.length > 0 && (
                <div>
                  <p className="text-sm text-foreground dark:text-muted-foreground">فئات خاصة</p>
                  <p className="font-semibold text-foreground">
                    {formData.specialAdCategories
                      .map(
                        (id) =>
                          specialAdCategories.find((c) => c.value === id)
                            ?.label,
                      )
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              )}
          </div>
        </div>

        <div className="p-4 bg-success/10 dark:bg-success/20 border border-success dark:border-success rounded-lg">
          <p className="text-sm text-success dark:text-success">
            <strong>جاهز للإطلاق!</strong> راجع جميع الإعدادات أعلاه ثم اضغط على &quot;إنشاء الحملة&quot; لبدء حملتك الإعلانية.
          </p>
        </div>
      </div>
    </div>
  );
};
