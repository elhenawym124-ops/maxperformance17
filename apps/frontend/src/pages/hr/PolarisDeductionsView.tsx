import React, { useState } from "react";
import { Plus, Search, BarChart3, Filter } from "lucide-react";
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
  DeductionStatsCards,
  DeductionTable,
} from "./deductions/index";
import { Deduction, DeductionStats, DEDUCTION_TYPES } from "./deductions/types";

export interface PolarisDeductionsViewProps {
  deductions: Deduction[];
  stats: DeductionStats | null;
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  filterStatus: string;
  setFilterStatus: (s: string) => void;
  filterType: string;
  setFilterType: (s: string) => void;
  filterMonth: string;
  setFilterMonth: (s: string) => void;
  filterYear: string;
  setFilterYear: (s: string) => void;
  onAddNew: () => void;
  onViewDetails: (deduction: Deduction) => void;
  onEdit: (deduction: Deduction) => void;
  onDelete: (id: string) => void;
}

export const PolarisDeductionsView: React.FC<PolarisDeductionsViewProps> = ({
  deductions,
  stats,
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  filterType,
  setFilterType,
  filterMonth,
  setFilterMonth,
  filterYear,
  setFilterYear,
  onAddNew,
  onViewDetails,
  onEdit,
  onDelete,
}) => {
  const [showStats, setShowStats] = useState(false);

  const tabs = [
    { key: "all", label: "الكل", count: stats?.total || deductions.length },
    { key: "PENDING", label: "قيد الانتظار" },
    { key: "APPROVED", label: "معتمدة" },
    { key: "APPLIED", label: "مطبقة بالراتب" },
    { key: "REJECTED", label: "مرفوضة" },
  ];

  return (
    <div
      data-polaris-deductions-view="true"
      className="polaris-deductions-container max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 space-y-4"
      dir="rtl"
    >
      {/* 1. Authentic Shopify Polaris Page Header */}
      <ShopifyPageHeader
        title="الخصومات والجزاءات"
        subtitle="إدارة الخصومات المالية، الجزاءات الإدارية وترحيلها لمسيرات الرواتب"
        badges={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-muted text-muted-foreground tabular-nums">
            {stats?.total || deductions.length} سجل
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
              onClick={onAddNew}
              className="gap-1.5 h-8 px-3 text-xs font-semibold rounded-lg bg-[var(--p-action-primary,#008060)] hover:bg-[#006e52] text-white transition-all active:scale-95 shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>إضافة خصم جديد</span>
            </Button>
          </div>
        }
      />

      {/* Collapsible Stats Section */}
      {showStats && stats && (
        <div className="motion-safe:animate-fade-in">
          <DeductionStatsCards stats={stats} />
        </div>
      )}

      {/* 2. Single Polaris Card Chassis */}
      <div className="bg-card rounded-xl border border-border/70 shadow-xs overflow-hidden flex flex-col">
        {/* Segmented Status Tabs */}
        <div className="flex items-center justify-between border-b border-border/70 px-3 overflow-x-auto scrollbar-none bg-card">
          <div className="flex items-center">
            {tabs.map((tab) => {
              const isActive = filterStatus === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilterStatus(tab.key)}
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

          {/* Quick Type Filter Selector in tab header */}
          <div className="py-1.5 hidden sm:block">
            <Select value={filterType} onValueChange={(val) => setFilterType(val || "all")}>
              <SelectTrigger className="w-[160px] h-8 text-xs bg-muted/40 border-border/70 rounded-lg">
                <SelectValue placeholder="نوع الخصم" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="all">كل الأنواع</SelectItem>
                {Object.entries(DEDUCTION_TYPES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Integrated Filter Bar */}
        <div className="p-2.5 sm:p-3 border-b border-border/70 bg-muted/15 flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="ابحث باسم الموظف، الرقم الوظيفي، أو سبب الخصم..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-9 h-8 text-xs bg-background border-border/70 rounded-lg shadow-none focus-visible:ring-1"
            />
          </div>

          {/* Month / Year Filter Controls */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={filterMonth} onValueChange={(val) => setFilterMonth(val || "all")}>
              <SelectTrigger className="w-[110px] h-8 text-xs bg-background border-border/70 rounded-lg">
                <SelectValue placeholder="الشهر" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الشهور</SelectItem>
                {[
                  "يناير",
                  "فبراير",
                  "مارس",
                  "إبريل",
                  "مايو",
                  "يونيو",
                  "يوليو",
                  "أغسطس",
                  "سبتمبر",
                  "أكتوبر",
                  "نوفمبر",
                  "ديسمبر",
                ].map((m, idx) => (
                  <SelectItem key={idx + 1} value={String(idx + 1)}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterYear} onValueChange={(val) => setFilterYear(val || "all")}>
              <SelectTrigger className="w-[100px] h-8 text-xs bg-background border-border/70 rounded-lg font-mono tabular-nums">
                <SelectValue placeholder="السنة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل السنوات</SelectItem>
                {[2024, 2025, 2026, 2027].map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 3. Deductions Table */}
        <div className="p-0 [&>div.rounded-2xl]:border-0 [&>div.rounded-2xl]:shadow-none [&>div.rounded-2xl]:rounded-none">
          <DeductionTable
            deductions={deductions}
            onViewDetails={onViewDetails}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      </div>
    </div>
  );
};

export default PolarisDeductionsView;
