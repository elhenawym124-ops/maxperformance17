import React from "react";
import { Download, ShieldCheck, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShopifyPageHeader } from "@/components/layout/ShopifyPageHeader";
import {
  AuditLogsStats,
  AuditLogsFilters,
  AuditLogsTable,
} from "./audit-logs/index";

export interface PolarisAuditLogsViewProps {
  logs: any[];
  stats: any;
  loading: boolean;
  pagination: any;
  filters: any;
  setFilters: (f: any) => void;
  onSelectLog: (log: any) => void;
  onExport: () => void;
  onPageChange: (p: number) => void;
}

export const PolarisAuditLogsView: React.FC<PolarisAuditLogsViewProps> = ({
  logs,
  stats,
  loading,
  pagination,
  filters,
  setFilters,
  onSelectLog,
  onExport,
  onPageChange,
}) => {
  return (
    <div
      data-polaris-audit-logs-view="true"
      className="polaris-audit-container max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 space-y-4"
      dir="rtl"
    >
      {/* 1. Authentic Shopify Polaris Page Header */}
      <ShopifyPageHeader
        title="سجل الرقابة والتدقيق الأمني"
        subtitle="توثيق الحركات والعمليات الإدارية وسجلات التعديل على بيانات النظام"
        badges={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-muted text-muted-foreground tabular-nums">
            {pagination?.total || logs.length} عملية مسجلة
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onExport}
              disabled={logs.length === 0}
              className="gap-1.5 h-8 text-xs font-semibold rounded-lg border-border/80 bg-card hover:bg-muted text-foreground transition-all active:scale-95 shadow-2xs"
            >
              <Download className="h-3.5 w-3.5 text-muted-foreground" />
              <span>تصدير السجل</span>
            </Button>
          </div>
        }
      />

      {/* Telemetry Stats */}
      {stats && <AuditLogsStats stats={stats} />}

      {/* 2. Single Polaris Card Chassis */}
      <div className="bg-card rounded-xl border border-border/70 shadow-xs overflow-hidden flex flex-col">
        {/* Filters */}
        <div className="p-3 border-b border-border/70 bg-muted/15">
          <AuditLogsFilters
            filters={filters}
            onFilterChange={setFilters}
          />
        </div>

        {/* Table */}
        <div className="p-0 [&>div.rounded-2xl]:border-0 [&>div.rounded-2xl]:shadow-none [&>div.rounded-2xl]:rounded-none">
          <AuditLogsTable
            logs={logs}
            loading={loading}
            pagination={pagination}
            onPageChange={onPageChange}
            onSelectLog={onSelectLog}
          />
        </div>
      </div>
    </div>
  );
};

export default PolarisAuditLogsView;
