import React from "react";
import {
  ArrowDownTrayIcon,
  ChartBarIcon,
  ClockIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";
import {
  OwnerSalesReportSection,
  OwnerTodayAttendanceSection,
  useOwnerReportsController,
} from "./reports";

const OwnerReports: React.FC = () => {
  const {
    navigate,
    activeTab,
    setActiveTab,
    isLoading,
    isExporting,
    reportData,
    todayAttendanceData,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    attendanceStartDate,
    setAttendanceStartDate,
    attendanceEndDate,
    setAttendanceEndDate,
    attendancePreset,
    setAttendancePreset,
    handleRangeSelect,
    handleAttendancePresetChange,
    handleExportSales,
    handleExportAttendance,
  } = useOwnerReportsController();

  if (isLoading) {
    return (
      <div
        className="p-6 space-y-6 min-h-screen bg-muted dark:bg-muted"
        dir="rtl"
      >
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg font-medium text-foreground dark:text-muted-foreground">
              جاري تحميل البيانات...
            </p>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-2">
              يرجى الانتظار قليلاً
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="p-6 space-y-6 bg-muted dark:bg-muted min-h-screen"
      dir="rtl"
    >
      <div className="bg-card p-4 rounded-xl shadow-sm border border-border dark:border-border">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground dark:text-white flex items-center gap-2">
              <ChartBarIcon className="w-7 h-7 text-primary" />
              التقارير الموحدة
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              تقارير شاملة لجميع شركاتك
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-2">
            <button
              onClick={
                activeTab === "sales"
                  ? handleExportSales
                  : handleExportAttendance
              }
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-success hover:bg-success text-white rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
            >
              {isExporting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <ArrowDownTrayIcon className="w-4 h-4" />
              )}
              تصدير
            </button>
          </div>
        </div>

        <div className="flex gap-2 mt-4 border-t border-border dark:border-border pt-4">
          <button
            onClick={() => setActiveTab("todayAttendance")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "todayAttendance"
                ? "bg-blue-600 text-white"
                : "bg-muted text-muted-foreground hover:bg-muted dark:hover:bg-muted"
            }`}
          >
            <ClockIcon className="w-5 h-5" />
            حضور اليوم
          </button>
          <button
            onClick={() => setActiveTab("sales")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "sales"
                ? "bg-blue-600 text-white"
                : "bg-muted text-muted-foreground hover:bg-muted dark:hover:bg-muted"
            }`}
          >
            <ShoppingCartIcon className="w-5 h-5" />
            تقرير المبيعات
          </button>
        </div>
      </div>

      {activeTab === "todayAttendance" && todayAttendanceData && (
        <OwnerTodayAttendanceSection
          todayAttendanceData={todayAttendanceData}
          attendancePreset={attendancePreset}
          onPresetChange={handleAttendancePresetChange}
          onSetCustomPreset={() => setAttendancePreset("custom")}
          attendanceStartDate={attendanceStartDate}
          onStartDateChange={setAttendanceStartDate}
          attendanceEndDate={attendanceEndDate}
          onEndDateChange={setAttendanceEndDate}
        />
      )}

      {activeTab === "sales" && (
        <OwnerSalesReportSection
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          onRangeSelect={handleRangeSelect}
          overview={reportData?.overview}
          companies={reportData?.byCompany || []}
          onNavigateCompanyOrders={(companyId) =>
            navigate(`/my-companies/company/${companyId}/orders`)
          }
        />
      )}
    </div>
  );
};

export default OwnerReports;
