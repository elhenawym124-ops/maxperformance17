import React from "react";
import type { CampaignFormData } from "./types";

interface CampaignPreviewCardProps {
  formData: CampaignFormData;
  previewMessage: string;
}

export const CampaignPreviewCard: React.FC<CampaignPreviewCardProps> = ({
  formData,
  previewMessage,
}) => {
  return (
    <div className="lg:sticky lg:top-6">
      <div className="bg-gray-50 dark:bg-muted rounded-lg p-4">
        <h4 className="text-sm font-medium text-foreground mb-3">
          معاينة الرسالة
        </h4>
        <div className="bg-card rounded-lg p-4 shadow-sm border dark:border-border">
          <div className="flex items-center mb-3">
            <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-white">ش</span>
            </div>
            <div className="me-3">
              <p className="text-sm font-medium text-foreground">
                شركتك
              </p>
              <p className="text-xs text-muted-foreground">
                {formData.sendNow
                  ? "سيتم الإرسال فوراً"
                  : formData.scheduledAt &&
                    formData.scheduledTime &&
                    new Date(
                      `${formData.scheduledAt}T${formData.scheduledTime}`
                    ).toLocaleString("ar-EG", {
                      calendar: "gregory",
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
              </p>
            </div>
          </div>
          <div className="text-sm text-foreground whitespace-pre-wrap">
            {previewMessage}
          </div>
          {formData.message &&
            (formData.message.includes("{customerName}") ||
              formData.message.includes("{firstName}") ||
              formData.message.includes("{lastName}")) && (
              <div className="mt-2 p-2 bg-primary/10 dark:bg-primary/30 rounded text-xs text-primary dark:text-primary">
                ℹ️ المعاينة تعرض مثال مع بيانات وهمية. سيتم استبدال المتغيرات
                بالبيانات الحقيقية عند الإرسال.
              </div>
            )}
          {formData.tags &&
            Array.isArray(formData.tags) &&
            formData.tags.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex flex-wrap gap-1">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-block px-2 py-1 text-xs bg-muted text-foreground rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              المستلمون:
            </span>
            <span className="font-medium text-foreground tabular-nums">
              {formData.recipientCount.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">الأولوية:</span>
            <span
              className={`font-medium ${
                formData.priority === "high"
                  ? "text-red-600 dark:text-destructive"
                  : formData.priority === "medium"
                  ? "text-yellow-600 dark:text-warning"
                  : "text-green-600 dark:text-success"
              }`}
            >
              {formData.priority === "high"
                ? "عالية"
                : formData.priority === "medium"
                ? "متوسطة"
                : "منخفضة"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
