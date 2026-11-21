import { useTranslation } from "react-i18next";
import { fmtMoney } from "../../shared";
import type { ReportsKpi } from "../types/reportsTypes";

export function ReportsKpiCards({ kpi }: { kpi: ReportsKpi | null }) {
  const { t } = useTranslation();

  const kpiCards = [
    {
      label: t("dentalLab.dashboard.collected"),
      value: kpi ? fmtMoney(kpi.revenue) : "—",
    },
    {
      label: t("dentalLab.dashboard.outstanding"),
      value: kpi ? fmtMoney(kpi.outstanding) : "—",
    },
    {
      label: t("dentalLab.dashboard.todayReceived"),
      value: String(kpi?.todayReceived ?? "—"),
    },
    {
      label: t("dentalLab.dashboard.overdueCount"),
      value: String(kpi?.overdueCount ?? "—"),
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {kpiCards.map((k) => (
        <div
          key={k.label}
          className="rounded-xl border border-border dark:border-border bg-card px-4 py-3"
        >
          <p className="text-xs text-muted-foreground truncate">{k.label}</p>
          <p className="text-lg font-bold truncate font-mono tabular-nums text-foreground mt-1">
            {k.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export default ReportsKpiCards;
