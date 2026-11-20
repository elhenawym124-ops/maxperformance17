import React from "react";
import {
  Bot,
  Sparkles,
  Layers,
  Compass,
  Sun,
  Type,
  Sliders,
} from "lucide-react";

export type ControlPanelTab =
  | "COPILOT"
  | "DIRECTOR"
  | "LIBRARY"
  | "PRESETS"
  | "PHYSICS"
  | "TYPOGRAPHY"
  | "ADVANCED";

interface CreativeStudioTabBarProps {
  activeTab: ControlPanelTab;
  onChangeTab: (tab: ControlPanelTab) => void;
}

export const CreativeStudioTabBar: React.FC<CreativeStudioTabBarProps> = ({
  activeTab,
  onChangeTab,
}) => {
  const tabs = [
    {
      id: "COPILOT" as const,
      label: "محادثة الإيجنت",
      icon: Bot,
      iconClass: "text-indigo-500",
    },
    {
      id: "DIRECTOR" as const,
      label: "المخرج الإبداعي",
      icon: Sparkles,
      iconClass: "text-amber-500",
    },
    {
      id: "LIBRARY" as const,
      label: "مكتبة المشاهد والتبديل",
      icon: Layers,
      iconClass: "text-primary",
    },
    {
      id: "PRESETS" as const,
      label: "البيئات الأربعة",
      icon: Compass,
      iconClass: "",
    },
    {
      id: "PHYSICS" as const,
      label: "الظلال والحجم",
      icon: Sun,
      iconClass: "text-amber-500",
    },
    {
      id: "TYPOGRAPHY" as const,
      label: "نصوص العرض",
      icon: Type,
      iconClass: "",
    },
    {
      id: "ADVANCED" as const,
      label: "الموديل",
      icon: Sliders,
      iconClass: "",
    },
  ];

  return (
    <div className="flex border-b border-border dark:border-border bg-muted dark:bg-muted px-2 pt-1.5 gap-0.5 overflow-x-auto flex-shrink-0 no-scrollbar">
      {tabs.map((tab) => {
        const IconComponent = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChangeTab(tab.id)}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-t-lg transition cursor-pointer border-b-2 whitespace-nowrap ${
              isActive
                ? "bg-white dark:bg-muted text-primary border-primary dark:border-primary shadow-2xs"
                : "text-slate-500 hover:text-foreground dark:hover:text-muted-foreground border-transparent"
            }`}
          >
            <IconComponent
              className={`w-3.5 h-3.5 ${tab.iconClass || ""}`}
            />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
