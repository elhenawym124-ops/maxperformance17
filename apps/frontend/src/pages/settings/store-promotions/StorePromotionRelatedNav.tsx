import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RelatedToolItem {
  to: string;
  icon: LucideIcon;
  label: string;
  desc: string;
  isCurrent: boolean;
}

interface StorePromotionRelatedNavProps {
  tools: RelatedToolItem[];
}

export const StorePromotionRelatedNav: React.FC<StorePromotionRelatedNavProps> = ({ tools }) => {
  const { t } = useTranslation();

  return (
    <nav
      aria-label={t("promotionSettings.relatedToolsLabel", "أدوات مرتبطة")}
      className="flex gap-2.5 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 xl:grid-cols-4"
    >
      {tools.map((tool) => {
        const Icon = tool.icon;
        const isCurrent = tool.isCurrent;
        return (
          <Link
            key={tool.to}
            to={tool.to}
            className={cn(
              "group flex min-w-[240px] shrink-0 items-start gap-2.5 rounded-xl border px-3.5 py-3 transition hover:-translate-y-px sm:min-w-0",
              isCurrent
                ? "border-amber-400/80 bg-warning/70 shadow-xs dark:border-warning/70 dark:bg-warning/30"
                : "border-slate-200/70 bg-white/85 hover:border-border hover:shadow-sm dark:border-border dark:bg-muted dark:hover:border-border"
            )}
          >
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset transition",
                isCurrent
                  ? "bg-amber-100 text-warning ring-warning/80 dark:bg-warning/50 dark:text-warning dark:ring-warning"
                  : "bg-slate-50 text-foreground ring-border group-hover:bg-white dark:bg-muted dark:text-muted-foreground dark:ring-border dark:group-hover:bg-muted"
              )}
            >
              <Icon className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-foreground dark:text-muted-foreground">
                {tool.label}
              </span>
              <span className="block text-xs text-muted-foreground dark:text-muted-foreground">{tool.desc}</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
};
