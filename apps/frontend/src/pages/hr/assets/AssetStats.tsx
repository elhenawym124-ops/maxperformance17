import React, { useState, useEffect } from "react";
import {
  CubeIcon,
  CurrencyDollarIcon,
  ClipboardDocumentCheckIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import { companyAwareApi } from "../../../services/companyAwareApi";
import { useCurrency } from "../../../hooks/useCurrency";

const AssetStats: React.FC<{ refreshTrigger: number }> = ({
  refreshTrigger,
}) => {
  const [stats, setStats] = useState({
    totalCount: 0,
    totalValue: 0,
    inUseCount: 0,
    maintenanceCount: 0,
  });
  const { formatPrice } = useCurrency();

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

  const fetchStats = async () => {
    try {
      // For now, we calculate stats from the assets list because we didn't make a specific stats endpoint
      // This is acceptable for MVP
      const response = await companyAwareApi.get("/hr/assets");
      if (response.data.success) {
        const assets = response.data.data;
        const totalCount = assets.length;
        const totalValue = assets.reduce(
          (sum: number, asset: any) => sum + (Number(asset.purchaseValue) || 0),
          0,
        );
        const inUseCount = assets.filter(
          (a: any) => a.status === "IN_USE",
        ).length;
        const maintenanceCount = assets.filter(
          (a: any) => a.status === "MAINTENANCE",
        ).length;

        setStats({ totalCount, totalValue, inUseCount, maintenanceCount });
      }
    } catch (error) {
      console.error("Error fetching asset stats:", error);
    }
  };

  const statCards = [
    {
      name: "إجمالي الأصول",
      value: stats.totalCount,
      icon: CubeIcon,
      color: "bg-indigo-50 text-primary",
    },
    {
      name: "القيمة الإجمالية",
      value: formatPrice(stats.totalValue),
      icon: CurrencyDollarIcon,
      color: "bg-green-50 text-success",
    },
    {
      name: "أصول في الاستخدام",
      value: stats.inUseCount,
      icon: ClipboardDocumentCheckIcon,
      color: "bg-blue-50 text-primary",
    },
    {
      name: "في الصيانة",
      value: stats.maintenanceCount,
      icon: WrenchScrewdriverIcon,
      color: "bg-yellow-50 text-warning",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((card) => (
        <div
          key={card.name}
          className="relative overflow-hidden rounded-lg bg-card px-4 pt-5 pb-12 shadow sm:px-6 sm:pt-6 border border-border dark:border-border"
        >
          <dt>
            <div className={`absolute rounded-md p-3 ${card.color}`}>
              <card.icon className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="ms-16 truncate text-sm font-medium text-muted-foreground">
              {card.name}
            </p>
          </dt>
          <dd className="ms-16 flex items-baseline pb-1 sm:pb-2">
            <p className="text-2xl font-semibold text-foreground">
              {card.value}
            </p>
          </dd>
        </div>
      ))}
    </div>
  );
};

export default AssetStats;
