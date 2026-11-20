import React from "react";
import { useTranslation } from "react-i18next";
import { TopProductItem } from "./types";

interface ReportsTopProductsProps {
  topProducts: TopProductItem[];
}

export const ReportsTopProducts: React.FC<ReportsTopProductsProps> = ({
  topProducts,
}) => {
  const { t } = useTranslation();

  if (topProducts.length === 0) return null;

  return (
    <div className="mb-8 bg-card shadow rounded-lg border border-border dark:border-border overflow-hidden">
      <div className="px-4 py-4 border-b border-border dark:border-border">
        <h3 className="text-lg font-medium text-foreground">
          {t("reports.topProducts", "المنتجات الأكثر مبيعاً")}
        </h3>
      </div>
      <div className="divide-y divide-border dark:divide-border">
        {topProducts.map((item, index) => (
          <div
            key={`${item.name}-${index}`}
            className="px-4 py-3 flex items-center justify-between hover:bg-muted dark:hover:bg-muted transition-colors"
          >
            <span className="text-sm font-medium text-foreground truncate">
              {item.name}
            </span>
            <span className="text-sm text-muted-foreground tabular-nums">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
