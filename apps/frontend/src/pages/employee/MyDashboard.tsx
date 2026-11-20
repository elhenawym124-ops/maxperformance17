import React from "react";
import { AlertCircle, Briefcase } from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  MyDashboardActivityTabsAndFooter,
  MyDashboardHeaderAndStats,
  MyDashboardQuickActionsColumn,
  useMyDashboardController,
} from "./dashboard";

const MyDashboard: React.FC = () => {
  const {
    navigate,
    t,
    hasHrActive,
    loading,
    setActiveTab,
    employee,
    employeeErrorStatus,
    todayAttendance,
    recentLeaves,
    permissions,
    advances,
    warnings,
    rewards,
    lastPayroll,
    canCheckIn,
    pendingRequestsCount,
  } = useMyDashboardController();

  if (!hasHrActive || employeeErrorStatus === 403) {
    return (
      <div
        className="min-h-[400px] flex items-center justify-center w-full"
        dir="rtl"
      >
        <div className="text-center max-w-md">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-warning/10 text-warning dark:text-warning">
            <Briefcase className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {t("employee.dashboard.hrNotActive")}
          </h2>
          <p className="text-muted-foreground mb-6">
            {t("employee.dashboard.hrNotActiveDesc")}
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className="min-h-[400px] flex items-center justify-center w-full"
        dir="rtl"
      >
        <div className="text-center">
          <div className="relative mx-auto mb-6 w-16 h-16">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
          </div>
          <p className="text-lg font-medium text-muted-foreground animate-pulse">
            {t("employee.dashboard.loading")}
          </p>
        </div>
      </div>
    );
  }

  if (!employee || employeeErrorStatus === 401 || employeeErrorStatus === 404) {
    return (
      <div
        className="min-h-[400px] flex items-center justify-center w-full"
        dir="rtl"
      >
        <div className="bg-red-50 dark:bg-destructive/20 p-8 rounded-xl text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {t("employee.dashboard.noData")}
          </h2>
          <p className="text-muted-foreground mb-6">
            {t("employee.dashboard.noDataDesc")}
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">
            {t("employee.dashboard.retry")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="space-y-6 w-full pb-8"
      dir="rtl"
    >
      <MyDashboardHeaderAndStats
        t={t}
        employee={employee}
        todayAttendance={todayAttendance}
        lastPayroll={lastPayroll}
        onNavigate={(path) => navigate(path)}
      />

      <div className="grid gap-8 lg:grid-cols-3">
        <MyDashboardQuickActionsColumn
          t={t}
          canCheckIn={canCheckIn}
          pendingRequestsCount={pendingRequestsCount}
          recentLeaves={recentLeaves}
          permissions={permissions}
          advances={advances}
          warnings={warnings}
          onNavigate={(path, options) => navigate(path, options)}
        />

        <MyDashboardActivityTabsAndFooter
          t={t}
          recentLeaves={recentLeaves}
          permissions={permissions}
          advances={advances}
          rewards={rewards}
          onTabChange={setActiveTab}
          onNavigate={(path) => navigate(path)}
        />
      </div>
    </div>
  );
};

export default MyDashboard;
