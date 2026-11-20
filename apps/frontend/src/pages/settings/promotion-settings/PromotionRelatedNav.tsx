import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PackageCheck, Percent, Sparkles } from "lucide-react";

export function PromotionRelatedNav() {
  const { t } = useTranslation();

  const relatedTools = [
    {
      to: "/settings/store-promotion",
      icon: Percent,
      label: t("promotionSettings.relatedVolume"),
      desc: t("promotionSettings.relatedVolumeDesc"),
    },
    {
      to: "/settings/delivery-options",
      icon: PackageCheck,
      label: t("promotionSettings.relatedDelivery"),
      desc: t("promotionSettings.relatedDeliveryDesc"),
    },
    {
      to: "/settings/recommendations",
      icon: Sparkles,
      label: t("promotionSettings.relatedRecommend"),
      desc: t("promotionSettings.relatedRecommendDesc"),
    },
  ];

  return (
    <nav
      aria-label={t("promotionSettings.relatedToolsLabel")}
      className="flex gap-2.5 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 xl:grid-cols-3"
    >
      {relatedTools.map((tool) => {
        const Icon = tool.icon;
        return (
          <Link
            key={tool.to}
            to={tool.to}
            className="group flex min-w-[240px] shrink-0 items-start gap-2.5 rounded-xl border border-border bg-white/85 px-3.5 py-3 transition hover:-translate-y-px hover:border-border hover:shadow-xs sm:min-w-0 dark:border-border dark:bg-muted dark:hover:border-border"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground ring-1 ring-inset ring-border transition group-hover:bg-white dark:bg-muted dark:text-muted-foreground dark:ring-border dark:group-hover:bg-muted">
              <Icon className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-foreground dark:text-muted-foreground">
                {tool.label}
              </span>
              <span className="block text-xs text-muted-foreground dark:text-muted-foreground">
                {tool.desc}
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
