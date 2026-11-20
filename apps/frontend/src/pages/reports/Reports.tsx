import React from "react";
import {
  useReportsDashboard,
  ReportsHeader,
  ReportsSummaryCards,
  ReportsTopProducts,
  AvailableReportsGrid,
  RelatedViewsPanel,
  ReportDetailsViewer,
} from "./reports-dashboard";

const Reports: React.FC = () => {
  const {
    t,
    reports,
    selectedReport,
    setSelectedReport,
    dateRange,
    setDateRange,
    loading,
    partialErrors,
    presets,
    activePresetId,
    handleStartDateChange,
    handleEndDateChange,
    fetchReports,
    summaryCards,
    topProducts,
  } = useReportsDashboard();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary dark:border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-muted px-4 py-8 sm:px-6 lg:px-8 dark:bg-muted">
      <ReportsHeader
        dateRange={dateRange}
        loading={loading}
        presets={presets}
        activePresetId={activePresetId}
        onStartDateChange={handleStartDateChange}
        onEndDateChange={handleEndDateChange}
        onRefresh={fetchReports}
        onSelectPreset={setDateRange}
      />

      <ReportsSummaryCards summaryCards={summaryCards} />

      {partialErrors.length > 0 && (
        <div className="mb-6 bg-warning/10 dark:bg-warning/20 border border-warning dark:border-warning rounded-lg px-4 py-3 text-sm text-warning dark:text-warning">
          {t("reports.partialErrors", {
            reports: partialErrors.join("، "),
          })}
        </div>
      )}

      <ReportsTopProducts topProducts={topProducts} />

      <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <AvailableReportsGrid
          reports={reports}
          selectedReportId={selectedReport?.id}
          onSelectReport={setSelectedReport}
        />
        <RelatedViewsPanel />
      </div>

      <ReportDetailsViewer selectedReport={selectedReport} />
    </div>
  );
};

export default Reports;
