import React from "react";
import { useTranslation } from "react-i18next";
import {
  TruckIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

interface TurboRecordsTopKpisProps {
  filterType: string;
  totalOrders: number;
  getStatusCount: (key: string) => number;
  onFilterChange: (key: string) => void;
}

export const TurboRecordsTopKpis: React.FC<TurboRecordsTopKpisProps> = ({
  filterType,
  totalOrders,
  getStatusCount,
  onFilterChange,
}) => {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Active shipments */}
      <button
        onClick={() => onFilterChange("active")}
        className={`rounded-xl border-2 p-4 text-right transition-all cursor-pointer shadow-sm hover:shadow-md ${
          filterType === "active"
            ? "border-warning bg-warning/10 dark:bg-warning/30 ring-2 ring-warning scale-[1.02]"
            : "border-warning dark:border-warning bg-warning/60 dark:bg-warning/20 hover:bg-warning/10 dark:hover:bg-warning/30"
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-warning dark:text-warning bg-warning/80 dark:bg-warning/60 px-2 py-0.5 rounded-md">
            {t("orders.k_42")}
          </span>
          <TruckIcon className="h-5 w-5 text-warning dark:text-warning" />
        </div>
        <div className="text-2xl font-black text-warning dark:text-warning font-mono tabular-nums">
          {getStatusCount("active")} {t("orders.k_43")}
        </div>
        <div className="text-xs text-warning dark:text-warning mt-1 font-medium">
          {t("orders.k_44")}
        </div>
      </button>

      {/* 2. Merchant preparing */}
      <button
        onClick={() => onFilterChange("merchant_preparing")}
        className={`rounded-xl border-2 p-4 text-right transition-all cursor-pointer shadow-sm hover:shadow-md ${
          filterType === "merchant_preparing"
            ? "border-primary bg-primary/10 dark:bg-primary/30 ring-2 ring-primary scale-[1.02]"
            : "border-primary dark:border-primary bg-primary/60 dark:bg-primary/20 hover:bg-primary/10 dark:hover:bg-primary/30"
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-primary dark:text-primary bg-primary/80 dark:bg-primary/60 px-2 py-0.5 rounded-md">
            {t("orders.k_45")}
          </span>
          <InformationCircleIcon className="h-5 w-5 text-primary" />
        </div>
        <div className="text-2xl font-black text-primary dark:text-primary font-mono tabular-nums">
          {getStatusCount("merchant_preparing")} {t("orders.k_43")}
        </div>
        <div className="text-xs text-primary dark:text-primary mt-1 font-medium">
          {t("orders.k_46")}
        </div>
      </button>

      {/* 3. Branch processing */}
      <button
        onClick={() => onFilterChange("processing")}
        className={`rounded-xl border-2 p-4 text-right transition-all cursor-pointer shadow-sm hover:shadow-md ${
          filterType === "processing"
            ? "border-primary bg-primary/10 dark:bg-primary/30 ring-2 ring-primary scale-[1.02]"
            : "border-primary dark:border-primary bg-primary/60 dark:bg-primary/20 hover:bg-primary/10 dark:hover:bg-primary/30"
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-primary dark:text-primary bg-primary/80 dark:bg-primary/60 px-2 py-0.5 rounded-md">
            {t("orders.k_47")}
          </span>
          <InformationCircleIcon className="h-5 w-5 text-primary dark:text-primary" />
        </div>
        <div className="text-2xl font-black text-primary dark:text-primary font-mono tabular-nums">
          {getStatusCount("processing")} {t("orders.k_43")}
        </div>
        <div className="text-xs text-primary dark:text-primary mt-1 font-medium">
          {t("orders.k_48")}
        </div>
      </button>

      {/* 4. Total orders */}
      <button
        onClick={() => onFilterChange("all")}
        className={`rounded-xl border-2 p-4 text-right transition-all cursor-pointer shadow-sm hover:shadow-md ${
          filterType === "all"
            ? "border-primary bg-primary/10 dark:bg-primary/30 ring-2 ring-primary scale-[1.02]"
            : "border-border dark:dark:border-border bg-card hover:bg-muted/50"
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-primary dark:text-primary bg-primary dark:bg-primary/60 px-2 py-0.5 rounded-md">
            {t("orders.k_49")}
          </span>
          <TruckIcon className="h-5 w-5 text-primary dark:text-primary" />
        </div>
        <div className="text-2xl font-black text-foreground font-mono tabular-nums">
          {totalOrders} {t("orders.k_43")}
        </div>
        <div className="text-xs text-muted-foreground mt-1 font-medium">
          {t("orders.k_50")}
        </div>
      </button>
    </div>
  );
};

export default TurboRecordsTopKpis;
