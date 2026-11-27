import React, { useCallback, useEffect, useState } from "react";
import { ChartBarIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { Type } from "lucide-react";
import i18n from "../../../i18n";
import {
  applyDashboardFont,
  ensureGoogleFont,
  getStoredDashboardFont,
  setStoredDashboardFont,
} from "../../../utils/dashboardFont";
import {
  DASHBOARD_FONT_OPTIONS,
  SIDEBAR_LAYOUT_OPTIONS,
  SidebarLayout,
  type DashboardFontFamily,
} from "./types";

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
  const [dashboardFont, setDashboardFont] = useState<DashboardFontFamily>(getStoredDashboardFont);

  // Apply on mount + preload current font
  useEffect(() => {
    applyDashboardFont(dashboardFont);
  }, [dashboardFont]);

  const handleFontChange = useCallback((fontId: DashboardFontFamily) => {
    setDashboardFont(fontId);
    setStoredDashboardFont(fontId);
    applyDashboardFont(fontId);
  }, []);

  return (
    <>
      {/* Sidebar Layout Section */}
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

      {/* Dashboard Font Section */}
      <div className="bg-card shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
          <Type className="h-5 w-5 text-primary me-2" />
          خط الواجهة
        </h2>
        <p className="text-sm text-muted-foreground mb-5">
          اختر الخط المستخدم في لوحة التحكم — يُطبّق فوراً ويُحفظ على هذا الجهاز.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {DASHBOARD_FONT_OPTIONS.map((font) => {
            const isActive = dashboardFont === font.id;
            // Preload font CSS on hover
            const handleMouseEnter = () => ensureGoogleFont(font.id, font.googleFontsUrl);
            return (
              <button
                key={font.id}
                type="button"
                onClick={() => handleFontChange(font.id)}
                onMouseEnter={handleMouseEnter}
                className={`relative p-4 rounded-xl border-2 text-start transition-all duration-200 active:scale-[0.97] ${
                  isActive
                    ? "border-primary bg-primary/8 dark:bg-primary/15"
                    : "border-border/70 hover:border-border dark:border-border hover:bg-muted/30"
                }`}
              >
                {/* Font name */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`text-sm font-bold ${isActive ? "text-primary" : "text-foreground"}`}
                  >
                    {font.label}
                  </span>
                  {isActive && (
                    <div className="h-5 w-5 bg-primary rounded-full flex items-center justify-center shrink-0">
                      <CheckCircleIcon className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
                {/* Preview */}
                <p
                  className="text-xs text-muted-foreground leading-relaxed line-clamp-2"
                  style={{ fontFamily: font.cssStack }}
                >
                  {font.arabic
                    ? "أهلاً بك في لوحة التحكم — مرحباً 123"
                    : "Welcome to your dashboard — Hello 123"}
                </p>
                {/* Tag */}
                <span className="mt-2 inline-block rounded-full bg-muted/60 border border-border/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {font.arabic ? "عربي" : "لاتيني"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
