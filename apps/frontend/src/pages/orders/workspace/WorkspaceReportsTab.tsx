import React from 'react';
import { useTranslation } from 'react-i18next';
import { useWorkspaceReports } from './reports/useWorkspaceReports';
import { ReportsTrendChart } from './reports/ReportsTrendChart';
import { ReportsToolbar } from './reports/ReportsToolbar';
import { ReportsKpiCards } from './reports/ReportsKpiCards';
import { ReportsBreakdownTable } from './reports/ReportsBreakdownTable';

export interface WorkspaceReportsTabProps {
  isManager: boolean;
}

export const WorkspaceReportsTab: React.FC<WorkspaceReportsTabProps> = ({ isManager }) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language.toLowerCase().startsWith('ar');

  const {
    range,
    startDate,
    endDate,
    selectedAgentId,
    data,
    loading,
    refreshing,
    error,
    handleRangeChange,
    handleCustomDatesChange,
    handleAgentChange,
    refresh,
    exportCsv,
  } = useWorkspaceReports(isManager);

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-background/95 p-3 sm:p-5 scrollbar-thin dark:dark:bg-muted">
      {/* 1. Control Toolbar */}
      <ReportsToolbar
        range={range}
        onRangeChange={handleRangeChange}
        startDate={startDate}
        endDate={endDate}
        onCustomDatesChange={handleCustomDatesChange}
        isManager={isManager}
        agents={data?.agents}
        selectedAgentId={selectedAgentId}
        onAgentChange={handleAgentChange}
        onExportCsv={exportCsv}
        canExport={Boolean(data?.agentBreakdown?.length)}
        onRefresh={refresh}
        loading={loading}
        refreshing={refreshing}
        isArabic={isArabic}
      />

      {/* Error Banner */}
      {error && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive dark:border-destructive/60 dark:bg-destructive/40 dark:text-destructive">
          <span>{error}</span>
          <button
            type="button"
            onClick={refresh}
            className="font-bold underline hover:no-underline"
          >
            {isArabic ? 'إعادة المحاولة' : 'Retry'}
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !data && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg border border-border/40 bg-muted/40 dark:dark:border-border dark:dark:bg-muted" />
            ))}
          </div>
          <div className="h-44 animate-pulse rounded-lg border border-border/40 bg-muted/40 dark:dark:border-border dark:dark:bg-muted" />
          <div className="h-64 animate-pulse rounded-lg border border-border/40 bg-muted/40 dark:dark:border-border dark:dark:bg-muted" />
        </div>
      )}

      {/* Report Content */}
      {data && data.kpis && (
        <div className="space-y-5">
          {/* 8 Primary Operational Metrics */}
          <ReportsKpiCards kpis={data.kpis} isArabic={isArabic} />

          {/* Daily Trend Chart Section */}
          {Array.isArray(data.dailyTrend) && data.dailyTrend.length > 0 && (
            <ReportsTrendChart data={data.dailyTrend} isArabic={isArabic} />
          )}

          {/* Detailed Performance Table */}
          {Array.isArray(data.agentBreakdown) && (
            <ReportsBreakdownTable
              agentBreakdown={data.agentBreakdown}
              kpis={data.kpis}
              isManager={isManager}
              isArabic={isArabic}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default WorkspaceReportsTab;
