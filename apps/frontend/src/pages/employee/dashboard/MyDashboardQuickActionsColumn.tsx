import React from "react";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  Target,
} from "lucide-react";
import type { TFunction } from "i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import {
  AdvanceRequest,
  PermissionRequest,
  RecentLeave,
  Warning,
} from "./types";

interface MyDashboardQuickActionsColumnProps {
  t: TFunction;
  canCheckIn: boolean;
  pendingRequestsCount: number;
  recentLeaves: RecentLeave[];
  permissions: PermissionRequest[];
  advances: AdvanceRequest[];
  warnings: Warning[];
  onNavigate: (path: string, options?: { state?: Record<string, unknown> }) => void;
}

export const MyDashboardQuickActionsColumn: React.FC<
  MyDashboardQuickActionsColumnProps
> = ({
  t,
  canCheckIn,
  pendingRequestsCount,
  recentLeaves,
  permissions,
  advances,
  warnings,
  onNavigate,
}) => {
  return (
    <div className="space-y-6 lg:col-span-1">
      <Card className="rounded-xl border border-border/70 bg-card shadow-xs overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            {t("employee.dashboard.quickActions")}
          </CardTitle>
          <CardDescription>
            {t("employee.dashboard.quickActionsDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Button
            variant="outline"
            className="w-full justify-start h-14 rounded-xl bg-white dark:bg-muted border-border hover:border-primary/50 hover:bg-primary/5 shadow-sm transition-all group"
            onClick={() => onNavigate("/my-attendance")}
          >
            <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-xl ms-3 group-hover:bg-primary group-hover:scale-110 transition-all">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 text-right">
              <p className="font-bold text-foreground">
                {canCheckIn
                  ? t("employee.attendance.checkIn")
                  : t("employee.attendance.checkOut")}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {t("employee.dashboard.checkInOutDesc")}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 -me-4 group-hover:me-0 transition-all" />
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start h-14 rounded-xl bg-white dark:bg-muted border-border hover:border-success/50 hover:bg-success/50 shadow-sm transition-all group"
            onClick={() =>
              onNavigate("/my-leaves", { state: { createNew: true } })
            }
          >
            <div className="p-2 bg-success/10 dark:bg-success/20 rounded-xl ms-3 group-hover:bg-success group-hover:scale-110 transition-all">
              <Calendar className="h-5 w-5 text-success" />
            </div>
            <div className="flex-1 text-right">
              <p className="font-bold text-foreground">
                {t("employee.dashboard.requestLeave")}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {t("employee.dashboard.requestLeaveDesc")}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 -me-4 group-hover:me-0 transition-all" />
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start h-14 rounded-xl bg-white dark:bg-muted border-border hover:border-warning/50 hover:bg-warning/50 shadow-sm transition-all group"
            onClick={() =>
              onNavigate("/my-permissions", { state: { createNew: true } })
            }
          >
            <div className="p-2 bg-warning/10 dark:bg-warning/20 rounded-xl ms-3 group-hover:bg-warning group-hover:scale-110 transition-all">
              <FileText className="h-5 w-5 text-warning" />
            </div>
            <div className="flex-1 text-right">
              <p className="font-bold text-foreground">
                {t("employee.dashboard.requestPermission")}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {t("employee.dashboard.requestPermissionDesc")}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 -me-4 group-hover:me-0 transition-all" />
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start h-14 rounded-xl bg-white dark:bg-muted border-border hover:border-primary/50 hover:bg-primary/50 shadow-sm transition-all group"
            onClick={() =>
              onNavigate("/my-advances", { state: { createNew: true } })
            }
          >
            <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-xl ms-3 group-hover:bg-primary group-hover:scale-110 transition-all">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 text-right">
              <p className="font-bold text-foreground">
                {t("employee.dashboard.requestAdvance")}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {t("employee.dashboard.requestAdvanceDesc")}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 -me-4 group-hover:me-0 transition-all" />
          </Button>
        </CardContent>
      </Card>

      {pendingRequestsCount > 0 && (
        <Card className="border-none shadow-md bg-white dark:bg-muted relative overflow-hidden">
          <div className="absolute top-0 right-0 h-1 w-full bg-warning"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span>{t("employee.dashboard.pendingRequests")}</span>
              <Badge className="bg-yellow-100 text-warning hover:bg-warning border-none rounded-full font-mono tabular-nums">
                {pendingRequestsCount}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              {t("employee.dashboard.pendingRequestsDesc", {
                count: pendingRequestsCount,
              })}
            </p>
            <div className="flex -space-x-reverse space-x-2">
              {recentLeaves
                .filter((l) => l.status === "PENDING")
                .map((l) => (
                  <div
                    key={l.id}
                    title={t("employee.dashboard.leaveRequest")}
                    className="p-2 bg-success/10 dark:bg-success/20 rounded-lg text-success border border-success dark:border-success"
                  >
                    <Calendar className="h-4 w-4" />
                  </div>
                ))}
              {permissions
                .filter((p) => p.status === "PENDING")
                .map((p) => (
                  <div
                    key={p.id}
                    title={t("employee.dashboard.permissionRequest")}
                    className="p-2 bg-warning/10 dark:bg-warning/20 rounded-lg text-warning border border-warning dark:border-warning"
                  >
                    <FileText className="h-4 w-4" />
                  </div>
                ))}
              {advances
                .filter((a) => a.status === "PENDING")
                .map((a) => (
                  <div
                    key={a.id}
                    title={t("employee.dashboard.advanceRequest")}
                    className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg text-primary border border-primary dark:border-primary"
                  >
                    <DollarSign className="h-4 w-4" />
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {warnings.length > 0 &&
        warnings.some((w) => w.status === "ISSUED" || !w.status) && (
          <Card className="border-none shadow-md bg-destructive/10 dark:bg-destructive/10 border-r-4 border-r-red-500">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-1" />
              <div className="flex-1">
                <p className="font-bold text-destructive dark:text-destructive text-sm">
                  {t("employee.dashboard.adminAlert")}
                </p>
                <p className="text-xs text-destructive dark:text-destructive/80 mb-2">
                  {t("employee.dashboard.adminAlertDesc")}
                </p>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto text-destructive font-bold"
                  onClick={() => onNavigate("/my-warnings")}
                >
                  {t("employee.dashboard.viewWarnings")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
};
