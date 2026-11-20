import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, BarChart3 } from "lucide-react";
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
  PermissionStatsCards,
  PermissionTable,
} from "./permissions/index";
import { permissionTypeConfig } from "./permissions/helpers";
import type { PermissionRequest, PermissionType } from "./permissions/types";

export interface PolarisPermissionsViewProps {
  loading: boolean;
  requests: PermissionRequest[];
  isMyPermissions: boolean;
  pagination: { page: number; limit: number; total: number; totalPages: number };
  setPagination: React.Dispatch<
    React.SetStateAction<{ page: number; limit: number; total: number; totalPages: number }>
  >;
  typeFilter: string;
  setTypeFilter: (type: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingCount: number;
  stats: any;
  onOpenAddDialog: () => void;
  handleApprove: (id: string) => void;
  onRejectClick: (request: PermissionRequest) => void;
  onDetailsClick: (request: PermissionRequest) => void;
  onDeleteClick: (request: PermissionRequest) => void;
}

export const PolarisPermissionsView: React.FC<PolarisPermissionsViewProps> = ({
  loading,
  requests,
  isMyPermissions,
  pagination,
  setPagination,
  typeFilter,
  setTypeFilter,
  activeTab,
  setActiveTab,
  pendingCount,
  stats,
  onOpenAddDialog,
  handleApprove,
  onRejectClick,
  onDetailsClick,
  onDeleteClick,
}) => {
  const { t } = useTranslation();
  const [showStats, setShowStats] = useState(false);

  const tabs = [
    { key: "all", label: t("employee.permissions.all") || "الكل", count: pagination.total },
    {
      key: "pending",
      label: t("employee.permissions.pendingTab") || "قيد الانتظار",
      badge: pendingCount,
    },
    { key: "APPROVED", label: t("employee.permissions.approvedTab") || "معتمدة" },
    { key: "REJECTED", label: t("employee.permissions.rejectedTab") || "مرفوضة" },
  ];

  return (
    <div
      data-polaris-permissions-view="true"
      className="polaris-permissions-container max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 space-y-4"
      dir="rtl"
    >
      {/* 1. Authentic Shopify Polaris Page Header */}
      <ShopifyPageHeader
        title={t("employee.permissions.title") || "أذونات التأخير والخروج"}
        subtitle="متابعة أذونات التأخير والانصراف المبكر والساعات التعويضية للموظفين"
        badges={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-muted text-muted-foreground tabular-nums">
            {pagination.total} إذن
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
              onClick={onOpenAddDialog}
              className="gap-1.5 h-8 px-3 text-xs font-semibold rounded-lg bg-[var(--p-action-primary,#008060)] hover:bg-[#006e52] text-white transition-all active:scale-95 shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t("employee.permissions.newPermission") || "إذن جديد"}</span>
            </Button>
          </div>
        }
      />

      {/* Collapsible Stats Section */}
      {showStats && stats && (
        <div className="motion-safe:animate-fade-in">
          <PermissionStatsCards stats={stats} />
        </div>
      )}

      {/* 2. Single Polaris Card Chassis */}
      <div className="bg-card rounded-xl border border-border/70 shadow-xs overflow-hidden flex flex-col">
        {/* Segmented Status Tabs */}
        <div className="flex items-center justify-between border-b border-border/70 px-3 overflow-x-auto scrollbar-none bg-card">
          <div className="flex items-center">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
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

          {/* Quick Permission Type Filter in Tab Header */}
          <div className="py-1.5 hidden sm:block">
            <Select value={typeFilter} onValueChange={(val) => setTypeFilter(val || "all")}>
              <SelectTrigger className="w-[170px] h-8 text-xs bg-muted/40 border-border/70 rounded-lg">
                <SelectValue placeholder={t("employee.permissions.allTypes") || "نوع الإذن"} />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="all">{t("employee.permissions.allTypes") || "كل الأنواع"}</SelectItem>
                {Object.keys(permissionTypeConfig).map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(
                      `employee.permissions.${permissionTypeConfig[type as PermissionType].labelKey}`,
                      permissionTypeConfig[type as PermissionType].labelKey,
                    )}
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
              <SelectValue placeholder={t("employee.permissions.allTypes") || "نوع الإذن"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("employee.permissions.allTypes") || "كل الأنواع"}</SelectItem>
              {Object.keys(permissionTypeConfig).map((type) => (
                <SelectItem key={type} value={type}>
                  {t(
                    `employee.permissions.${permissionTypeConfig[type as PermissionType].labelKey}`,
                    permissionTypeConfig[type as PermissionType].labelKey,
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 3. Permission Table */}
        <div className="p-0">
          <PermissionTable
            loading={loading}
            requests={requests}
            isMyPermissions={isMyPermissions}
            pagination={pagination}
            setPagination={setPagination}
            onApprove={handleApprove}
            onRejectClick={onRejectClick}
            onDetailsClick={onDetailsClick}
            onDeleteClick={onDeleteClick}
            onOpenAddDialog={onOpenAddDialog}
          />
        </div>
      </div>
    </div>
  );
};

export default PolarisPermissionsView;
