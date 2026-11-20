import React from "react";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

interface TurboStatusCardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
  enabled: boolean;
  onToggle: (checked: boolean) => void;
}

export const TurboStatusCard: React.FC<TurboStatusCardProps> = ({
  t,
  enabled,
  onToggle,
}) => {
  return (
    <div
      className={`p-4 rounded-lg border-2 transition-colors ${
        enabled
          ? "bg-green-50 dark:bg-success/20 border-success dark:border-success"
          : "bg-gray-50 dark:bg-muted border-border dark:border-border"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {enabled ? (
            <CheckCircleIcon className="h-6 w-6 text-success dark:text-success ms-2" />
          ) : (
            <XCircleIcon className="h-6 w-6 text-muted-foreground/80 ms-2" />
          )}
          <div>
            <h3 className="font-medium text-foreground">
              {enabled ? t("turbo.k_10") : t("turbo.k_11")}
            </h3>
            <p className="text-sm text-foreground dark:text-muted-foreground">
              {enabled ? t("turbo.k_12") : t("turbo.k_13")}
            </p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer" dir="ltr">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
            className="sr-only peer"
            aria-label={enabled ? t("turbo.k_10") : t("turbo.k_11")}
          />
          <div className="w-14 h-7 bg-muted dark:bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer peer-checked:bg-indigo-600 dark:peer-checked:bg-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-gray-600 after:border after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
        </label>
      </div>
    </div>
  );
};
