import React from "react";
import { useTranslation } from "react-i18next";
import { SparklesIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

export function SidebarSmartInfoCard() {
  const { t } = useTranslation();

  return (
    <div className="mt-8 rounded-xl border border-primary bg-primary/50 p-4 dark:border-primary/30 dark:bg-primary/20">
      <div className="flex items-start gap-3">
        <SparklesIcon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div>
          <h4 className="text-sm font-semibold text-primary dark:text-primary">
            {t("sidebar.sidebarSmartTitle")}
          </h4>
          <ul className="mt-2 space-y-1.5 text-xs text-primary dark:text-primary">
            <li className="flex items-center gap-1.5">
              <CheckCircleIcon className="h-3.5 w-3.5 shrink-0" />
              <span>{t("sidebar.sidebarSmartHidden")}</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircleIcon className="h-3.5 w-3.5 shrink-0" />
              <span>{t("sidebar.sidebarSmartRoles")}</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircleIcon className="h-3.5 w-3.5 shrink-0" />
              <span>{t("sidebar.sidebarSmartInactive")}</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircleIcon className="h-3.5 w-3.5 shrink-0" />
              <span>{t("sidebar.sidebarSmartAutoSave")}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
