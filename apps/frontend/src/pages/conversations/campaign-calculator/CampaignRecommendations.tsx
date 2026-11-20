import React from "react";
import {
  LightBulbIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  BookmarkIcon as SaveIcon,
} from "@heroicons/react/24/outline";
import { SmartRecommendation } from "./types";

interface CampaignRecommendationsProps {
  recommendations: SmartRecommendation[];
  onSaveScenario: () => void;
}

export const CampaignRecommendations: React.FC<
  CampaignRecommendationsProps
> = ({ recommendations, onSaveScenario }) => {
  return (
    <>
      {recommendations.length > 0 && (
        <div className="bg-white dark:bg-muted rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <LightBulbIcon className="w-6 h-6 text-warning dark:text-warning" />
            توصيات ذكية
          </h3>
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg flex items-start gap-3 ${
                  rec.type === "warning"
                    ? "bg-red-50 dark:bg-destructive border business-border-danger-soft"
                    : rec.type === "success"
                      ? "bg-emerald-50 dark:bg-success border business-border-success-soft"
                      : "bg-blue-50 dark:bg-primary border border-primary dark:border-primary"
                }`}
              >
                {rec.type === "warning" ? (
                  <ExclamationTriangleIcon className="w-5 h-5 text-destructive dark:text-destructive flex-shrink-0 mt-0.5" />
                ) : rec.type === "success" ? (
                  <CheckCircleIcon className="w-5 h-5 text-success dark:text-success flex-shrink-0 mt-0.5" />
                ) : (
                  <InformationCircleIcon className="w-5 h-5 text-primary dark:text-primary flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-medium text-foreground">
                    {rec.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {rec.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <button
          onClick={onSaveScenario}
          className="flex items-center gap-2 px-6 py-3 business-bg-primary-solid text-white rounded-lg business-hover-primary-solid transition-colors font-medium"
        >
          <SaveIcon className="w-5 h-5" />
          حفظ هذا السيناريو
        </button>
      </div>
    </>
  );
};
