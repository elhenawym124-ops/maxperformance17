import React from "react";
import { useTranslation } from "react-i18next";
import { Zap, Activity, DollarSign, Clock, Layers } from "lucide-react";
import { AutomationReportKpis } from "./OrderAutomationReportsTypes";

interface AutomationReportsKpisProps {
  kpis: AutomationReportKpis;
  loading: boolean;
}

export const AutomationReportsKpis: React.FC<AutomationReportsKpisProps> = ({
  kpis,
  loading,
}) => {
  const { t } = useTranslation();

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("ar-EG", {
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const cards = [
    {
      id: "totalTransitions",
      title: t("orders.kpiTotalTransitions", "إجمالي تنفيذات الأتمتة"),
      value: kpis.totalTransitions.toLocaleString("ar-EG"),
      subValue: "من قواعد وأحداث هذه الصفحة فقط",
      icon: Zap,
      accent: "text-primary",
      bgAccent: "bg-primary/10",
      borderAccent: "border-primary/20",
    },
    {
      id: "uniqueOrders",
      title: t("orders.kpiUniqueOrders", "طلبات فريدة مؤتمتة"),
      value: kpis.uniqueOrders.toLocaleString("ar-EG"),
      subValue: t("orders.kpiOrdersTouched", "طلب تم تغييره عبر الأتمتة"),
      icon: Activity,
      accent: "text-emerald-500",
      bgAccent: "bg-emerald-500/10",
      borderAccent: "border-emerald-500/20",
    },
    {
      id: "totalRevenue",
      title: t("orders.kpiTotalRevenue", "قيمة الطلبات المؤتمتة"),
      value: `${formatCurrency(kpis.totalRevenue)} ج.م`,
      subValue: t("orders.kpiRevenueProtected", "إجمالي مبيعات الطلبات المنفذة"),
      icon: DollarSign,
      accent: "text-amber-500",
      bgAccent: "bg-amber-500/10",
      borderAccent: "border-amber-500/20",
    },
    {
      id: "channelBreakdown",
      title: t("orders.kpiChannels", "توزيع مسارات الأتمتة"),
      value: `${kpis.rulesTransitions.toLocaleString("ar-EG")} قواعد`,
      subValue: `${kpis.printTransitions} طباعة • ${kpis.turboTransitions} تربو`,
      icon: Layers,
      accent: "text-blue-500",
      bgAccent: "bg-blue-500/10",
      borderAccent: "border-blue-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className="flex flex-col justify-between rounded-xl border border-border/70 bg-card p-4 transition-all hover:border-border shadow-2xs"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-semibold text-muted-foreground">
                {card.title}
              </span>
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${card.borderAccent} ${card.bgAccent} ${card.accent}`}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="mt-2.5">
              <div className="text-xl font-bold font-mono tabular-nums text-foreground">
                {loading ? "..." : card.value}
              </div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                {card.subValue}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
