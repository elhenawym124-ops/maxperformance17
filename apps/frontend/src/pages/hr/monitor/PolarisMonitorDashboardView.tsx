import React, { useState } from "react";
import { RefreshCw, Search, ChevronRight, ChevronLeft, Calendar, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShopifyPageHeader } from "@/components/layout/ShopifyPageHeader";
import TeamExecutiveSummary from "./components/TeamExecutiveSummary";
import {
  TeamMemberSummary,
  MonitorAlertsAndKpis,
  MonitorDesktopTable,
  MonitorMobileCards,
} from "./dashboard/index";

export interface PolarisMonitorDashboardViewProps {
  loading: boolean;
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  statusFilter: "all" | "active" | "idle" | "offline";
  setStatusFilter: (s: "all" | "active" | "idle" | "offline") => void;
  sortField: any;
  sortDirection: any;
  teamMembers: TeamMemberSummary[];
  selectedEmployeeId: string | null;
  setSelectedEmployeeId: (id: string | null) => void;
  visibleAlerts: any[];
  archiving: boolean;
  archiveSuccess: boolean;
  stats: any;
  isToday: boolean;
  yesterdayStr: string;
  handleDateStep: (direction: "prev" | "next") => void;
  handleSort: (field: any) => void;
  handleDismissAlert: (id: string) => void;
  fetchData: () => void;
  handleTriggerArchive: () => void;
  sortedMembers: TeamMemberSummary[];
  isSuperOrOwner: boolean;
}

export const PolarisMonitorDashboardView: React.FC<PolarisMonitorDashboardViewProps> = ({
  loading,
  selectedDate,
  setSelectedDate,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  sortField,
  sortDirection,
  teamMembers,
  setSelectedEmployeeId,
  visibleAlerts,
  archiving,
  archiveSuccess,
  stats,
  isToday,
  handleDateStep,
  handleSort,
  handleDismissAlert,
  fetchData,
  handleTriggerArchive,
  sortedMembers,
  isSuperOrOwner,
}) => {
  const [showExecutiveSummary, setShowExecutiveSummary] = useState(false);

  const tabs: Array<{ key: "all" | "active" | "idle" | "offline"; label: string; count?: number; live?: boolean }> = [
    { key: "all", label: "الكل", count: teamMembers.length },
    { key: "active", label: "نشط الآن", count: stats?.activeNow || 0, live: true },
    { key: "idle", label: "استراحة / خمول" },
    { key: "offline", label: "غير متصل" },
  ];

  return (
    <div
      data-polaris-monitor-dashboard="true"
      className="polaris-monitor-container max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 space-y-4"
      dir="rtl"
    >
      {/* 1. Authentic Shopify Polaris Page Header */}
      <ShopifyPageHeader
        title="مراقبة الأجهزة والإنتاجية"
        subtitle={`متابعة النشاط الرقمي، الإنتاجية وحالة الأجهزة ليوم ${selectedDate}`}
        badges={
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 tabular-nums">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>{stats?.activeNow || 0} نشط الآن</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-muted text-muted-foreground tabular-nums">
              {teamMembers.length} جهاز/موظف
            </span>
          </div>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Date Navigator */}
            <div className="flex items-center bg-card rounded-lg border border-border/70 p-0.5 shadow-2xs">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDateStep("prev")}
                className="h-7 w-7 p-0 rounded-md"
                title="اليوم السابق"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              <div className="flex items-center gap-1 px-2 text-xs font-mono tabular-nums text-foreground">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span>{selectedDate}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDateStep("next")}
                disabled={isToday}
                className="h-7 w-7 p-0 rounded-md disabled:opacity-30"
                title="اليوم التالي"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowExecutiveSummary(!showExecutiveSummary)}
              className={`gap-1.5 h-8 text-xs font-semibold rounded-lg border-border/80 transition-all active:scale-95 shadow-2xs ${
                showExecutiveSummary ? "bg-primary/10 border-primary text-primary" : "bg-card text-foreground"
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>التقرير التنفيذي</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={fetchData}
              disabled={loading}
              className="gap-1.5 h-8 text-xs font-semibold rounded-lg border-border/80 bg-card hover:bg-muted text-foreground transition-all active:scale-95 shadow-2xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">تحديث</span>
            </Button>
          </div>
        }
      />

      {/* Alerts and KPI Strip */}
      <MonitorAlertsAndKpis
        visibleAlerts={visibleAlerts}
        onDismissAlert={handleDismissAlert}
        stats={stats}
      />

      {/* Collapsible Executive Summary */}
      {showExecutiveSummary && (
        <div className="motion-safe:animate-fade-in">
          <TeamExecutiveSummary
            stats={stats}
            isSuperOrOwner={isSuperOrOwner}
            archiving={archiving}
            archiveSuccess={archiveSuccess}
            onTriggerArchive={handleTriggerArchive}
          />
        </div>
      )}

      {/* 2. Single Polaris Card Chassis */}
      <div className="bg-card rounded-xl border border-border/70 shadow-xs overflow-hidden flex flex-col">
        {/* Segmented Status Tabs */}
        <div className="flex items-center justify-between border-b border-border/70 px-3 overflow-x-auto scrollbar-none bg-card">
          <div className="flex items-center">
            {tabs.map((tab) => {
              const isActive = statusFilter === tab.key;
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
                  {typeof tab.count === "number" && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono tabular-nums ${
                        tab.live && tab.count > 0
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
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
              placeholder="بحث بالاسم، القسم أو عنوان الجهاز..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9 h-8 text-xs bg-background border-border/70 rounded-lg shadow-none focus-visible:ring-1"
            />
          </div>
        </div>

        {/* 3. Main Activity Content */}
        <div className="p-0">
          {loading && teamMembers.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin ml-2 text-primary" />
              <span>جاري استرداد بيانات النشاط السحابية…</span>
            </div>
          ) : sortedMembers.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
              لا توجد أجهزة مطابقة للبحث المسجل لهذا اليوم
            </div>
          ) : (
            <>
              <MonitorDesktopTable
                sortedMembers={sortedMembers}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
                onSelectEmployee={setSelectedEmployeeId}
              />
              <MonitorMobileCards
                sortedMembers={sortedMembers}
                onSelectEmployee={setSelectedEmployeeId}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PolarisMonitorDashboardView;
