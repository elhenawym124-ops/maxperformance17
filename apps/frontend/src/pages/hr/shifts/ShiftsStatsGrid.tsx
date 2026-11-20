import React from "react";
import { Clock, TrendingUp, Users } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import type { ShiftStats } from "./types";

interface ShiftsStatsGridProps {
  stats: ShiftStats;
}

export const ShiftsStatsGrid: React.FC<ShiftsStatsGridProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="border-none shadow-sm bg-card/80 overflow-hidden group hover:shadow-md transition-all">
        <div className="h-1 w-full bg-primary opacity-60" />
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-muted-foreground/80 uppercase tracking-wider">
              الإجمالي
            </p>
            <p className="text-2xl font-black text-foreground dark:text-muted-foreground font-mono tabular-nums">
              {stats.total}
            </p>
          </div>
          <div className="p-3 bg-primary/10 dark:bg-primary/30 rounded-xl text-primary group-hover:scale-110 transition-transform">
            <Clock className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-card/80 overflow-hidden group hover:shadow-md transition-all">
        <div className="h-1 w-full bg-success opacity-60" />
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-muted-foreground/80 uppercase tracking-wider">
              نشطة
            </p>
            <p className="text-2xl font-black text-success dark:text-success font-mono tabular-nums">
              {stats.active}
            </p>
          </div>
          <div className="p-3 bg-success/10 dark:bg-success/30 rounded-xl text-success group-hover:scale-110 transition-transform">
            <TrendingUp className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-card/80 overflow-hidden group hover:shadow-md transition-all">
        <div className="h-1 w-full bg-muted opacity-60" />
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-muted-foreground/80 uppercase tracking-wider">
              معطلة
            </p>
            <p className="text-2xl font-black text-muted-foreground font-mono tabular-nums">
              {stats.inactive}
            </p>
          </div>
          <div className="p-3 bg-muted/60 rounded-xl text-muted-foreground group-hover:scale-110 transition-transform">
            <Clock className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-card/80 overflow-hidden group hover:shadow-md transition-all">
        <div className="h-1 w-full bg-primary opacity-60" />
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-muted-foreground/80 uppercase tracking-wider">
              الموظفين
            </p>
            <p className="text-2xl font-black text-primary dark:text-primary font-mono tabular-nums">
              {stats.totalAssignments}
            </p>
          </div>
          <div className="p-3 bg-primary/10 dark:bg-primary/30 rounded-xl text-primary group-hover:scale-110 transition-transform">
            <Users className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
