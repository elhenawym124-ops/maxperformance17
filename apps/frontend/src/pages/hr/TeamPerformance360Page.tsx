import React from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  useTeamPerformance360Controller,
  TeamPerformance360Header,
  TeamPerformance360KPIs,
  TeamPerformance360Filters,
  TeamPerformance360Table,
  PerformanceDrilldownDialog,
  PerformancePIPModal,
} from "./team-performance-360/index";
import { PolarisTeamPerformance360View } from "./PolarisTeamPerformance360View";

export const TeamPerformance360Page: React.FC = () => {
  const [searchParams] = useSearchParams();
  const isPolaris =
    searchParams.get("layout") === "polaris" ||
    sessionStorage.getItem("maxp_session_layout") === "polaris";

  const {
    loading,
    data,
    searchQuery,
    setSearchQuery,
    selectedTier,
    setSelectedTier,
    selectedDepartment,
    setSelectedDepartment,
    selectedPeriodMode,
    setSelectedPeriodMode,
    selectedEmployeeForPIP,
    setSelectedEmployeeForPIP,
    selectedEmployeeForDrilldown,
    setSelectedEmployeeForDrilldown,
    fetchLeaderboard,
    departments,
    filteredEmployees,
  } = useTeamPerformance360Controller();

  return (
    <div className="space-y-6 w-full pb-8" dir="rtl">
      {isPolaris ? (
        <PolarisTeamPerformance360View
          loading={loading}
          data={data}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedTier={selectedTier}
          setSelectedTier={setSelectedTier}
          selectedDepartment={selectedDepartment}
          setSelectedDepartment={setSelectedDepartment}
          selectedPeriodMode={selectedPeriodMode}
          setSelectedPeriodMode={setSelectedPeriodMode}
          departments={departments}
          filteredEmployees={filteredEmployees}
          onSelectForDrilldown={setSelectedEmployeeForDrilldown}
          onSelectForPIP={setSelectedEmployeeForPIP}
          onRefresh={fetchLeaderboard}
        />
      ) : (
        <>
          {/* Top Header */}
          <TeamPerformance360Header
            selectedPeriodMode={selectedPeriodMode}
            onPeriodModeChange={setSelectedPeriodMode}
            activePeriodLabel={data?.period || "الفترة النشطة"}
            loading={loading}
            onRefresh={fetchLeaderboard}
          />

          {/* KPI Overview Cards */}
          <TeamPerformance360KPIs summary={data?.summary} />

          {/* Filter and Search Bar */}
          <TeamPerformance360Filters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedTier={selectedTier}
            onTierChange={setSelectedTier}
            selectedDepartment={selectedDepartment}
            onDepartmentChange={setSelectedDepartment}
            departments={departments}
          />

          {/* Leaderboard Table Card */}
          <TeamPerformance360Table
            employees={filteredEmployees}
            totalCount={data?.leaderboard.length ?? 0}
            onSelectForDrilldown={setSelectedEmployeeForDrilldown}
            onSelectForPIP={setSelectedEmployeeForPIP}
          />
        </>
      )}

      {/* Drill-down Audit Dialog */}
      <PerformanceDrilldownDialog
        employee={selectedEmployeeForDrilldown}
        onClose={() => setSelectedEmployeeForDrilldown(null)}
      />

      {/* PIP Generation Modal */}
      <PerformancePIPModal
        employee={selectedEmployeeForPIP}
        onClose={() => setSelectedEmployeeForPIP(null)}
        onConfirmPIP={(emp) => {
          toast.success(
            `تم حفظ وإشعار الموظف ${emp.name} بخطة تحسين الأداء بنجاح.`,
          );
          setSelectedEmployeeForPIP(null);
        }}
      />
    </div>
  );
};

export default TeamPerformance360Page;
