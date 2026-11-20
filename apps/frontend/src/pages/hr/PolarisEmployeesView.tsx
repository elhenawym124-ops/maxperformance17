import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Download, Upload, Link2, Search, X, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ShopifyPageHeader } from "@/components/layout/ShopifyPageHeader";
import { EmployeeTableSkeleton } from "@/components/hr/SkeletonLoader";
import { EmptyState } from "@/components/hr/EmptyState";
import { EnhancedPagination } from "@/components/hr/EnhancedPagination";
import { Department, Employee, PaginationState } from "./employees/types";
import { EmployeeTableRow } from "./employees/EmployeeTableRow";

export interface PolarisEmployeesViewProps {
  loading: boolean;
  employees: Employee[];
  departments: Department[];
  pagination: PaginationState;
  setPagination: React.Dispatch<React.SetStateAction<PaginationState>>;
  searchInput: string;
  setSearchInput: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  departmentFilter: string;
  setDepartmentFilter: (value: string) => void;
  contractFilter: string;
  setContractFilter: (value: string) => void;
  userStatusFilter: string;
  setUserStatusFilter: (value: string) => void;
  onOpenAddDialog: () => void;
  onOpenInviteDialog: () => void;
  onOpenAssets: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  onResetPassword?: (employee: Employee) => void;
  onToggleStatus?: (employee: Employee) => void;
  onTerminate?: (employee: Employee) => void;
}

