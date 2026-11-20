import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Activity as ChartBarIcon,
  Circle as PresentationChartLineIcon,
  DollarSign as CurrencyDollarIcon,
} from "lucide-react";

export const RelatedViewsPanel: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const relatedViews = [
    {
      id: "profit-loss",
      title: t("reports.profitLossTitle", "تقرير الأرباح والخسائر"),
      description: t(
        "reports.profitLossDescription",
        "تحليل تفصيلي للإيرادات والتكاليف وهوامش الربح الإجمالية والصافية",
      ),
      cta: t("reports.openRoute", "فتح الصفحة"),
      icon: CurrencyDollarIcon,
      onClick: () => navigate("/reports/profit-loss"),
    },
    {
      id: "advanced-analytics",
      title: t("reports.advancedAnalyticsTitle", "التحليلات المتقدمة"),
      description: t(
        "reports.advancedAnalyticsDescription",
        "لوحة بيانات تفاعلية لاستكشاف اتجاهات المتجر ومؤشرات النمو",
      ),
      cta: t("reports.openRoute", "فتح الصفحة"),
      icon: PresentationChartLineIcon,
      onClick: () => navigate("/analytics"),
    },
    {
      id: "status-analysis",
      title: "تحليل تقارير الحالات",
      description: "تحليل مفصل لأداء الطلبات بناءً على حالتها الحالية",
      cta: t("reports.openRoute", "فتح الصفحة"),
      icon: ChartBarIcon,
      onClick: () => navigate("/reports/status-analysis"),
    },
  ];

  return (
    <div className="bg-white shadow rounded-lg dark:bg-muted border border-border dark:border-border overflow-hidden">
      <div className="border-b border-border px-4 py-5 dark:border-border">
        <h3 className="text-lg font-medium text-foreground">
          {t("reports.relatedViews", "صفحات وإحصائيات ذات صلة")}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("reports.relatedViewsHint", "انتقل مباشرة للتقارير المتقدمة ذات الصلة")}
        </p>
      </div>
      <div className="space-y-3 p-4">
        {relatedViews.map((view) => {
          const IconComponent = view.icon;
          return (
            <button
              key={view.id}
              type="button"
              onClick={view.onClick}
              className="w-full rounded-xl border border-border bg-muted px-4 py-4 text-right transition hover:border-primary hover:bg-primary/10 dark:border-border dark:bg-muted dark:hover:border-primary/50 dark:hover:bg-muted active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-white p-2 text-primary shadow-sm dark:bg-muted dark:text-primary">
                  <IconComponent className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {view.title}
                  </p>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground">
                    {view.description}
                  </p>
                  <span className="mt-3 inline-flex text-xs font-semibold text-primary dark:text-primary">
                    {view.cta} &larr;
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
