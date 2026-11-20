import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Download, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShopifyPageHeader } from "@/components/layout/ShopifyPageHeader";
import {
  LeaveStatsCards,
  LeaveRequestsTable,
} from "./leaves/index";
import { LeaveRequest, leaveTypeConfig } from "./leaves/types";

export interface PolarisLeavesViewProps {
  loading: boolean;
  requests: LeaveRequest[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  setPagination: React.Dispatch<
    React.SetStateAction<{ page: number; limit: number; total: number; totalPages: number }>
  >;
  statusFilter?: string;
  setStatusFilter: (val: string) => void;
  typeFilter: string;
  setTypeFilter: (val: string) => void;
  activeTab: string;
  setActiveTab: (val: string) => void;
  pendingCount: number;
  isMyLeaves: boolean;
  onOpenAddDialog: () => void;
  handleApprove: (id: string) => void;
  onOpenReject: (req: LeaveRequest) => void;
  handleCancel: (id: string) => void;
  onOpenChangeDecision: (req: LeaveRequest) => void;
  onOpenEdit: (req: LeaveRequest) => void;
  handleDelete: (req: LeaveRequest) => void;
  onOpenDetails: (req: LeaveRequest) => void;
}

export const PolarisLeavesView: React.FC<PolarisLeavesViewProps> = ({
  loading,
  requests,
  pagination,
  setPagination,
  statusFilter: _statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  activeTab,
  setActiveTab,
  pendingCount,
  isMyLeaves,
  onOpenAddDialog,
  handleApprove,
  onOpenReject,
  handleCancel,
  onOpenChangeDecision,
  onOpenEdit,
  handleDelete,
  onOpenDetails,
}) => {
  const { t } = useTranslation();
  const [showStats, setShowStats] = useState(false);

  const tabs = [
    { key: "all", label: t("employee.leaves.all") || "الكل", count: pagination.total },
    {
      key: "pending",
      label: t("employee.leaves.pending") || "قيد الانتظار",
      badge: pendingCount,
    },
    { key: "APPROVED", label: t("employee.leaves.approved") || "معتمدة" },
    { key: "REJECTED", label: t("employee.leaves.rejected") || "مرفوضة" },
  ];

  const handleTabChange = (tabKey: string) => {
    setActiveTab(tabKey);
    if (tabKey === "all") {
      setStatusFilter("all");
    } else if (tabKey === "pending") {
      setStatusFilter("PENDING");
    } else {
      setStatusFilter(tabKey);
    }
  };

  return (
    <div
      data-polaris-leaves-view="true"
      className="polaris-leaves-container max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 space-y-4"
      dir="rtl"
    >
      {/* 1. Authentic Shopify Polaris Page Header */}
      <ShopifyPageHeader
        title={isMyLeaves ? t("employee.leaves.myLeaves") || "إجازاتي" : t("employee.leaves.manageLeaves") || "طلبات الإجازات"}
        subtitle="متابعة وإدارة طلبات الإجازات والأرصدة السنوية للموظفين"
        badges={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-muted text-muted-foreground tabular-nums">
            {pagination.total} طلب
          </span>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowStats(!showStats)}
              className={`gap-1.5 h-8 text-xs font-semibold rounded-lg border-border/80 transition-all active:scale-95 shadow-2xs ${
                showStats ? "bg-primary/10 border-primary text-primary" : "bg-card text-foreground"
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>الإحصائيات</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 h-8 text-xs font-semibold rounded-lg border-border/80 bg-card hover:bg-muted text-foreground transition-all active:scale-95 shadow-2xs"
            >
              <Download className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{t("employee.leaves.export") || "تصدير"}</span>
            </Button>

            <Button
              size="sm"
              onClick={onOpenAddDialog}
              className="gap-1.5 h-8 px-3 text-xs font-semibold rounded-lg bg-[var(--p-action-primary,#008060)] hover:bg-[#006e52] text-white transition-all active:scale-95 shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t("employee.leaves.newLeaveRequest") || "طلب إجازة"}</span>
            </Button>
          </div>
        }
      />

      {/* Collapsible Stats Section */}
      {showStats && (
        <div className="motion-safe:animate-fade-in">
          <LeaveStatsCards
            t={t}
            requests={requests}
            pendingCount={pendingCount}
          />
        </div>
      )}

      {/* 2. Single Polaris Card Chassis */}
      <div className="bg-card rounded-xl border border-border/70 shadow-xs overflow-hidden flex flex-col">
        {/* Segmented View Tabs */}
        <div className="flex items-center justify-between border-b border-border/70 px-3 overflow-x-auto scrollbar-none bg-card">
          <div className="flex items-center">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleTabChange(tab.key)}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "border-[var(--petrol,#013735)] dark:border-[#3ec8b7] text-foreground font-semibold"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/60"
                  }`}
                >
                  <span>{tab.label}</span>
                  {typeof tab.badge === "number" && tab.badge > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono tabular-nums font-bold">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Type Filter Selector in tab header */}
          <div className="py-1.5 hidden sm:block">
            <Select value={typeFilter} onValueChange={(val) => setTypeFilter(val || "all")}>
              <SelectTrigger className="w-[160px] h-8 text-xs bg-muted/40 border-border/70 rounded-lg">
                <SelectValue placeholder={t("employee.leaves.leaveType") || "نوع الإجازة"} />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="all">{t("employee.leaves.all") || "كل الأنواع"}</SelectItem>
                {Object.entries(leaveTypeConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {t(config.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Mobile Type Filter Bar */}
        <div className="p-2 sm:hidden border-b border-border/70 bg-muted/20">
          <Select value={typeFilter} onValueChange={(val) => setTypeFilter(val || "all")}>
            <SelectTrigger className="w-full h-8 text-xs bg-background border-border/70 rounded-lg">
              <SelectValue placeholder={t("employee.leaves.leaveType") || "نوع الإجازة"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("employee.leaves.all") || "كل الأنواع"}</SelectItem>
              {Object.entries(leaveTypeConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {t(config.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 3. Requests Table embedded inside the chassis */}
        <div className="[&>div.rounded-xl]:border-0 [&>div.rounded-xl]:shadow-none [&>div.rounded-xl]:rounded-none">
          <LeaveRequestsTable
            t={t}
            loading={loading}
            requests={requests}
            isMyLeaves={isMyLeaves}
            pagination={pagination}
            setPagination={setPagination}
            onApprove={handleApprove}
            onOpenReject={onOpenReject}
            onCancel={handleCancel}
            onOpenChangeDecision={onOpenChangeDecision}
            onOpenEdit={onOpenEdit}
            onDelete={handleDelete}
            onOpenDetails={onOpenDetails}
          />
        </div>
      </div>
    </div>
  );
};

export default PolarisLeavesView;
