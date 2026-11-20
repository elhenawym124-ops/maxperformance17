import React from "react";
import { Plus, Search, Network, LayoutGrid, Building2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShopifyPageHeader } from "@/components/layout/ShopifyPageHeader";
import DepartmentSkeleton from "./components/DepartmentSkeleton";
import HierarchyView from "./components/HierarchyView";
import { DepartmentGrid } from "./departments/index";

export interface PolarisDepartmentsViewProps {
  departments: any[];
  filteredDepartments: any[];
  paginatedDepartments: any[];
  totalEmployees: number;
  loading: boolean;
  canManage: boolean;
  viewMode: "grid" | "hierarchy";
  setViewMode: (mode: "grid" | "hierarchy") => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  openDetailsDialog: (dept: any) => void;
  fillFormFromDepartment: (dept: any) => void;
  setSelectedDepartment: (dept: any) => void;
  setShowAddDialog: (show: boolean) => void;
  setShowDeleteDialog: (show: boolean) => void;
  setIsAddingEmployees: (show: boolean) => void;
}

export const PolarisDepartmentsView: React.FC<PolarisDepartmentsViewProps> = ({
  departments,
  filteredDepartments,
  paginatedDepartments,
  totalEmployees,
  loading,
  canManage,
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  filterStatus,
  setFilterStatus,
  currentPage,
  setCurrentPage,
  totalPages,
  openDetailsDialog,
  fillFormFromDepartment,
  setSelectedDepartment,
  setShowAddDialog,
  setShowDeleteDialog,
  setIsAddingEmployees,
}) => {
  const tabs = [
    { key: "all", label: "كل الأقسام", count: departments.length },
    { key: "active", label: "النشطة" },
    { key: "inactive", label: "المعطلة" },
  ];

  return (
    <div
      data-polaris-departments-view="true"
      className="polaris-departments-container max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 space-y-4"
      dir="rtl"
    >
      {/* 1. Authentic Shopify Polaris Page Header */}
      <ShopifyPageHeader
        title="الهيكل التنظيمي والأقسام"
        subtitle="إدارة الأقسام المؤسسية، تسكين الموظفين، ومتابعة الهيكل الهرمي للإدارة"
        badges={
          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-muted text-muted-foreground tabular-nums">
              {departments.length} قسم
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-primary/10 text-primary border border-primary/20 tabular-nums">
              {totalEmployees} موظف
            </span>
          </div>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-card p-0.5 rounded-lg border border-border/70 shadow-2xs">
              <Button
                type="button"
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-7 px-2 text-xs rounded-md"
              >
                <LayoutGrid className="h-3.5 w-3.5 ml-1" />
                <span>شبكة</span>
              </Button>
              <Button
                type="button"
                variant={viewMode === "hierarchy" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("hierarchy")}
                className="h-7 px-2 text-xs rounded-md"
              >
                <Network className="h-3.5 w-3.5 ml-1" />
                <span>هيكل هرمي</span>
              </Button>
            </div>

            {canManage && (
              <Button
                size="sm"
                onClick={() => setShowAddDialog(true)}
                className="gap-1.5 h-8 px-3 text-xs font-semibold rounded-lg bg-[var(--p-action-primary,#008060)] hover:bg-[#006e52] text-white transition-all active:scale-95 shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>إضافة قسم جديد</span>
              </Button>
            )}
          </div>
        }
      />

      {/* 2. Single Polaris Card Chassis */}
      <div className="bg-card rounded-xl border border-border/70 shadow-xs overflow-hidden flex flex-col">
        {/* Segmented Status Tabs */}
        <div className="flex items-center justify-between border-b border-border/70 px-3 overflow-x-auto scrollbar-none bg-card">
          <div className="flex items-center">
            {tabs.map((tab) => {
              const isActive = filterStatus === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilterStatus(tab.key)}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "border-[var(--petrol,#013735)] dark:border-[#3ec8b7] text-foreground font-semibold"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/60"
                  }`}
                >
                  <span>{tab.label}</span>
                  {typeof tab.count === "number" && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-muted text-muted-foreground font-mono tabular-nums">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Integrated Search Bar */}
        <div className="p-2.5 sm:p-3 border-b border-border/70 bg-muted/15 flex items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="ابحث باسم القسم أو كوده..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9 h-8 text-xs bg-background border-border/70 rounded-lg shadow-none focus-visible:ring-1"
            />
          </div>
        </div>

        {/* 3. Main Departments Content */}
        <div className="p-4">
          {loading ? (
            <DepartmentSkeleton />
          ) : viewMode === "hierarchy" ? (
            <HierarchyView departments={departments} />
          ) : (
            <DepartmentGrid
              departments={departments}
              paginatedDepartments={paginatedDepartments}
              filteredDepartments={filteredDepartments}
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
              onViewDetails={openDetailsDialog}
              onDelete={(dept) => {
                setSelectedDepartment(dept);
                setShowDeleteDialog(true);
              }}
              canManage={canManage}
              onOpenAddDialog={() => setShowAddDialog(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PolarisDepartmentsView;
