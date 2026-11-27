import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ChartBarIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { Type } from "lucide-react";
import i18n from "../../../i18n";
import {
  applyDashboardFont,
  getStoredDashboardFont,
  setStoredDashboardFont,
} from "../../../utils/dashboardFont";
import {
  DASHBOARD_FONT_OPTIONS,
  DEFAULT_DASHBOARD_FONT,
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

  const activeFont = useMemo(
    () =>
      DASHBOARD_FONT_OPTIONS.find((f) => f.id === dashboardFont) ??
      DASHBOARD_FONT_OPTIONS.find((f) => f.id === DEFAULT_DASHBOARD_FONT)!,
    [dashboardFont],
  );

  const arabicFonts = useMemo(
    () => DASHBOARD_FONT_OPTIONS.filter((f) => f.group === "ar"),
    [],
  );
  const englishFonts = useMemo(
    () => DASHBOARD_FONT_OPTIONS.filter((f) => f.group === "en"),
    [],
  );

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
        <div className="max-w-md space-y-3">
          <select
            aria-label="خط الواجهة"
            value={dashboardFont}
            onChange={(e) => handleFontChange(e.target.value as DashboardFontFamily)}
            className="w-full px-3.5 py-2.5 bg-card border border-border/70 text-foreground rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-2xs cursor-pointer"
          >
            <optgroup label="الخطوط العربية (الأكثر استخداماً 2026)">
              {arabicFonts.map((font) => (
                <option key={font.id} value={font.id}>
                  {font.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="الخطوط الإنجليزية (الأكثر استخداماً 2026)">
              {englishFonts.map((font) => (
                <option key={font.id} value={font.id}>
                  {font.label}
                </option>
              ))}
            </optgroup>
          </select>

          <div
            className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-foreground"
            style={{ fontFamily: activeFont.cssStack }}
          >
            <p className="font-semibold">أهلاً بك في لوحة التحكم — 12,450 ج.م</p>
            <p className="text-xs text-muted-foreground mt-1" dir="ltr">
              Dashboard typography preview — 0123456789
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
