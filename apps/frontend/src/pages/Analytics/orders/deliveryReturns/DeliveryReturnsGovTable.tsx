import React from "react";
import { useTranslation } from "react-i18next";
import { MapPin } from "lucide-react";
import { useCurrency } from "../../../../hooks/useCurrency";

export interface GovernoratePerformance {
  name: string;
  totalShipped: number;
  delivered: number;
  returned: number;
  inTransit: number;
  deliveryRate: number;
  returnRate: number;
  codCollected: number;
}

interface Props {
  governorates: GovernoratePerformance[];
  search: string;
}

export const DeliveryReturnsGovTable: React.FC<Props> = ({ governorates, search }) => {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();

  const filtered = governorates.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase().trim()),
  );

  if (filtered.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <MapPin className="h-10 w-10 mx-auto text-muted-foreground dark:text-foreground mb-2" />
        <p className="text-sm font-medium">{t("deliveryReturnsReport.noData")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 dark:bg-muted border-b border-border dark:border-border text-muted-foreground">
            <tr>
              <th className="py-3 px-4 font-semibold">{t("deliveryReturnsReport.governorateName")}</th>
              <th className="py-3 px-3 font-semibold">{t("deliveryReturnsReport.shipped")}</th>
              <th className="py-3 px-3 font-semibold text-success dark:text-success">{t("deliveryReturnsReport.delivered")}</th>
              <th className="py-3 px-3 font-semibold text-warning dark:text-warning">{t("deliveryReturnsReport.returned")}</th>
              <th className="py-3 px-3 font-semibold text-blue-600 dark:text-blue-400">{t("deliveryReturnsReport.inTransit")}</th>
              <th className="py-3 px-3 font-semibold cursor-help" title={t("deliveryReturnsReport.closedRateTooltip")}>
                {t("deliveryReturnsReport.closedRate")}
              </th>
              <th className="py-3 px-3 font-semibold cursor-help" title={t("deliveryReturnsReport.returnRateTooltip")}>
                {t("deliveryReturnsReport.returnRate")}
              </th>
              <th className="py-3 px-4 font-semibold">{t("deliveryReturnsReport.codDeliveredRevenue")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border dark:divide-border">
            {filtered.map((gov) => {
              const isHighDelivery = gov.deliveryRate >= 70;
              const isMidDelivery = gov.deliveryRate >= 45 && gov.deliveryRate < 70;
              const closedCount = gov.delivered + gov.returned;

              return (
                <tr
                  key={gov.name}
                  className="hover:bg-slate-50/70 dark:hover:bg-muted transition-colors"
                >
                  <td className="py-3 px-4 font-medium text-foreground whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>{gov.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono font-semibold text-foreground dark:text-muted-foreground tabular-nums">
                    {gov.totalShipped.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 font-mono text-success dark:text-success tabular-nums">
                    {gov.delivered.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 font-mono text-warning dark:text-warning tabular-nums">
                    {gov.returned.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 font-mono text-blue-600 dark:text-blue-400 tabular-nums">
                    {gov.inTransit.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 font-mono font-semibold tabular-nums">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] ${
                        isHighDelivery
                          ? "bg-emerald-50 dark:bg-success/40 text-success dark:text-success border border-success/60 dark:border-success/40"
                          : isMidDelivery
                            ? "bg-amber-50 dark:bg-warning/40 text-warning dark:text-warning border border-warning/60 dark:border-warning/40"
                            : "bg-rose-50 dark:bg-destructive/40 text-destructive dark:text-destructive border border-destructive/60 dark:border-destructive/40"
                      }`}
                      title={`${gov.delivered} مسلّم ÷ ${closedCount} محسوم`}
                    >
                      {gov.deliveryRate}%
                    </span>
                  </td>
                  <td
                    className="py-3 px-3 font-mono text-muted-foreground tabular-nums"
                    title={`${gov.returned} مرتجع ÷ ${gov.totalShipped} مشحون`}
                  >
                    {gov.returnRate}%
                  </td>
                  <td className="py-3 px-4 font-mono font-medium text-foreground tabular-nums whitespace-nowrap">
                    {formatPrice(gov.codCollected)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-2.5 bg-muted dark:bg-muted rounded-lg border border-border dark:border-border text-[11px] text-muted-foreground">
        {t("deliveryReturnsReport.tableMetricsLegend")}
      </div>
    </div>
  );
};
