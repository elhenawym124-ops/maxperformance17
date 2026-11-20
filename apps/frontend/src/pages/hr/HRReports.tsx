import React from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs } from "@/components/ui/tabs";
import { PolarisHRReportsView } from "./PolarisHRReportsView";
import {
  useHRReportsController,
  HRReportsHeader,
  HRReportsFilters,
  HRReportsTabsList,
  AttendanceReportTab,
  LeavesReportTab,
  PayrollReportTab,
  WarningsReportTab,
  TrainingReportTab,
  PerformanceReportTab,
  KpiReportTab,
  LateAbsenceReportTab,
  OvertimeReportTab,
  TurnoverReportTab,
  EmployeeDemographicsTab,
} from "./hr-reports/index";

export const HRReports: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlLayout = searchParams.get("layout");
  const sessionLayout =
    typeof window !== "undefined"
      ? sessionStorage.getItem("maxp_session_layout")
      : null;
  const isPolaris = urlLayout !== "legacy" && sessionLayout !== "legacy";

  const {
    loading,
    activeTab,
    setActiveTab,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    attendanceReport,
    leaveReport,
    payrollReport,
    warningReport,
    trainingReport,
    performanceReport,
    fetchReport,
    handleExport,
  } = useHRReportsController();

  if (isPolaris) {
    return (
      <PolarisHRReportsView
        loading={loading}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        attendanceReport={attendanceReport}
        leaveReport={leaveReport}
        payrollReport={payrollReport}
        warningReport={warningReport}
        trainingReport={trainingReport}
        performanceReport={performanceReport}
        fetchReport={fetchReport}
        handleExport={handleExport}
      />
    );
  }

  return (
    <div className="space-y-6 w-full pb-8" dir="rtl">
      {/* Header */}
      <HRReportsHeader
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onRefresh={fetchReport}
        onExport={handleExport}
      />

      {/* Filters */}
      <HRReportsFilters
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
      />

      {/* Report Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <HRReportsTabsList />

        {/* Tab Contents */}
        <AttendanceReportTab
          loading={loading}
          attendanceReport={attendanceReport}
        />
        <LeavesReportTab loading={loading} leaveReport={leaveReport} />
        <PayrollReportTab
          loading={loading}
          payrollReport={payrollReport}
        />
        <WarningsReportTab
          loading={loading}
          warningReport={warningReport}
        />
        <TrainingReportTab
          loading={loading}
          trainingReport={trainingReport}
        />
        <PerformanceReportTab
          loading={loading}
          performanceReport={performanceReport}
        />
        <KpiReportTab />
        <LateAbsenceReportTab />
        <OvertimeReportTab />
        <TurnoverReportTab />
        <EmployeeDemographicsTab />
      </Tabs>
    </div>
  );
};

export default HRReports;
