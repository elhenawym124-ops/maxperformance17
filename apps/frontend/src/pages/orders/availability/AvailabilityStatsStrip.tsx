import React from "react";
import {
  TableCellsIcon,
  ShoppingBagIcon,
  ShieldCheckIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

interface AvailabilityStatsStripProps {
  totalItems: number;
  preOrderOn: number;
  trackOn: number;
  outOfStock: number;
  loading: boolean;
}

export const AvailabilityStatsStrip: React.FC<AvailabilityStatsStripProps> = ({
  totalItems,
  preOrderOn,
  trackOn,
  outOfStock,
  loading,
}) => {
  const metricCards = [
    {
      title: "إجمالي المنتجات",
      value: totalItems,
      icon: TableCellsIcon,
      accent: "text-primary",
    },
    {
      title: "طلب مسبق مفعل",
      value: preOrderOn,
      icon: ShoppingBagIcon,
      accent: "text-primary dark:text-primary",
    },
    {
      title: "تتبع مخزون مفعل",
      value: trackOn,
      icon: ShieldCheckIcon,
      accent: "text-success dark:text-success",
    },
    {
      title: "نفد المخزون",
      value: outOfStock,
      icon: XCircleIcon,
      accent: "text-destructive dark:text-destructive",
    },
  ];

  return (
    <div className="rounded-xl border border-border/70 bg-card shadow-2xs overflow-hidden">
      <div className="grid grid-cols-2 divide-y divide-border/50 sm:grid-cols-4 sm:divide-y-0 sm:divide-x rtl:">
        {metricCards.map((card, index) => (
          <div key={index} className="p-3 sm:p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium mb-1">
              <span>{card.title}</span>
              <span className="flex h-1.5 w-1.5 rounded-full bg-border" />
            </div>
            <div className={`text-lg sm:text-xl font-bold tracking-tight font-mono tabular-nums ${card.accent}`}>
              {loading ? "..." : (typeof card.value === "number" ? card.value.toLocaleString() : card.value)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
