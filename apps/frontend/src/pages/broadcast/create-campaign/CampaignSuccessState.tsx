import React from "react";
import { CheckCircleIcon } from "@heroicons/react/24/outline";

interface CampaignSuccessStateProps {
  message: string;
}

export const CampaignSuccessState: React.FC<CampaignSuccessStateProps> = ({
  message,
}) => {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-green-50 dark:bg-success/20 border border-success dark:border-success rounded-lg p-6 text-center">
        <CheckCircleIcon className="mx-auto h-12 w-12 text-success dark:text-success mb-4" />
        <h3 className="text-lg font-medium text-success dark:text-success mb-2">
          تم إنشاء الحملة بنجاح!
        </h3>
        <p className="text-green-600 dark:text-success">{message}</p>
      </div>
    </div>
  );
};
