import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Banknote,
  Download,
  Plus,
  Play,
  RotateCcw,
  ChartBarIcon,
  Calculator,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShopifyPageHeader } from "@/components/layout/ShopifyPageHeader";
import {
  PayrollAutoStatusBar,
  PayrollKpiCards,
  PayrollFiltersBar,
  PayrollTable,
} from "./payroll/index";
import PayrollSimulator from "./components/PayrollSimulator";

export interface PolarisPayrollViewProps {
  isMyPayroll: boolean;
  loading: boolean;
  payrolls: any[];
  summary: any;
  pagination: any;
  setPagination: any;
  selectedMonth: number;
  setSelectedMonth: (m: number) => void;
  selectedYear: number;
  setSelectedYear: (y: number) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  selectedIds: string[];
  toggleSelectAll: () => void;
  toggleSelect: (id: string) => void;
  onOpenGenerateDialog: () => void;
  onViewDetails: (payroll: any) => void;
  onApprove: (id: string) => void;
  onEdit: (payroll: any) => void;
  onPay: (payroll: any) => void;
  onPrint: (payroll: any) => void;
  view: "table" | "simulator";
  setView: (v: "table" | "simulator") => void;
  autoStatus: any;
  autoCalculating: boolean;
  onAutoCalculate: () => void;
  onExportBankFile: () => void;
  handleBulkApprove: () => void;
  handleBulkPay: () => void;
}

export const PolarisPayrollView: React.FC<PolarisPayrollViewProps> = ({
  isMyPayroll,
  loading,
  payrolls,
  summary,
  pagination,
  setPagination,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  statusFilter,
  setStatusFilter,
  selectedIds,
  toggleSelectAll,
  toggleSelect,
  onOpenGenerateDialog,
  onViewDetails,
  onApprove,
  onEdit,
  onPay,
  onPrint,
  view,
  setView,
  autoStatus,
  autoCalculating,
  onAutoCalculate,
  onExportBankFile,
  handleBulkApprove,
  handleBulkPay,
}) => {
  const { t } = useTranslation();
  const [showKpi, setShowKpi] = useState(false);

  const activeTab = useMemo(() => {
    return statusFilter || "all";
  }, [statusFilter]);

  const monthNames = [
    "يناير",
    "فبراير",
    "مارس",
    "أبريل",
    "مايو",
    "يونيو",
    "يوليو",
    "أغسطس",
    "سبتمبر",
    "أكتوبر",
    "نوفمبر",
    "ديسمبر",
  ];

  return (
    <div
      data-polaris-payroll-view="true"
      className="polaris-payroll-container max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 space-y-4"
      dir="rtl"
    >
      {/* 1. Authentic Shopify Polaris Page Header */}
      <ShopifyPageHeader
        title={isMyPayroll ? "سجل رواتبي" : "مسير الرواتب"}
        subtitle={`${monthNames[selectedMonth - 1] || selectedMonth} ${selectedYear}`}
        badges={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-muted text-muted-foreground tabular-nums">
            {pagination.total || payrolls.length} مسير
          </span>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {!isMyPayroll && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setView(view === "simulator" ? "table" : "simulator")}
                  className={`gap-1.5 h-8 text-xs font-semibold rounded-lg border-border/80 transition-all active:scale-95 shadow-2xs ${
                    view === "simulator"
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-card text-foreground"
                  }`}
                >
                  <Calculator className="h-3.5 w-3.5" />
                  <span>{view === "simulator" ? "عرض المسير" : "محاكي الرواتب"}</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowKpi(!showKpi)}
                  className={`gap-1.5 h-8 text-xs font-semibold rounded-lg border-border/80 transition-all active:scale-95 shadow-2xs ${
                    showKpi ? "bg-primary/10 border-primary text-primary" : "bg-card text-foreground"
                  }`}
                >
                  <ChartBarIcon className="h-3.5 w-3.5" />
                  <span>المؤشرات المالية</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={onExportBankFile}
                  className="gap-1.5 h-8 text-xs font-semibold rounded-lg border-border/80 bg-card hover:bg-muted text-foreground transition-all active:scale-95 shadow-2xs"
                >
                  <Download className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>ملف البنك</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={onAutoCalculate}
                  disabled={autoCalculating}
                  className="gap-1.5 h-8 text-xs font-semibold rounded-lg border-border/80 bg-card hover:bg-muted text-foreground transition-all active:scale-95 shadow-2xs"
                >
                  <RotateCcw className={`h-3.5 w-3.5 ${autoCalculating ? "animate-spin text-primary" : "text-muted-foreground"}`} />
                  <span>احتساب تلقائي</span>
                </Button>

                <Button
                  size="sm"
                  onClick={onOpenGenerateDialog}
                  className="gap-1.5 h-8 px-3 text-xs font-semibold rounded-lg bg-[var(--p-action-primary,#008060)] hover:bg-[#006e52] text-white transition-all active:scale-95 shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>إنشاء مسير</span>
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Auto Status Banner */}
      {!isMyPayroll && autoStatus && (
        <PayrollAutoStatusBar autoStatus={autoStatus} />
      )}

      {/* Main View Area */}
      {view === "simulator" ? (
        <PayrollSimulator />
      ) : (
        <>
          {/* Collapsible KPI Cards */}
          {!isMyPayroll && showKpi && (
            <div className="motion-safe:animate-fade-in">
              <PayrollKpiCards summary={summary} />
            </div>
          )}

          {/* 2. Single Polaris Card Container */}
          <div className="bg-card rounded-xl border border-border/70 shadow-xs overflow-hidden flex flex-col">
            {/* Segmented View Tabs */}
            <div className="flex items-center border-b border-border/70 px-3 overflow-x-auto scrollbar-none bg-card">
              {[
                { key: "all", label: "الكل" },
                { key: "DRAFT", label: "مسودة" },
                { key: "APPROVED", label: "معتمد" },
                { key: "PAID", label: "مدفوع" },
                { key: "PENDING", label: "معلق" },
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

            {/* Filters & Month/Year Bar */}
            <div className="p-2.5 sm:p-3 border-b border-border/70 bg-muted/20">
              <PayrollFiltersBar
                isMyPayroll={isMyPayroll}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                selectedCount={selectedIds.length}
                onBulkApprove={handleBulkApprove}
                onBulkPay={handleBulkPay}
              />
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <PayrollTable
                isMyPayroll={isMyPayroll}
                loading={loading}
                payrolls={payrolls}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                selectedIds={selectedIds}
                pagination={pagination}
                setPagination={setPagination}
                onToggleSelectAll={toggleSelectAll}
                onToggleSelect={toggleSelect}
                onOpenGenerateDialog={onOpenGenerateDialog}
                onViewDetails={onViewDetails}
                onApprove={onApprove}
                onEdit={onEdit}
                onPay={onPay}
                onPrint={onPrint}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PolarisPayrollView;
