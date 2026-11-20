import { useTranslation } from "react-i18next";
import { PackageSearch, CheckCircle2, AlertCircle, Truck, Clock, Timer } from 'lucide-react';

interface PreparationStatsProps {
  searchedOrdersCount: number;
  readyCount: number;
  shortageCount: number;
  readyToShipCount: number;
  shortageHoldCount: number;
  overdueShortageFollowUpCount: number;
}

const PreparationStats = ({
  searchedOrdersCount,
  readyCount,
  shortageCount,
  readyToShipCount,
  shortageHoldCount,
  overdueShortageFollowUpCount,
}: PreparationStatsProps) => {
  const { t } = useTranslation();

  const items = [
    {
      title: t("preparation.stats.inPreparation"),
      count: searchedOrdersCount,
      icon: PackageSearch,
      iconColor: 'text-primary dark:text-primary',
      iconBg: 'bg-primary/10 dark:bg-primary/20',
      countColor: 'text-primary dark:text-primary',
    },
    {
      title: t("preparation.stats.fullyReady"),
      count: readyCount,
      icon: CheckCircle2,
      iconColor: 'text-success dark:text-success',
      iconBg: 'bg-success/10 dark:bg-success/20',
      countColor: 'text-success dark:text-success',
    },
    {
      title: t("preparation.stats.hasShortage"),
      count: shortageCount,
      icon: AlertCircle,
      iconColor: 'text-destructive dark:text-destructive',
      iconBg: 'bg-destructive/10 dark:bg-destructive/20',
      countColor: 'text-destructive dark:text-destructive',
    },
    {
      title: t("preparation.stats.readyToShip"),
      count: readyToShipCount,
      icon: Truck,
      iconColor: 'text-info dark:text-info',
      iconBg: 'bg-info/10 dark:bg-info/20',
      countColor: 'text-info dark:text-info',
    },
    {
      title: t("preparation.stats.onHoldByShortage"),
      count: shortageHoldCount,
      icon: Clock,
      iconColor: 'text-warning dark:text-warning',
      iconBg: 'bg-warning/10 dark:bg-warning/20',
      countColor: 'text-warning dark:text-warning',
    },
    {
      title: t("preparation.stats.overdueFollowUps"),
      count: overdueShortageFollowUpCount,
      icon: Timer,
      iconColor: 'text-warning dark:text-warning',
      iconBg: 'bg-warning/10 dark:bg-warning/20',
      countColor: 'text-warning dark:text-warning',
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
      {items.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-card px-3 py-2 transition-colors hover:border-border"
          >
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${stat.iconBg}`}
            >
              <Icon className={`h-3.5 w-3.5 ${stat.iconColor}`} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">{stat.title}</p>
              <p className={`mt-0.5 font-mono text-base font-semibold tabular-nums leading-none ${stat.countColor}`}>
                {stat.count.toLocaleString('en-US')}
              </p>
            </div>
          </div>
        );
      })}
    </section>
  );
};

export default PreparationStats;
