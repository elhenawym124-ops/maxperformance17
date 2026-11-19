import React from "react";
import { useTranslation } from "react-i18next";
import { Users, Building2, UserCheck, AlertCircle } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { DashboardData } from "./types";

interface HRDashboardStatsGridProps {
  data: DashboardData | null;
}

export const HRDashboardStatsGrid: React.FC<HRDashboardStatsGridProps> = ({
  data,
}) => {
  const { t } = useTranslation();

  const stats = [
    {
      label: t("hrDashboard.totalEmployees"),
      value: data?.employees.totalEmployees || 0,
      icon: Users,
      iconColor: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-500/10",
    },
    {
      label: t("hrDashboard.todaysAttendance"),
      value: data?.attendance.present || 0,
      icon: UserCheck,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-500/10",
    },
    {
      label: t("hrDashboard.pendingLeaves"),
      value: data?.pendingLeaves?.length || 0,
      icon: AlertCircle,
      iconColor: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-500/10",
    },
    {
      label: t("hrDashboard.totalDepartments"),
      value: data?.departments.totalDepartments || 0,
      icon: Building2,
      iconColor: "text-indigo-600 dark:text-indigo-400",
      iconBg: "bg-indigo-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
      {stats.map((stat, i) => (
        <Card
          key={i}
          className="rounded-xl sm:rounded-2xl border border-border/70 bg-card shadow-xs transition-colors hover:border-border"
        >
          <CardContent className="p-3 sm:p-5 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate mb-1">
                {stat.label}
              </p>
              <p className="text-xl sm:text-3xl font-bold text-foreground font-mono tabular-nums tracking-tight">
                {stat.value}
              </p>
            </div>
            <div
              className={`p-2 sm:p-3 rounded-lg sm:rounded-xl border border-border/40 ${stat.iconBg} ${stat.iconColor} shrink-0`}
            >
              <stat.icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
