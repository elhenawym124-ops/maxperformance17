import React from "react";
import {
  ExclamationTriangleIcon,
  MinusIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

interface CampaignRiskBadgeProps {
  roi: number;
}

export const CampaignRiskBadge: React.FC<CampaignRiskBadgeProps> = ({ roi }) => {
  if (roi < 0) {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-destructive/10 dark:bg-destructive text-destructive dark:text-destructive">
        <ExclamationTriangleIcon className="w-4 h-4 ms-1" />
        مخاطر عالية
      </span>
    );
  } else if (roi < 50) {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-warning/10 dark:bg-warning text-warning dark:text-warning">
        <MinusIcon className="w-4 h-4 ms-1" />
        مخاطر متوسطة
      </span>
    );
  } else {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-success/10 dark:bg-success text-success dark:text-success">
        <CheckCircleIcon className="w-4 h-4 ms-1" />
        فرصة ممتازة
      </span>
    );
  }
};
