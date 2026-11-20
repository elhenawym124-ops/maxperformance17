import React from "react";
import { useSearchParams } from "react-router-dom";
import { PolarisAuditLogsView } from "./PolarisAuditLogsView";
import {
  useAuditLogsController,
  AuditLogsHeader,
  AuditLogsStats,
  AuditLogsFilters,
  AuditLogsTable,
  AuditLogDetailsDialog,
} from "./audit-logs/index";

const AuditLogs: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlLayout = searchParams.get("layout");
  const sessionLayout =
    typeof window !== "undefined"
      ? sessionStorage.getItem("maxp_session_layout")
      : null;
  const isPolaris = urlLayout === "polaris" || sessionLayout === "polaris";

  const {
    logs,
    stats,
    loading,
    pagination,
    filters,
    selectedLog,
    setFilters,
    setSelectedLog,
    handleExport,
    handlePageChange,
  } = useAuditLogsController();

  return (
    <div className="w-full pb-8" dir="rtl">
      {isPolaris ? (
        <PolarisAuditLogsView
          logs={logs}
          stats={stats}
          loading={loading}
          pagination={pagination}
          filters={filters}
          setFilters={setFilters}
          onSelectLog={setSelectedLog}
          onExport={handleExport}
          onPageChange={handlePageChange}
        />
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <AuditLogsHeader
            onExport={handleExport}
            disabled={logs.length === 0}
          />

          {/* Stats Cards */}
          <AuditLogsStats stats={stats} />

          {/* Filters Bar */}
          <AuditLogsFilters
            filters={filters}
            onFilterChange={setFilters}
          />

          {/* Data Table */}
          <AuditLogsTable
            logs={logs}
            loading={loading}
            pagination={pagination}
            onPageChange={handlePageChange}
            onSelectLog={setSelectedLog}
          />
        </div>
      )}

      {/* Details Dialog */}
      <AuditLogDetailsDialog
        selectedLog={selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
};

export default AuditLogs;
