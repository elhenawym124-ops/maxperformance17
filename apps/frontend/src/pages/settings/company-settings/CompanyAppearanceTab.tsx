import React from "react";
import { ChartBarIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import i18n from "../../../i18n";
import { SIDEBAR_LAYOUT_OPTIONS, SidebarLayout } from "./types";

interface CompanyAppearanceTabProps {
  sidebarLayout: SidebarLayout;
  savingLayout: boolean;
  handleLayoutChange: (layout: SidebarLayout) => void;
}

export const CompanyAppearanceTab: React.FC<CompanyAppearanceTabProps> = ({
  sidebarLayout,
  savingLayout,
  handleLayoutChange,
}) => {
  return (
    <div className="bg-card shadow rounded-lg p-6 mb-8">
      <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
        <ChartBarIcon className="h-6 w-6 text-primary me-2" />
        نظام القائمة الجانبية
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SIDEBAR_LAYOUT_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => handleLayoutChange(option.id)}
            disabled={savingLayout}
            className={`relative p-4 rounded-xl border-2 text-right transition-[background-color,border-color,color,box-shadow] duration-200 ${
              sidebarLayout === option.id
                ? "border-indigo-500 bg-primary/10 dark:bg-primary/20"
                : "border-gray-200 dark:border-border hover:border-border"
            }`}
          >
            <h3
              className={`font-semibold ${
                sidebarLayout === option.id
                  ? "text-indigo-700 dark:text-primary"
                  : "text-foreground"
              }`}
            >
              {i18n.t(option.nameKey)}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {i18n.t(option.descriptionKey)}
            </p>
            {sidebarLayout === option.id && (
              <div className="absolute top-4 left-4 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                <CheckCircleIcon className="h-3 w-3 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
