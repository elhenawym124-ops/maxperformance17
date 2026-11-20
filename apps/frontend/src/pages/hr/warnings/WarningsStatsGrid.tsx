import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { FileText, Clock, CheckCircle2, ShieldAlert } from "lucide-react";
import { WarningStats } from "./types";

interface WarningsStatsGridProps {
  stats: WarningStats | null;
}

export const WarningsStatsGrid: React.FC<WarningsStatsGridProps> = ({
  stats,
}) => {
  if (!stats) return null;

  const severeCount =
    stats.bySeverity.find((s) => s.severity === "severe")?._count || 0;
  const pendingCount = stats.total - stats.acknowledged;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-card border-none shadow-sm hover:shadow-md transition-all">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">
            إجمالي الإنذارات
          </CardTitle>
          <FileText className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono tabular-nums text-blue-900 dark:text-blue-100">
            {stats.total}
          </div>
          <p className="text-xs text-blue-600/80 mt-1">سجل كامل للمخالفات</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-warning to-white dark:from-warning/20 dark:to-card border-none shadow-sm hover:shadow-md transition-all">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-warning dark:text-warning">
            قيد الانتظار
          </CardTitle>
          <Clock className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono tabular-nums text-warning dark:text-warning">
            {pendingCount}
          </div>
          <p className="text-xs text-warning/80 mt-1">
            بانتظار توقيع الموظف
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-success to-white dark:from-success/20 dark:to-card border-none shadow-sm hover:shadow-md transition-all">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-success dark:text-success">
            مكتملة الإجراءات
          </CardTitle>
          <CheckCircle2 className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono tabular-nums text-success dark:text-success">
            {stats.acknowledged}
          </div>
          <p className="text-xs text-success/80 mt-1">تم الاعتراف بها</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-destructive to-white dark:from-destructive/20 dark:to-card border-none shadow-sm hover:shadow-md transition-all">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-destructive dark:text-destructive">
            مخالفات جسيمة
          </CardTitle>
          <ShieldAlert className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono tabular-nums text-destructive dark:text-destructive">
            {severeCount}
          </div>
          <p className="text-xs text-destructive/80 mt-1">تتطلب انتباه فوري</p>
        </CardContent>
      </Card>
    </div>
  );
};
