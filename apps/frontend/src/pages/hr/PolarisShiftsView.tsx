import React, { useState } from "react";
import { Plus, LayoutGrid, Table as TableIcon, BarChart3, Search } from "lucide-react";
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
import ShiftsSkeleton from "@/components/hr/ShiftsSkeleton";
import ShiftsTableView from "@/components/hr/ShiftsTableView";
import {
  ShiftsStatsGrid,
  ShiftsBulkActionBar,
  ShiftsGridView,
  ShiftsEmptyState,
} from "./shifts/index";
import type { ViewMode, StatusFilter, SortBy, ShiftStats } from "./shifts/types";

export interface PolarisShiftsViewProps {
  loading: boolean;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  selectedShifts: string[];
  setSelectedShifts: (shifts: string[]) => void;
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (val: StatusFilter) => void;
  sortBy: SortBy;
  setSortBy: (val: SortBy) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  filteredAndSortedShifts: any[];
  stats: ShiftStats;
  openCreateDialog: () => void;
  openEditDialog: (shift: any) => void;
  handleDuplicate: (shift: any) => void;
  handleToggleStatus: (id: string, currentStatus: boolean) => void;
  toggleSelectShift: (id: string) => void;
  toggleSelectAll: (ids: string[]) => void;
  onOpenDelete: (id: string | "bulk") => void;
  onOpenAssign: (shift: { id: string; name: string }) => void;
  onNavigateDetails: (id: string) => void;
}

export const PolarisShiftsView: React.FC<PolarisShiftsViewProps> = ({
  loading,
  viewMode,
  setViewMode,
  selectedShifts,
  setSelectedShifts,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  searchInputRef,
  filteredAndSortedShifts,
  stats,
  openCreateDialog,
  openEditDialog,
  handleDuplicate,
  handleToggleStatus,
  toggleSelectShift,
  toggleSelectAll,
  onOpenDelete,
  onOpenAssign,
  onNavigateDetails,
}) => {
  const [showStats, setShowStats] = useState(false);

  const tabs: Array<{ key: StatusFilter; label: string; count?: number }> = [
    { key: "all", label: "الكل", count: stats.total },
    { key: "active", label: "النشطة", count: stats.active },
    { key: "inactive", label: "المعطلة", count: stats.inactive },
  ];

  return (
    <div
      data-polaris-shifts-view="true"
      className="polaris-shifts-container max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 space-y-4"
      dir="rtl"
    >
      {/* 1. Authentic Shopify Polaris Page Header */}
      <ShopifyPageHeader
        title="المناوبات وجداول العمل"
        subtitle="إدارة وتوزيع مناوبات العمل وجداول الموظفين الأسبوعية"
        badges={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-muted text-muted-foreground tabular-nums">
            {stats.total} مناوبة
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

            {/* View Mode Toggle */}
            <div className="flex items-center bg-card p-0.5 rounded-lg border border-border/70 shadow-2xs">
              <Button
                type="button"
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-7 px-2 text-xs rounded-md"
              >
                <LayoutGrid className="h-3.5 w-3.5 ml-1" />
                <span>شبكة</span>
              </Button>
              <Button
                type="button"
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="h-7 px-2 text-xs rounded-md"
              >
                <TableIcon className="h-3.5 w-3.5 ml-1" />
                <span>جدول</span>
              </Button>
            </div>

            <Button
              size="sm"
              onClick={openCreateDialog}
              className="gap-1.5 h-8 px-3 text-xs font-semibold rounded-lg bg-[var(--p-action-primary,#008060)] hover:bg-[#006e52] text-white transition-all active:scale-95 shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>مناوبة جديدة</span>
            </Button>
          </div>
        }
      />

      {/* Collapsible Stats Section */}
      {showStats && (
        <div className="motion-safe:animate-fade-in">
          <ShiftsStatsGrid stats={stats} />
        </div>
      )}

      {/* Bulk Action Bar */}
      <ShiftsBulkActionBar
        selectedCount={selectedShifts.length}
        onDeleteSelected={() => onOpenDelete("bulk")}
        onClearSelection={() => setSelectedShifts([])}
      />

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
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-muted text-muted-foreground font-mono tabular-nums">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Sort Selector in tab header */}
          <div className="py-1.5 hidden sm:block">
            <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
              <SelectTrigger className="w-[150px] h-8 text-xs bg-muted/40 border-border/70 rounded-lg">
                <SelectValue placeholder="الترتيب" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="name">حسب الاسم</SelectItem>
                <SelectItem value="startTime">وقت البدء</SelectItem>
                <SelectItem value="createdAt">تاريخ الإنشاء</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Integrated Search and Filter Bar */}
        <div className="p-2.5 sm:p-3 border-b border-border/70 bg-muted/15 flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              ref={searchInputRef as any}
              placeholder="ابحث عن مناوبة بالاسم أو الرمز... (/)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-9 h-8 text-xs bg-background border-border/70 rounded-lg shadow-none focus-visible:ring-1"
            />
          </div>

          <div className="w-full sm:w-auto sm:hidden">
            <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
              <SelectTrigger className="w-full h-8 text-xs bg-background border-border/70 rounded-lg">
                <SelectValue placeholder="الترتيب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">حسب الاسم</SelectItem>
                <SelectItem value="startTime">وقت البدء</SelectItem>
                <SelectItem value="createdAt">تاريخ الإنشاء</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 3. Main Content Area */}
        <div className="p-0">
          {loading ? (
            <div className="p-4">
              <ShiftsSkeleton viewMode={viewMode} />
            </div>
          ) : filteredAndSortedShifts.length === 0 ? (
            <div className="p-6">
              <ShiftsEmptyState
                searchTerm={searchTerm}
                onClearSearch={() => setSearchTerm("")}
                onCreateNew={openCreateDialog}
              />
            </div>
          ) : viewMode === "table" ? (
            <div className="[&>div.rounded-2xl]:border-0 [&>div.rounded-2xl]:shadow-none [&>div.rounded-2xl]:rounded-none">
              <ShiftsTableView
                shifts={filteredAndSortedShifts}
                selectedShifts={selectedShifts}
                onToggleSelect={toggleSelectShift}
                onToggleSelectAll={() =>
                  toggleSelectAll(filteredAndSortedShifts.map((s) => s.id))
                }
                onEdit={openEditDialog}
                onDelete={(id) => onOpenDelete(id)}
                onDuplicate={handleDuplicate}
                onToggleStatus={handleToggleStatus}
              />
            </div>
          ) : (
            <div className="p-4">
              <ShiftsGridView
                shifts={filteredAndSortedShifts}
                selectedShifts={selectedShifts}
                onToggleSelect={toggleSelectShift}
                onToggleStatus={handleToggleStatus}
                onEdit={openEditDialog}
                onDuplicate={handleDuplicate}
                onAssign={onOpenAssign}
                onDelete={(id) => onOpenDelete(id)}
                onNavigateDetails={onNavigateDetails}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PolarisShiftsView;