export const PolarisEmployeesView: React.FC<PolarisEmployeesViewProps> = ({
  loading,
  employees,
  departments,
  pagination,
  setPagination,
  searchInput,
  setSearchInput,
  statusFilter,
  setStatusFilter,
  departmentFilter,
  setDepartmentFilter,
  contractFilter,
  setContractFilter,
  userStatusFilter,
  setUserStatusFilter,
  onOpenAddDialog,
  onOpenInviteDialog,
  onOpenAssets,
  onDelete,
  onResetPassword,
  onToggleStatus,
  onTerminate,
}) => {
  const { t } = useTranslation();

  const activeTab = useMemo(() => {
    return statusFilter || "all";
  }, [statusFilter]);

  const hasActiveFilters =
    Boolean(searchInput) ||
    statusFilter !== "all" ||
    departmentFilter !== "all" ||
    contractFilter !== "all" ||
    userStatusFilter !== "all";

  const clearFilters = () => {
    setSearchInput("");
    setStatusFilter("all");
    setDepartmentFilter("all");
    setContractFilter("all");
    setUserStatusFilter("all");
  };

  return (
    <div
      data-polaris-employees-view="true"
      className="polaris-employees-container max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 space-y-4"
      dir="rtl"
    >
      {/* 1. Authentic Shopify Polaris Page Header */}
      <ShopifyPageHeader
        title={t("employees.pageTitle") || "الموظفون"}
        badges={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-muted text-muted-foreground tabular-nums">
            {pagination.total} {t("employees.employeeCountLabel", "موظف")}
          </span>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenInviteDialog}
              className="gap-1.5 h-8 text-xs font-semibold rounded-lg border-border/80 bg-card hover:bg-muted text-foreground transition-all active:scale-95 shadow-2xs"
            >
              <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span>دعوة برابط</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 h-8 text-xs font-semibold rounded-lg border-border/80 bg-card hover:bg-muted text-foreground transition-all active:scale-95 shadow-2xs"
            >
              <Upload className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">{t("employees.import") || "استيراد"}</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 h-8 text-xs font-semibold rounded-lg border-border/80 bg-card hover:bg-muted text-foreground transition-all active:scale-95 shadow-2xs"
            >
              <Download className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">{t("employees.export") || "تصدير"}</span>
            </Button>

            <Button
              size="sm"
              onClick={onOpenAddDialog}
              className="gap-1.5 h-8 px-3 text-xs font-semibold rounded-lg bg-[var(--p-action-primary,#008060)] hover:bg-[#006e52] text-white transition-all active:scale-95 shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t("employees.addEmployee") || "إضافة موظف"}</span>
            </Button>
          </div>
        }
      />

      {/* 2. Single Polaris Card Container */}
      <div className="bg-card rounded-xl border border-border/70 shadow-xs overflow-hidden flex flex-col">
        {/* Segmented View Tabs */}
        <div className="flex items-center border-b border-border/70 px-3 overflow-x-auto scrollbar-none bg-card">
          {[
            { key: "all", label: "الكل" },
            { key: "ACTIVE", label: "نشط" },
            { key: "INACTIVE", label: "غير نشط" },
            { key: "TERMINATED", label: "منتهي خدمته" },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "border-[var(--petrol,#013735)] dark:border-[#3ec8b7] text-foreground font-semibold"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/60"
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Integrated Filter Bar */}
        <div className="p-2.5 sm:p-3 border-b border-border/70 flex flex-wrap items-center justify-between gap-2 bg-muted/20">
          <div className="flex-1 min-w-[220px] max-w-sm relative">
            <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 text-muted-foreground h-3.5 w-3.5 pointer-events-none" />
            <Input
              placeholder={t("employees.searchPlaceholder") || "بحث بالاسم أو الكود..."}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-8 ps-8 pe-3 text-xs bg-card border-border/70 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="h-8 text-xs bg-card border-border/70 rounded-lg text-foreground w-[130px] sm:w-[150px]">
                <SelectValue placeholder={t("employees.departmentFilter") || "القسم"} />
              </SelectTrigger>
              <SelectContent className="bg-card border-border/70">
                <SelectItem value="all" className="text-xs">
                  {t("employees.allDepartments") || "جميع الأقسام"}
                </SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id} className="text-xs">
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={contractFilter} onValueChange={setContractFilter}>
              <SelectTrigger className="h-8 text-xs bg-card border-border/70 rounded-lg text-foreground w-[120px] sm:w-[130px]">
                <SelectValue placeholder={t("employees.contractFilter") || "العقد"} />
              </SelectTrigger>
              <SelectContent className="bg-card border-border/70">
                <SelectItem value="all" className="text-xs">
                  {t("employees.allContracts") || "جميع العقود"}
                </SelectItem>
                <SelectItem value="FULL_TIME" className="text-xs">
                  {t("employees.fullTime") || "دوام كامل"}
                </SelectItem>
                <SelectItem value="PART_TIME" className="text-xs">
                  {t("employees.partTime") || "دوام جزئي"}
                </SelectItem>
                <SelectItem value="REMOTE" className="text-xs">
                  {t("employees.remote") || "عن بعد"}
                </SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                title="إلغاء الفلاتر"
              >
                <X className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">إلغاء</span>
              </Button>
            )}
          </div>
        </div>

        {/* Employees Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-4">
              <EmployeeTableSkeleton />
            </div>
          ) : employees.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={Users}
                title={t("employees.noEmployees")}
                description={t("employees.noEmployeesDesc")}
                actionLabel={t("employees.addFirstEmployee")}
                onAction={onOpenAddDialog}
                secondaryActionLabel={t("employees.importFromExcel")}
                secondaryIcon={Upload}
              />
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30 border-b border-border/70">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-start text-xs font-semibold text-muted-foreground py-2.5">
                    {t("employees.employee", "الموظف")}
                  </TableHead>
                  <TableHead className="text-start text-xs font-semibold text-muted-foreground py-2.5">
                    {t("employees.department", "القسم")}
                  </TableHead>
                  <TableHead className="text-start text-xs font-semibold text-muted-foreground py-2.5">
                    {t("employees.position", "المسمى الوظيفي")}
                  </TableHead>
                  <TableHead className="text-start text-xs font-semibold text-muted-foreground py-2.5">
                    {t("employees.contact", "بيانات الاتصال")}
                  </TableHead>
                  <TableHead className="text-start text-xs font-semibold text-muted-foreground py-2.5">
                    {t("employees.contract", "نوع العقد")}
                  </TableHead>
                  <TableHead className="text-start text-xs font-semibold text-muted-foreground py-2.5">
                    {t("employees.status", "الحالة")}
                  </TableHead>
                  <TableHead className="text-center text-xs font-semibold text-muted-foreground py-2.5">
                    {t("employees.actions", "الإجراءات")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/40">
                {employees.map((employee) => (
                  <EmployeeTableRow
                    key={employee.id}
                    employee={employee}
                    onOpenAssets={onOpenAssets}
                    onDelete={onDelete}
                    onResetPassword={onResetPassword}
                    onToggleStatus={onToggleStatus}
                    onTerminate={onTerminate}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Integrated Pagination Footer */}
        {employees.length > 0 && (
          <div className="px-3 sm:px-4 py-2.5 border-t border-border/70 bg-card">
            <EnhancedPagination
              currentPage={pagination?.page || 1}
              totalPages={pagination?.totalPages || 1}
              pageSize={pagination?.limit || 10}
              totalItems={pagination?.total || employees.length}
              pagination={pagination}
              setPagination={setPagination}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PolarisEmployeesView;
