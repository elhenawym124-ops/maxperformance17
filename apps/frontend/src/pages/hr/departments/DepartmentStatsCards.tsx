import React from "react";
import { Building2, Activity, Users } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { motion } from "framer-motion";

interface DepartmentStatsCardsProps {
  totalDepartments: number;
  activeDepartments: number;
  totalEmployees: number;
}

export const DepartmentStatsCards: React.FC<DepartmentStatsCardsProps> = ({
  totalDepartments,
  activeDepartments,
  totalEmployees,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 sm:grid-cols-3 gap-4"
    >
      <Card className="rounded-xl border border-border/70 bg-card shadow-xs transition-colors hover:border-border">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground truncate mb-1">
                إجمالي الأقسام
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums tracking-tight">
                {totalDepartments}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
              <Building2 className="size-5" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl border border-border/70 bg-card shadow-xs transition-colors hover:border-border">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground truncate mb-1">
                الأقسام النشطة
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums tracking-tight">
                {activeDepartments}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-success/10 text-success dark:text-success border border-success/20 shrink-0">
              <Activity className="size-5" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl border border-border/70 bg-card shadow-xs transition-colors hover:border-border">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground truncate mb-1">
                إجمالي الموظفين
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums tracking-tight">
                {totalEmployees}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-warning/10 text-warning dark:text-warning border border-warning/20 shrink-0">
              <Users className="size-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
