import React from "react";
import { Card, CardContent } from "../../../components/ui/card";
import { PromotionStats } from "./types";

interface EmployeesPromotionStatsGridProps {
  stats: PromotionStats;
}

export const EmployeesPromotionStatsGrid: React.FC<
  EmployeesPromotionStatsGridProps
> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-foreground font-mono tabular-nums">
            {stats.total}
          </div>
          <div className="text-sm text-muted-foreground">إجمالي الترقيات</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-warning font-mono tabular-nums">
            {stats.pending}
          </div>
          <div className="text-sm text-muted-foreground">قيد المراجعة</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-success font-mono tabular-nums">
            {stats.approved}
          </div>
          <div className="text-sm text-muted-foreground">موافق عليها</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-destructive font-mono tabular-nums">
            {stats.rejected}
          </div>
          <div className="text-sm text-muted-foreground">مرفوضة</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-primary font-mono tabular-nums">
            {stats.completed}
          </div>
          <div className="text-sm text-muted-foreground">مكتملة</div>
        </CardContent>
      </Card>
    </div>
  );
};
