import React, { useState } from "react";
import { Plus, BarChart3, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShopifyPageHeader } from "@/components/layout/ShopifyPageHeader";
import {
  AdvancesStatsGrid,
  AdvancesTable,
} from "./advances/index";
import type { AdvanceRequest, AdvancePagination, AdvanceStats, PayStatusFilter } from "./advances/types";

export interface PolarisAdvancesViewProps {
  loading: boolean;
  requests: AdvanceRequest[];
  rawTotalCount: number;
  pagination: AdvancePagination;
  handlePageChange: (page: number) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  payStatusFilter: PayStatusFilter;
  setPayStatusFilter: (val: PayStatusFilter) => void;
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  stats: AdvanceStats;
  onCreateNew: () => void;
  handleApprove: (id: string) => void;
  openRejectDialog: (request: AdvanceRequest) => void;
  openDetailsDialog: (request: AdvanceRequest) => void;
  openUpdateStatusDialog: (request: AdvanceRequest) => void;
  handleDelete: (id: string) => void;
  markAsPaid: (id: string) => void;
}

export const PolarisAdvancesView: React.FC<PolarisAdvancesViewProps> = ({
  loading,
  requests,
  rawTotalCount,
  pagination,
  handlePageChange,
  statusFilter,
  setStatusFilter,
  payStatusFilter,
  setPayStatusFilter,
  searchTerm,
  setSearchTerm,
  stats,
  onCreateNew,
  handleApprove,
  openRejectDialog,
  openDetailsDialog,
  openUpdateStatusDialog,
  handleDelete,
  markAsPaid,
}) => {
  const [showStats, setShowStats] = useState(false);

  const tabs: Array<{ key: string; label: string; count?: number }> = [
    { key: "all", label: "الكل", count: stats?.total || rawTotalCount },
    { key: "PENDING", label: "قيد المراجعة", count: stats?.pending },
    { key: "APPROVED", label: "معتمدة", count: stats?.approved },
    { key: "COMPLETED", label: "مسددة بالكامل" },
    { key: "REJECTED", label: "مرفوضة" },
  ];

  return (
    <div
      data-polaris-advances-view="true"
      className="polaris-advances-container max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 space-y-4"
      dir="rtl"
    >
      {/* 1. Authentic Shopify Polaris Page Header */}
      <ShopifyPageHeader
        title="السلف والقروض"
        subtitle="إدارة ومتابعة طلبات السلف الشخصية وأقساط السداد للموظفين"
        badges={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-muted text-muted-foreground tabular-nums">
            {rawTotalCount || stats?.total || 0} طلب
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
              <BarChart3 className="h-3.5 w-3.5" />
              <span>الإحصائيات</span>
            </Button>

            <Button
              size="sm"
              onClick={onCreateNew}
              className="gap-1.5 h-8 px-3 text-xs font-semibold rounded-lg bg-[var(--p-action-primary,#008060)] hover:bg-[#006e52] text-white transition-all active:scale-95 shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>طلب سلفة جديدة</span>
            </Button>
          </div>
        }
      />

      {/* Collapsible Stats Section */}
      {showStats && stats && (
        <div className="motion-safe:animate-fade-in">
          <AdvancesStatsGrid stats={stats} />
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
                  {typeof tab.count === "number" && tab.count > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono tabular-nums ${
                        tab.key === "PENDING"
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold"
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

          {/* Quick PayStatus Filter in Tab Header */}
          <div className="py-1.5 hidden sm:block">
            <Select
              value={payStatusFilter}
              onValueChange={(val: any) => setPayStatusFilter(val || "all")}
            >
              <SelectTrigger className="w-[150px] h-8 text-xs bg-muted/40 border-border/70 rounded-lg">
                <SelectValue placeholder="حالة السداد" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="all">كل حالات السداد</SelectItem>
                <SelectItem value="paid">مسدد</SelectItem>
                <SelectItem value="unpaid">غير مسدد</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Integrated Search and Filter Bar */}
        <div className="p-2.5 sm:p-3 border-b border-border/70 bg-muted/15 flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="ابحث بالموظف أو السبب أو المبلغ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-9 h-8 text-xs bg-background border-border/70 rounded-lg shadow-none focus-visible:ring-1"
            />
          </div>

          <div className="w-full sm:w-auto sm:hidden">
            <Select
              value={payStatusFilter}
              onValueChange={(val: any) => setPayStatusFilter(val || "all")}
            >
              <SelectTrigger className="w-full h-8 text-xs bg-background border-border/70 rounded-lg">
                <SelectValue placeholder="حالة السداد" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل حالات السداد</SelectItem>
                <SelectItem value="paid">مسدد</SelectItem>
                <SelectItem value="unpaid">غير مسدد</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 3. Advances Table inside single surface */}
        <div className="[&>div.shadow-sm]:shadow-none [&>div.border]:border-0 [&>div.rounded-2xl]:rounded-none">
          <AdvancesTable
            loading={loading}
            requests={requests}
            rawTotalCount={rawTotalCount}
            pagination={pagination}
            onPageChange={handlePageChange}
            onApprove={handleApprove}
            onOpenReject={openRejectDialog}
            onOpenDetails={openDetailsDialog}
            onOpenUpdateStatus={openUpdateStatusDialog}
            onDelete={handleDelete}
            onMarkAsPaid={markAsPaid}
          />
        </div>
      </div>
    </div>
  );
};

export default PolarisAdvancesView;
