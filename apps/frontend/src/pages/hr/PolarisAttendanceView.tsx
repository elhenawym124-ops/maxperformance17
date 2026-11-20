import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Clock, Download, ChartBarIcon, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShopifyPageHeader } from "@/components/layout/ShopifyPageHeader";
import {
  AttendanceStatsCards,
  AttendanceAutoCloseBanner,
  AttendanceFilters,
  AttendanceTable,
  AttendanceExceptionRequestsSection,
  AttendanceMissingPunchesSection,
  formatAttendanceDate,
} from "./attendance/index";

export interface PolarisAttendanceViewProps {
  loading: boolean;
  todayStats: any;
  records: any[];
  attendanceTimezone: string;
  pagination: any;
  setPagination: any;
  autoCloseSummary: any;
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  endDate: string;
  setEndDate: (d: string) => void;
  useDateRange: boolean;
  setUseDateRange: (val: boolean) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  employeeId: string;
  setEmployeeId: (val: string) => void;
  autoClosedOnly: boolean;
  setAutoClosedOnly: (val: boolean) => void;
  autoCloseReviewStatus: string;
  setAutoCloseReviewStatus: (val: string) => void;
  employees: any[];
  onOpenManualDialog: () => void;
  handleExport: () => void;
  fetchAttendance: () => void;
  fetchTodayStats: () => void;
  handleCheckIn: any;
  handleCheckOut: any;
  handleEditClick: any;
  confirmDelete: any;
  openAutoCloseReview: any;
  setSelectedNotes: any;
  setShowNotesDialog: any;
  openLocationInMap: any;
}

export const PolarisAttendanceView: React.FC<PolarisAttendanceViewProps> = ({
  loading,
  todayStats,
  records,
  attendanceTimezone,
  pagination,
  setPagination,
  autoCloseSummary,
  selectedDate,
  setSelectedDate,
  endDate,
  setEndDate,
  useDateRange,
  setUseDateRange,
  statusFilter,
  setStatusFilter,
  employeeId,
  setEmployeeId,
  autoClosedOnly,
  setAutoClosedOnly,
  autoCloseReviewStatus,
  setAutoCloseReviewStatus,
  employees,
  onOpenManualDialog,
  handleExport,
  fetchAttendance,
  fetchTodayStats,
  handleCheckIn,
  handleCheckOut,
  handleEditClick,
  confirmDelete,
  openAutoCloseReview,
  setSelectedNotes,
  setShowNotesDialog,
  openLocationInMap,
}) => {
  const { t } = useTranslation();
  const [showStats, setShowStats] = useState(false);

  const activeTab = useMemo(() => {
    if (autoClosedOnly) return "autoClosed";
    return statusFilter || "all";
  }, [statusFilter, autoClosedOnly]);

  const handleTabClick = (tabKey: string) => {
    if (tabKey === "autoClosed") {
      setAutoClosedOnly(true);
      setStatusFilter("all");
    } else {
      setAutoClosedOnly(false);
      setStatusFilter(tabKey);
    }
  };

  const formattedDate = formatAttendanceDate(
    selectedDate,
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    },
    "-",
    attendanceTimezone,
  );

  return (
    <div
      data-polaris-attendance-view="true"
      className="polaris-attendance-container max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 space-y-4"
      dir="rtl"
    >
      {/* 1. Authentic Shopify Polaris Page Header */}
      <ShopifyPageHeader
        title="الحضور والانصراف"
        subtitle={formattedDate}
        badges={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-muted text-muted-foreground tabular-nums">
            {pagination.total || records.length} سجل
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
              <ChartBarIcon className="h-3.5 w-3.5" />
              <span>الإحصائيات</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleExport}
              className="gap-1.5 h-8 text-xs font-semibold rounded-lg border-border/80 bg-card hover:bg-muted text-foreground transition-all active:scale-95 shadow-2xs"
            >
              <Download className="h-3.5 w-3.5 text-muted-foreground" />
              <span>تصدير</span>
            </Button>

            <Button
              size="sm"
              onClick={onOpenManualDialog}
              className="gap-1.5 h-8 px-3 text-xs font-semibold rounded-lg bg-[var(--p-action-primary,#008060)] hover:bg-[#006e52] text-white transition-all active:scale-95 shadow-xs"
            >
              <Clock className="h-3.5 w-3.5" />
              <span>تسجيل يدوي</span>
            </Button>
          </div>
        }
      />

      {/* Collapsible Stats Section */}
      {showStats && (
        <div className="motion-safe:animate-fade-in space-y-3">
          <AttendanceStatsCards todayStats={todayStats} />
        </div>
      )}

      {/* Auto-Close Review Summary Banner */}
      <AttendanceAutoCloseBanner
        autoCloseSummary={autoCloseSummary}
        autoClosedOnly={autoClosedOnly}
        setAutoClosedOnly={setAutoClosedOnly}
        autoCloseReviewStatus={autoCloseReviewStatus}
        setAutoCloseReviewStatus={setAutoCloseReviewStatus}
      />

      {/* Exceptions & Missing Punches Accordions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <AttendanceExceptionRequestsSection
          onDecisionSuccess={() => {
            fetchAttendance();
            fetchTodayStats();
          }}
        />
        <AttendanceMissingPunchesSection
          onResolveSuccess={() => {
            fetchAttendance();
            fetchTodayStats();
          }}
        />
      </div>

      {/* 2. Single Polaris Card Container */}
      <div className="bg-card rounded-xl border border-border/70 shadow-xs overflow-hidden flex flex-col">
        {/* Segmented View Tabs */}
        <div className="flex items-center border-b border-border/70 px-3 overflow-x-auto scrollbar-none bg-card">
          {[
            { key: "all", label: "الكل" },
            { key: "PRESENT", label: "حاضر" },
            { key: "LATE", label: "متأخر" },
            { key: "ABSENT", label: "غائب" },
            { key: "autoClosed", label: "إغلاق تلقائي" },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabClick(tab.key)}
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

        {/* Filters Row */}
        <div className="p-2.5 sm:p-3 border-b border-border/70 bg-muted/20">
          <AttendanceFilters
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            endDate={endDate}
            setEndDate={setEndDate}
            useDateRange={useDateRange}
            setUseDateRange={setUseDateRange}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            employeeId={employeeId}
            setEmployeeId={setEmployeeId}
            employees={employees}
            autoClosedOnly={autoClosedOnly}
            setAutoClosedOnly={setAutoClosedOnly}
            autoCloseReviewStatus={autoCloseReviewStatus}
            setAutoCloseReviewStatus={setAutoCloseReviewStatus}
          />
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <AttendanceTable
            loading={loading}
            records={records}
            attendanceTimezone={attendanceTimezone}
            pagination={pagination}
            setPagination={setPagination}
            handleCheckIn={handleCheckIn}
            handleCheckOut={handleCheckOut}
            handleEditClick={handleEditClick}
            confirmDelete={confirmDelete}
            openAutoCloseReview={openAutoCloseReview}
            setSelectedNotes={setSelectedNotes}
            setShowNotesDialog={setShowNotesDialog}
            openLocationInMap={openLocationInMap}
          />
        </div>
      </div>
    </div>
  );
};

export default PolarisAttendanceView;
