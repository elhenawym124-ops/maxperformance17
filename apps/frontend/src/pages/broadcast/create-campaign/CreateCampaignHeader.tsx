import React from "react";
import { EyeIcon } from "@heroicons/react/24/outline";

interface CreateCampaignHeaderProps {
  previewMode: boolean;
  onTogglePreview: () => void;
}

export const CreateCampaignHeader: React.FC<CreateCampaignHeaderProps> = ({
  previewMode,
  onTogglePreview,
}) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-lg leading-6 font-medium text-foreground">
          إنشاء حملة برودكاست جديدة
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          قم بإنشاء حملة إرسال جماعي لتصل لعملائك خلال 24 ساعة
        </p>
      </div>
      <button
        type="button"
        onClick={onTogglePreview}
        className="inline-flex items-center px-3 py-2 border border-border shadow-sm text-sm leading-4 font-medium rounded-md text-foreground bg-card hover:bg-muted dark:hover:bg-muted transition-colors"
      >
        <EyeIcon className="h-4 w-4 ms-2" />
        {previewMode ? "إخفاء المعاينة" : "معاينة"}
      </button>
    </div>
  );
};
