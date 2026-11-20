import React from "react";
import { useNavigate } from "react-router-dom";
import { Users, Clock, FileText, ChevronLeft, ArrowUpRight } from "lucide-react";
import { ShopifyPageHeader } from "@/components/layout/ShopifyPageHeader";
import { Button } from "../../components/ui/button";
import type { DashboardData } from "./hr-dashboard/types";
import {
  HRDashboardStatsGrid,
  AttendanceOverviewCard,
  PendingLeavesCard,
  PendingPermissionsCard,
  PendingAdvancesCard,
  WarningsOverviewCard,
  RecruitmentOverviewCard,
  RecentHiresCard,
  DepartmentsOverviewCard,
  HRQuickActionsCard,
} from "./hr-dashboard/index";

interface PolarisHRDashboardViewProps {
  data: DashboardData | null;
  attendanceRate: number;
  handleLeaveAction: (id: string, action: "approve" | "reject") => void;
  handlePermissionAction: (id: string, action: "approve" | "reject") => void;
  handleAdvanceAction: (id: string, action: "approve" | "reject") => void;
}

export const PolarisHRDashboardView: React.FC<PolarisHRDashboardViewProps> = ({
  data,
  attendanceRate,
  handleLeaveAction,
  handlePermissionAction,
  handleAdvanceAction,
}) => {
  const navigate = useNavigate();

  const totalPendingActions =
    (data?.pendingLeaves?.length || 0) +
    (data?.pendingPermissions?.length || 0) +
    (data?.pendingAdvances?.length || 0);

  return (
    <div className="space-y-5 w-full max-w-full" dir="rtl">
      {/* Polaris Page Header */}
      <ShopifyPageHeader
        title="لوحة قيادة الموارد البشرية"
        subtitle="المؤشرات التشغيلية الحية، نسب الحضور والغياب، وإدارة الموافقات والطلبات المعلقة للفرق"
        badges={[
          { label: `${data?.employees?.totalEmployees || 0} موظف`, variant: "default" },
          { label: `${data?.attendance?.present || 0} حاضر اليوم`, variant: "secondary" },
          ...(totalPendingActions > 0
            ? [{ label: `${totalPendingActions} طلب بانتظار الإجراء`, variant: "destructive" as const }]
            : []),
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/hr/reports")}
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <FileText className="h-3.5 w-3.5" />
              التقارير
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/hr/attendance")}
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <Clock className="h-3.5 w-3.5" />
              سجل الحضور
            </Button>
            <Button
              size="sm"
              onClick={() => navigate("/hr/employees")}
              className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground font-medium shadow-xs"
            >
              <Users className="h-3.5 w-3.5" />
              إدارة الموظفين
            </Button>
          </div>
        }
      />

      {/* Top 4 KPI Metrics Cards */}
      <HRDashboardStatsGrid data={data} />

      {/* Primary Section: Live Attendance & Pending Leaves */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <AttendanceOverviewCard data={data} attendanceRate={attendanceRate} />
        </div>
        <div className="lg:col-span-1">
          <PendingLeavesCard
            pendingLeaves={data?.pendingLeaves}
            onAction={handleLeaveAction}
          />
        </div>
      </div>

      {/* Action Center: Permissions, Advances, Warnings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <PendingPermissionsCard
          pendingPermissions={data?.pendingPermissions}
          onAction={handlePermissionAction}
        />
        <PendingAdvancesCard
          pendingAdvances={data?.pendingAdvances}
          onAction={handleAdvanceAction}
        />
        <WarningsOverviewCard warnings={data?.warnings} />
      </div>

      {/* Recruitment Pipeline Overview */}
      {data?.recruitment && (
        <RecruitmentOverviewCard recruitment={data.recruitment} />
      )}

      {/* Secondary Section: Recent Hires & Departments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RecentHiresCard recentHires={data?.employees?.recentHires} />
        <DepartmentsOverviewCard departments={data?.departments?.departments} />
      </div>

      {/* Quick Access Navigation */}
      <HRQuickActionsCard />
    </div>
  );
};
