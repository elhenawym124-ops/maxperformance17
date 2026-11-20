import React from "react";
import { useTranslation } from "react-i18next";
import { PaintBrushIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import type { SidebarLayoutType } from "../../../types/layout";

export interface SidebarLayoutPickerProps {
  userLayout: SidebarLayoutType | null;
  onSelectLayout: (layout: SidebarLayoutType | null) => void;
}

export function SidebarLayoutPicker({
  userLayout,
  onSelectLayout,
}: SidebarLayoutPickerProps) {
  const { t } = useTranslation();

  const options: Array<{
    id: SidebarLayoutType;
    label: string;
    desc: string;
  }> = [
    {
      id: "polaris",
      label: "Shopify Polaris (الموصى به - أحدث قالب)",
      desc: "نمط شوبيفاي بولاريس فائق السرعة، فواصل شعرية وتصفية سريعة للأعمال",
    },
    {
      id: "classic",
      label: t("sidebar.sidebarLayoutClassic"),
      desc: t("sidebar.sidebarLayoutClassicDesc"),
    },
    {
      id: "three-tier",
      label: t("sidebar.sidebarLayoutThreeTier"),
      desc: t("sidebar.sidebarLayoutThreeTierDesc"),
    },
    {
      id: "horizontal",
      label: t("sidebar.sidebarLayoutHorizontal"),
      desc: t("sidebar.sidebarLayoutHorizontalDesc"),
    },
    {
      id: "floating",
      label: t("sidebar.sidebarLayoutFloating"),
      desc: t("sidebar.sidebarLayoutFloatingDesc"),
    },
    {
      id: "minimal",
      label: t("sidebar.sidebarLayoutMinimal"),
      desc: t("sidebar.sidebarLayoutMinimalDesc"),
    },
  ];

  return (
    <div className="mb-6 rounded-xl border border-border bg-white p-4 shadow-xs dark:border-border dark:bg-muted">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <PaintBrushIcon className="h-4 w-4 text-primary" />
        {t("sidebar.sidebarLayout")}
      </h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {options.map((opt) => {
          const isSelected = userLayout === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelectLayout(isSelected ? null : opt.id)}
              className={`relative rounded-xl border p-3 text-right transition-all duration-150 ${
                isSelected
                  ? "border-indigo-500 bg-primary/70 shadow-xs dark:border-primary dark:bg-primary/40"
                  : "border-gray-200 bg-white hover:border-border dark:border-border dark:bg-muted dark:hover:border-border"
              }`}
            >
              <div
                className={`text-xs font-semibold ${
                  isSelected
                    ? "text-indigo-700 dark:text-primary"
                    : "text-foreground"
                }`}
              >
                {opt.label}
              </div>
              <div className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                {opt.desc}
              </div>
              {isSelected && (
                <CheckCircleIcon className="absolute left-1.5 top-1.5 h-3.5 w-3.5 text-primary" />
              )}
            </button>
          );
        })}
        {userLayout && (
          <button
            type="button"
            onClick={() => onSelectLayout(null)}
            className="col-span-full mt-1 text-xs text-muted-foreground transition hover:text-foreground dark:hover:text-muted-foreground"
          >
            {t("sidebar.sidebarResetLayout")}
          </button>
        )}
      </div>
    </div>
  );
}
